/**
 * Scheduler Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Schedule communication validation
 */
export const scheduleCommunicationSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    type: Joi.string().valid('SMS', 'EMAIL', 'PUSH').required(),
    message: Joi.string().required(),
    scheduled_at: Joi.date().iso(),
    template_id: Joi.string(),
    metadata: Joi.object(),
  }),
};

/**
 * Check conflicts validation
 */
export const checkConflictsSchema = {
  body: Joi.object({
    appointmentId: uuidSchema.required(),
  }),
};

/**
 * Resolve decision validation
 */
export const resolveDecisionSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    decision: Joi.string().valid('extend', 'cancel', 'send_anyway').required(),
    note: Joi.string(),
  }),
};

/**
 * Bulk resolve decisions validation
 */
export const bulkResolveDecisionsSchema = {
  body: Joi.object({
    decisionIds: Joi.array().items(uuidSchema).required().min(1),
    decision: Joi.string().valid('extend', 'cancel', 'send_anyway').required(),
  }),
};

/**
 * Update communication rule validation
 */
export const updateRuleSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string(),
    trigger: Joi.string(),
    delay_hours: Joi.number().integer().min(0),
    message_template: Joi.string(),
    channel: Joi.string().valid('SMS', 'EMAIL', 'PUSH'),
    enabled: Joi.boolean(),
  }).min(1),
};

/**
 * Get patient scheduled comms validation
 */
export const getPatientCommsSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Cancel scheduled message validation
 */
export const cancelMessageSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Send approved messages validation
 */
export const sendMessagesSchema = {
  body: Joi.object({
    messageIds: Joi.array().items(uuidSchema).required().min(1),
  }),
};

/**
 * Import appointments validation
 */
export const importAppointmentsSchema = {
  body: Joi.object({
    appointments: Joi.array().items(Joi.object()).required().min(1),
    source: Joi.string().required(),
  }),
};
