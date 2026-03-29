/**
 * PDF Invoice Generation — Invoice PDF rendering.
 *
 * @module services/clinical/pdfInvoice
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import {
  fontName,
  formatNorwegianDate,
  formatNorwegianCurrency,
  createDoc,
  docToBuffer,
} from './pdf-utils.js';

/**
 * Generate invoice PDF
 * @param {string} organizationId - Organization ID
 * @param {string} financialMetricId - Financial metric ID
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export const generateInvoice = async (organizationId, financialMetricId) => {
  try {
    const result = await query(
      `SELECT
        fm.*,
        p.first_name,
        p.last_name,
        p.address,
        p.postal_code,
        p.city,
        o.name as clinic_name,
        o.address as clinic_address,
        o.org_number,
        o.phone as clinic_phone,
        o.email as clinic_email
      FROM financial_metrics fm
      JOIN patients p ON p.id = fm.patient_id
      JOIN organizations o ON o.id = fm.organization_id
      WHERE fm.id = $1 AND fm.organization_id = $2`,
      [financialMetricId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Financial metric not found');
    }

    const data = result.rows[0];
    const doc = createDoc();

    // Header with clinic info
    doc
      .fontSize(18)
      .font(fontName(true))
      .text(data.clinic_name || 'Klinikk', { align: 'left' });
    doc.fontSize(10).font(fontName(false));
    doc.text(data.clinic_address || '');
    if (data.clinic_phone) {
      doc.text(`Tlf: ${data.clinic_phone}`);
    }
    if (data.org_number) {
      doc.text(`Org.nr: ${data.org_number}`);
    }

    // Invoice title and number (right side)
    doc.fontSize(24).font(fontName(true));
    doc.text('FAKTURA', 400, 50, { width: 145, align: 'right' });
    doc.fontSize(10).font(fontName(false));
    doc.text(`Nr: ${data.invoice_number || 'N/A'}`, 400, 80, { width: 145, align: 'right' });
    doc.text(`Dato: ${formatNorwegianDate(data.created_at)}`, 400, 95, {
      width: 145,
      align: 'right',
    });

    // Horizontal line
    doc.y = 130;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Patient info
    doc.fontSize(10).font(fontName(true)).text('Faktureres til:');
    doc.font(fontName(false));
    doc.text(`${data.first_name || ''} ${data.last_name || ''}`);
    if (data.address) {
      doc.text(data.address);
    }
    if (data.postal_code || data.city) {
      doc.text(`${data.postal_code || ''} ${data.city || ''}`);
    }
    doc.moveDown(1.5);

    // Treatment codes table
    const treatmentCodes =
      typeof data.treatment_codes === 'string'
        ? JSON.parse(data.treatment_codes)
        : data.treatment_codes || [];

    // Table header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 25).fill('#f0f0f0');
    doc.fillColor('#000000').fontSize(10).font(fontName(true));
    doc.text('Takst', 60, tableTop + 7);
    doc.text('Beskrivelse', 150, tableTop + 7);
    doc.text('Beløp', 450, tableTop + 7, { width: 85, align: 'right' });

    // Table rows
    let rowY = tableTop + 25;
    doc.font(fontName(false));

    if (Array.isArray(treatmentCodes) && treatmentCodes.length > 0) {
      treatmentCodes.forEach((code, index) => {
        const rowHeight = 20;
        if (index % 2 === 0) {
          doc.rect(50, rowY, 495, rowHeight).fill('#fafafa');
        }
        doc.fillColor('#000000');
        doc.text(code.code || code, 60, rowY + 5);
        doc.text(code.description || '', 150, rowY + 5, { width: 280 });
        if (code.price) {
          doc.text(formatNorwegianCurrency(code.price), 450, rowY + 5, {
            width: 85,
            align: 'right',
          });
        }
        rowY += rowHeight;
      });
    } else {
      doc.text('Ingen takster', 60, rowY + 5);
      rowY += 20;
    }

    // Bottom line
    doc.moveTo(50, rowY).lineTo(545, rowY).stroke();
    doc.moveDown(1);
    doc.y = rowY + 20;

    // Totals
    doc.fontSize(11);
    doc.text(`Bruttobeløp: ${formatNorwegianCurrency(data.gross_amount)}`, { align: 'right' });
    doc.text(`Egenandel refusjon: ${formatNorwegianCurrency(data.insurance_amount)}`, {
      align: 'right',
    });
    doc.moveDown(0.5);
    doc.fontSize(14).font(fontName(true));
    doc.text(`Å betale: ${formatNorwegianCurrency(data.patient_amount)}`, { align: 'right' });
    doc.moveDown(1.5);

    // Payment info
    doc.fontSize(10).font(fontName(false));
    doc.font(fontName(true)).text('Betalingsinformasjon:');
    doc.font(fontName(false));
    doc.text('Vennligst betal innen 14 dager.');
    doc.moveDown(0.5);

    const statusMap = {
      PAID: 'BETALT',
      PENDING: 'UBETALT',
      CANCELLED: 'KANSELLERT',
    };
    const statusText = statusMap[data.payment_status] || data.payment_status;
    doc.font(fontName(true)).text(`Status: ${statusText}`);

    // Footer
    const footerY = doc.page.height - 50;
    doc.fontSize(8).font(fontName(false)).fillColor('#666666');
    const footerText = [
      data.clinic_name,
      data.clinic_address,
      data.clinic_phone ? `Tlf: ${data.clinic_phone}` : null,
      data.clinic_email,
    ]
      .filter(Boolean)
      .join(' | ');
    doc.text(footerText, 50, footerY, { align: 'center', width: 495 });

    // Convert to buffer
    const pdfBuffer = await docToBuffer(doc);

    logger.info(`Generated invoice PDF for financial metric ${financialMetricId}`, {
      size: pdfBuffer.length,
      invoiceNumber: data.invoice_number,
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `Faktura_${data.invoice_number || 'unknown'}_${data.last_name || 'patient'}.pdf`,
      invoice_number: data.invoice_number,
    };
  } catch (error) {
    logger.error('Error generating invoice:', error);
    throw error;
  }
};
