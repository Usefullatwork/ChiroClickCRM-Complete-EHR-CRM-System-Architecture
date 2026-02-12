/**
 * PDF Generator Service
 * Enhanced PDF generation for treatment summaries, referral letters,
 * sick notes, and invoices using PDFKit.
 *
 * Norwegian-compliant formats throughout.
 */

import PDFDocument from 'pdfkit';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import fs from 'fs';

// ── Norwegian text constants ──────────────────────────────────────────
const TEXT = {
  TREATMENT_SUMMARY: 'Behandlingssammendrag',
  REFERRAL_LETTER: 'Henvisning',
  SICK_NOTE: 'Sykmelding',
  INVOICE: 'Faktura',
  PATIENT: 'Pasient',
  DOB: 'Fødselsdato',
  DIAGNOSIS: 'Diagnose',
  CLINICAL_FINDINGS: 'Kliniske funn',
  ASSESSMENT: 'Vurdering',
  PLAN: 'Plan',
  DATE: 'Dato',
  PAGE: 'Side',
  SUBJECTIVE: 'Subjektivt',
  OBJECTIVE: 'Objektivt',
  CHIEF_COMPLAINT: 'Hovedplage',
  HISTORY: 'Sykehistorie',
  OBSERVATION: 'Observasjon',
  PALPATION: 'Palpasjon',
  ROM: 'Bevegelighet (ROM)',
  ORTHO_TESTS: 'Ortopediske tester',
  NEURO_TESTS: 'Nevrologiske tester',
  PROGNOSIS: 'Prognose',
  TREATMENT: 'Behandling',
  EXERCISES: 'Øvelser',
  ADVICE: 'Råd',
  FOLLOWUP: 'Oppfølging',
  ENCOUNTER_HISTORY: 'Konsultasjonshistorikk',
  OUTCOME_SCORES: 'Utfallsmål',
  GENERATED: 'Generert',
  CONTACT: 'Kontakt',
  PHONE: 'Tlf',
  ORG_NR: 'Org.nr',
  HPR_NR: 'HPR-nummer',
  FROM: 'Fra',
  TO: 'Til',
  RE: 'Vedr.',
  REASON_REFERRAL: 'Grunn til henvisning',
  RELEVANT_FINDINGS: 'Relevante funn',
  DURATION: 'Varighet',
  WORK_RESTRICTIONS: 'Arbeidsrestriksjoner',
  FUNCTIONAL_CAPACITY: 'Funksjonsvurdering',
  INVOICE_NR: 'Fakturanr',
  INVOICE_DATE: 'Fakturadato',
  DUE_DATE: 'Forfallsdato',
  SUBTOTAL: 'Subtotal',
  VAT: 'MVA',
  TOTAL: 'Totalt',
  AMOUNT_DUE: 'Å betale',
  PAYMENT_INFO: 'Betalingsinformasjon',
  ACCOUNT_NR: 'Kontonummer',
  KID_NR: 'KID-nummer',
  REGARDS: 'Med vennlig hilsen',
  CHIROPRACTOR: 'Kiropraktor',
};

// ── Font management ───────────────────────────────────────────────────

let cachedFontPath = null;
let cachedBoldFontPath = null;
let fontChecked = false;

const findFont = () => {
  if (fontChecked) return;
  fontChecked = true;

  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/calibri.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      cachedFontPath = p;
      // Try bold variant
      const boldPaths = [
        p.replace(/\.ttf$/i, 'bd.ttf'),
        p.replace(/\.ttf$/i, '-Bold.ttf'),
        p.replace(/\.ttf$/i, 'b.ttf'),
      ];
      for (const bp of boldPaths) {
        if (fs.existsSync(bp)) {
          cachedBoldFontPath = bp;
          break;
        }
      }
      logger.info(`pdfGenerator: Using font ${cachedFontPath}`);
      return;
    }
  }
  logger.warn('pdfGenerator: No Unicode font found, Norwegian characters may render incorrectly');
};

const fontName = (bold = false) => {
  if (cachedFontPath) return bold ? 'Unicode-Bold' : 'Unicode';
  return bold ? 'Helvetica-Bold' : 'Helvetica';
};

// ── Formatting helpers ────────────────────────────────────────────────

/**
 * Format date as dd.mm.yyyy (Norwegian convention)
 */
export function formatNorwegianDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Format amount as Norwegian currency: "1 234,50 kr"
 */
