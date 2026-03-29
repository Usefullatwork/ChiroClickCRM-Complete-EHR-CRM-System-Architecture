/**
 * Billing Calculations — Takst codes, invoice totals, and number generation.
 *
 * @module services/practice/billingCalc
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { DEFAULT_INVOICE_DUE_DAYS } from '../../config/constants.js';
import takstCodes from '../../data/takst-codes.json' with { type: 'json' };

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
    due_days = DEFAULT_INVOICE_DUE_DAYS,
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
