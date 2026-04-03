/**
 * Billing API — invoices, payments, claims, HELFO, financial
 */
import apiClient from './client';

export const financialAPI = {
  getAll: (params) => apiClient.get('/financial', { params }),
  getById: (id) => apiClient.get(`/financial/${id}`),
  getByPatient: (patientId) => apiClient.get(`/financial/patient/${patientId}`),
  create: (data) => apiClient.post('/financial', data),
  updatePaymentStatus: (id, data) => apiClient.patch(`/financial/${id}/payment-status`, data),
  getSummary: (params) => apiClient.get('/financial/summary', { params }),
  getRevenueByCode: (params) => apiClient.get('/financial/revenue-by-code', { params }),
  getPaymentMethods: (params) => apiClient.get('/financial/payment-methods', { params }),
  getOutstanding: (params) => apiClient.get('/financial/outstanding', { params }),
  getDailyRevenueChart: (params) => apiClient.get('/financial/chart/daily-revenue', { params }),
  generateInvoiceNumber: () => apiClient.get('/financial/invoice-number'),
};

export const billingAPI = {
  // Takst Codes
  getTakstCodes: () => apiClient.get('/billing/takst-codes'),
  getTakstCode: (code) => apiClient.get(`/billing/takst-codes/${code}`),
  calculateTotals: (data) => apiClient.post('/billing/calculate', data),

  // Invoices
  getInvoices: (params) => apiClient.get('/billing/invoices', { params }),
  getInvoice: (id) => apiClient.get(`/billing/invoices/${id}`),
  createInvoice: (data) => apiClient.post('/billing/invoices', data),
  updateInvoice: (id, data) => apiClient.patch(`/billing/invoices/${id}`, data),
  finalizeInvoice: (id) => apiClient.post(`/billing/invoices/${id}/finalize`),
  cancelInvoice: (id, data) => apiClient.post(`/billing/invoices/${id}/cancel`, data),
  getInvoiceHTML: (id) => apiClient.get(`/billing/invoices/${id}/html`),
  getStatistics: (params) => apiClient.get('/billing/invoices/statistics', { params }),
  generateInvoiceNumber: () => apiClient.get('/billing/invoices/number'),
  updateOverdueInvoices: () => apiClient.post('/billing/invoices/update-overdue'),

  // Payments
  getInvoicePayments: (invoiceId) => apiClient.get(`/billing/invoices/${invoiceId}/payments`),
  recordPayment: (invoiceId, data) =>
    apiClient.post(`/billing/invoices/${invoiceId}/payments`, data),

  // HELFO Reports
  getHelfoReport: (params) => apiClient.get('/billing/helfo-report', { params }),
};

export const pdfAPI = {
  generateInvoice: (financialMetricId) => apiClient.post(`/pdf/invoice/${financialMetricId}`),
  generatePatientLetter: (encounterId, letterType) =>
    apiClient.post(`/pdf/letter/${encounterId}`, { letterType }),
  deliverDocument: (type, id, data) => apiClient.post(`/pdf/${type}/${id}/deliver`, data),
  generateReferralLetter: (data) =>
    apiClient.post('/pdf/referral-letter', data, { responseType: 'blob' }),
  generateSickNote: (data) => apiClient.post('/pdf/sick-note', data, { responseType: 'blob' }),
};
