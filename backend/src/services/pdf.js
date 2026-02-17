/**
 * PDF Generation Service
 * Generates PDF documents for letters, reports, and invoices
 * Uses pdfkit for server-side PDF generation
 */

import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch image from URL and return as buffer
 * @param {string} url - Image URL
 * @returns {Promise<Buffer|null>} Image buffer or null if failed
 */
const fetchImageBuffer = async (url) => {
  if (!url) {
    return null;
  }

  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000); // 5 second timeout

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          clearTimeout(timeout);
          resolve(null);
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
        });
        response.on('error', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      })
      .on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
};

// Norwegian date formatter
const formatDateNO = (date) => {
  if (!date) {
    return 'N/A';
  }
  const d = new Date(date);
  return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format currency in Norwegian style
const formatCurrencyNO = (amount) => {
  if (amount === null || amount === undefined) {
    return '0 kr';
  }
  return `${Number(amount).toLocaleString('no-NO')} kr`;
};

/**
 * Get path to a Unicode-capable font
 * @returns {string|null} Font path or null if not found
 */
const getUnicodeFontPath = () => {
  // Try common Windows font paths for Arial (supports Norwegian characters)
  const windowsFontPaths = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/Arial.ttf',
    'C:/Windows/Fonts/calibri.ttf',
    'C:/Windows/Fonts/Calibri.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
  ];

  // Try common Linux/Mac paths
  const unixFontPaths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
  ];

  const allPaths = [...windowsFontPaths, ...unixFontPaths];

  for (const fontPath of allPaths) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }
  return null;
};

// Cache the font path
let cachedFontPath = null;
let fontPathChecked = false;

// Cache the bold font path
let cachedBoldFontPath = null;

/**
 * Get path to bold variant of the font
 * @param {string} regularPath - Path to regular font
 * @returns {string|null} Bold font path or null
 */
const getBoldFontPath = (regularPath) => {
  if (!regularPath) {
    return null;
  }

  // Try common bold font naming conventions
  const boldPaths = [
    regularPath.replace(/\.ttf$/i, 'bd.ttf'), // arial.ttf -> arialbd.ttf
    regularPath.replace(/\.ttf$/i, '-Bold.ttf'), // font.ttf -> font-Bold.ttf
    regularPath.replace(/\.ttf$/i, 'b.ttf'), // font.ttf -> fontb.ttf
  ];

  for (const boldPath of boldPaths) {
    if (fs.existsSync(boldPath)) {
      return boldPath;
    }
  }
  return null;
};

/**
 * Create a new PDF document with standard settings
 * @returns {PDFDocument} Configured PDF document
 */
const createPDFDocument = () => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'ChiroClick Document',
      Author: 'ChiroClick EHR',
      Creator: 'ChiroClick PDF Service',
    },
  });

  // Check for Unicode font path (only once)
  if (!fontPathChecked) {
    cachedFontPath = getUnicodeFontPath();
    cachedBoldFontPath = getBoldFontPath(cachedFontPath);
    fontPathChecked = true;
    if (cachedFontPath) {
      logger.info(`PDF Service: Using Unicode font from ${cachedFontPath}`);
      if (cachedBoldFontPath) {
        logger.info(`PDF Service: Using bold font from ${cachedBoldFontPath}`);
      }
    } else {
      logger.warn(
        'PDF Service: No Unicode font found, Norwegian characters may not display correctly'
      );
    }
  }

  // Register fonts on THIS document instance (each PDFDocument is independent)
  if (cachedFontPath) {
    try {
      doc.registerFont('Unicode', cachedFontPath);
      // Use actual bold font if available, otherwise fall back to regular
      if (cachedBoldFontPath) {
        doc.registerFont('Unicode-Bold', cachedBoldFontPath);
      } else {
        doc.registerFont('Unicode-Bold', cachedFontPath);
      }
    } catch (err) {
      logger.warn(`Failed to register Unicode font: ${err.message}`);
    }
  }

  return doc;
};

