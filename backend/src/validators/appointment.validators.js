/**
 * Appointment Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateSchema = Joi.date().iso();

/**
 * List appointments validation
 */
export const listAppointmentsSchema = {
  query: Joi.object({
    date: dateSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    status: Joi.string(),
    practitioner_id: uuidSchema,
    practitionerId: uuidSchema,
    patient_id: uuidSchema,
    patientId: uuidSchema,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

// Alias
export const getAppointmentsSchema = listAppointmentsSchema;

/**
 * Create appointment validation
 */
export const createAppointmentSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    practitioner_id: uuidSchema,
    start_time: Joi.string().required(),
    end_time: Joi.string().required(),
    appointment_type: Joi.string(),
    status: Joi.string(),
    notes: Joi.string().allow('', null),
    patient_notes: Joi.string().allow('', null),
    internal_notes: Joi.string().allow('', null),
    recurring_pattern: Joi.string().allow(null),
    recurring_end_date: dateSchema.allow(null),
  }),
};

/**
 * Get appointment by ID validation
 */
export const getAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Update appointment validation
 */
export const updateAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    patient_id: uuidSchema,
    practitioner_id: uuidSchema,
    start_time: Joi.string(),
    end_time: Joi.string(),
    appointment_type: Joi.string(),
    status: Joi.string(),
    notes: Joi.string().allow('', null),
    patient_notes: Joi.string().allow('', null),
    internal_notes: Joi.string().allow('', null),
    recurring_pattern: Joi.string().allow(null),
    recurring_end_date: dateSchema.allow(null),
  }).min(1),
};

/**
 * Update appointment status validation
 */
export const updateStatusSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    status: Joi.string().required(),
  }),
};

/**
 * Cancel appointment validation
 */
export const cancelAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    reason: Joi.string().allow('', null),
    cancellation_reason: Joi.string().allow('', null),
    cancelled_by: uuidSchema,
  }),
};

/**
 * Confirm appointment validation
 */
export const confirmAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    confirmation_method: Joi.string().valid('SMS', 'EMAIL', 'PHONE'),
  }),
};
