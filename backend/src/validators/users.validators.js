/**
 * Users Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Get user by ID validation
 */
export const getUserSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * List users validation
 */
export const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string(),
    role: Joi.string().valid('ADMIN', 'PRACTITIONER', 'ASSISTANT'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  }),
};

/**
 * Update current user profile validation
 */
export const updateCurrentUserSchema = {
  body: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    phone: Joi.string().max(20),
    preferred_language: Joi.string().valid('no', 'en'),
    preferences: Joi.object(),
  }).min(1),
};

/**
 * Create user validation
 */
export const createUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    first_name: Joi.string().required().max(100),
    last_name: Joi.string().required().max(100),
    role: Joi.string().valid('ADMIN', 'PRACTITIONER', 'ASSISTANT').required(),
    phone: Joi.string().max(20),
    password: Joi.string().min(6),
    preferred_language: Joi.string().valid('no', 'en'),
  }),
};

/**
 * Update user validation
 */
export const updateUserSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('ADMIN', 'PRACTITIONER', 'ASSISTANT'),
    phone: Joi.string().max(20),
    preferred_language: Joi.string().valid('no', 'en'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  }).min(1),
};

/**
 * Update user preferences validation
 */
export const updateUserPreferencesSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object().min(1),
};

/**
 * Deactivate/reactivate user validation
 */
export const userActionSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Get user stats validation
 */
export const getUserStatsSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};
