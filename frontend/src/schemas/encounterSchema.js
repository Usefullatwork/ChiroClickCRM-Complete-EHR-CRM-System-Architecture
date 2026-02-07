/**
 * Encounter Zod Validation Schema
 * Required fields per encounter type and field format validation.
 */

import { z } from 'zod';

// Reusable string schemas
const nonEmptyString = z.string().min(1, 'Feltet er obligatorisk');
const optionalString = z.string().optional().default('');

// Subjective section
const subjectiveSchema = z.object({
  chief_complaint: nonEmptyString,
  history: optionalString,
  onset: optionalString,
  pain_description: optionalString,
  aggravating_factors: optionalString,
  relieving_factors: optionalString,
});

// Minimal subjective for followup/maintenance
const subjectiveMinimalSchema = z.object({
  chief_complaint: nonEmptyString,
  history: optionalString,
  onset: optionalString,
  pain_description: optionalString,
  aggravating_factors: optionalString,
  relieving_factors: optionalString,
});

// Objective section
const objectiveSchema = z.object({
  observation: optionalString,
  palpation: optionalString,
  rom: optionalString,
  ortho_tests: optionalString,
  neuro_tests: optionalString,
  posture: optionalString,
});

// Assessment section
const assessmentSchema = z.object({
  clinical_reasoning: optionalString,
  differential_diagnosis: optionalString,
  prognosis: optionalString,
  red_flags_checked: z.boolean().default(true),
});

// Plan section
const planSchema = z.object({
  treatment: optionalString,
  exercises: optionalString,
  advice: optionalString,
  follow_up: optionalString,
  referrals: optionalString,
});

// Diagnosis code schema
const diagnosisCodeSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  system: z.string().optional(),
});

// Full encounter schema (INITIAL)
export const initialEncounterSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  encounter_type: z.literal('INITIAL'),
  duration_minutes: z.number().int().min(1).max(480),
  subjective: subjectiveSchema.refine((s) => s.chief_complaint.length >= 3, {
    message: 'Hovedklage må være minst 3 tegn',
    path: ['chief_complaint'],
  }),
  objective: objectiveSchema.refine((o) => o.observation || o.palpation || o.rom, {
    message: 'Minst ett objektivt funn kreves for nyundersøkelse',
  }),
  assessment: assessmentSchema.refine((a) => a.clinical_reasoning, {
    message: 'Klinisk resonnement kreves for nyundersøkelse',
    path: ['clinical_reasoning'],
  }),
  plan: planSchema.refine((p) => p.treatment || p.follow_up, {
    message: 'Behandling eller oppfølging kreves',
    path: ['treatment'],
  }),
  icpc_codes: z.array(diagnosisCodeSchema).min(1, 'Minst en diagnosekode kreves'),
  icd10_codes: z.array(diagnosisCodeSchema).optional().default([]),
  vas_pain_start: z.number().min(0).max(10),
  vas_pain_end: z.number().min(0).max(10),
});

// Followup encounter schema
export const followupEncounterSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  encounter_type: z.literal('FOLLOWUP'),
  duration_minutes: z.number().int().min(1).max(480),
  subjective: subjectiveMinimalSchema,
  objective: objectiveSchema,
  assessment: assessmentSchema,
  plan: planSchema,
  icpc_codes: z.array(diagnosisCodeSchema).optional().default([]),
  icd10_codes: z.array(diagnosisCodeSchema).optional().default([]),
  vas_pain_start: z.number().min(0).max(10),
  vas_pain_end: z.number().min(0).max(10),
});

// Maintenance encounter schema (minimal requirements)
export const maintenanceEncounterSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  encounter_type: z.literal('MAINTENANCE'),
  duration_minutes: z.number().int().min(1).max(480),
  subjective: subjectiveMinimalSchema,
  objective: objectiveSchema,
  assessment: assessmentSchema,
  plan: planSchema,
  icpc_codes: z.array(diagnosisCodeSchema).optional().default([]),
  icd10_codes: z.array(diagnosisCodeSchema).optional().default([]),
  vas_pain_start: z.number().min(0).max(10),
  vas_pain_end: z.number().min(0).max(10),
});

/**
 * Get the appropriate schema for an encounter type
 */
export function getSchemaForType(encounterType) {
  switch (encounterType) {
    case 'INITIAL':
      return initialEncounterSchema;
    case 'MAINTENANCE':
      return maintenanceEncounterSchema;
    case 'FOLLOWUP':
    default:
      return followupEncounterSchema;
  }
}

/**
 * Validate encounter data against the schema for its type
 * @returns {{ success: boolean, errors: Array<{path: string[], message: string}> }}
 */
export function validateEncounter(data) {
  const schema = getSchemaForType(data.encounter_type);
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    })),
  };
}
