/**
 * PDF Clinical Letters — Sick leave, referral, and treatment summary PDFs.
 *
 * @module services/clinical/pdfClinical
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import { fontName, formatNorwegianDate, createDoc, docToBuffer } from './pdf-utils.js';
import { drawHeader, drawPatientInfo, drawSectionHeader, drawSignature } from './pdfShared.js';

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
    const period = `${formatNorwegianDate(data.sick_leave_start)} - ${formatNorwegianDate(data.sick_leave_end)}`;
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
    doc.font(fontName(true)).text('Observasjon: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.observation);
  }
  if (data.objective?.palpation) {
    doc.font(fontName(true)).text('Palpasjon: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.palpation);
  }
  if (data.objective?.ortho_tests) {
    doc.font(fontName(true)).text('Ortopediske tester: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.ortho_tests);
  }
  if (data.objective?.neuro_tests) {
    doc.font(fontName(true)).text('Nevrologiske tester: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.neuro_tests);
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
    doc.font(fontName(true)).text('Hovedplage: ', { continued: true });
    doc.font(fontName(false)).text(data.subjective.chief_complaint);
  }
  if (data.subjective?.history) {
    doc.font(fontName(true)).text('Sykehistorie: ', { continued: true });
    doc.font(fontName(false)).text(data.subjective.history);
  }
  if (data.subjective?.pain_description) {
    doc.font(fontName(true)).text('Smertebeskrivelse: ', { continued: true });
    doc.font(fontName(false)).text(data.subjective.pain_description);
  }
  doc.moveDown(1);

  // OBJECTIVE
  drawSectionHeader(doc, 'OBJEKTIVT (O):');
  if (data.objective?.observation) {
    doc.font(fontName(true)).text('Observasjon: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.observation);
  }
  if (data.objective?.palpation) {
    doc.font(fontName(true)).text('Palpasjon: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.palpation);
  }
  if (data.objective?.rom) {
    doc.font(fontName(true)).text('Bevegelighet (ROM): ', { continued: true });
    doc.font(fontName(false)).text(data.objective.rom);
  }
  if (data.objective?.ortho_tests) {
    doc.font(fontName(true)).text('Ortopediske tester: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.ortho_tests);
  }
  if (data.objective?.neuro_tests) {
    doc.font(fontName(true)).text('Nevrologiske tester: ', { continued: true });
    doc.font(fontName(false)).text(data.objective.neuro_tests);
  }
  doc.moveDown(1);

  // ASSESSMENT
  drawSectionHeader(doc, 'VURDERING (A):');
  if (data.assessment?.clinical_reasoning) {
    doc.text(data.assessment.clinical_reasoning, { align: 'justify' });
  }
  if (data.icpc_codes && data.icpc_codes.length > 0) {
    doc.font(fontName(true)).text('Diagnosekode(r): ', { continued: true });
    doc.font(fontName(false)).text(data.icpc_codes.join(', '));
  }
  if (data.assessment?.prognosis) {
    doc.font(fontName(true)).text('Prognose: ', { continued: true });
    doc.font(fontName(false)).text(data.assessment.prognosis);
  }
  doc.moveDown(1);

  // PLAN
  drawSectionHeader(doc, 'PLAN (P):');
  if (data.plan?.treatment) {
    doc.font(fontName(true)).text('Behandling: ', { continued: true });
    doc.font(fontName(false)).text(data.plan.treatment);
  }
  if (data.plan?.exercises) {
    doc.font(fontName(true)).text('Øvelser: ', { continued: true });
    doc.font(fontName(false)).text(data.plan.exercises);
  }
  if (data.plan?.advice) {
    doc.font(fontName(true)).text('Råd: ', { continued: true });
    doc.font(fontName(false)).text(data.plan.advice);
  }
  if (data.plan?.follow_up) {
    doc.font(fontName(true)).text('Oppfølging: ', { continued: true });
    doc.font(fontName(false)).text(data.plan.follow_up);
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
    const doc = createDoc();

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
    const pdfBuffer = await docToBuffer(doc);

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

    const doc = createDoc();

    // Header
    doc
      .fontSize(20)
      .font(fontName(true))
      .text(title || 'Dokument', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Clinic info
    if (clinic.name) {
      doc.fontSize(10).font(fontName(false));
      doc.text(clinic.name, { align: 'right' });
      if (clinic.address) {
        doc.text(clinic.address, { align: 'right' });
      }
      doc.text(`Dato: ${formatNorwegianDate(new Date())}`, { align: 'right' });
      doc.moveDown(1);
    }

    // Patient info
    if (patient) {
      drawPatientInfo(doc, patient);
    }

    // Main content
    doc.fontSize(11).font(fontName(false));
    doc.text(content || '', { align: 'justify' });

    // Signature
    if (practitioner) {
      drawSignature(doc, practitioner);
    }

    const pdfBuffer = await docToBuffer(doc);

    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: `${title || 'document'}_${formatNorwegianDate(new Date()).replace(/\./g, '-')}.pdf`,
    };
  } catch (error) {
    logger.error('Error generating custom PDF:', error);
    throw error;
  }
};
