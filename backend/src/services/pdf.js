/**
 * PDF Generation Service
 * Generates PDF documents for letters, reports, and invoices
 * Uses pdfkit for server-side PDF generation
 */

import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

// Norwegian date formatter
const formatDateNO = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format currency in Norwegian style
const formatCurrencyNO = (amount) => {
  if (amount === null || amount === undefined) return '0 kr';
  return `${Number(amount).toLocaleString('no-NO')} kr`;
};

/**
 * Create a new PDF document with standard settings
 * @returns {PDFDocument} Configured PDF document
 */
const createPDFDocument = () => {
  return new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'ChiroClick Document',
      Author: 'ChiroClick EHR',
      Creator: 'ChiroClick PDF Service'
    }
  });
};

/**
 * Convert PDF document stream to buffer
 * @param {PDFDocument} doc - PDF document
 * @returns {Promise<Buffer>} PDF as buffer
 */
const pdfToBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
};

/**
 * Draw document header with clinic info
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Document data
 * @param {string} title - Document title
 */
const drawHeader = (doc, data, title) => {
  // Title
  doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);

  // Horizontal line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Clinic info (right aligned)
  const startY = doc.y;
  doc.fontSize(10).font('Helvetica');
  doc.text(data.clinic_name || 'Klinikk', { align: 'right' });
  doc.text(data.clinic_address || '', { align: 'right' });
  if (data.clinic_phone) doc.text(`Tlf: ${data.clinic_phone}`, { align: 'right' });
  if (data.org_number) doc.text(`Org.nr: ${data.org_number}`, { align: 'right' });
  doc.moveDown(0.5);

  // Date
  doc.text(`Dato: ${formatDateNO(new Date())}`, { align: 'right' });
  doc.moveDown(1.5);
};

/**
 * Draw patient info box
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Patient data
 */
const drawPatientInfo = (doc, data) => {
  const boxTop = doc.y;

  // Background box
  doc.rect(50, boxTop, 495, 70).fill('#f5f5f5');

  // Patient info text
  doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
  doc.text('Pasientinformasjon:', 60, boxTop + 10);
  doc.font('Helvetica');
  doc.text(`Navn: ${data.first_name || ''} ${data.last_name || ''}`, 60, boxTop + 25);
  doc.text(`Fødselsdato: ${formatDateNO(data.date_of_birth)}`, 60, boxTop + 40);

  const address = [data.address, data.postal_code, data.city].filter(Boolean).join(', ');
  if (address) {
    doc.text(`Adresse: ${address}`, 60, boxTop + 55);
  }

  doc.y = boxTop + 80;
  doc.moveDown(1);
};

/**
 * Draw section header
 * @param {PDFDocument} doc - PDF document
 * @param {string} title - Section title
 */
const drawSectionHeader = (doc, title) => {
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
  doc.text(title);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor('#000000');
};

/**
 * Draw signature section
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Practitioner data
 */
const drawSignature = (doc, data) => {
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica');
  doc.text('Med vennlig hilsen,');
  doc.moveDown(2);

  // Signature line
  doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold');
  doc.text(data.practitioner_name || 'Behandler');
  doc.font('Helvetica');
  doc.text('Kiropraktor');
  if (data.hpr_number) {
    doc.text(`HPR-nummer: ${data.hpr_number}`);
  }
};

/**
 * Generate patient letter (sykefraværsattest, henvisning, etc.)
 * @param {string} organizationId - Organization ID
 * @param {string} encounterId - Encounter ID
 * @param {string} letterType - Letter type (SICK_LEAVE, REFERRAL, TREATMENT_SUMMARY)
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export const generatePatientLetter = async (organizationId, encounterId, letterType) => {
  try {
    // Get encounter data with all related information
    const encounterResult = await query(
      `SELECT
        ce.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.address,
        p.postal_code,
        p.city,
        o.name as clinic_name,
        o.address as clinic_address,
        o.phone as clinic_phone,
        o.org_number,
        u.first_name || ' ' || u.last_name as practitioner_name,
        u.hpr_number
      FROM clinical_encounters ce
      JOIN patients p ON p.id = ce.patient_id
      JOIN organizations o ON o.id = ce.organization_id
      JOIN users u ON u.id = ce.practitioner_id
      WHERE ce.id = $1 AND ce.organization_id = $2`,
      [encounterId, organizationId]
    );

    if (encounterResult.rows.length === 0) {
      throw new Error('Encounter not found');
    }

    const data = encounterResult.rows[0];
    const doc = createPDFDocument();

    // Generate letter based on type
    switch (letterType) {
      case 'SICK_LEAVE':
        generateSickLeavePDF(doc, data);
        break;
      case 'REFERRAL':
        generateReferralPDF(doc, data);
        break;
      case 'TREATMENT_SUMMARY':
        generateTreatmentSummaryPDF(doc, data);
        break;
      default:
        throw new Error(`Unknown letter type: ${letterType}`);
    }

    // Convert to buffer
    const pdfBuffer = await pdfToBuffer(doc);

    logger.info(`Generated ${letterType} PDF for encounter ${encounterId}`, {
      size: pdfBuffer.length,
      type: letterType
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `${letterType}_${data.last_name}_${new Date().toISOString().split('T')[0]}.pdf`,
      encounter_id: encounterId,
      letter_type: letterType
    };
  } catch (error) {
    logger.error('Error generating patient letter:', error);
    throw error;
  }
};

/**
 * Generate sick leave letter PDF (Sykefraværsattest)
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Encounter data
 */
