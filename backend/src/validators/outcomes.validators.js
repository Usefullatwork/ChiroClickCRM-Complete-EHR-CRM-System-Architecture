/**
 * Outcomes Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Get patient outcome summary validation
 */
export const getPatientOutcomeSummarySchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Get patient longitudinal data validation
 */
export const getPatientLongitudinalSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Predict treatment outcome validation
 */
export const predictOutcomeSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  body: Joi.object({
    diagnosis: Joi.string(),
    treatment_type: Joi.string(),
    duration_weeks: Joi.number().integer(),
  }),
};

/**
 * Get diagnosis outcome stats validation
 */
export const getDiagnosisOutcomeSchema = {
  params: Joi.object({
    icpcCode: Joi.string().required(),
  }),
};

/**
 * Submit questionnaire validation
 */
export const submitQuestionnaireSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    type: Joi.string().valid('ODI', 'NDI', 'VAS', 'DASH', 'NPRS').required(),
    encounter_id: uuidSchema,
    answers: Joi.object().required(),
    score: Joi.number(),
    interpretation: Joi.string(),
  }),
};

/**
 * Get patient questionnaires/trend validation
 */
export const getPatientQuestionnairesSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    type: Joi.string().valid('ODI', 'NDI', 'VAS', 'DASH', 'NPRS'),
  }),
};

/**
 * Get questionnaire by ID validation
 */
export const getQuestionnaireByIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Delete questionnaire validation
 */
export const deleteQuestionnaireSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};
