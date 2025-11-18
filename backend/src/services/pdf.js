/**
 * PDF Generation Service
 * Generates PDF documents for letters, reports, and invoices
 * NOTE: Requires pdf-lib or pdfkit package
 */

import logger from '../utils/logger.js';
import { query } from '../config/database.js';

/**
 * Generate patient letter (sykefraværsattest, henvisning, etc.)
 * This is a placeholder - in production would use pdf-lib or pdfkit
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

    // Generate letter content based on type
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

    // TODO: Convert to PDF using pdf-lib or pdfkit
    // For now, return HTML that can be converted to PDF client-side
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

    logger.info(`Generated ${letterType} letter for encounter ${encounterId}`);

    return {
      html,
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
