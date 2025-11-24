/**
 * Clinical Encounter Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateTimeSchema = Joi.date().iso();

/**
 * SOAP note schema (Subjective, Objective, Assessment, Plan)
 */
const soapSubjectiveSchema = Joi.object({
  chief_complaint: Joi.string().max(500),
  history: Joi.string().max(2000),
  pain_description: Joi.string().max(1000),
  onset: Joi.string().max(500),
  aggravating_factors: Joi.string().max(1000),
  relieving_factors: Joi.string().max(1000)
});

const soapObjectiveSchema = Joi.object({
  observation: Joi.string().max(2000),
  palpation: Joi.string().max(2000),
  rom: Joi.string().max(1000),
  ortho_tests: Joi.string().max(2000),
  neuro_tests: Joi.string().max(2000),
  posture: Joi.string().max(1000)
});

const soapAssessmentSchema = Joi.object({
  clinical_reasoning: Joi.string().max(2000),
  differential_diagnosis: Joi.string().max(1000),
  prognosis: Joi.string().max(1000),
  red_flags_checked: Joi.boolean()
});

const soapPlanSchema = Joi.object({
  treatment: Joi.string().max(2000),
  exercises: Joi.string().max(2000),
  advice: Joi.string().max(2000),
  follow_up: Joi.string().max(500),
  referrals: Joi.string().max(1000)
});

/**
 * Create encounter validation
 */
export const createEncounterSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    practitioner_id: uuidSchema.required(),
    encounter_date: dateTimeSchema.default(new Date()),
    encounter_type: Joi.string()
      .valid('INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY')
      .required(),
    duration_minutes: Joi.number().integer().min(5).max(180).default(30),

    // SOAP notes
    subjective: soapSubjectiveSchema,
    objective: soapObjectiveSchema,
    assessment: soapAssessmentSchema,
    plan: soapPlanSchema,

    // Diagnosis codes
    icpc_codes: Joi.array().items(Joi.string().max(10)).max(10),
    icd10_codes: Joi.array().items(Joi.string().max(10)).max(10),

    // Treatments
    treatments: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        region: Joi.string(),
        technique: Joi.string(),
        side: Joi.string().valid('left', 'right', 'bilateral'),
        notes: Joi.string().max(500)
      })
    ),

    // Pain assessment (VAS 0-10)
    vas_pain_start: Joi.number().integer().min(0).max(10).allow(null),
    vas_pain_end: Joi.number().integer().min(0).max(10).allow(null),

    // Norwegian insurance (NAV)
    nav_series_number: Joi.number().integer().min(1).max(14).allow(null),
    nav_diagnosis_date: Joi.date().iso().allow(null)
  })
};

/**
 * Update encounter validation
 */
export const updateEncounterSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    encounter_date: dateTimeSchema,
    encounter_type: Joi.string().valid('INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY'),
    duration_minutes: Joi.number().integer().min(5).max(180),

    // SOAP notes
    subjective: soapSubjectiveSchema,
    objective: soapObjectiveSchema,
    assessment: soapAssessmentSchema,
    plan: soapPlanSchema,

    // Diagnosis codes
    icpc_codes: Joi.array().items(Joi.string().max(10)).max(10),
    icd10_codes: Joi.array().items(Joi.string().max(10)).max(10),

    // Treatments
    treatments: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        region: Joi.string(),
        technique: Joi.string(),
        side: Joi.string().valid('left', 'right', 'bilateral'),
        notes: Joi.string().max(500)
      })
    ),

    // Pain assessment
    vas_pain_start: Joi.number().integer().min(0).max(10).allow(null),
    vas_pain_end: Joi.number().integer().min(0).max(10).allow(null),

    // NAV
    nav_series_number: Joi.number().integer().min(1).max(14).allow(null),
    nav_diagnosis_date: Joi.date().iso().allow(null)
  }).min(1) // At least one field must be present
};

/**
 * Get encounter by ID validation
 */
export const getEncounterSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  })
};

/**
 * Sign encounter validation
 */
export const signEncounterSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  })
};

/**
 * Get encounters list validation
 */
export const getEncountersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    patientId: uuidSchema,
    practitionerId: uuidSchema,
    startDate: dateTimeSchema,
    endDate: dateTimeSchema,
    encounterType: Joi.string().valid('INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY'),
    signed: Joi.boolean()
  })
};

/**
 * Generate formatted note validation
 */
export const generateNoteSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  })
};
