/**
 * Communication Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Send SMS validation
 */
export const sendSMSSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    content: Joi.string().required().max(1600), // Max SMS length
    template_id: uuidSchema,
    send_immediately: Joi.boolean().default(true),
    scheduled_at: Joi.date().iso().when('send_immediately', {
      is: false,
      then: Joi.required(),
    }),
  }),
};

/**
 * Send email validation
 */
export const sendEmailSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    subject: Joi.string().required().max(255),
    content: Joi.string().required(),
    template_id: uuidSchema,
    send_immediately: Joi.boolean().default(true),
    scheduled_at: Joi.date().iso().when('send_immediately', {
      is: false,
      then: Joi.required(),
    }),
  }),
};

/**
 * Get communication history validation
 */
export const getCommunicationHistorySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    patientId: uuidSchema,
    type: Joi.string().valid('SMS', 'EMAIL', 'PHONE', 'LETTER', 'sms', 'email', 'phone', 'letter'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

/**
 * Create message template validation
 */
export const createTemplateSchema = {
  body: Joi.object({
    name: Joi.string().required().max(100),
    type: Joi.string().valid('SMS', 'EMAIL', 'LETTER').required(),
    category: Joi.string().valid('RECALL', 'BIRTHDAY', 'FOLLOW_UP', 'REMINDER', 'MARKETING'),
    language: Joi.string().valid('NO', 'EN').default('NO'),
    subject: Joi.string().max(255).when('type', {
      is: 'EMAIL',
      then: Joi.required(),
    }),
    body: Joi.string().required(),
    available_variables: Joi.array().items(Joi.string()),
    is_active: Joi.boolean().default(true),
    is_default: Joi.boolean().default(false),
  }),
};

/**
 * Update message template validation
 */
export const updateTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(100),
    category: Joi.string().valid('RECALL', 'BIRTHDAY', 'FOLLOW_UP', 'REMINDER', 'MARKETING'),
    subject: Joi.string().max(255),
    body: Joi.string(),
    available_variables: Joi.array().items(Joi.string()),
    is_active: Joi.boolean(),
    is_default: Joi.boolean(),
  }).min(1),
};
