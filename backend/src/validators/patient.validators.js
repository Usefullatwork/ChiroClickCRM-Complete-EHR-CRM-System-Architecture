/**
 * Patient Validation Schemas
 */

import Joi from 'joi';
import { validatePhoneNumber } from '../utils/phoneValidation.js';

// UUID validation pattern
const uuidSchema = Joi.string().uuid();

// Date validation (YYYY-MM-DD format)
const dateSchema = Joi.date().iso();

/**
 * Custom phone number validation
 * Validates phone numbers with country code support
 * Norwegian (+47, 8 digits) is the default
 */
const phoneSchema = Joi.string().max(20).custom((value, helpers) => {
  if (!value) return value; // Allow empty/null

  const result = validatePhoneNumber(value);

  if (!result.valid) {
    return helpers.error('phone.invalid', { message: result.error });
  }

  // Return the formatted E.164 number for storage
  return result.fullNumber;
}, 'Phone number validation').messages({
  'phone.invalid': '{{#message}}'
});

/**
 * Create patient validation
 */
export const createPatientSchema = {
  body: Joi.object({
    solvit_id: Joi.string().required().max(50),
    encrypted_personal_number: Joi.string().max(255),
    first_name: Joi.string().required().max(100),
    last_name: Joi.string().required().max(100),
    date_of_birth: dateSchema.required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    email: Joi.string().email().max(255),
    phone: phoneSchema, // Validates Norwegian 8-digit or international format
    address: Joi.object(),
    emergency_contact: Joi.object({
      name: Joi.string().max(200),
      phone: phoneSchema, // Also validate emergency contact phone
      relationship: Joi.string().max(100)
    }),
    red_flags: Joi.array().items(Joi.string()),
    contraindications: Joi.array().items(Joi.string()),
    allergies: Joi.array().items(Joi.string()),
    current_medications: Joi.array().items(Joi.string()),
    medical_history: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED').default('ACTIVE'),
    category: Joi.string().valid('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'),
    referral_source: Joi.string().max(100),
    referring_doctor: Joi.string().max(255),
    insurance_type: Joi.string().max(50),
    insurance_number: Joi.string().max(50),
    has_nav_rights: Joi.boolean().default(false),
    consent_sms: Joi.boolean().default(false),
    consent_email: Joi.boolean().default(false),
    consent_data_storage: Joi.boolean().default(true),
    consent_marketing: Joi.boolean().default(false),
    preferred_contact_method: Joi.string().valid('SMS', 'EMAIL', 'PHONE'),
    preferred_therapist_id: uuidSchema,
    internal_notes: Joi.string()
  })
};

/**
 * Update patient validation
 */
export const updatePatientSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    date_of_birth: dateSchema,
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    email: Joi.string().email().max(255),
    phone: phoneSchema, // Validates Norwegian 8-digit or international format
    address: Joi.object(),
    emergency_contact: Joi.object({
      name: Joi.string().max(200),
      phone: phoneSchema,
      relationship: Joi.string().max(100)
    }),
    red_flags: Joi.array().items(Joi.string()),
    contraindications: Joi.array().items(Joi.string()),
    allergies: Joi.array().items(Joi.string()),
    current_medications: Joi.array().items(Joi.string()),
    medical_history: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'),
    category: Joi.string().valid('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'),
    referral_source: Joi.string().max(100),
    referring_doctor: Joi.string().max(255),
    insurance_type: Joi.string().max(50),
    insurance_number: Joi.string().max(50),
    has_nav_rights: Joi.boolean(),
    consent_sms: Joi.boolean(),
    consent_email: Joi.boolean(),
    consent_data_storage: Joi.boolean(),
    consent_marketing: Joi.boolean(),
    preferred_contact_method: Joi.string().valid('SMS', 'EMAIL', 'PHONE'),
    preferred_therapist_id: uuidSchema,
    should_be_followed_up: dateSchema,
    main_problem: Joi.string(),
    needs_feedback: Joi.boolean(),
    internal_notes: Joi.string()
  }).min(1) // At least one field must be present
};

/**
 * Get patient by ID validation
 */
export const getPatientSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  })
};

/**
 * Delete patient validation
 */
export const deletePatientSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  })
};

/**
 * Search patients validation
 */
export const searchPatientsSchema = {
  query: Joi.object({
    q: Joi.string().min(1).max(200),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'),
    category: Joi.string().valid('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};
