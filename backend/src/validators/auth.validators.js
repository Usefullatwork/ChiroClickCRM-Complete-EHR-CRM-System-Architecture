/**
 * Auth Validation Schemas
 */

import Joi from 'joi';

export const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    organizationId: Joi.string().uuid().required(),
    role: Joi.string().valid('ADMIN', 'PRACTITIONER', 'ASSISTANT'),
    hprNumber: Joi.string().max(20),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};

export const verifyEmailSchema = {
  body: Joi.object({
    token: Joi.string().required(),
  }),
};

export const confirmPasswordSchema = {
  body: Joi.object({
    password: Joi.string().required(),
  }),
};
