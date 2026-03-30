/**
 * PDF Referral Letter Generator
 * Norwegian formal referral letter (Henvisning)
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import {
  TEXT,
  fontName,
  formatNorwegianDate,
  createDoc,
  docToBuffer,
  addFooter,
  sectionHeading,
  labeledValue,
} from './pdf-utils.js';

/**
 * Generate a Norwegian formal referral letter.
 */
export async function generateReferralLetter(referralData) {
  const {
    _patientId,
    orgId,
    encounterId,
    recipientName,
    recipientAddress,
    reasonForReferral,
    relevantFindings,
    relevantTestResults,
  } = referralData;

  const res = await query(
    `SELECT ce.id, ce.organization_id, ce.patient_id, ce.practitioner_id,
            ce.encounter_date, ce.encounter_type,
            ce.subjective, ce.objective, ce.assessment, ce.plan,
            ce.icpc_codes, ce.icd10_codes,
            p.first_name, p.last_name, p.date_of_birth, p.phone, p.email, p.solvit_id,
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

  if (res.rows.length === 0) {
    throw new Error('Encounter not found');
  }
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

  // Sender block
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
  if (data.hpr_number) {
    doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  }
  if (clinic.phone) {
    doc.text(`${TEXT.PHONE}: ${clinic.phone}`);
  }

  // Recipient block
  doc.moveDown(1.5);
  doc.fontSize(10).font(fb).text(`${TEXT.TO}:`);
  doc.font(f);
  doc.text(recipientName || '[Spesialist / Avdeling]');
  if (recipientAddress) {
    doc.text(recipientAddress);
  }

  doc
    .fontSize(9)
    .font(f)
    .text(formatNorwegianDate(new Date()), 400, doc.y - 20, { width: 145, align: 'right' });

  // Subject line
  doc.moveDown(1.5);
  doc.fontSize(11).font(fb);
  doc.text(
    `${TEXT.RE}: ${data.first_name} ${data.last_name}, f. ${formatNorwegianDate(data.date_of_birth)}`
  );
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#333333');
  doc.moveDown(0.8);

  // Diagnosis
  doc.fontSize(10);
  sectionHeading(doc, TEXT.DIAGNOSIS);
  const icpc = data.icpc_codes?.join(', ') || 'Ikke spesifisert';
  const icd = data.icd10_codes?.join(', ');
  labeledValue(doc, 'ICPC-2', icpc);
  if (icd) {
    labeledValue(doc, 'ICD-10', icd);
  }
  doc.moveDown(0.5);

  // Clinical findings
  sectionHeading(doc, TEXT.CLINICAL_FINDINGS);
  const findings = relevantFindings || buildFindingsText(data);
  doc.text(findings, { align: 'justify' });
  doc.moveDown(0.5);

  if (relevantTestResults) {
    sectionHeading(doc, 'Relevante testresultater');
    doc.text(relevantTestResults, { align: 'justify' });
    doc.moveDown(0.5);
  }

  // Reason for referral
  sectionHeading(doc, TEXT.REASON_REFERRAL);
  doc.text(reasonForReferral || 'Pasienten henvises for videre utredning og behandling.', {
    align: 'justify',
  });
  doc.moveDown(0.5);

  if (data.assessment?.clinical_reasoning) {
    sectionHeading(doc, TEXT.ASSESSMENT);
    doc.text(data.assessment.clinical_reasoning, { align: 'justify' });
    doc.moveDown(0.5);
  }

  // Signature
  doc.moveDown(2);
  doc.font(f).text(`${TEXT.REGARDS},`);
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(220, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font(fb).text(data.practitioner_name || '');
  doc.font(f).text(TEXT.CHIROPRACTOR);
  if (data.hpr_number) {
    doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  }
  doc.text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`);

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated referral letter for encounter ${encounterId}`, { size: buffer.length });
  return buffer;
}

/** Build clinical findings text from encounter objective data */
function buildFindingsText(data) {
  const parts = [];
  if (data.subjective?.history) {
    parts.push(`${TEXT.HISTORY}: ${data.subjective.history}`);
  }
  if (data.objective?.observation) {
    parts.push(`${TEXT.OBSERVATION}: ${data.objective.observation}`);
  }
  if (data.objective?.palpation) {
    parts.push(`${TEXT.PALPATION}: ${data.objective.palpation}`);
  }
  if (data.objective?.ortho_tests) {
    parts.push(`${TEXT.ORTHO_TESTS}: ${data.objective.ortho_tests}`);
  }
  if (data.objective?.neuro_tests) {
    parts.push(`${TEXT.NEURO_TESTS}: ${data.objective.neuro_tests}`);
  }
  if (data.objective?.rom) {
    parts.push(`${TEXT.ROM}: ${data.objective.rom}`);
  }
  return parts.join('\n') || 'Se pasientjournal.';
}
