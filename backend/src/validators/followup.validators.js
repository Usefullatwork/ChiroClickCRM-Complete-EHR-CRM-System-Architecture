/**
 * Follow-up Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateSchema = Joi.date().iso();

/**
 * Create follow-up validation
 */
export const createFollowUpSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    encounter_id: uuidSchema,
    follow_up_type: Joi.string()
      .valid('RECALL_3M', 'RECALL_6M', 'BIRTHDAY', 'CHECK_IN', 'INSURANCE_EXPIRING', 'OUTCOME_MEASURE', 'APPOINTMENT', 'CUSTOM')
      .required(),
    reason: Joi.string().required(),
    due_date: dateSchema.required(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
    assigned_to: uuidSchema,
    notes: Joi.string()
  })
};

/**
 * Update follow-up validation
 */
export const updateFollowUpSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    due_date: dateSchema,
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW'),
    assigned_to: uuidSchema.allow(null),
    notes: Joi.string(),
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')
  }).min(1)
};

/**
 * Complete follow-up validation
 */
export const completeFollowUpSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    completion_notes: Joi.string().allow('')
  })
};

/**
 * Get follow-ups list validation
 */
export const getFollowUpsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    patientId: uuidSchema,
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW'),
    dueDate: dateSchema
  })
};
