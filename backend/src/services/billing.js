/**
 * Billing Service
 * Norwegian healthcare invoicing and payment management
 *
 * Handles invoice generation, takst codes, HELFO refunds,
 * and payment tracking for Norwegian chiropractic clinics
 */

import { createRequire } from 'module';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const takstCodes = require('../data/takst-codes.json');

// Invoice statuses
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SENT: 'sent',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  CREDITED: 'credited',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  VIPPS: 'vipps',
  BANK_TRANSFER: 'bank_transfer',
  HELFO: 'helfo',
  INSURANCE: 'insurance',
};

/**
 * Get all Norwegian takst codes
 * @returns {Object} Takst codes with metadata
 */
export const getTakstCodes = () => ({
  codes: takstCodes.codes,
  additionalCodes: takstCodes.additionalCodes,
  categories: takstCodes.categories,
  exemptions: takstCodes.exemptions,
  version: takstCodes.version,
  lastUpdated: takstCodes.lastUpdated,
});

/**
 * Get a specific takst code by ID
 * @param {string} codeId - Takst code ID (e.g., '1a', '1c')
 * @returns {Object|null} Takst code details or null
 */
export const getTakstCode = (codeId) => {
  const normalizedCode = codeId.toLowerCase();
  return takstCodes.codes[normalizedCode] || takstCodes.additionalCodes[normalizedCode] || null;
};

/**
 * Calculate invoice totals from takst codes
 * @param {Array} items - Array of {code, quantity} objects
 * @param {Object} options - Calculation options (e.g., isChild, hasExemption)
 * @returns {Object} Calculated totals
 */
export const calculateInvoiceTotals = (items, options = {}) => {
  const { isChild = false, hasExemption = false } = options;

  let totalGross = 0;
  let totalHelfoRefund = 0;
  let totalPatientShare = 0;
  const itemDetails = [];

  for (const item of items) {
    const code = getTakstCode(item.code);
    if (!code) {
      logger.warn(`Unknown takst code: ${item.code}`);
      continue;
    }

    const quantity = item.quantity || 1;
    const lineGross = code.price * quantity;
    const lineHelfo = code.helfoRefund * quantity;

    // Calculate patient share (zero for children under 16)
    let linePatientShare = code.patientShare * quantity;
    if (isChild) {
      linePatientShare = 0;
    } else if (hasExemption) {
      // Reduced patient share for exemptions
      linePatientShare = Math.round(linePatientShare * 0.5);
    }

    totalGross += lineGross;
    totalHelfoRefund += lineHelfo;
    totalPatientShare += linePatientShare;

    itemDetails.push({
      code: item.code,
      name: code.name,
      description: code.description,
      quantity,
      unitPrice: code.price,
      lineTotal: lineGross,
      helfoRefund: lineHelfo,
      patientShare: linePatientShare,
    });
  }

  return {
    items: itemDetails,
    totalGross,
    totalHelfoRefund,
    totalPatientShare,
    totalDue: totalPatientShare,
    currency: 'NOK',
  };
};

/**
 * Generate unique invoice number
 * Format: F{YEAR}{MONTH}-{SEQUENCE}
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<string>} Generated invoice number
 */
export const generateInvoiceNumber = async (organizationId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `F${year}${month}`;

  const result = await query(
    `SELECT COUNT(*) as count
     FROM invoices
     WHERE organization_id = $1
       AND invoice_number LIKE $2`,
    [organizationId, `${prefix}-%`]
  );

  const sequence = parseInt(result.rows[0].count) + 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Create a new invoice
 * @param {string} organizationId - Organization UUID
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Object>} Created invoice
 */
