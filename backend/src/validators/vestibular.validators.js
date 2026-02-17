/**
 * Vestibular Assessment Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Create vestibular assessment validation
 */
export const createAssessmentSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    encounter_id: uuidSchema,
    assessment_type: Joi.string(),
    chief_complaint: Joi.string(),
    onset_date: Joi.date().iso(),
    symptom_duration: Joi.string(),
    triggers: Joi.array().items(Joi.string()),
    associated_symptoms: Joi.array().items(Joi.string()),
    dix_hallpike: Joi.object(),
    head_impulse: Joi.object(),
    nystagmus: Joi.object(),
    romberg: Joi.object(),
    gait_assessment: Joi.object(),
    bppv_findings: Joi.object(),
    diagnosis: Joi.string(),
    diagnosis_code: Joi.string(),
    treatment_plan: Joi.string(),
    notes: Joi.string(),
  }),
};

/**
 * Get assessment by ID validation
 */
export const getAssessmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Get patient assessments validation
 */
export const getPatientAssessmentsSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Get encounter assessment validation
 */
export const getEncounterAssessmentSchema = {
  params: Joi.object({
    encounterId: uuidSchema.required(),
  }),
};

/**
 * Update assessment validation
 */
export const updateAssessmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    assessment_type: Joi.string(),
    chief_complaint: Joi.string(),
    onset_date: Joi.date().iso(),
    symptom_duration: Joi.string(),
    triggers: Joi.array().items(Joi.string()),
    associated_symptoms: Joi.array().items(Joi.string()),
    dix_hallpike: Joi.object(),
    head_impulse: Joi.object(),
    nystagmus: Joi.object(),
    romberg: Joi.object(),
    gait_assessment: Joi.object(),
    bppv_findings: Joi.object(),
    diagnosis: Joi.string(),
    diagnosis_code: Joi.string(),
    treatment_plan: Joi.string(),
    notes: Joi.string(),
  }),
};

/**
 * Delete assessment validation
 */
export const deleteAssessmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Get BPPV trends validation
 */
export const getBPPVTrendsSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};
