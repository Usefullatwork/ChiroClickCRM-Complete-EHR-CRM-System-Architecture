/**
 * Patient Validation Schemas
 * Includes Norwegian fødselsnummer validation with DOB cross-check
 * and configurable phone validation modes
 */

import Joi from 'joi';
import { validatePhoneNumber, validatePhoneWithOptions } from '../utils/phoneValidation.js';
import { validateFodselsnummer, validateFodselsnummerWithDOB } from '../utils/encryption.js';

// UUID validation pattern
const uuidSchema = Joi.string().uuid();

// Date validation (YYYY-MM-DD format)
const dateSchema = Joi.date().iso();

// Phone validation mode from environment
const PHONE_VALIDATION_MODE = process.env.PHONE_VALIDATION_MODE || 'strict';

/**
 * Custom phone number validation
 * Validates phone numbers with country code support
 * Norwegian (+47, 8 digits) is the default
 * Supports validation modes: 'strict', 'lenient', 'format-only'
 */
const phoneSchema = Joi.string().max(20).custom((value, helpers) => {
  if (!value) return value; // Allow empty/null

  const result = validatePhoneWithOptions(value, { mode: PHONE_VALIDATION_MODE });

  if (!result.valid) {
    return helpers.error('phone.invalid', { message: result.error });
  }

  // Return the formatted E.164 number for storage
  return result.fullNumber;
}, 'Phone number validation').messages({
  'phone.invalid': '{{#message}}'
});

/**
 * Custom fødselsnummer validation (11 digits with Modulus 11 checksum)
 */
const fodselsnummerSchema = Joi.string().length(11).custom((value, helpers) => {
  if (!value) return value;

  // Remove spaces/dashes
  const cleaned = value.replace(/[\s-]/g, '');

  if (!validateFodselsnummer(cleaned)) {
    return helpers.error('fnr.invalid');
  }

  return cleaned;
}, 'Fødselsnummer validation').messages({
  'fnr.invalid': 'Invalid fødselsnummer (must be 11 digits with valid checksum)'
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
 * Supports search by: name, phone, date of birth, date range
 */
export const searchPatientsSchema = {
  query: Joi.object({
    // General search (searches name, phone, email)
    q: Joi.string().min(1).max(200),

    // Specific field searches
    name: Joi.string().min(1).max(200), // Search by first_name or last_name
    phone: Joi.string().min(3).max(20), // Search by phone (partial match)
    email: Joi.string().min(3).max(255), // Search by email (partial match)

    // Date of birth search
    date_of_birth: dateSchema, // Exact date of birth
    dob_from: dateSchema, // DOB range start
    dob_to: dateSchema, // DOB range end

    // Visit date search
    last_visit_from: dateSchema, // Last visit after this date
    last_visit_to: dateSchema, // Last visit before this date
    first_visit_from: dateSchema, // First visit after this date
    first_visit_to: dateSchema, // First visit before this date

    // Created/updated date search
    created_from: dateSchema, // Created after this date
    created_to: dateSchema, // Created before this date

    // Status and category filters
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'),
    category: Joi.string().valid('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'),

    // Therapist filter
    preferred_therapist_id: uuidSchema,

    // Follow-up filter
    needs_followup: Joi.boolean(), // Patients needing follow-up
    followup_before: dateSchema, // Follow-up due before this date

    // Sorting
    sort_by: Joi.string().valid('name', 'date_of_birth', 'last_visit', 'created_at', 'first_name', 'last_name').default('last_name'),
    sort_order: Joi.string().valid('asc', 'desc').default('asc'),

    // Pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

/**
 * Cross-validate fødselsnummer with date of birth
 * Use after basic Joi validation to perform identity cross-check
 * @param {object} patientData - Patient data with fodselsnummer and date_of_birth
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export const crossValidatePatientIdentity = (patientData) => {
  const errors = [];
  const warnings = [];

  const { fodselsnummer, personal_number, date_of_birth, gender } = patientData;
  const fnr = fodselsnummer || personal_number;

  // If no fødselsnummer, skip cross-validation
  if (!fnr) {
    return { valid: true, errors, warnings };
  }

  // Validate fødselsnummer format
  if (!validateFodselsnummer(fnr)) {
    errors.push('Invalid fødselsnummer format or checksum');
    return { valid: false, errors, warnings };
  }

  // Cross-validate with DOB if provided
  if (date_of_birth) {
    const dobResult = validateFodselsnummerWithDOB(fnr, date_of_birth);
    if (!dobResult.valid) {
      errors.push(dobResult.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