/**
 * Get font name - uses Unicode font if available, falls back to Helvetica
 * @param {boolean} bold - Whether to use bold variant
 * @returns {string} Font name
 */
const getFont = (bold = false) => {
  if (cachedFontPath) {
    return bold ? 'Unicode-Bold' : 'Unicode';
  }
  return bold ? 'Helvetica-Bold' : 'Helvetica';
};

/**
 * Convert PDF document stream to buffer
 * @param {PDFDocument} doc - PDF document
 * @returns {Promise<Buffer>} PDF as buffer
 */
const pdfToBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

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
  const _startY = doc.y;
  doc.fontSize(10).font('Helvetica');
  doc.text(data.clinic_name || 'Klinikk', { align: 'right' });
  doc.text(data.clinic_address || '', { align: 'right' });
  if (data.clinic_phone) {
    doc.text(`Tlf: ${data.clinic_phone}`, { align: 'right' });
  }
  if (data.org_number) {
    doc.text(`Org.nr: ${data.org_number}`, { align: 'right' });
  }
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
      type: letterType,
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `${letterType}_${data.last_name}_${new Date().toISOString().split('T')[0]}.pdf`,
      encounter_id: encounterId,
      letter_type: letterType,
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
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.clinic_name || 'Klinikk', { align: 'left' });
    doc.fontSize(10).font('Helvetica');
    doc.text(data.clinic_address || '');
    if (data.clinic_phone) {
      doc.text(`Tlf: ${data.clinic_phone}`);
    }
    if (data.org_number) {
      doc.text(`Org.nr: ${data.org_number}`);
    }

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
      PAID: 'BETALT',
      PENDING: 'UBETALT',
      CANCELLED: 'KANSELLERT',
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
      data.clinic_email,
    ]
      .filter(Boolean)
      .join(' | ');
    doc.text(footerText, 50, footerY, { align: 'center', width: 495 });

    // Convert to buffer
    const pdfBuffer = await pdfToBuffer(doc);

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
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title || 'Dokument', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Clinic info
    if (clinic.name) {
      doc.fontSize(10).font('Helvetica');
      doc.text(clinic.name, { align: 'right' });
      if (clinic.address) {
        doc.text(clinic.address, { align: 'right' });
      }
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
      filename: `${title || 'document'}_${formatDateNO(new Date()).replace(/\./g, '-')}.pdf`,
    };
  } catch (error) {
    logger.error('Error generating custom PDF:', error);
    throw error;
  }
};

