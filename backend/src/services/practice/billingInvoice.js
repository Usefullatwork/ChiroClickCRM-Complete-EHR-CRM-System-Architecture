/**
 * Billing Invoice Operations — CRUD, payments, and invoice lifecycle.
 *
 * @module services/practice/billingInvoice
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { DEFAULT_PAGE_SIZE_LARGE } from '../../config/constants.js';
import { INVOICE_STATUS } from './billingCalc.js';

/**
 * Get invoice by ID
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Object|null>} Invoice or null
 */
export const getInvoiceById = async (organizationId, invoiceId) => {
  const result = await query(
    `SELECT i.id, i.organization_id, i.patient_id, i.practitioner_id, i.encounter_id,
            i.invoice_number, i.invoice_date, i.due_date, i.status,
            i.line_items, i.subtotal, i.tax_amount, i.total_amount,
            i.patient_amount, i.insurance_amount, i.amount_paid, i.amount_due,
            i.payment_method, i.notes, i.sent_at, i.paid_at, i.cancelled_at,
            i.cancellation_reason, i.created_at, i.updated_at,
            p.first_name as patient_first_name,
            p.last_name as patient_last_name,
            p.address as patient_address,
            p.postal_code as patient_postal_code,
            p.city as patient_city,
            p.email as patient_email,
            p.phone as patient_phone,
            o.name as organization_name,
            o.address as organization_address,
            o.postal_code as organization_postal_code,
            o.city as organization_city,
            o.org_number as organization_org_number,
            o.phone as organization_phone,
            o.email as organization_email,
            o.bank_account as organization_bank_account,
            u.first_name || ' ' || u.last_name as practitioner_name,
            u.hpr_number as practitioner_hpr
     FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     JOIN organizations o ON o.id = i.organization_id
     LEFT JOIN users u ON u.id = i.practitioner_id
     WHERE i.id = $1 AND i.organization_id = $2`,
    [invoiceId, organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Get invoices with filtering and pagination
 * @param {string} organizationId - Organization UUID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated invoices
 */
export const getInvoices = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE_LARGE,
    status = null,
    patient_id = null,
    start_date = null,
    end_date = null,
    search = null,
    sort_by = 'invoice_date',
    sort_order = 'DESC',
  } = options;

  const offset = (page - 1) * limit;
  const whereConditions = ['i.organization_id = $1'];
  const params = [organizationId];
  let paramIndex = 2;

  if (status) {
    whereConditions.push(`i.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (patient_id) {
    whereConditions.push(`i.patient_id = $${paramIndex}`);
    params.push(patient_id);
    paramIndex++;
  }

  if (start_date) {
    whereConditions.push(`i.invoice_date >= $${paramIndex}`);
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    whereConditions.push(`i.invoice_date <= $${paramIndex}`);
    params.push(end_date);
    paramIndex++;
  }

  if (search) {
    whereConditions.push(`(
      i.invoice_number ILIKE $${paramIndex}
      OR p.first_name ILIKE $${paramIndex}
      OR p.last_name ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Validate sort column
  const validSortColumns = [
    'invoice_date',
    'due_date',
    'invoice_number',
    'patient_amount',
    'status',
    'created_at',
  ];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'invoice_date';
  const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Get count
  const countResult = await query(
    `SELECT COUNT(*) FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     WHERE ${whereClause}`,
    params
  );

  // Get invoices
  const result = await query(
    `SELECT i.id, i.organization_id, i.patient_id, i.practitioner_id,
            i.invoice_number, i.invoice_date, i.due_date, i.status,
            i.subtotal, i.tax_amount, i.total_amount,
            i.patient_amount, i.insurance_amount, i.amount_paid, i.amount_due,
            i.sent_at, i.paid_at, i.created_at, i.updated_at,
            p.first_name || ' ' || p.last_name as patient_name,
            p.email as patient_email
     FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     WHERE ${whereClause}
     ORDER BY i.${sortColumn} ${sortDir}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    invoices: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit),
    },
  };
};

/**
 * Update invoice
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated invoice
 */
export const updateInvoice = async (organizationId, invoiceId, updates) => {
  const allowedFields = ['notes', 'status', 'due_date'];
  const setClause = [];
  const params = [invoiceId, organizationId];
  let paramIndex = 3;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  setClause.push('updated_at = NOW()');

  const result = await query(
    `UPDATE invoices
     SET ${setClause.join(', ')}
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, invoice_number, invoice_date, due_date, status,
               patient_amount, amount_paid, amount_due, notes, created_at, updated_at`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Invoice not found');
  }

  logger.info(`Invoice updated: ${result.rows[0].invoice_number}`);
  return result.rows[0];
};

/**
 * Finalize and send invoice
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Object>} Updated invoice
 */
export const finalizeInvoice = async (organizationId, invoiceId) => {
  const result = await query(
    `UPDATE invoices
     SET status = $3,
         sent_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND status IN ('draft', 'pending')
     RETURNING id, organization_id, invoice_number, invoice_date, due_date, status,
               patient_amount, amount_paid, amount_due, sent_at, created_at, updated_at`,
    [invoiceId, organizationId, INVOICE_STATUS.SENT]
  );

  if (result.rows.length === 0) {
    throw new Error('Invoice not found or cannot be finalized');
  }

  logger.info(`Invoice finalized: ${result.rows[0].invoice_number}`);
  return result.rows[0];
};

/**
 * Record payment on invoice
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Updated invoice
 */
export const recordPayment = async (organizationId, invoiceId, paymentData) => {
  const {
    amount,
    payment_method,
    payment_reference = null,
    payment_date = new Date(),
    notes = null,
  } = paymentData;

  // Get current invoice
  const invoice = await getInvoiceById(organizationId, invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amount);
  const amountDue = parseFloat(invoice.patient_amount);

  // Determine new status
  let newStatus = invoice.status;
  if (newAmountPaid >= amountDue) {
    newStatus = INVOICE_STATUS.PAID;
  } else if (newAmountPaid > 0) {
    newStatus = INVOICE_STATUS.PARTIAL;
  }

  // Record payment
  const paymentResult = await query(
    `INSERT INTO invoice_payments (
      organization_id,
      invoice_id,
      amount,
      payment_method,
      payment_reference,
      payment_date,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, organization_id, invoice_id, amount, payment_method,
              payment_reference, payment_date, notes, created_at`,
    [organizationId, invoiceId, amount, payment_method, payment_reference, payment_date, notes]
  );

  // Update invoice
  const invoiceResult = await query(
    `UPDATE invoices
     SET amount_paid = $3,
         amount_due = $4,
         status = $5,
         paid_at = CASE WHEN $5 = 'paid' THEN NOW() ELSE paid_at END,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, invoice_number, invoice_date, due_date, status,
               patient_amount, amount_paid, amount_due, paid_at, created_at, updated_at`,
    [invoiceId, organizationId, newAmountPaid, amountDue - newAmountPaid, newStatus]
  );

  logger.info(`Payment recorded: ${amount} NOK for invoice ${invoice.invoice_number}`);

  return {
    invoice: invoiceResult.rows[0],
    payment: paymentResult.rows[0],
  };
};

/**
 * Get payments for an invoice
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Array>} List of payments
 */
export const getInvoicePayments = async (organizationId, invoiceId) => {
  const result = await query(
    `SELECT id, organization_id, invoice_id, amount, payment_method, payment_reference, payment_date, notes, created_at
     FROM invoice_payments
     WHERE organization_id = $1 AND invoice_id = $2
     ORDER BY payment_date DESC`,
    [organizationId, invoiceId]
  );

  return result.rows;
};

/**
 * Cancel an invoice
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancelled invoice
 */
export const cancelInvoice = async (organizationId, invoiceId, reason) => {
  const result = await query(
    `UPDATE invoices
     SET status = $3,
         cancellation_reason = $4,
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND status NOT IN ('paid', 'cancelled')
     RETURNING id, organization_id, invoice_number, invoice_date, status,
               cancellation_reason, cancelled_at, created_at, updated_at`,
    [invoiceId, organizationId, INVOICE_STATUS.CANCELLED, reason]
  );

  if (result.rows.length === 0) {
    throw new Error('Invoice not found or cannot be cancelled');
  }

  logger.info(`Invoice cancelled: ${result.rows[0].invoice_number}`);
  return result.rows[0];
};
