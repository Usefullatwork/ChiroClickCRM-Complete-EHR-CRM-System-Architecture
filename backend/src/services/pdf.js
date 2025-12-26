/**
 * PDF Generation Service
 * Generates PDF documents for letters, reports, and invoices
 *
 * PDF Generation Options:
 * 1. Native PDF (recommended): Install pdf-lib with `npm install pdf-lib`
 * 2. HTML fallback: Returns HTML for client-side conversion using browser print
 *
 * The service automatically detects pdf-lib and uses it when available.
 */

import logger from '../utils/logger.js';
import { query } from '../config/database.js';

// Try to dynamically import pdf-lib for native PDF generation
let PDFDocument = null;
let rgb = null;
let StandardFonts = null;
let pdfLibAvailable = false;

// Check for pdf-lib availability at runtime
const initPdfLib = async () => {
  if (pdfLibAvailable) return true;
  try {
    const pdfLib = await import('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
    rgb = pdfLib.rgb;
    StandardFonts = pdfLib.StandardFonts;
    pdfLibAvailable = true;
    logger.info('pdf-lib loaded - native PDF generation enabled');
    return true;
  } catch (e) {
    logger.debug('pdf-lib not installed - using HTML fallback');
    return false;
  }
};

/**
 * Generate native PDF from structured data using pdf-lib
 * @param {Object} data - Document data
 * @param {string} documentType - Type of document
 * @returns {Buffer|null} - PDF buffer or null if pdf-lib unavailable
 */
const generateNativePDF = async (data, documentType) => {
  await initPdfLib();
  if (!pdfLibAvailable) return null;

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    let yPosition = height - 50;
    const leftMargin = 50;
    const lineHeight = 16;
    const maxWidth = width - 100;

    // Helper to add text with automatic page breaks
    const addText = (text, options = {}) => {
      const fontSize = options.fontSize || 11;
      const isBold = options.bold || false;
      const selectedFont = isBold ? boldFont : font;

      if (yPosition < 60) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      // Handle special characters (Norwegian)
      const safeText = (text || '').replace(/[æøåÆØÅ]/g, char => {
        const map = { 'æ': 'ae', 'ø': 'o', 'å': 'a', 'Æ': 'AE', 'Ø': 'O', 'Å': 'A' };
        return map[char] || char;
      });

      page.drawText(safeText, {
        x: options.x || leftMargin,
        y: yPosition,
        size: fontSize,
        font: selectedFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= options.lineHeight || lineHeight;
    };

    const addSpace = (lines = 1) => {
      yPosition -= lineHeight * lines;
    };

    // Wrap long text
    const addWrappedText = (text, options = {}) => {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      const maxChars = 85;

      for (const word of words) {
        if (line.length + word.length > maxChars) {
          addText(line, options);
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      }
      if (line.trim()) addText(line.trim(), options);
    };

    // Document titles
    const titles = {
      'SICK_LEAVE': 'Sykefravaersattest',
      'REFERRAL': 'Henvisning',
      'TREATMENT_SUMMARY': 'Behandlingssammendrag',
      'INVOICE': 'Faktura'
    };

    // Header
    addText(data.clinic_name || 'ChiroClick Clinic', { fontSize: 16, bold: true });
    addText(data.clinic_address || '', { fontSize: 10 });
    addSpace();

    // Title
    addText(titles[documentType] || documentType, { fontSize: 18, bold: true });
    addText(`Dato: ${new Date().toLocaleDateString('nb-NO')}`, { fontSize: 10 });
    addSpace();

    // Patient info
    addText('Pasientinformasjon:', { bold: true, fontSize: 12 });
    addText(`Navn: ${data.first_name || ''} ${data.last_name || ''}`);
    if (data.date_of_birth) {
      addText(`Fodselsdato: ${new Date(data.date_of_birth).toLocaleDateString('nb-NO')}`);
    }
    if (data.address) {
      addText(`Adresse: ${data.address}, ${data.postal_code || ''} ${data.city || ''}`);
    }
    addSpace();

    // Content based on type
    if (documentType === 'SICK_LEAVE' || documentType === 'REFERRAL' || documentType === 'TREATMENT_SUMMARY') {
      // Diagnosis codes
      if (data.icpc_codes && data.icpc_codes.length > 0) {
        addText('Diagnosekode(r):', { bold: true });
        addText(data.icpc_codes.join(', '));
        addSpace();
      }

      // SOAP sections for treatment summary
      if (documentType === 'TREATMENT_SUMMARY') {
        if (data.subjective?.chief_complaint) {
          addText('SUBJEKTIVT (S):', { bold: true, fontSize: 12 });
          addText(`Hovedplage: ${data.subjective.chief_complaint}`);
          if (data.subjective.history) addWrappedText(`Sykehistorie: ${data.subjective.history}`);
          addSpace();
        }

        if (data.objective) {
          addText('OBJEKTIVT (O):', { bold: true, fontSize: 12 });
          if (data.objective.observation) addText(`Observasjon: ${data.objective.observation}`);
          if (data.objective.palpation) addWrappedText(`Palpasjon: ${data.objective.palpation}`);
          if (data.objective.rom) addText(`ROM: ${data.objective.rom}`);
          addSpace();
        }
      }

      // Assessment
      if (data.assessment?.clinical_reasoning) {
        addText('Vurdering:', { bold: true, fontSize: 12 });
        addWrappedText(data.assessment.clinical_reasoning);
        addSpace();
      }

      // Plan
      if (data.plan?.advice || data.plan?.treatment) {
        addText('Plan:', { bold: true, fontSize: 12 });
        if (data.plan.treatment) addWrappedText(`Behandling: ${data.plan.treatment}`);
        if (data.plan.advice) addWrappedText(`Rad: ${data.plan.advice}`);
        if (data.plan.follow_up) addText(`Oppfolging: ${data.plan.follow_up}`);
        addSpace();
      }

      // VAS scores
      if (data.vas_pain_start !== null && data.vas_pain_start !== undefined) {
        addText('Smertevurdering:', { bold: true });
        addText(`VAS ved start: ${data.vas_pain_start}/10`);
        if (data.vas_pain_end !== null && data.vas_pain_end !== undefined) {
          addText(`VAS ved slutt: ${data.vas_pain_end}/10`);
        }
        addSpace();
      }
    }

    // Signature
    addSpace(2);
    addText('Med vennlig hilsen,');
    addSpace(2);
    addText(data.practitioner_name || 'Behandler', { bold: true });
    addText('Kiropraktor');
    if (data.hpr_number) {
      addText(`HPR-nummer: ${data.hpr_number}`);
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated native PDF for ${documentType}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error('Error generating native PDF:', error);
    return null;
  }
};

/**
 * Generate patient letter (sykefraværsattest, henvisning, etc.)
 * Uses native PDF generation when pdf-lib is available, falls back to HTML
 */
export const generatePatientLetter = async (organizationId, encounterId, letterType) => {
  try {
    // Get encounter data
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

    // Try native PDF generation first
    const pdfBuffer = await generateNativePDF(data, letterType);
    if (pdfBuffer) {
      logger.info(`Generated native PDF ${letterType} letter for encounter ${encounterId}`);
      return {
        pdf: pdfBuffer,
        contentType: 'application/pdf',
        filename: `${letterType}_${data.last_name}_${new Date().toISOString().split('T')[0]}.pdf`,
        encounter_id: encounterId,
        letter_type: letterType,
        format: 'pdf'
      };
    }

    // Fallback to HTML generation
    let letterContent;
    switch (letterType) {
      case 'SICK_LEAVE':
        letterContent = generateSickLeaveLetter(data);
        break;
      case 'REFERRAL':
        letterContent = generateReferralLetter(data);
        break;
      case 'TREATMENT_SUMMARY':
        letterContent = generateTreatmentSummary(data);
        break;
      default:
        throw new Error(`Unknown letter type: ${letterType}`);
    }

    // HTML fallback - can be converted to PDF client-side using browser print
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-info { font-size: 10pt; color: #666; }
          .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
          .content { margin: 30px 0; }
          .signature { margin-top: 60px; }
          h1 { font-size: 18pt; margin-bottom: 10px; }
          h2 { font-size: 14pt; margin-top: 30px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        ${letterContent}
      </body>
      </html>
    `;

    logger.info(`Generated HTML ${letterType} letter for encounter ${encounterId}`);

    return {
      html,
      contentType: 'text/html',
      filename: `${letterType}_${data.last_name}_${new Date().toISOString().split('T')[0]}.pdf`,
      encounter_id: encounterId,
      letter_type: letterType,
      format: 'html'
    };
  } catch (error) {
    logger.error('Error generating patient letter:', error);
    throw error;
  }
};

/**
 * Generate sick leave letter (Sykefraværsattest)
 */
function generateSickLeaveLetter(data) {
  const today = new Date().toLocaleDateString('no-NO');

  return `
    <div class="header">
      <h1>Sykefraværsattest</h1>
      <div class="clinic-info">
        <strong>${data.clinic_name}</strong><br>
        ${data.clinic_address}<br>
        Dato: ${today}
      </div>
    </div>

    <div class="patient-info">
      <strong>Pasientinformasjon:</strong><br>
      Navn: ${data.first_name} ${data.last_name}<br>
      Fødselsdato: ${new Date(data.date_of_birth).toLocaleDateString('no-NO')}<br>
      Adresse: ${data.address}, ${data.postal_code} ${data.city}
    </div>

    <div class="content">
      <h2>Diagnosekode(r):</h2>
      <p>${data.icpc_codes ? data.icpc_codes.join(', ') : 'Ikke spesifisert'}</p>

      <h2>Vurdering:</h2>
      <p>${data.assessment?.clinical_reasoning || 'Kiropraktisk vurdering utført.'}</p>

      <h2>Anbefaling:</h2>
      <p>${data.plan?.advice || 'Pasienten anbefales å følge behandlingsplanen.'}</p>
    </div>

    <div class="signature">
      <p>Med vennlig hilsen,</p>
      <br><br>
      <p>
        <strong>${data.practitioner_name}</strong><br>
        Kiropraktor<br>
        HPR-nummer: ${data.hpr_number || 'N/A'}
      </p>
    </div>
  `;
}

/**
 * Generate referral letter (Henvisning)
 */
function generateReferralLetter(data) {
  const today = new Date().toLocaleDateString('no-NO');

  return `
    <div class="header">
      <h1>Henvisning</h1>
      <div class="clinic-info">
        <strong>${data.clinic_name}</strong><br>
        ${data.clinic_address}<br>
        Dato: ${today}
      </div>
    </div>

    <div class="patient-info">
      <strong>Pasientinformasjon:</strong><br>
      Navn: ${data.first_name} ${data.last_name}<br>
      Fødselsdato: ${new Date(data.date_of_birth).toLocaleDateString('no-NO')}<br>
      Adresse: ${data.address}, ${data.postal_code} ${data.city}
    </div>

    <div class="content">
      <h2>Henvisning til:</h2>
      <p>${data.plan?.referrals || '[Spesialist/Instans]'}</p>

      <h2>Sykehistorie:</h2>
      <p>${data.subjective?.history || 'Se pasientjournal.'}</p>

      <h2>Funn:</h2>
      <p><strong>Observasjon:</strong> ${data.objective?.observation || 'N/A'}</p>
      <p><strong>Palpasjon:</strong> ${data.objective?.palpation || 'N/A'}</p>
      <p><strong>Ortopediske tester:</strong> ${data.objective?.ortho_tests || 'N/A'}</p>

      <h2>Vurdering:</h2>
      <p>${data.assessment?.clinical_reasoning || 'Kiropraktisk vurdering utført.'}</p>

      <h2>Diagnosekode(r):</h2>
      <p>${data.icpc_codes ? data.icpc_codes.join(', ') : 'Ikke spesifisert'}</p>

      <h2>Grunnen til henvisning:</h2>
      <p>Pasienten henvises for videre utredning og behandling.</p>
    </div>

    <div class="signature">
      <p>Med vennlig hilsen,</p>
      <br><br>
      <p>
        <strong>${data.practitioner_name}</strong><br>
        Kiropraktor<br>
        HPR-nummer: ${data.hpr_number || 'N/A'}
      </p>
    </div>
  `;
}

/**
 * Generate treatment summary
 */
function generateTreatmentSummary(data) {
  const today = new Date().toLocaleDateString('no-NO');

  return `
    <div class="header">
      <h1>Behandlingssammendrag</h1>
      <div class="clinic-info">
        <strong>${data.clinic_name}</strong><br>
        ${data.clinic_address}<br>
        Dato: ${today}
      </div>
    </div>

    <div class="patient-info">
      <strong>Pasientinformasjon:</strong><br>
      Navn: ${data.first_name} ${data.last_name}<br>
      Fødselsdato: ${new Date(data.date_of_birth).toLocaleDateString('no-NO')}
    </div>

    <div class="content">
      <h2>SUBJEKTIVT (S):</h2>
      <p><strong>Hovedplage:</strong> ${data.subjective?.chief_complaint || 'N/A'}</p>
      <p><strong>Sykehistorie:</strong> ${data.subjective?.history || 'N/A'}</p>
      <p><strong>Smertebeskrivelse:</strong> ${data.subjective?.pain_description || 'N/A'}</p>

      <h2>OBJEKTIVT (O):</h2>
      <p><strong>Observasjon:</strong> ${data.objective?.observation || 'N/A'}</p>
      <p><strong>Palpasjon:</strong> ${data.objective?.palpation || 'N/A'}</p>
      <p><strong>Bevegelighet (ROM):</strong> ${data.objective?.rom || 'N/A'}</p>
      <p><strong>Ortopediske tester:</strong> ${data.objective?.ortho_tests || 'N/A'}</p>

      <h2>VURDERING (A):</h2>
      <p>${data.assessment?.clinical_reasoning || 'Kiropraktisk vurdering utført.'}</p>
      <p><strong>Diagnosekode(r):</strong> ${data.icpc_codes ? data.icpc_codes.join(', ') : 'N/A'}</p>
      <p><strong>Prognose:</strong> ${data.assessment?.prognosis || 'N/A'}</p>

      <h2>PLAN (P):</h2>
      <p><strong>Behandling:</strong> ${data.plan?.treatment || 'N/A'}</p>
      <p><strong>Øvelser:</strong> ${data.plan?.exercises || 'N/A'}</p>
      <p><strong>Råd:</strong> ${data.plan?.advice || 'N/A'}</p>
      <p><strong>Oppfølging:</strong> ${data.plan?.follow_up || 'N/A'}</p>

      ${data.vas_pain_start !== null ? `
        <h2>Smertevurdering:</h2>
        <p>VAS ved start: ${data.vas_pain_start}/10</p>
        ${data.vas_pain_end !== null ? `<p>VAS ved slutt: ${data.vas_pain_end}/10</p>` : ''}
      ` : ''}
    </div>

    <div class="signature">
      <p>
        <strong>${data.practitioner_name}</strong><br>
        Kiropraktor<br>
        HPR-nummer: ${data.hpr_number || 'N/A'}
      </p>
    </div>
  `;
}

/**
 * Generate invoice PDF
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
    const treatmentCodes = typeof data.treatment_codes === 'string'
      ? JSON.parse(data.treatment_codes)
      : data.treatment_codes;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-number { font-size: 20pt; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-size: 14pt; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 60px; font-size: 9pt; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${data.clinic_name}</h1>
            <p>${data.clinic_address}</p>
            <p>Tlf: ${data.clinic_phone}</p>
            <p>Org.nr: ${data.org_number}</p>
          </div>
          <div>
            <div class="invoice-number">FAKTURA</div>
            <p>Nr: ${data.invoice_number}</p>
            <p>Dato: ${new Date(data.created_at).toLocaleDateString('no-NO')}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <strong>Pasient:</strong><br>
          ${data.first_name} ${data.last_name}<br>
          ${data.address}<br>
          ${data.postal_code} ${data.city}
        </div>

        <table>
          <thead>
            <tr>
              <th>Takst</th>
              <th>Beskrivelse</th>
              <th style="text-align: right;">Beløp</th>
            </tr>
          </thead>
          <tbody>
            ${Array.isArray(treatmentCodes) ? treatmentCodes.map(code => `
              <tr>
                <td>${code.code || code}</td>
                <td>${code.description || ''}</td>
                <td style="text-align: right;">${code.price ? `${code.price} kr` : ''}</td>
              </tr>
            `).join('') : '<tr><td colspan="3">Ingen takster</td></tr>'}
          </tbody>
        </table>

        <div class="total">
          <p>Bruttobeløp: ${data.gross_amount} kr</p>
          <p>Egenandel refusjon: ${data.insurance_amount} kr</p>
          <p style="font-size: 16pt; color: #333;">Å betale: ${data.patient_amount} kr</p>
        </div>

        <div style="margin-top: 40px;">
          <p><strong>Betalingsinformasjon:</strong></p>
          <p>Vennligst betal innen 14 dager.</p>
          <p>Status: ${data.payment_status === 'PAID' ? 'BETALT' : data.payment_status === 'PENDING' ? 'UBETALT' : 'KANSELLERT'}</p>
        </div>

        <div class="footer">
          <p>${data.clinic_name} | ${data.clinic_address} | Tlf: ${data.clinic_phone} | ${data.clinic_email}</p>
        </div>
      </body>
      </html>
    `;

    logger.info(`Generated invoice for financial metric ${financialMetricId}`);

    return {
      html,
      filename: `Faktura_${data.invoice_number}_${data.last_name}.pdf`,
      invoice_number: data.invoice_number
    };
  } catch (error) {
    logger.error('Error generating invoice:', error);
    throw error;
  }
};

export default {
  generatePatientLetter,
  generateInvoice
};