export function formatNorwegianCurrency(amount) {
  if (amount == null) return '0,00 kr';
  const num = Number(amount);
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} kr`;
}

// ── Document helpers ──────────────────────────────────────────────────

function createDoc(title = 'ChiroClick Dokument') {
  findFont();

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: title,
      Author: 'ChiroClick EHR',
      Creator: 'ChiroClick PDF Generator',
    },
  });

  if (cachedFontPath) {
    try {
      doc.registerFont('Unicode', cachedFontPath);
      doc.registerFont('Unicode-Bold', cachedBoldFontPath || cachedFontPath);
    } catch (err) {
      logger.warn(`pdfGenerator: Failed to register font: ${err.message}`);
    }
  }

  return doc;
}

function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Add header with clinic info to the PDF
 */
function addHeader(doc, clinic, title) {
  const f = fontName(true);
  const fNormal = fontName(false);

  // Clinic name
  doc
    .fontSize(16)
    .font(f)
    .text(clinic.name || 'Klinikk', 50, 30);
  doc.fontSize(9).font(fNormal);
  if (clinic.address) {
    const addr =
      typeof clinic.address === 'object'
        ? [clinic.address.street, clinic.address.postal_code, clinic.address.city]
            .filter(Boolean)
            .join(', ')
        : clinic.address;
    doc.text(addr);
  }
  if (clinic.phone) doc.text(`${TEXT.PHONE}: ${clinic.phone}`);
  if (clinic.email) doc.text(clinic.email);
  if (clinic.org_number) doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);

  // Title (right side)
  doc.fontSize(20).font(f).text(title, 300, 30, { width: 245, align: 'right' });

  // Date below title
  doc
    .fontSize(9)
    .font(fNormal)
    .text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`, 300, doc.y, {
      width: 245,
      align: 'right',
    });

  // Separator line
  const lineY = Math.max(doc.y + 10, 100);
  doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(1).stroke('#333333');
  doc.y = lineY + 15;
}

/**
 * Add footer with page numbers and generated date
 */
function addFooter(doc, clinic) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);

    const bottom = doc.page.height - 40;

    // Footer line
    doc
      .moveTo(50, bottom - 10)
      .lineTo(545, bottom - 10)
      .lineWidth(0.5)
      .stroke('#cccccc');

    doc.fontSize(7).font(fontName(false)).fillColor('#888888');

    // Left: generated date
    doc.text(`${TEXT.GENERATED}: ${formatNorwegianDate(new Date())}`, 50, bottom, {
      width: 200,
      align: 'left',
    });

    // Center: clinic contact
    const contactParts = [
      clinic.name,
      clinic.phone ? `${TEXT.PHONE}: ${clinic.phone}` : null,
    ].filter(Boolean);
    doc.text(contactParts.join(' | '), 200, bottom, { width: 200, align: 'center' });

    // Right: page number
    doc.text(`${TEXT.PAGE} ${i - range.start + 1} / ${totalPages}`, 400, bottom, {
      width: 145,
      align: 'right',
    });
  }

  doc.fillColor('#000000');
}

/**
 * Add patient info block
 */
function addPatientInfo(doc, patient) {
  const f = fontName(false);
  const fb = fontName(true);
  const top = doc.y;

  doc.rect(50, top, 495, 60).fill('#f5f7fa');
  doc.fillColor('#000000');

  doc
    .fontSize(10)
    .font(fb)
    .text(`${TEXT.PATIENT}:`, 60, top + 8);
  doc.font(f);
  doc.text(`${patient.first_name || ''} ${patient.last_name || ''}`, 120, top + 8);

  doc.font(fb).text(`${TEXT.DOB}:`, 60, top + 22);
  doc.font(f).text(formatNorwegianDate(patient.date_of_birth), 140, top + 22);

  if (patient.phone) {
    doc.font(fb).text(`${TEXT.PHONE}:`, 300, top + 8);
    doc.font(f).text(patient.phone, 330, top + 8);
  }
  if (patient.email) {
    doc.font(fb).text('E-post:', 300, top + 22);
    doc.font(f).text(patient.email, 345, top + 22);
  }

  if (patient.solvit_id) {
    doc.font(fb).text('Pasient-ID:', 60, top + 38);
    doc.font(f).text(patient.solvit_id, 140, top + 38);
  }

  doc.y = top + 70;
  doc.moveDown(0.5);
}

/**
 * Draw a section heading
 */
