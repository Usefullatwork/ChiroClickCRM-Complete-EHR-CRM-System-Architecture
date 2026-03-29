/**
 * Billing Service
 * Norwegian healthcare invoicing and payment management
 *
 * Barrel re-export — all functions split into domain modules:
 *   billingCalc.js    — Takst codes, calculations, invoice creation
 *   billingInvoice.js — Invoice CRUD, payments, lifecycle
 *   billingHelfo.js   — Statistics, overdue management, HTML generation, HELFO reports
 */

export {
  INVOICE_STATUS,
  PAYMENT_METHODS,
  getTakstCodes,
  getTakstCode,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  createInvoice,
} from './billingCalc.js';

export {
  getInvoiceById,
  getInvoices,
  updateInvoice,
  finalizeInvoice,
  recordPayment,
  getInvoicePayments,
  cancelInvoice,
} from './billingInvoice.js';

export {
  getInvoiceStatistics,
  updateOverdueInvoices,
  generateInvoiceHTML,
  getHelfoReportData,
} from './billingHelfo.js';

export default {
  INVOICE_STATUS: (await import('./billingCalc.js')).INVOICE_STATUS,
  PAYMENT_METHODS: (await import('./billingCalc.js')).PAYMENT_METHODS,
  getTakstCodes: (await import('./billingCalc.js')).getTakstCodes,
  getTakstCode: (await import('./billingCalc.js')).getTakstCode,
  calculateInvoiceTotals: (await import('./billingCalc.js')).calculateInvoiceTotals,
  generateInvoiceNumber: (await import('./billingCalc.js')).generateInvoiceNumber,
  createInvoice: (await import('./billingCalc.js')).createInvoice,
  getInvoiceById: (await import('./billingInvoice.js')).getInvoiceById,
  getInvoices: (await import('./billingInvoice.js')).getInvoices,
  updateInvoice: (await import('./billingInvoice.js')).updateInvoice,
  finalizeInvoice: (await import('./billingInvoice.js')).finalizeInvoice,
  recordPayment: (await import('./billingInvoice.js')).recordPayment,
  getInvoicePayments: (await import('./billingInvoice.js')).getInvoicePayments,
  cancelInvoice: (await import('./billingInvoice.js')).cancelInvoice,
  getInvoiceStatistics: (await import('./billingHelfo.js')).getInvoiceStatistics,
  updateOverdueInvoices: (await import('./billingHelfo.js')).updateOverdueInvoices,
  generateInvoiceHTML: (await import('./billingHelfo.js')).generateInvoiceHTML,
  getHelfoReportData: (await import('./billingHelfo.js')).getHelfoReportData,
};
