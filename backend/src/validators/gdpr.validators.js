/**
 * GDPR Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Create GDPR request validation
 */
export const createGDPRRequestSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    request_type: Joi.string()
      .valid('ACCESS', 'PORTABILITY', 'ERASURE', 'RECTIFICATION', 'RESTRICTION')
      .required(),
    reason: Joi.string(),
    notes: Joi.string(),
  }),
};

/**
 * Update GDPR request status validation
 */
export const updateGDPRRequestStatusSchema = {
  params: Joi.object({
    requestId: uuidSchema.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED').required(),
    notes: Joi.string(),
  }),
};

/**
 * Patient ID param validation (for data-access, data-portability, consent-audit)
 */
export const patientIdParamSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Process erasure validation
 */
export const processErasureSchema = {
  params: Joi.object({
    requestId: uuidSchema.required(),
  }),
  body: Joi.object({
    confirm: Joi.boolean(),
    reason: Joi.string(),
  }),
};

/**
 * Update consent validation
 */
export const updateConsentSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  body: Joi.object({
    consent_sms: Joi.boolean(),
    consent_email: Joi.boolean(),
    consent_data_storage: Joi.boolean(),
    consent_marketing: Joi.boolean(),
    consent_research: Joi.boolean(),
  }).min(1),
};
