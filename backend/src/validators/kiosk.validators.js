/**
 * Kiosk Validation Schemas
 */

import Joi from 'joi';

export const checkInSchema = {
  body: Joi.object({
    patientId: Joi.string().uuid().required(),
    appointmentId: Joi.string().uuid(),
  }),
};

export const getIntakeFormSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    encounterType: Joi.string().max(50),
  }),
};

export const submitIntakeFormSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  body: Joi.object().unknown(true),
};

export const submitConsentSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    consentType: Joi.string().max(100).required(),
    signature: Joi.string().required(),
  }),
};

export const getQueueSchema = {
  query: Joi.object({
    practitionerId: Joi.string().uuid(),
  }),
};
