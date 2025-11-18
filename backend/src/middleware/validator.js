/**
 * Request Validation Middleware
 * Uses Joi for schema validation
 */

import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Validate request data against a Joi schema
 * @param {object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error', {
        path: req.path,
        errors
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// UUID validation
export const uuidSchema = Joi.string().uuid().required();

// Pagination
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('asc', 'desc').default('desc'),
  sortBy: Joi.string()
});

// Date range
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

// Norwegian phone number
export const norwegianPhoneSchema = Joi.string()
  .pattern(/^(\+47)?[0-9]{8}$/)
  .messages({
    'string.pattern.base': 'Phone number must be a valid Norwegian phone number'
  });

// Norwegian organization number
export const orgNumberSchema = Joi.string()
  .pattern(/^[0-9]{9}$/)
  .messages({
    'string.pattern.base': 'Organization number must be 9 digits'
  });

// Email
export const emailSchema = Joi.string().email().lowercase();

// Patient validation schemas
export const createPatientSchema = Joi.object({
  solvit_id: Joi.string().required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  date_of_birth: Joi.date().max('now').required(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
  email: emailSchema,
  phone: norwegianPhoneSchema,
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    postal_code: Joi.string(),
    country: Joi.string().default('Norway')
  }),
  red_flags: Joi.array().items(Joi.string()),
  contraindications: Joi.array().items(Joi.string()),
  allergies: Joi.array().items(Joi.string()),
  current_medications: Joi.array().items(Joi.string()),
  referral_source: Joi.string().max(100),
  category: Joi.string().valid('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED')
});

export const updatePatientSchema = createPatientSchema.fork(
  ['solvit_id', 'first_name', 'last_name', 'date_of_birth', 'gender'],
  (schema) => schema.optional()
);

// Clinical encounter validation
export const createEncounterSchema = Joi.object({
  patient_id: uuidSchema,
  encounter_date: Joi.date().iso().required(),
  encounter_type: Joi.string().valid('INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY').required(),
  duration_minutes: Joi.number().integer().min(5).max(180).default(30),
  subjective: Joi.object().default({}),
  objective: Joi.object().default({}),
  assessment: Joi.object().default({}),
  plan: Joi.object().default({}),
  icpc_codes: Joi.array().items(Joi.string()),
  icd10_codes: Joi.array().items(Joi.string()),
  treatments: Joi.array().items(Joi.object()),
  vas_pain_start: Joi.number().integer().min(0).max(10),
  vas_pain_end: Joi.number().integer().min(0).max(10)
});

// Appointment validation
export const createAppointmentSchema = Joi.object({
  patient_id: uuidSchema,
  practitioner_id: uuidSchema,
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
  appointment_type: Joi.string().max(50).required(),
  recurring_pattern: Joi.string().valid('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'),
  recurring_end_date: Joi.date().iso(),
  patient_notes: Joi.string().max(500)
});

// Communication validation
export const createCommunicationSchema = Joi.object({
  patient_id: uuidSchema,
  type: Joi.string().valid('SMS', 'EMAIL', 'PHONE', 'LETTER').required(),
  template_id: Joi.string().uuid(),
  subject: Joi.string().max(255),
  content: Joi.string().required(),
  recipient_phone: Joi.when('type', {
    is: 'SMS',
    then: norwegianPhoneSchema.required()
  }),
  recipient_email: Joi.when('type', {
    is: 'EMAIL',
    then: emailSchema.required()
  })
});

export default {
  validate,
  uuidSchema,
  paginationSchema,
  dateRangeSchema,
  norwegianPhoneSchema,
  orgNumberSchema,
  emailSchema,
  createPatientSchema,
  updatePatientSchema,
  createEncounterSchema,
  createAppointmentSchema,
  createCommunicationSchema
};