function sectionHeading(doc, text) {
  doc.fontSize(12).font(fontName(true)).fillColor('#1a3c5e');
  doc.text(text);
  doc.moveDown(0.2);
  doc.fillColor('#000000').font(fontName(false)).fontSize(10);
}

/**
 * Draw a labeled value: "Label: Value"
 */
function labeledValue(doc, label, value) {
  if (!value) return;
  doc.font(fontName(true)).text(`${label}: `, { continued: true });
  doc.font(fontName(false)).text(String(value));
}

/**
 * Check if we need a new page (with margin)
 */
function needsNewPage(doc, requiredSpace = 100) {
  if (doc.y + requiredSpace > doc.page.height - 80) {
    doc.addPage();
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════════
// 1. TREATMENT SUMMARY
// ════════════════════════════════════════════════════════════════════════

/**
 * Generate a treatment summary PDF for a patient.
 * Includes encounter history table and outcome scores.
 *
 * @param {string} patientId
 * @param {string} orgId
 * @param {Object} [options]
 * @param {number} [options.maxEncounters=20] - max encounters to include
 * @returns {Promise<Buffer>}
 */
export async function generateTreatmentSummary(patientId, orgId, options = {}) {
  const maxEncounters = options.maxEncounters || 20;

  // Fetch patient + clinic
  const patientRes = await query(
    `SELECT p.*, o.name AS clinic_name, o.address AS clinic_address,
            o.phone AS clinic_phone, o.email AS clinic_email, o.org_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId]
  );

  if (patientRes.rows.length === 0) throw new Error('Patient not found');
  const patient = patientRes.rows[0];

  const clinic = {
    name: patient.clinic_name,
    address: patient.clinic_address,
    phone: patient.clinic_phone,
    email: patient.clinic_email,
    org_number: patient.org_number,
  };

  // Fetch encounters
  const encRes = await query(
    `SELECT ce.id, ce.encounter_date, ce.encounter_type,
            ce.subjective, ce.objective, ce.assessment, ce.plan,
            ce.icpc_codes, ce.icd10_codes,
            ce.vas_pain_start, ce.vas_pain_end,
            u.first_name || ' ' || u.last_name AS practitioner_name
     FROM clinical_encounters ce
     LEFT JOIN users u ON u.id = ce.practitioner_id
     WHERE ce.patient_id = $1 AND ce.organization_id = $2
     ORDER BY ce.encounter_date DESC
     LIMIT $3`,
    [patientId, orgId, maxEncounters]
  );
  const encounters = encRes.rows;

  // Fetch outcome scores (if table exists)
  let outcomeScores = [];
  try {
    const outRes = await query(
      `SELECT * FROM outcome_scores
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY assessed_at DESC
       LIMIT 20`,
      [patientId, orgId]
    );
    outcomeScores = outRes.rows;
  } catch {
    // Table may not exist yet
  }

  // ── Build PDF ─────────────────────────────────────────────────────
  const doc = createDoc(TEXT.TREATMENT_SUMMARY);
  const f = fontName(false);
  const fb = fontName(true);

  addHeader(doc, clinic, TEXT.TREATMENT_SUMMARY);
  addPatientInfo(doc, patient);

  // Diagnosis codes
  const allIcpc = [...new Set(encounters.flatMap((e) => e.icpc_codes || []))];
  const allIcd = [...new Set(encounters.flatMap((e) => e.icd10_codes || []))];
  if (allIcpc.length > 0 || allIcd.length > 0) {
    sectionHeading(doc, TEXT.DIAGNOSIS);
    if (allIcpc.length > 0) labeledValue(doc, 'ICPC-2', allIcpc.join(', '));
    if (allIcd.length > 0) labeledValue(doc, 'ICD-10', allIcd.join(', '));
    doc.moveDown(0.8);
  }

  // Encounter history table
  if (encounters.length > 0) {
    sectionHeading(doc, TEXT.ENCOUNTER_HISTORY);
    doc.moveDown(0.3);

    const typeLabels = {
      INITIAL: 'Første',
      FOLLOWUP: 'Oppfølging',
      REEXAM: 'Re-undersøkelse',
      EMERGENCY: 'Akutt',
    };

    // Table header
    const colX = [50, 110, 175, 310, 420];
    const colW = [60, 65, 135, 110, 125];
    const headerLabels = [TEXT.DATE, 'Type', TEXT.SUBJECTIVE, TEXT.ASSESSMENT, TEXT.PLAN];

    const headerY = doc.y;
    doc.rect(50, headerY, 495, 18).fill('#e8eef4');
    doc.fillColor('#000000').fontSize(8).font(fb);
    headerLabels.forEach((lbl, i) => {
      doc.text(lbl, colX[i] + 3, headerY + 4, { width: colW[i] - 6 });
    });

    let rowY = headerY + 18;

    for (const enc of encounters) {
      const subjText = enc.subjective?.chief_complaint || '';
      const assessText = enc.assessment?.clinical_reasoning || '';
      const planText = enc.plan?.treatment || enc.plan?.advice || '';

      // Estimate row height
      const rowHeight = Math.max(
        20,
        Math.ceil(subjText.length / 20) * 10,
        Math.ceil(assessText.length / 16) * 10,
        Math.ceil(planText.length / 18) * 10
      );
      const clampedHeight = Math.min(rowHeight, 60);

      if (rowY + clampedHeight > doc.page.height - 80) {
        doc.addPage();
        rowY = 60;
      }

      // Alternating row background
      if (encounters.indexOf(enc) % 2 === 0) {
        doc.rect(50, rowY, 495, clampedHeight).fill('#fafbfc');
        doc.fillColor('#000000');
      }

      doc.fontSize(7).font(f);
      doc.text(formatNorwegianDate(enc.encounter_date), colX[0] + 3, rowY + 3, {
        width: colW[0] - 6,
      });
      doc.text(typeLabels[enc.encounter_type] || enc.encounter_type, colX[1] + 3, rowY + 3, {
        width: colW[1] - 6,
      });
      doc.text(subjText.substring(0, 80), colX[2] + 3, rowY + 3, {
        width: colW[2] - 6,
        height: clampedHeight - 6,
      });
      doc.text(assessText.substring(0, 60), colX[3] + 3, rowY + 3, {
        width: colW[3] - 6,
        height: clampedHeight - 6,
      });
      doc.text(planText.substring(0, 70), colX[4] + 3, rowY + 3, {
        width: colW[4] - 6,
        height: clampedHeight - 6,
      });

      rowY += clampedHeight;
    }

    doc.y = rowY + 5;
    doc.moveDown(0.5);
  }

  // Outcome scores
  if (outcomeScores.length > 0) {
    needsNewPage(doc, 120);
    sectionHeading(doc, TEXT.OUTCOME_SCORES);

    const scoreHeaderY = doc.y;
    doc.rect(50, scoreHeaderY, 495, 18).fill('#e8eef4');
    doc.fillColor('#000000').fontSize(8).font(fb);
    doc.text(TEXT.DATE, 55, scoreHeaderY + 4, { width: 80 });
    doc.text('Type', 140, scoreHeaderY + 4, { width: 120 });
    doc.text('Score', 265, scoreHeaderY + 4, { width: 60 });
    doc.text('Alvorlighetsgrad', 330, scoreHeaderY + 4, { width: 150 });

    let sRowY = scoreHeaderY + 18;
    doc.font(f).fontSize(8);

    for (const score of outcomeScores) {
      if (sRowY > doc.page.height - 80) {
        doc.addPage();
        sRowY = 60;
      }
      doc.text(formatNorwegianDate(score.assessed_at), 55, sRowY + 3, { width: 80 });
      doc.text(score.questionnaire_type || '', 140, sRowY + 3, { width: 120 });
      doc.text(String(score.score ?? ''), 265, sRowY + 3, { width: 60 });
      doc.text(score.severity || '', 330, sRowY + 3, { width: 150 });
      sRowY += 18;
    }
    doc.y = sRowY + 5;
  }

  // Add footer with page numbers
  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated treatment summary PDF for patient ${patientId}`, {
    size: buffer.length,
    encounters: encounters.length,
  });
  return buffer;
}

// ════════════════════════════════════════════════════════════════════════
// 2. REFERRAL LETTER (Henvisning)
// ════════════════════════════════════════════════════════════════════════

/**
 * Generate a Norwegian formal referral letter.
 *
 * @param {Object} referralData
 * @param {string} referralData.patientId
 * @param {string} referralData.orgId
 * @param {string} referralData.encounterId
 * @param {string} referralData.recipientName - specialist/department
 * @param {string} [referralData.recipientAddress]
 * @param {string} [referralData.reasonForReferral]
 * @param {string} [referralData.relevantFindings]
 * @param {string} [referralData.relevantTestResults]
 * @returns {Promise<Buffer>}
 */
export async function generateReferralLetter(referralData) {
  const {
    patientId,
    orgId,
    encounterId,
    recipientName,
    recipientAddress,
    reasonForReferral,
    relevantFindings,
    relevantTestResults,
  } = referralData;

  // Fetch data
  const res = await query(
    `SELECT ce.*, p.first_name, p.last_name, p.date_of_birth, p.phone, p.email, p.solvit_id,
            o.name AS clinic_name, o.address AS clinic_address, o.phone AS clinic_phone,
            o.email AS clinic_email, o.org_number,
            u.first_name || ' ' || u.last_name AS practitioner_name, u.hpr_number
     FROM clinical_encounters ce
     JOIN patients p ON p.id = ce.patient_id
     JOIN organizations o ON o.id = ce.organization_id
     LEFT JOIN users u ON u.id = ce.practitioner_id
     WHERE ce.id = $1 AND ce.organization_id = $2`,
    [encounterId, orgId]
  );

  if (res.rows.length === 0) throw new Error('Encounter not found');
  const data = res.rows[0];

  const clinic = {
    name: data.clinic_name,
    address: data.clinic_address,
    phone: data.clinic_phone,
    email: data.clinic_email,
    org_number: data.org_number,
  };

  const doc = createDoc(TEXT.REFERRAL_LETTER);
  const f = fontName(false);
  const fb = fontName(true);

  // ── Sender block (top left) ──
  doc
    .fontSize(11)
    .font(fb)
    .text(data.practitioner_name || TEXT.CHIROPRACTOR, 50, 40);
  doc.fontSize(9).font(f);
  doc.text(TEXT.CHIROPRACTOR);
  doc.text(clinic.name || '');
  if (clinic.address) {
    const addr =
      typeof clinic.address === 'object'
        ? [clinic.address.street, clinic.address.postal_code, clinic.address.city]
            .filter(Boolean)
            .join(', ')
        : clinic.address;
    doc.text(addr);
  }
  if (data.hpr_number) doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  if (clinic.phone) doc.text(`${TEXT.PHONE}: ${clinic.phone}`);

  // ── Recipient block ──
  doc.moveDown(1.5);
  doc.fontSize(10).font(fb).text(`${TEXT.TO}:`);
  doc.font(f);
  doc.text(recipientName || '[Spesialist / Avdeling]');
  if (recipientAddress) doc.text(recipientAddress);

  // ── Date (right side) ──
  doc
    .fontSize(9)
    .font(f)
    .text(formatNorwegianDate(new Date()), 400, doc.y - 20, { width: 145, align: 'right' });

  // ── Subject line ──
  doc.moveDown(1.5);
  doc.fontSize(11).font(fb);
  doc.text(
    `${TEXT.RE}: ${data.first_name} ${data.last_name}, f. ${formatNorwegianDate(data.date_of_birth)}`
  );
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#333333');
  doc.moveDown(0.8);

  // ── Diagnosis ──
  doc.fontSize(10);
  sectionHeading(doc, TEXT.DIAGNOSIS);
  const icpc = data.icpc_codes?.join(', ') || 'Ikke spesifisert';
  const icd = data.icd10_codes?.join(', ');
  labeledValue(doc, 'ICPC-2', icpc);
  if (icd) labeledValue(doc, 'ICD-10', icd);
  doc.moveDown(0.5);

  // ── Clinical findings ──
  sectionHeading(doc, TEXT.CLINICAL_FINDINGS);
  const findings = relevantFindings || buildFindingsText(data);
  doc.text(findings, { align: 'justify' });
  doc.moveDown(0.5);

  // ── Relevant test results ──
  if (relevantTestResults) {
    sectionHeading(doc, 'Relevante testresultater');
    doc.text(relevantTestResults, { align: 'justify' });
    doc.moveDown(0.5);
  }

  // ── Reason for referral ──
  sectionHeading(doc, TEXT.REASON_REFERRAL);
  doc.text(reasonForReferral || 'Pasienten henvises for videre utredning og behandling.', {
    align: 'justify',
  });
  doc.moveDown(0.5);

  // ── Assessment / plan ──
  if (data.assessment?.clinical_reasoning) {
    sectionHeading(doc, TEXT.ASSESSMENT);
    doc.text(data.assessment.clinical_reasoning, { align: 'justify' });
    doc.moveDown(0.5);
  }

  // ── Signature block ──
  doc.moveDown(2);
  doc.font(f).text(TEXT.REGARDS + ',');
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(220, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font(fb).text(data.practitioner_name || '');
  doc.font(f).text(TEXT.CHIROPRACTOR);
  if (data.hpr_number) doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  doc.text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`);

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated referral letter for encounter ${encounterId}`, { size: buffer.length });
  return buffer;
}

/** Build clinical findings text from encounter objective data */
function buildFindingsText(data) {
  const parts = [];
  if (data.subjective?.history) parts.push(`${TEXT.HISTORY}: ${data.subjective.history}`);
  if (data.objective?.observation) parts.push(`${TEXT.OBSERVATION}: ${data.objective.observation}`);
  if (data.objective?.palpation) parts.push(`${TEXT.PALPATION}: ${data.objective.palpation}`);
  if (data.objective?.ortho_tests) parts.push(`${TEXT.ORTHO_TESTS}: ${data.objective.ortho_tests}`);
  if (data.objective?.neuro_tests) parts.push(`${TEXT.NEURO_TESTS}: ${data.objective.neuro_tests}`);
  if (data.objective?.rom) parts.push(`${TEXT.ROM}: ${data.objective.rom}`);
  return parts.join('\n') || 'Se pasientjournal.';
}

// ════════════════════════════════════════════════════════════════════════
// 3. SICK NOTE (Sykmelding)
// ════════════════════════════════════════════════════════════════════════

/**
 * Generate a Norwegian-compliance sick note PDF.
 *
 * @param {Object} sickNoteData
 * @param {string} sickNoteData.patientId
 * @param {string} sickNoteData.orgId
 * @param {string} sickNoteData.encounterId
 * @param {string} sickNoteData.diagnosisCode - ICD-10 code
 * @param {string} sickNoteData.diagnosisText
 * @param {string} sickNoteData.startDate - YYYY-MM-DD
 * @param {string} sickNoteData.endDate - YYYY-MM-DD
 * @param {number} [sickNoteData.percentage=100] - sick leave percentage
 * @param {string} [sickNoteData.functionalAssessment]
 * @param {string} [sickNoteData.workRestrictions]
 * @returns {Promise<Buffer>}
 */
export async function generateSickNote(sickNoteData) {
  const {
    patientId,
    orgId,
    encounterId,
    diagnosisCode,
    diagnosisText,
    startDate,
    endDate,
    percentage = 100,
    functionalAssessment,
    workRestrictions,
  } = sickNoteData;

  // Fetch patient/practitioner data
  const res = await query(
    `SELECT p.first_name, p.last_name, p.date_of_birth, p.phone, p.email,
            p.address, p.encrypted_personal_number, p.solvit_id,
            o.name AS clinic_name, o.address AS clinic_address, o.phone AS clinic_phone,
            o.email AS clinic_email, o.org_number,
            u.first_name || ' ' || u.last_name AS practitioner_name, u.hpr_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     LEFT JOIN clinical_encounters ce ON ce.id = $3 AND ce.organization_id = $2
     LEFT JOIN users u ON u.id = ce.practitioner_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId, encounterId]
  );

  if (res.rows.length === 0) throw new Error('Patient not found');
  const data = res.rows[0];

  const clinic = {
    name: data.clinic_name,
    address: data.clinic_address,
    phone: data.clinic_phone,
    email: data.clinic_email,
    org_number: data.org_number,
  };

  const doc = createDoc(TEXT.SICK_NOTE);
  const f = fontName(false);
  const fb = fontName(true);

  addHeader(doc, clinic, TEXT.SICK_NOTE);

  // Patient details
  doc.moveDown(0.5);
  sectionHeading(doc, 'Pasientopplysninger');

  const infoTop = doc.y;
  doc.rect(50, infoTop, 495, 80).fill('#f5f7fa');
  doc.fillColor('#000000').fontSize(10).font(f);

  labeledValue(doc, 'Navn', `${data.first_name} ${data.last_name}`);
  labeledValue(doc, TEXT.DOB, formatNorwegianDate(data.date_of_birth));
  if (data.phone) labeledValue(doc, TEXT.PHONE, data.phone);

  const addr = data.address;
  if (addr) {
    const addrStr =
      typeof addr === 'object'
        ? [addr.street, addr.postal_code, addr.city].filter(Boolean).join(', ')
        : addr;
    labeledValue(doc, 'Adresse', addrStr);
  }

  doc.y = Math.max(doc.y, infoTop + 85);
  doc.moveDown(0.8);

  // Diagnosis
  sectionHeading(doc, `${TEXT.DIAGNOSIS} (ICD-10)`);
  doc
    .fontSize(11)
    .font(fb)
    .text(diagnosisCode || 'Ikke angitt', { continued: true });
  doc.font(f).text(diagnosisText ? ` — ${diagnosisText}` : '');
  doc.moveDown(0.8);

  // Functional capacity assessment
  sectionHeading(doc, TEXT.FUNCTIONAL_CAPACITY);
  doc.text(functionalAssessment || 'Se journal for detaljert funksjonsvurdering.', {
    align: 'justify',
  });
  doc.moveDown(0.8);

  // Duration
  sectionHeading(doc, `${TEXT.DURATION} og grad`);
  labeledValue(doc, 'Fra dato', formatNorwegianDate(startDate));
  labeledValue(doc, 'Til dato', formatNorwegianDate(endDate));
  labeledValue(doc, 'Sykmeldingsgrad', `${percentage}%`);
  doc.moveDown(0.8);

  // Work restrictions
  if (workRestrictions) {
    sectionHeading(doc, TEXT.WORK_RESTRICTIONS);
    doc.text(workRestrictions, { align: 'justify' });
    doc.moveDown(0.8);
  }

  // Practitioner signature
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#cccccc');
  doc.moveDown(1);

  doc.font(f).text(TEXT.REGARDS + ',');
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(220, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font(fb).text(data.practitioner_name || '');
  doc.font(f).text(TEXT.CHIROPRACTOR);
  if (data.hpr_number) doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  doc.text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`);

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated sick note for patient ${patientId}`, { size: buffer.length });
  return buffer;
}

// ════════════════════════════════════════════════════════════════════════
// 4. INVOICE (Faktura)
// ════════════════════════════════════════════════════════════════════════

/**
 * Generate a Norwegian-format invoice PDF.
 *
 * @param {Object} invoiceData
 * @param {string} invoiceData.orgId
 * @param {string} invoiceData.patientId
 * @param {string} [invoiceData.invoiceNumber]
 * @param {string} [invoiceData.invoiceDate] - defaults to now
 * @param {string} [invoiceData.dueDate] - defaults to +14 days
 * @param {Array} invoiceData.lineItems - [{date, service, icpcCode, amount}]
 * @param {number} [invoiceData.vatRate=0] - VAT percentage (0 for health services)
 * @param {string} [invoiceData.accountNumber] - bank account
 * @param {string} [invoiceData.kidNumber] - KID payment reference
 * @param {string} [invoiceData.insuranceCompany] - if billed to insurance
 * @returns {Promise<Buffer>}
 */
export async function generateInvoice(invoiceData) {
  const {
    orgId,
    patientId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    lineItems = [],
    vatRate = 0,
    accountNumber,
    kidNumber,
    insuranceCompany,
  } = invoiceData;

  // Fetch patient + org
  const res = await query(
    `SELECT p.first_name, p.last_name, p.address, p.phone, p.email,
            o.name AS clinic_name, o.address AS clinic_address,
            o.phone AS clinic_phone, o.email AS clinic_email, o.org_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId]
  );

  if (res.rows.length === 0) throw new Error('Patient not found');
  const data = res.rows[0];

  const clinic = {
    name: data.clinic_name,
    address: data.clinic_address,
    phone: data.clinic_phone,
    email: data.clinic_email,
    org_number: data.org_number,
  };

  const invDate = invoiceDate ? new Date(invoiceDate) : new Date();
  const due = dueDate ? new Date(dueDate) : new Date(invDate.getTime() + 14 * 86400000);
  const invNum = invoiceNumber || `F-${invDate.getFullYear()}-${String(Date.now()).slice(-6)}`;

  const doc = createDoc(TEXT.INVOICE);
  const f = fontName(false);
  const fb = fontName(true);

  // ── Header ──
  doc
    .fontSize(16)
    .font(fb)
    .text(clinic.name || 'Klinikk', 50, 30);
  doc.fontSize(9).font(f);
  if (clinic.address) {
    const addr =
      typeof clinic.address === 'object'
        ? [clinic.address.street, clinic.address.postal_code, clinic.address.city]
            .filter(Boolean)
            .join(', ')
        : clinic.address;
    doc.text(addr);
  }
  if (clinic.phone) doc.text(`${TEXT.PHONE}: ${clinic.phone}`);
  if (clinic.org_number) doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);

  // Invoice title (right)
  doc.fontSize(24).font(fb).text(TEXT.INVOICE, 350, 30, { width: 195, align: 'right' });
  doc.fontSize(9).font(f);
  doc.text(`${TEXT.INVOICE_NR}: ${invNum}`, 350, 60, { width: 195, align: 'right' });
  doc.text(`${TEXT.INVOICE_DATE}: ${formatNorwegianDate(invDate)}`, 350, 73, {
    width: 195,
    align: 'right',
  });
  doc.text(`${TEXT.DUE_DATE}: ${formatNorwegianDate(due)}`, 350, 86, {
    width: 195,
    align: 'right',
  });

  // Separator
  doc.y = 110;
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke('#333333');
  doc.moveDown(1);

  // ── Bill-to ──
  doc
    .fontSize(10)
    .font(fb)
    .text(insuranceCompany ? 'Faktureres til (forsikring):' : 'Faktureres til:');
  doc.font(f);
  if (insuranceCompany) {
    doc.text(insuranceCompany);
    doc.moveDown(0.3);
    doc.font(fb).text(`${TEXT.PATIENT}:`);
    doc.font(f);
  }
  doc.text(`${data.first_name || ''} ${data.last_name || ''}`);
  if (data.address) {
    const addr =
      typeof data.address === 'object'
        ? [data.address.street, data.address.postal_code, data.address.city]
            .filter(Boolean)
            .join(', ')
        : data.address;
    doc.text(addr);
  }
  doc.moveDown(1.2);

  // ── Line items table ──
  const tableTop = doc.y;
  const colDefs = [
    { x: 50, w: 80, label: TEXT.DATE },
    { x: 130, w: 200, label: 'Tjeneste' },
    { x: 330, w: 80, label: 'ICPC-kode' },
    { x: 410, w: 135, label: 'Beløp' },
  ];

  // Header row
  doc.rect(50, tableTop, 495, 22).fill('#e8eef4');
  doc.fillColor('#000000').fontSize(9).font(fb);
  for (const col of colDefs) {
    doc.text(col.label, col.x + 4, tableTop + 6, { width: col.w - 8 });
  }

  let rowY = tableTop + 22;
  let subtotal = 0;

  doc.font(f).fontSize(9);
  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const amount = Number(item.amount) || 0;
    subtotal += amount;

    if (i % 2 === 0) {
      doc.rect(50, rowY, 495, 20).fill('#fafbfc');
      doc.fillColor('#000000');
    }

    doc.text(formatNorwegianDate(item.date), colDefs[0].x + 4, rowY + 5, {
      width: colDefs[0].w - 8,
    });
    doc.text(item.service || '', colDefs[1].x + 4, rowY + 5, { width: colDefs[1].w - 8 });
    doc.text(item.icpcCode || '', colDefs[2].x + 4, rowY + 5, { width: colDefs[2].w - 8 });
    doc.text(formatNorwegianCurrency(amount), colDefs[3].x + 4, rowY + 5, {
      width: colDefs[3].w - 8,
      align: 'right',
    });

    rowY += 20;
  }

  // Bottom line
  doc.moveTo(50, rowY).lineTo(545, rowY).lineWidth(0.5).stroke();
  doc.y = rowY + 10;

  // ── Totals ──
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  doc.fontSize(10).font(f);
  doc.text(`${TEXT.SUBTOTAL}: ${formatNorwegianCurrency(subtotal)}`, { align: 'right' });
  if (vatRate > 0) {
    doc.text(`${TEXT.VAT} (${vatRate}%): ${formatNorwegianCurrency(vatAmount)}`, {
      align: 'right',
    });
  }
  doc.moveDown(0.3);
  doc.fontSize(14).font(fb);
  doc.text(`${TEXT.AMOUNT_DUE}: ${formatNorwegianCurrency(total)}`, { align: 'right' });
  doc.moveDown(1.5);

  // ── Payment info ──
  doc
    .fontSize(10)
    .font(fb)
    .text(TEXT.PAYMENT_INFO + ':');
  doc.font(f).fontSize(9);
  if (accountNumber) doc.text(`${TEXT.ACCOUNT_NR}: ${accountNumber}`);
  if (kidNumber) doc.text(`${TEXT.KID_NR}: ${kidNumber}`);
  doc.text(`${TEXT.DUE_DATE}: ${formatNorwegianDate(due)}`);
  if (clinic.org_number) doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated invoice ${invNum} for patient ${patientId}`, { size: buffer.length });
  return buffer;
}

export default {
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
  generateInvoice,
  formatNorwegianDate,
  formatNorwegianCurrency,
};