export const createInvoice = async (organizationId, invoiceData) => {
  const {
    patient_id,
    encounter_id = null,
    practitioner_id,
    items = [],
    notes = null,
    due_days = 14,
    is_child = false,
    has_exemption = false,
  } = invoiceData;

  // Calculate totals
  const totals = calculateInvoiceTotals(items, { isChild: is_child, hasExemption: has_exemption });

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(organizationId);

  // Calculate due date
  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + due_days);

  const result = await query(
    `INSERT INTO invoices (
      organization_id,
      patient_id,
      encounter_id,
      practitioner_id,
      invoice_number,
      invoice_date,
      due_date,
      items,
      gross_amount,
      helfo_refund,
      patient_amount,
      amount_due,
      amount_paid,
      status,
      notes,
      is_child,
      has_exemption
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      organizationId,
      patient_id,
      encounter_id,
      practitioner_id,
      invoiceNumber,
      invoiceDate,
      dueDate,
      JSON.stringify(totals.items),
      totals.totalGross,
      totals.totalHelfoRefund,
      totals.totalPatientShare,
      totals.totalPatientShare,
      0,
      INVOICE_STATUS.DRAFT,
      notes,
      is_child,
      has_exemption,
    ]
  );

  logger.info(`Invoice created: ${invoiceNumber}`, { organizationId, patientId: patient_id });
  return result.rows[0];
};

/**
 * Get invoice by ID
 * @param {string} organizationId - Organization UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Object|null>} Invoice or null
 */
export const getInvoiceById = async (organizationId, invoiceId) => {
  const result = await query(
    `SELECT i.*,
            p.first_name as patient_first_name,
            p.last_name as patient_last_name,
            p.address as patient_address,
            p.postal_code as patient_postal_code,
            p.city as patient_city,
            p.email as patient_email,
            p.phone as patient_phone,
            p.national_id as patient_national_id,
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
    limit = 50,
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
    `SELECT i.*,
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
     RETURNING *`,
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
     RETURNING *`,
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
    RETURNING *`,
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
     RETURNING *`,
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
    `SELECT * FROM invoice_payments
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
     RETURNING *`,
    [invoiceId, organizationId, INVOICE_STATUS.CANCELLED, reason]
  );

  if (result.rows.length === 0) {
    throw new Error('Invoice not found or cannot be cancelled');
  }

  logger.info(`Invoice cancelled: ${result.rows[0].invoice_number}`);
  return result.rows[0];
};

/**
 * Get invoice statistics
 * @param {string} organizationId - Organization UUID
 * @param {Object} options - Date range options
 * @returns {Promise<Object>} Statistics
 */
export const getInvoiceStatistics = async (organizationId, options = {}) => {
  const { start_date = null, end_date = null } = options;

  let dateFilter = '';
  const params = [organizationId];
  let paramIndex = 2;

  if (start_date) {
    dateFilter += ` AND invoice_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  if (end_date) {
    dateFilter += ` AND invoice_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
      COUNT(*) FILTER (WHERE status = 'pending' OR status = 'sent') as pending_count,
      COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
      COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN patient_amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status IN ('pending', 'sent', 'partial') THEN amount_due ELSE 0 END), 0) as total_outstanding,
      COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount_due ELSE 0 END), 0) as total_overdue,
      COALESCE(SUM(helfo_refund), 0) as total_helfo_refund,
      COUNT(*) as total_invoices
     FROM invoices
     WHERE organization_id = $1 ${dateFilter}`,
    params
  );

  return result.rows[0];
};

/**
 * Get overdue invoices and update their status
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<Array>} Updated overdue invoices
 */
export const updateOverdueInvoices = async (organizationId) => {
  const result = await query(
    `UPDATE invoices
     SET status = 'overdue',
         updated_at = NOW()
     WHERE organization_id = $1
       AND due_date < CURRENT_DATE
       AND status IN ('pending', 'sent', 'partial')
     RETURNING *`,
    [organizationId]
  );

  if (result.rows.length > 0) {
    logger.info(`Marked ${result.rows.length} invoices as overdue`, { organizationId });
  }

  return result.rows;
};

/**
 * Generate invoice PDF HTML
 * @param {Object} invoice - Invoice with all related data
 * @returns {string} HTML content for PDF
 */
