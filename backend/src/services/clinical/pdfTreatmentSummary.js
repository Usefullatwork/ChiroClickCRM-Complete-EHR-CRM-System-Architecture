/**
 * PDF Treatment Summary Generator
 * Generates patient treatment summary PDFs with encounter history
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import {
  TEXT,
  fontName,
  formatNorwegianDate,
  createDoc,
  docToBuffer,
  addHeader,
  addFooter,
  addPatientInfo,
  sectionHeading,
  labeledValue,
  needsNewPage,
} from './pdf-utils.js';

/**
 * Generate a treatment summary PDF for a patient.
 */
export async function generateTreatmentSummary(patientId, orgId, options = {}) {
  const maxEncounters = options.maxEncounters || 20;

  const patientRes = await query(
    `SELECT p.id, p.organization_id, p.first_name, p.last_name, p.date_of_birth,
            p.phone, p.email, p.solvit_id,
            o.name AS clinic_name, o.address AS clinic_address,
            o.phone AS clinic_phone, o.email AS clinic_email, o.org_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId]
  );

  if (patientRes.rows.length === 0) {
    throw new Error('Patient not found');
  }
  const patient = patientRes.rows[0];

  const clinic = {
    name: patient.clinic_name,
    address: patient.clinic_address,
    phone: patient.clinic_phone,
    email: patient.clinic_email,
    org_number: patient.org_number,
  };

  const encRes = await query(
    `SELECT ce.id, ce.encounter_date, ce.encounter_type,
            ce.subjective, ce.objective, ce.assessment, ce.plan,
            ce.icpc_codes, ce.icd10_codes, ce.vas_pain_start, ce.vas_pain_end,
            u.first_name || ' ' || u.last_name AS practitioner_name
     FROM clinical_encounters ce
     LEFT JOIN users u ON u.id = ce.practitioner_id
     WHERE ce.patient_id = $1 AND ce.organization_id = $2
     ORDER BY ce.encounter_date DESC LIMIT $3`,
    [patientId, orgId, maxEncounters]
  );
  const encounters = encRes.rows;

  let outcomeScores = [];
  try {
    const outRes = await query(
      `SELECT assessed_at, questionnaire_type, score, severity
       FROM outcome_scores
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY assessed_at DESC LIMIT 20`,
      [patientId, orgId]
    );
    outcomeScores = outRes.rows;
  } catch {
    /* Table may not exist yet */
  }

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
    if (allIcpc.length > 0) {
      labeledValue(doc, 'ICPC-2', allIcpc.join(', '));
    }
    if (allIcd.length > 0) {
      labeledValue(doc, 'ICD-10', allIcd.join(', '));
    }
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

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated treatment summary PDF for patient ${patientId}`, {
    size: buffer.length,
    encounters: encounters.length,
  });
  return buffer;
}
