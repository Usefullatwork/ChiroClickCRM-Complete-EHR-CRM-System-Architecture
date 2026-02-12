/**
 * AI Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Record feedback validation
 */
export const recordFeedbackSchema = {
  body: Joi.object({
    suggestion_id: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5),
    accepted: Joi.boolean(),
    feedback_text: Joi.string().max(2000),
    task_type: Joi.string(),
    model_used: Joi.string(),
  }),
};

/**
 * Spell check validation
 */
export const spellCheckSchema = {
  body: Joi.object({
    text: Joi.string().required().max(10000),
    language: Joi.string().valid('no', 'en', 'nb', 'nn').default('no'),
  }),
};

/**
 * SOAP suggestion validation
 */
export const soapSuggestionSchema = {
  body: Joi.object({
    chief_complaint: Joi.string().required().max(5000),
    patient_id: uuidSchema,
    encounter_id: uuidSchema,
    section: Joi.string().valid('subjective', 'objective', 'assessment', 'plan'),
    context: Joi.object(),
  }),
};

/**
 * Suggest diagnosis validation
 */
export const suggestDiagnosisSchema = {
  body: Joi.object({
    symptoms: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    patient_id: uuidSchema,
    encounter_id: uuidSchema,
    clinical_findings: Joi.string(),
    context: Joi.object(),
  }),
};

/**
 * Analyze red flags validation
 */
export const analyzeRedFlagsSchema = {
  body: Joi.object({
    patient_id: uuidSchema,
    encounter_id: uuidSchema,
    subjective: Joi.object(),
    objective: Joi.object(),
    chief_complaint: Joi.string(),
    history: Joi.string(),
  }),
};

/**
 * Clinical summary validation
 */
export const clinicalSummarySchema = {
  body: Joi.object({
    patient_id: uuidSchema,
    encounter_id: uuidSchema,
    encounters: Joi.array().items(Joi.object()),
    format: Joi.string().valid('brief', 'detailed', 'referral'),
    language: Joi.string().valid('no', 'en', 'nb', 'nn'),
  }),
};

/**
 * Outcome feedback validation
 */
export const outcomeFeedbackSchema = {
  body: Joi.object({
    suggestion_id: Joi.string().required(),
    outcome: Joi.string().required(),
    patient_id: uuidSchema,
    encounter_id: uuidSchema,
    notes: Joi.string(),
  }),
};

/**
 * Circuit reset validation
 */
export const circuitResetSchema = {
  params: Joi.object({
    service: Joi.string().required(),
  }),
};