export const generateInvoiceHTML = (invoice) => {
  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('no-NO');
  const dueDate = new Date(invoice.due_date).toLocaleDateString('no-NO');

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount);

  const itemsHTML = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${item.code}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info { text-align: left; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .invoice-title { text-align: right; }
        .invoice-number { font-size: 28px; font-weight: bold; color: #2563eb; }
        .invoice-meta { color: #666; margin-top: 5px; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .party { width: 45%; }
        .party-label { font-weight: bold; color: #666; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; }
        .table-container { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: bold; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
        .payment-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; }
        .payment-title { font-weight: bold; margin-bottom: 10px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-overdue { background-color: #fee2e2; color: #991b1b; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${invoice.organization_name || 'Klinikk'}</div>
          <div>${invoice.organization_address || ''}</div>
          <div>${invoice.organization_postal_code || ''} ${invoice.organization_city || ''}</div>
          <div>Org.nr: ${invoice.organization_org_number || ''}</div>
          <div>Tlf: ${invoice.organization_phone || ''}</div>
        </div>
        <div class="invoice-title">
          <div class="invoice-number">FAKTURA</div>
          <div class="invoice-meta">Nr: ${invoice.invoice_number}</div>
          <div class="invoice-meta">Dato: ${invoiceDate}</div>
          <div class="invoice-meta">Forfallsdato: ${dueDate}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">Faktureres til</div>
          <div><strong>${invoice.patient_first_name} ${invoice.patient_last_name}</strong></div>
          <div>${invoice.patient_address || ''}</div>
          <div>${invoice.patient_postal_code || ''} ${invoice.patient_city || ''}</div>
        </div>
        <div class="party">
          <div class="party-label">Behandler</div>
          <div>${invoice.practitioner_name || ''}</div>
          <div>HPR: ${invoice.practitioner_hpr || ''}</div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Takst</th>
              <th>Beskrivelse</th>
              <th style="text-align: center;">Antall</th>
              <th style="text-align: right;">Pris</th>
              <th style="text-align: right;">Belop</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Brutto:</span>
          <span>${formatCurrency(invoice.gross_amount)}</span>
        </div>
        <div class="total-row">
          <span>HELFO-refusjon:</span>
          <span>- ${formatCurrency(invoice.helfo_refund)}</span>
        </div>
        <div class="total-row grand-total">
          <span>A betale:</span>
          <span>${formatCurrency(invoice.amount_due)}</span>
        </div>
      </div>

      <div class="payment-info">
        <div class="payment-title">Betalingsinformasjon</div>
        <div>Kontonummer: ${invoice.organization_bank_account || '0000 00 00000'}</div>
        <div>KID: ${invoice.invoice_number.replace(/-/g, '')}</div>
        <div>Betales innen: ${dueDate}</div>
      </div>

      <div class="footer">
        <p>${invoice.organization_name} | ${invoice.organization_address} | ${invoice.organization_postal_code} ${invoice.organization_city}</p>
        <p>Org.nr: ${invoice.organization_org_number} | ${invoice.organization_email}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get HELFO report data for a period
 * @param {string} organizationId - Organization UUID
 * @param {string} startDate - Period start
 * @param {string} endDate - Period end
 * @returns {Promise<Object>} HELFO report data
 */
export const getHelfoReportData = async (organizationId, startDate, endDate) => {
  const result = await query(
    `SELECT
      i.invoice_number,
      i.invoice_date,
      i.helfo_refund,
      i.items,
      p.first_name || ' ' || p.last_name as patient_name,
      p.national_id as patient_fnr
     FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     WHERE i.organization_id = $1
       AND i.invoice_date >= $2
       AND i.invoice_date <= $3
       AND i.status != 'cancelled'
       AND i.helfo_refund > 0
     ORDER BY i.invoice_date`,
    [organizationId, startDate, endDate]
  );

  const totalRefund = result.rows.reduce((sum, row) => sum + parseFloat(row.helfo_refund), 0);

  return {
    period: { startDate, endDate },
    invoices: result.rows,
    totalRefund,
    invoiceCount: result.rows.length,
  };
};

export default {
  INVOICE_STATUS,
  PAYMENT_METHODS,
  getTakstCodes,
  getTakstCode,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  createInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
  finalizeInvoice,
  recordPayment,
  getInvoicePayments,
  cancelInvoice,
  getInvoiceStatistics,
  updateOverdueInvoices,
  generateInvoiceHTML,
  getHelfoReportData,
};
