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
