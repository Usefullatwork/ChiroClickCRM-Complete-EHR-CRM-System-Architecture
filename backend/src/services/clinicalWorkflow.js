/**
 * Clinical Workflow Orchestrator
 * Coordinates the clinical encounter lifecycle: start → examine → treat → finalize
 * Uses existing service layer rather than direct DB access.
 */

import * as encounterService from './encounters.js';
import * as examinationService from './examinations.js';
import * as treatmentService from './treatments.js';
import * as clinicalNotes from './clinicalNotes.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../utils/errors.js';

/**
 * Start a new clinical encounter.
 * Creates the encounter shell, loads patient context (previous encounters,
 * red flags, allergies), and returns everything the practitioner needs.
 *
 * @param {string} organizationId
 * @param {string} patientId
 * @param {string} encounterType - e.g. 'INITIAL', 'FOLLOW_UP', 'VESTIBULAR'
 * @param {string} practitionerId
 * @returns {{ encounter, context }}
 */
export const startEncounter = async (organizationId, patientId, encounterType, practitionerId) => {
  // Create the encounter shell
  const encounter = await encounterService.createEncounter(organizationId, {
    patient_id: patientId,
    practitioner_id: practitionerId,
    encounter_type: encounterType,
    encounter_date: new Date(),
    subjective: {},
    objective: {},
    assessment: {},
    plan: {},
  });

  // Load patient context in parallel
  const [encounterHistory, redFlags, patientData] = await Promise.all([
    encounterService.getPatientEncounterHistory(organizationId, patientId),
    encounterService.checkRedFlags(patientId, {}),
    query(
      `SELECT
        id, first_name, last_name, date_of_birth,
        red_flags, contraindications, allergies, current_medications,
        status
      FROM patients
      WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    ),
  ]);

  const patient = patientData.rows[0] || null;

  const context = {
    patient: patient
      ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
          dateOfBirth: patient.date_of_birth,
          allergies: patient.allergies || [],
          currentMedications: patient.current_medications || [],
          redFlags: patient.red_flags || [],
          contraindications: patient.contraindications || [],
        }
      : null,
    previousEncounters: encounterHistory,
    alerts: redFlags.alerts,
    warnings: redFlags.warnings,
  };

  logger.info('Encounter started', {
    encounterId: encounter.id,
    patientId,
    encounterType,
    practitionerId,
  });

  return { encounter, context };
};

/**
 * Record examination findings for an encounter.
 * Validates exam data, stores structured findings in the objective section,
 * and returns suggestions based on the findings.
 *
 * @param {string} organizationId
 * @param {string} encounterId
 * @param {object} examData - { findings: [...], bodyRegion, category, ... }
 * @param {string} userId - practitioner performing the exam
 * @returns {{ updated, suggestions }}
 */
export const recordExamination = async (organizationId, encounterId, examData, userId) => {
  // Verify encounter exists and is not signed
  const encounter = await encounterService.getEncounterById(organizationId, encounterId);
  if (!encounter) {
    throw new NotFoundError('Encounter', encounterId);
  }
  if (encounter.signed_at) {
    throw new BusinessLogicError('Cannot record examination on a signed encounter');
  }

  // Store structured findings if provided
  const storedFindings = [];
  if (examData.findings && Array.isArray(examData.findings)) {
    for (const finding of examData.findings) {
      const stored = await examinationService.createFinding(organizationId, userId, {
        encounter_id: encounterId,
        protocol_id: finding.protocol_id || null,
        body_region: finding.body_region || examData.bodyRegion,
        category: finding.category || examData.category,
        test_name: finding.test_name,
        result: finding.result,
        laterality: finding.laterality || null,
        severity: finding.severity || null,
        findings_text: finding.findings_text || null,
        clinician_notes: finding.clinician_notes || null,
        measurement_value: finding.measurement_value || null,
        measurement_unit: finding.measurement_unit || null,
        pain_score: finding.pain_score || null,
        pain_location: finding.pain_location || null,
      });
      storedFindings.push(stored);
    }
  }

  // Map findings to the objective section of the encounter
  const objectiveUpdate = mapFindingsToObjective(
    encounter.objective || {},
    examData,
    storedFindings
  );

  // Update the encounter's objective section
  const updated = await encounterService.updateEncounter(organizationId, encounterId, {
    objective: objectiveUpdate,
  });

  // Generate suggestions based on findings
  const suggestions = generateExamSuggestions(storedFindings, examData);

  logger.info('Examination recorded', {
    encounterId,
    findingsCount: storedFindings.length,
  });

  return { updated, suggestions };
};

/**
 * Record treatment for an encounter.
 * Validates treatment data, updates the plan section, logs billing codes.
 *
 * @param {string} organizationId
 * @param {string} encounterId
 * @param {object} treatmentData - { treatments: [...], notes, exercises, advice }
 * @returns {{ updated, billingCodes }}
 */
export const recordTreatment = async (organizationId, encounterId, treatmentData) => {
  // Verify encounter exists and is not signed
  const encounter = await encounterService.getEncounterById(organizationId, encounterId);
  if (!encounter) {
    throw new NotFoundError('Encounter', encounterId);
  }
  if (encounter.signed_at) {
    throw new BusinessLogicError('Cannot record treatment on a signed encounter');
  }

  // Collect billing codes from treatments
  const billingCodes = [];
  if (treatmentData.treatments && Array.isArray(treatmentData.treatments)) {
    for (const treatment of treatmentData.treatments) {
      if (treatment.code) {
        const treatmentCode = await treatmentService.getTreatmentCode(treatment.code);
        if (treatmentCode) {
          billingCodes.push({
            code: treatmentCode.code,
            description: treatmentCode.description,
            price: treatmentCode.default_price,
            insurance: treatmentCode.insurance_reimbursement,
          });
          // Increment usage tracking
          await treatmentService.incrementTreatmentUsageCount(treatment.code);
        }
      }
    }
  }

  // Calculate pricing
  const pricing =
    billingCodes.length > 0
      ? await treatmentService.calculateTreatmentPrice(billingCodes.map((b) => b.code))
      : { grossAmount: 0, insuranceAmount: 0, patientAmount: 0 };

  // Build the plan update
  const planUpdate = mapTreatmentsToPlan(encounter.plan || {}, treatmentData);

  // Update encounter
  const updated = await encounterService.updateEncounter(organizationId, encounterId, {
    plan: planUpdate,
    treatments: treatmentData.treatments || [],
    vas_pain_end: treatmentData.vas_pain_end ?? encounter.vas_pain_end,
  });

  logger.info('Treatment recorded', {
    encounterId,
    billingCodesCount: billingCodes.length,
    grossAmount: pricing.grossAmount,
  });

  return {
    updated,
    billingCodes: {
      codes: billingCodes,
      ...pricing,
    },
  };
};

/**
 * Finalize an encounter.
 * Generates the formatted SOAP note, signs the encounter, and suggests follow-up.
 *
 * @param {string} organizationId
 * @param {string} encounterId
 * @param {string} practitionerId
 * @returns {{ note, signed, followUpSuggested }}
 */
export const finalizeEncounter = async (organizationId, encounterId, practitionerId) => {
  // Verify encounter exists and is not already signed
  const encounter = await encounterService.getEncounterById(organizationId, encounterId);
  if (!encounter) {
    throw new NotFoundError('Encounter', encounterId);
  }
  if (encounter.signed_at) {
    throw new BusinessLogicError('Encounter is already finalized');
  }

  // Generate the formatted SOAP note
  const note = await encounterService.generateFormattedNote(organizationId, encounterId);

  // Also create a clinical note record linked to this encounter
  await clinicalNotes.createNote(
    organizationId,
    {
      patient_id: encounter.patient_id,
      practitioner_id: practitionerId,
      note_type: 'SOAP',
      template_type: encounter.encounter_type || 'SOAP',
      note_date: encounter.encounter_date,
      subjective: encounter.subjective || {},
      objective: encounter.objective || {},
      assessment: encounter.assessment || {},
      plan: encounter.plan || {},
      icd10_codes: encounter.icd10_codes || [],
      icpc_codes: encounter.icpc_codes || [],
      duration_minutes: encounter.duration_minutes,
      vas_pain_start: encounter.vas_pain_start,
      vas_pain_end: encounter.vas_pain_end,
      encounter_id: encounterId,
      is_draft: false,
    },
    practitionerId
  );

  // Sign the encounter
  const signed = await encounterService.signEncounter(organizationId, encounterId, practitionerId);

  // Determine if follow-up is suggested
  const followUpSuggested = suggestFollowUp(encounter);

  logger.info('Encounter finalized', {
    encounterId,
    practitionerId,
    followUpSuggested: followUpSuggested.recommended,
  });

  return { note, signed, followUpSuggested };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map structured examination findings into the encounter's objective section.
 */
function mapFindingsToObjective(existingObjective, examData, storedFindings) {
  const objective = { ...existingObjective };

  // Merge free-text fields from examData
  if (examData.observation) objective.observation = examData.observation;
  if (examData.palpation) objective.palpation = examData.palpation;
  if (examData.rom) objective.rom = examData.rom;
  if (examData.ortho_tests) objective.ortho_tests = examData.ortho_tests;
  if (examData.neuro_tests) objective.neuro_tests = examData.neuro_tests;
  if (examData.vital_signs) objective.vital_signs = examData.vital_signs;

  // Build structured findings summary
  if (storedFindings.length > 0) {
    const findingsSummary = storedFindings
      .map((f) => {
        let text = f.test_name || '';
        if (f.result) text += `: ${f.result}`;
        if (f.laterality) text += ` (${f.laterality})`;
        if (f.findings_text) text += ` - ${f.findings_text}`;
        return text;
      })
      .filter(Boolean);

    objective.structured_findings = [
      ...(existingObjective.structured_findings || []),
      ...findingsSummary,
    ];
  }

  return objective;
}

/**
 * Map treatment data into the encounter's plan section.
 */
function mapTreatmentsToPlan(existingPlan, treatmentData) {
  const plan = { ...existingPlan };

  if (treatmentData.treatment_description) {
    plan.treatment = treatmentData.treatment_description;
  }

  // Build treatment summary from individual treatments
  if (treatmentData.treatments && treatmentData.treatments.length > 0) {
    const treatmentDescriptions = treatmentData.treatments
      .map((t) => {
        let desc = t.description || t.code || '';
        if (t.region) desc += ` (${t.region})`;
        if (t.notes) desc += ` - ${t.notes}`;
        return desc;
      })
      .filter(Boolean);

    plan.treatments_performed = [
      ...(existingPlan.treatments_performed || []),
      ...treatmentDescriptions,
    ];
  }

  if (treatmentData.exercises) plan.exercises = treatmentData.exercises;
  if (treatmentData.advice) plan.advice = treatmentData.advice;
  if (treatmentData.follow_up) plan.follow_up = treatmentData.follow_up;
  if (treatmentData.referral) plan.referral = treatmentData.referral;

  return plan;
}

/**
 * Generate suggestions based on examination findings.
 */
function generateExamSuggestions(findings, examData) {
  const suggestions = [];

  // Check for positive red-flag tests
  const positiveFindings = findings.filter((f) => f.result === 'positive' || f.result === '+');

  if (positiveFindings.length > 0) {
    suggestions.push({
      type: 'warning',
      message: `${positiveFindings.length} positive finding(s) detected. Review for clinical significance.`,
      findings: positiveFindings.map((f) => f.test_name),
    });
  }

  // Suggest additional tests based on body region
  if (examData.bodyRegion === 'cervical' || examData.bodyRegion === 'Nakke') {
    const hasNeuro = findings.some((f) => f.category === 'neurological');
    if (!hasNeuro) {
      suggestions.push({
        type: 'info',
        message:
          'Consider neurological screening for cervical complaints (reflexes, sensation, motor).',
      });
    }
  }

  if (examData.bodyRegion === 'lumbar' || examData.bodyRegion === 'Korsrygg') {
    const hasSLR = findings.some(
      (f) =>
        f.test_name?.toLowerCase().includes('slr') ||
        f.test_name?.toLowerCase().includes('straight leg')
    );
    if (!hasSLR) {
      suggestions.push({
        type: 'info',
        message: 'Consider SLR test for lumbar complaints with radiculopathy signs.',
      });
    }
  }

  return suggestions;
}

/**
 * Determine if follow-up is recommended based on encounter data.
 */
function suggestFollowUp(encounter) {
  const plan = encounter.plan || {};
  const vasStart = encounter.vas_pain_start;
  const vasEnd = encounter.vas_pain_end;

  // If VAS is still high at end of treatment, recommend follow-up
  if (vasEnd !== null && vasEnd > 3) {
    return {
      recommended: true,
      reason: `VAS pain score remains elevated (${vasEnd}/10) after treatment`,
      suggestedDays: vasEnd > 6 ? 3 : 7,
    };
  }

  // If plan mentions follow-up
  if (plan.follow_up) {
    return {
      recommended: true,
      reason: 'Follow-up noted in treatment plan',
      suggestedDays: 7,
    };
  }

  // Initial encounters typically need follow-up
  if (encounter.encounter_type === 'INITIAL') {
    return {
      recommended: true,
      reason: 'Initial encounter - follow-up recommended to assess response',
      suggestedDays: 7,
    };
  }

  return {
    recommended: false,
    reason: null,
    suggestedDays: null,
  };
}

export { mapFindingsToObjective, mapTreatmentsToPlan };

export default {
  startEncounter,
  recordExamination,
  recordTreatment,
  finalizeEncounter,
};
