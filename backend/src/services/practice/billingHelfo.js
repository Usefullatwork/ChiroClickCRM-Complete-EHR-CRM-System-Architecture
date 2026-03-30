/**
 * Billing HELFO and Statistics — Invoice statistics, overdue management, HTML generation, and HELFO reports.
 *
 * @module services/practice/billingHelfo
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

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
      p.date_of_birth as patient_dob
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