/**
 * Generate exercise handout PDF for a patient
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export const generateExerciseHandout = async (organizationId, patientId) => {
  try {
    // Get patient info
    const patientResult = await query(
      `SELECT p.*, o.name as clinic_name, o.address as clinic_address, o.phone as clinic_phone
       FROM patients p
       JOIN organizations o ON o.id = p.organization_id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }

    const patient = patientResult.rows[0];

    // Get active exercise prescriptions with full exercise details
    const exercisesResult = await query(
      `SELECT pep.*,
              e.video_url, e.image_url, e.thumbnail_url,
              e.contraindications, e.precautions,
              e.instructions_no, e.instructions_en
       FROM patient_exercise_prescriptions pep
       LEFT JOIN exercise_library e ON e.id = pep.exercise_id
       WHERE pep.patient_id = $1 AND pep.organization_id = $2 AND pep.status = 'active'
       ORDER BY pep.created_at DESC`,
      [patientId, organizationId]
    );

    const exercises = exercisesResult.rows;
    const doc = createPDFDocument();

    // Use Unicode font throughout
    const font = getFont(false);
    const fontBold = getFont(true);

    // Header
    doc.fontSize(20).font(fontBold).text('Ditt øvelsesprogram', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Clinic info (right aligned)
    doc.fontSize(10).font(font);
    doc.text(patient.clinic_name || 'Klinikk', { align: 'right' });
    if (patient.clinic_address) {
      doc.text(patient.clinic_address, { align: 'right' });
    }
    if (patient.clinic_phone) {
      doc.text(`Tlf: ${patient.clinic_phone}`, { align: 'right' });
    }
    doc.moveDown(1);

    // Patient info
    doc.fontSize(12).font(font);
    doc.text(`Pasient: ${patient.first_name} ${patient.last_name}`);
    doc.text(`Dato: ${formatDateNO(new Date())}`);
    doc.moveDown(1);

    // Introduction
    doc.fontSize(10).font(font);
    doc.text(
      'Her er dine foreskrevne øvelser. Følg instruksjonene nøye og kontakt din behandler ved spørsmål.',
      { align: 'justify' }
    );
    doc.moveDown(1);

    // Frequency labels in Norwegian
    const frequencyLabels = {
      daily: 'Daglig',
      '2x_daily': '2 ganger daglig',
      '3x_week': '3 ganger per uke',
      weekly: 'Ukentlig',
      as_needed: 'Ved behov',
    };

    // Exercises
    if (exercises.length === 0) {
      doc.text('Ingen aktive øvelser.', { align: 'center' });
    } else {
      for (let index = 0; index < exercises.length; index++) {
        const exercise = exercises[index];

        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        // Exercise number and name
        doc.fontSize(14).font(fontBold).fillColor('#2d7d46');
        doc.text(`${index + 1}. ${exercise.exercise_name}`);
        doc.fillColor('#000000');
        doc.moveDown(0.3);

        // Try to fetch and embed image
        const imageUrl = exercise.image_url || exercise.thumbnail_url;
        let imageEmbedded = false;

        if (imageUrl) {
          try {
            const imageBuffer = await fetchImageBuffer(imageUrl);
            if (imageBuffer && imageBuffer.length > 0) {
              const imageX = 380;
              const imageY = doc.y;
              const imageWidth = 150;
              const imageHeight = 100;

              doc.image(imageBuffer, imageX, imageY, {
                fit: [imageWidth, imageHeight],
                align: 'center',
                valign: 'center',
              });
              imageEmbedded = true;
            }
          } catch (imgErr) {
            logger.debug(
              `Could not embed image for exercise ${exercise.exercise_code}: ${imgErr.message}`
            );
          }
        }

        // Dosing info box (narrower if image is present)
        const dosingTop = doc.y;
        const dosingWidth = imageEmbedded ? 300 : 200;
        doc.rect(50, dosingTop, dosingWidth, 50).fill('#f5f9f6');
        doc.fillColor('#000000').fontSize(10).font(fontBold);
        doc.text('Dosering:', 60, dosingTop + 8);
        doc.font(font);
        doc.text(
          `${exercise.sets || 3} sett × ${exercise.reps || 10} repetisjoner`,
          60,
          dosingTop + 22
        );
        if (exercise.hold_seconds) {
          doc.text(`Hold: ${exercise.hold_seconds} sekunder`, 60, dosingTop + 36);
        }
        doc.text(
          `Frekvens: ${frequencyLabels[exercise.frequency] || exercise.frequency}`,
          170,
          dosingTop + 22
        );

        doc.y = dosingTop + (imageEmbedded ? 110 : 60);

        // Instructions (prefer Norwegian, fallback to English or stored instructions)
        const instructions =
          exercise.instructions_no || exercise.exercise_instructions || exercise.instructions_en;
        if (instructions) {
          doc.fontSize(10).font(fontBold);
          doc.text('Instruksjoner:');
          doc.font(font);
          doc.text(instructions, { align: 'justify' });
          doc.moveDown(0.5);
        }

        // Custom instructions from practitioner
        if (exercise.custom_instructions) {
          doc.fontSize(10).font(fontBold).fillColor('#1e5db8');
          doc.text('Fra din behandler:');
          doc.font(font);
          doc.text(exercise.custom_instructions, { align: 'justify' });
          doc.fillColor('#000000');
          doc.moveDown(0.5);
        }

        // Precautions
        if (exercise.precautions) {
          doc.fontSize(9).font(fontBold).fillColor('#b86e00');
          doc.text('Forsiktighetsregler: ', { continued: true });
          doc.font(font);
          doc.text(exercise.precautions);
          doc.fillColor('#000000');
          doc.moveDown(0.3);
        }

        // Contraindications
        if (exercise.contraindications) {
          doc.fontSize(9).font(fontBold).fillColor('#b82e2e');
          doc.text('Kontraindikasjoner: ', { continued: true });
          doc.font(font);
          doc.text(exercise.contraindications);
          doc.fillColor('#000000');
          doc.moveDown(0.3);
        }

        // Video link if available
        if (exercise.video_url) {
          doc.fontSize(9).fillColor('#0066cc');
          doc.text('Se video: ', { continued: true });
          doc.text(exercise.video_url, { link: exercise.video_url, underline: true });
          doc.fillColor('#000000');
        }

        doc.moveDown(1);

        // Separator line
        if (index < exercises.length - 1) {
          doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(3, { space: 3 }).stroke();
          doc.undash();
          doc.moveDown(0.5);
        }
      }
    }

    // Tracking table
    if (exercises.length > 0) {
      if (doc.y > 500) {
        doc.addPage();
      }

      doc.moveDown(1);
      doc.fontSize(12).font(fontBold);
      doc.text('Ukentlig oppfølgingsskjema', { align: 'center' });
      doc.moveDown(0.5);

      // Create a simple tracking grid
      const tableTop = doc.y;
      const cellWidth = 28;
      const rowHeight = 25;
      const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

      // Header row
      doc.rect(50, tableTop, 170, rowHeight).fill('#f0f0f0');
      doc.fillColor('#000000').fontSize(9).font(fontBold);
      doc.text('Øvelse', 55, tableTop + 8);

      days.forEach((day, i) => {
        doc.rect(220 + i * cellWidth, tableTop, cellWidth, rowHeight).stroke();
        doc.text(day, 223 + i * cellWidth, tableTop + 8, { width: cellWidth - 6, align: 'center' });
      });

      // Exercise rows (max 8 to fit on page)
      const maxRows = Math.min(exercises.length, 8);
      for (let i = 0; i < maxRows; i++) {
        const rowY = tableTop + rowHeight + i * rowHeight;
        doc.rect(50, rowY, 170, rowHeight).stroke();
        doc.font(font).fontSize(8);

        // Truncate exercise name if too long
        let name = exercises[i].exercise_name;
        if (name.length > 25) {
          name = `${name.substring(0, 22)}...`;
        }
        doc.text(name, 55, rowY + 8, { width: 160 });

        // Day cells
        days.forEach((_, j) => {
          doc.rect(220 + j * cellWidth, rowY, cellWidth, rowHeight).stroke();
        });
      }

      doc.y = tableTop + rowHeight + maxRows * rowHeight + 10;
    }

    // Footer instructions
    doc.moveDown(1);
    doc.fontSize(9).font(font).fillColor('#666666');
    doc.text('Tips:');
    doc.list(
      [
        'Gjør øvelsene som vist av behandleren din',
        'Stopp hvis du opplever økt smerte',
        'Marker av når du har gjennomført øvelsene',
        'Ta med dette skjemaet til neste konsultasjon',
      ],
      { bulletRadius: 2, textIndent: 15 }
    );

    doc.fillColor('#000000');

    // Convert to buffer
    const pdfBuffer = await pdfToBuffer(doc);

    logger.info(`Generated exercise handout PDF for patient ${patientId}`, {
      size: pdfBuffer.length,
      exerciseCount: exercises.length,
    });

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `Ovelsesprogram_${patient.last_name}_${formatDateNO(new Date()).replace(/\./g, '-')}.pdf`,
      patientId,
      exerciseCount: exercises.length,
    };
  } catch (error) {
    logger.error('Error generating exercise handout:', error);
    throw error;
  }
};

export default {
  generatePatientLetter,
  generateInvoice,
  generateCustomPDF,
  generateExerciseHandout,
};
