/**
 * Billing Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateSchema = Joi.date().iso();

/**
 * Create episode validation
 */
export const createEpisodeSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    diagnosis_codes: Joi.array().items(Joi.string()),
    primary_diagnosis: Joi.string(),
    notes: Joi.string(),
  }),
};

/**
 * Get patient episodes validation
 */
export const getPatientEpisodesSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Get episode by ID validation
 */
export const getEpisodeSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
};

/**
 * Update episode progress validation
 */
export const updateEpisodeProgressSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
  body: Joi.object({
    visit_number: Joi.number().integer().min(1),
    pain_level: Joi.number().min(0).max(10),
    functional_improvement: Joi.number(),
    notes: Joi.string(),
  }),
};

/**
 * Episode reeval validation
 */
export const episodeReevalSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
  body: Joi.object({
    findings: Joi.string(),
    recommendation: Joi.string(),
    continue_treatment: Joi.boolean(),
  }),
};

/**
 * Episode maintenance validation
 */
export const episodeMaintenanceSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string(),
    frequency: Joi.string(),
  }),
};

/**
 * Episode ABN validation
 */
export const episodeABNSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
  body: Joi.object({
    signed: Joi.boolean(),
    signed_date: dateSchema,
    patient_choice: Joi.string(),
  }),
};

/**
 * Episode discharge validation
 */
export const episodeDischargeSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string(),
    outcome: Joi.string(),
    recommendations: Joi.string(),
  }),
};

/**
 * Get billing modifier validation
 */
export const getBillingModifierSchema = {
  params: Joi.object({
    episodeId: uuidSchema.required(),
    patientId: uuidSchema.required(),
  }),
};

/**
 * List claims validation
 */
export const listClaimsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    status: Joi.string(),
    patient_id: uuidSchema,
    payer_id: Joi.string(),
    start_date: dateSchema,
    end_date: dateSchema,
  }),
};

/**
 * Create claim validation
 */
export const createClaimSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    episode_id: uuidSchema,
    encounter_id: uuidSchema,
    line_items: Joi.array().items(
      Joi.object({
        cpt_code: Joi.string().required(),
        modifier: Joi.string(),
        units: Joi.number().integer().min(1).default(1),
        diagnosis_pointer: Joi.array().items(Joi.number().integer()),
      })
    ),
    diagnosis_codes: Joi.array().items(Joi.string()),
    payer_id: Joi.string(),
    notes: Joi.string(),
  }),
};

/**
 * Get claim by ID validation
 */
export const getClaimSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
};

/**
 * Update claim line items validation
 */
export const updateClaimLineItemsSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
  body: Joi.object({
    line_items: Joi.array().items(Joi.object()).required(),
  }),
};

/**
 * Submit claim validation
 */
export const submitClaimSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
};

/**
 * Process remittance validation
 */
export const processRemittanceSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
  body: Joi.object({
    paid_amount: Joi.number(),
    adjustment_amount: Joi.number(),
    adjustment_reason: Joi.string(),
    check_number: Joi.string(),
    payment_date: dateSchema,
  }),
};

/**
 * Appeal claim validation
 */
export const appealClaimSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string().required(),
    supporting_docs: Joi.array().items(Joi.string()),
  }),
};

/**
 * Write off claim validation
 */
export const writeOffClaimSchema = {
  params: Joi.object({
    claimId: uuidSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string().required(),
  }),
};

/**
 * Suggest CMT code validation
 */
export const suggestCMTSchema = {
  body: Joi.object({
    regions_count: Joi.number().integer().min(1).max(5).required(),
  }),
};