function generateSickLeavePDF(doc, data) {
  drawHeader(doc, data, 'Sykefraværsattest');
  drawPatientInfo(doc, data);

  // Diagnosis
  drawSectionHeader(doc, 'Diagnosekode(r):');
  const icpcCodes = data.icpc_codes ? data.icpc_codes.join(', ') : 'Ikke spesifisert';
  doc.text(icpcCodes);
  doc.moveDown(1);

  // Assessment
  drawSectionHeader(doc, 'Vurdering:');
  const assessment = data.assessment?.clinical_reasoning || 'Kiropraktisk vurdering utført.';
  doc.text(assessment, { align: 'justify' });
  doc.moveDown(1);

  // Recommendation
  drawSectionHeader(doc, 'Anbefaling:');
  const advice = data.plan?.advice || 'Pasienten anbefales å følge behandlingsplanen.';
  doc.text(advice, { align: 'justify' });
  doc.moveDown(1);

  // Sick leave period if applicable
  if (data.sick_leave_start || data.sick_leave_end) {
    drawSectionHeader(doc, 'Sykefraværsperiode:');
    const period = `${formatDateNO(data.sick_leave_start)} - ${formatDateNO(data.sick_leave_end)}`;
    doc.text(period);
    doc.moveDown(1);
  }

  // Percentage if applicable
  if (data.sick_leave_percentage) {
    drawSectionHeader(doc, 'Sykefraværsgrad:');
    doc.text(`${data.sick_leave_percentage}%`);
    doc.moveDown(1);
  }

  drawSignature(doc, data);
}

/**
 * Generate referral letter PDF (Henvisning)
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Encounter data
 */
function generateReferralPDF(doc, data) {
  drawHeader(doc, data, 'Henvisning');
  drawPatientInfo(doc, data);

  // Referral recipient
  drawSectionHeader(doc, 'Henvisning til:');
  const referralTo = data.plan?.referrals || '[Spesialist/Instans]';
  doc.text(referralTo);
  doc.moveDown(1);

  // History
  drawSectionHeader(doc, 'Sykehistorie:');
  const history = data.subjective?.history || 'Se pasientjournal.';
  doc.text(history, { align: 'justify' });
  doc.moveDown(1);

  // Findings
  drawSectionHeader(doc, 'Funn:');
  if (data.objective?.observation) {
    doc.font('Helvetica-Bold').text('Observasjon: ', { continued: true });
    doc.font('Helvetica').text(data.objective.observation);
  }
  if (data.objective?.palpation) {
    doc.font('Helvetica-Bold').text('Palpasjon: ', { continued: true });
    doc.font('Helvetica').text(data.objective.palpation);
  }
  if (data.objective?.ortho_tests) {
    doc.font('Helvetica-Bold').text('Ortopediske tester: ', { continued: true });
    doc.font('Helvetica').text(data.objective.ortho_tests);
  }
  if (data.objective?.neuro_tests) {
    doc.font('Helvetica-Bold').text('Nevrologiske tester: ', { continued: true });
    doc.font('Helvetica').text(data.objective.neuro_tests);
  }
  doc.moveDown(1);

  // Assessment
  drawSectionHeader(doc, 'Vurdering:');
  const assessment = data.assessment?.clinical_reasoning || 'Kiropraktisk vurdering utført.';
  doc.text(assessment, { align: 'justify' });
  doc.moveDown(1);

  // Diagnosis codes
  drawSectionHeader(doc, 'Diagnosekode(r):');
  const icpcCodes = data.icpc_codes ? data.icpc_codes.join(', ') : 'Ikke spesifisert';
  doc.text(icpcCodes);
  doc.moveDown(1);

  // Reason for referral
  drawSectionHeader(doc, 'Grunnen til henvisning:');
  doc.text('Pasienten henvises for videre utredning og behandling.', { align: 'justify' });

  drawSignature(doc, data);
}

