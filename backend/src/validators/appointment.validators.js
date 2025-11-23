/**
 * Appointment Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateTimeSchema = Joi.date().iso();

/**
 * Create appointment validation
 */
export const createAppointmentSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    practitioner_id: uuidSchema.required(),
    start_time: dateTimeSchema.required(),
    end_time: dateTimeSchema.required().greater(Joi.ref('start_time')),
    appointment_type: Joi.string()
      .valid('INITIAL', 'FOLLOWUP', 'MAINTENANCE', 'EMERGENCY')
      .required(),
    status: Joi.string()
      .valid('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED')
      .default('SCHEDULED'),
    recurring_pattern: Joi.string().valid('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'),
    recurring_end_date: Joi.date().iso().when('recurring_pattern', {
      is: Joi.exist(),
      then: Joi.required()
    }),
    internal_notes: Joi.string(),
    patient_notes: Joi.string()
  })
};

/**
 * Update appointment validation
 */
export const updateAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    start_time: dateTimeSchema,
    end_time: dateTimeSchema,
    appointment_type: Joi.string().valid('INITIAL', 'FOLLOWUP', 'MAINTENANCE', 'EMERGENCY'),
    status: Joi.string()
      .valid('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'),
    internal_notes: Joi.string(),
    patient_notes: Joi.string()
  }).min(1)
};

/**
 * Cancel appointment validation
 */
export const cancelAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    cancellation_reason: Joi.string().required(),
    cancelled_by: uuidSchema
  })
};

/**
 * Get appointments validation
 */
export const getAppointmentsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    patientId: uuidSchema,
    practitionerId: uuidSchema,
    status: Joi.string()
      .valid('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'),
    startDate: dateTimeSchema,
    endDate: dateTimeSchema
  })
};

/**
 * Confirm appointment validation
 */
export const confirmAppointmentSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    confirmation_method: Joi.string().valid('SMS', 'EMAIL', 'PHONE').required()
  })
};
