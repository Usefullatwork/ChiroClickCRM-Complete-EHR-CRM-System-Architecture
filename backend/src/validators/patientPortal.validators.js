/**
 * Patient Portal Validation Schemas
 */

import Joi from 'joi';

export const pinAuthSchema = {
  body: Joi.object({
    pin: Joi.string()
      .pattern(/^\d{4,6}$/)
      .required()
      .messages({ 'string.pattern.base': 'PIN must be 4-6 digits' }),
    patientId: Joi.string().uuid(),
    dateOfBirth: Joi.date().iso(),
  }).or('patientId', 'dateOfBirth'),
};

export const logComplianceSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    completed: Joi.boolean().default(true),
    pain_level: Joi.number().integer().min(0).max(10),
    difficulty_rating: Joi.number().integer().min(1).max(5),
    notes: Joi.string().max(1000),
  }),
};

export const bookingRequestSchema = {
  body: Joi.object({
    preferredDate: Joi.date().iso().required(),
    preferredTime: Joi.string().max(20).allow('', null),
    reason: Joi.string().max(1000).allow('', null),
  }),
};

export const rescheduleSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    preferredDate: Joi.date().iso().required(),
    preferredTime: Joi.string().max(20).allow('', null),
    reason: Joi.string().max(1000).allow('', null),
  }),
};

export const cancelAppointmentSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({ reason: Joi.string().max(500).allow('', null) }),
};

export const messageSchema = {
  body: Joi.object({
    subject: Joi.string().max(255).allow('', null),
    body: Joi.string().max(5000).required(),
    parent_message_id: Joi.string().uuid().allow(null),
  }),
};

export const handleBookingSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    appointment_date: Joi.date().iso().when('action', { is: 'approve', then: Joi.required() }),
    appointment_time: Joi.string().when('action', { is: 'approve', then: Joi.required() }),
    duration: Joi.number().integer().min(5).max(120).default(30),
    visit_type: Joi.string().max(50).default('consultation'),
  }),
};