/**
 * Generate treatment summary PDF
 * @param {PDFDocument} doc - PDF document
 * @param {Object} data - Encounter data
 */
function generateTreatmentSummaryPDF(doc, data) {
  drawHeader(doc, data, 'Behandlingssammendrag');
  drawPatientInfo(doc, data);

  // SUBJECTIVE
  drawSectionHeader(doc, 'SUBJEKTIVT (S):');
  if (data.subjective?.chief_complaint) {
    doc.font('Helvetica-Bold').text('Hovedplage: ', { continued: true });
    doc.font('Helvetica').text(data.subjective.chief_complaint);
  }
  if (data.subjective?.history) {
    doc.font('Helvetica-Bold').text('Sykehistorie: ', { continued: true });
    doc.font('Helvetica').text(data.subjective.history);
  }
  if (data.subjective?.pain_description) {
    doc.font('Helvetica-Bold').text('Smertebeskrivelse: ', { continued: true });
    doc.font('Helvetica').text(data.subjective.pain_description);
  }
  doc.moveDown(1);

  // OBJECTIVE
  drawSectionHeader(doc, 'OBJEKTIVT (O):');
  if (data.objective?.observation) {
    doc.font('Helvetica-Bold').text('Observasjon: ', { continued: true });
    doc.font('Helvetica').text(data.objective.observation);
  }
  if (data.objective?.palpation) {
    doc.font('Helvetica-Bold').text('Palpasjon: ', { continued: true });
    doc.font('Helvetica').text(data.objective.palpation);
  }
  if (data.objective?.rom) {
    doc.font('Helvetica-Bold').text('Bevegelighet (ROM): ', { continued: true });
    doc.font('Helvetica').text(data.objective.rom);
  }
  if (data.objective?.ortho_tests) {
    doc.font('Helvetica-Bold').text('Ortopediske tester: ', { continued: true });
    doc.font('Helvetica').text(data.objective.ortho_tests);
  }
  if (data.objective?.neuro_tests) {
    doc.font('Helvetica-Bold').text('Nevrologiske tester: ', { continued: true });
    doc.font('Helvetica').text(data.objective.neuro_tests);
  }
  doc.moveDown(1);

  // ASSESSMENT
  drawSectionHeader(doc, 'VURDERING (A):');
  if (data.assessment?.clinical_reasoning) {
    doc.text(data.assessment.clinical_reasoning, { align: 'justify' });
  }
  if (data.icpc_codes && data.icpc_codes.length > 0) {
    doc.font('Helvetica-Bold').text('Diagnosekode(r): ', { continued: true });
    doc.font('Helvetica').text(data.icpc_codes.join(', '));
  }
  if (data.assessment?.prognosis) {
    doc.font('Helvetica-Bold').text('Prognose: ', { continued: true });
    doc.font('Helvetica').text(data.assessment.prognosis);
  }
  doc.moveDown(1);

  // PLAN
  drawSectionHeader(doc, 'PLAN (P):');
  if (data.plan?.treatment) {
    doc.font('Helvetica-Bold').text('Behandling: ', { continued: true });
    doc.font('Helvetica').text(data.plan.treatment);
  }
  if (data.plan?.exercises) {
    doc.font('Helvetica-Bold').text('Øvelser: ', { continued: true });
    doc.font('Helvetica').text(data.plan.exercises);
  }
  if (data.plan?.advice) {
    doc.font('Helvetica-Bold').text('Råd: ', { continued: true });
    doc.font('Helvetica').text(data.plan.advice);
  }
  if (data.plan?.follow_up) {
    doc.font('Helvetica-Bold').text('Oppfølging: ', { continued: true });
    doc.font('Helvetica').text(data.plan.follow_up);
  }
  doc.moveDown(1);

  // Pain assessment
  if (data.vas_pain_start !== null && data.vas_pain_start !== undefined) {
    drawSectionHeader(doc, 'Smertevurdering (VAS):');
    doc.text(`VAS ved start: ${data.vas_pain_start}/10`);
    if (data.vas_pain_end !== null && data.vas_pain_end !== undefined) {
      doc.text(`VAS ved slutt: ${data.vas_pain_end}/10`);
    }
  }

  drawSignature(doc, data);
}

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
    const doc = createPDFDocument();

    // Header with clinic info
    doc.fontSize(18).font('Helvetica-Bold').text(data.clinic_name || 'Klinikk', { align: 'left' });
    doc.fontSize(10).font('Helvetica');
    doc.text(data.clinic_address || '');
    if (data.clinic_phone) doc.text(`Tlf: ${data.clinic_phone}`);
    if (data.org_number) doc.text(`Org.nr: ${data.org_number}`);

    // Invoice title and number (right side)
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('FAKTURA', 400, 50, { width: 145, align: 'right' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nr: ${data.invoice_number || 'N/A'}`, 400, 80, { width: 145, align: 'right' });
    doc.text(`Dato: ${formatDateNO(data.created_at)}`, 400, 95, { width: 145, align: 'right' });

    // Horizontal line
    doc.y = 130;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Patient info
    doc.fontSize(10).font('Helvetica-Bold').text('Faktureres til:');
    doc.font('Helvetica');
    doc.text(`${data.first_name || ''} ${data.last_name || ''}`);
    if (data.address) doc.text(data.address);
    if (data.postal_code || data.city) doc.text(`${data.postal_code || ''} ${data.city || ''}`);
    doc.moveDown(1.5);

    // Treatment codes table
    const treatmentCodes = typeof data.treatment_codes === 'string'
      ? JSON.parse(data.treatment_codes)
      : data.treatment_codes || [];

    // Table header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 25).fill('#f0f0f0');
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('Takst', 60, tableTop + 7);
    doc.text('Beskrivelse', 150, tableTop + 7);
    doc.text('Beløp', 450, tableTop + 7, { width: 85, align: 'right' });

    // Table rows
    let rowY = tableTop + 25;
    doc.font('Helvetica');

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
          doc.text(formatCurrencyNO(code.price), 450, rowY + 5, { width: 85, align: 'right' });
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
    doc.text(`Bruttobeløp: ${formatCurrencyNO(data.gross_amount)}`, { align: 'right' });
    doc.text(`Egenandel refusjon: ${formatCurrencyNO(data.insurance_amount)}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Å betale: ${formatCurrencyNO(data.patient_amount)}`, { align: 'right' });
    doc.moveDown(1.5);

    // Payment info
    doc.fontSize(10).font('Helvetica');
    doc.font('Helvetica-Bold').text('Betalingsinformasjon:');
    doc.font('Helvetica');
    doc.text('Vennligst betal innen 14 dager.');
    doc.moveDown(0.5);

    const statusMap = {
      'PAID': 'BETALT',
      'PENDING': 'UBETALT',
      'CANCELLED': 'KANSELLERT'
    };
    const statusText = statusMap[data.payment_status] || data.payment_status;
    doc.font('Helvetica-Bold').text(`Status: ${statusText}`);

    // Footer
    const footerY = doc.page.height - 50;
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    const footerText = [
      data.clinic_name,
      data.clinic_address,
      data.clinic_phone ? `Tlf: ${data.clinic_phone}` : null,
      data.clinic_email
    ].filter(Boolean).join(' | ');
    doc.text(footerText, 50, footerY, { align: 'center', width: 495 });

    // Convert to buffer
    const pdfBuffer = await pdfToBuffer(doc);

    logger.info(`Generated invoice PDF for financial metric ${financialMetricId}`, {
      size: pdfBuffer.length,
      invoiceNumber: data.invoice_number
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `Faktura_${data.invoice_number || 'unknown'}_${data.last_name || 'patient'}.pdf`,
      invoice_number: data.invoice_number
    };
  } catch (error) {
    logger.error('Error generating invoice:', error);
    throw error;
  }
};

/**
 * Generate a simple text-based PDF (for custom letters)
 * @param {Object} options - PDF options
 * @param {string} options.title - Document title
 * @param {string} options.content - Main content
 * @param {Object} options.clinic - Clinic info
 * @param {Object} options.patient - Patient info (optional)
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export const generateCustomPDF = async (options) => {
  try {
    const { title, content, clinic = {}, patient = null, practitioner = null } = options;

    const doc = createPDFDocument();

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(title || 'Dokument', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Clinic info
    if (clinic.name) {
      doc.fontSize(10).font('Helvetica');
      doc.text(clinic.name, { align: 'right' });
      if (clinic.address) doc.text(clinic.address, { align: 'right' });
      doc.text(`Dato: ${formatDateNO(new Date())}`, { align: 'right' });
      doc.moveDown(1);
    }

    // Patient info
    if (patient) {
      drawPatientInfo(doc, patient);
    }

    // Main content
    doc.fontSize(11).font('Helvetica');
    doc.text(content || '', { align: 'justify' });

    // Signature
    if (practitioner) {
      drawSignature(doc, practitioner);
    }

    const pdfBuffer = await pdfToBuffer(doc);

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `${title || 'document'}_${formatDateNO(new Date()).replace(/\./g, '-')}.pdf`
    };
  } catch (error) {
    logger.error('Error generating custom PDF:', error);
    throw error;
  }
};

export default {
  generatePatientLetter,
  generateInvoice,
  generateCustomPDF
};
