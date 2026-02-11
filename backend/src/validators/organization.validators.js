/**
 * Organization Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Get organization by ID validation
 */
export const getOrganizationSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create organization validation
 */
export const createOrganizationSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    org_number: Joi.string().max(20),
    address: Joi.string().max(500),
    postal_code: Joi.string().max(10),
    city: Joi.string().max(100),
    phone: Joi.string().max(20),
    email: Joi.string().email().max(255),
    website: Joi.string().max(500).allow('', null),
    logo_url: Joi.string().max(500).allow('', null),
    bank_account: Joi.string().max(30),
    settings: Joi.object(),
  }),
};

/**
 * Update organization validation
 */
export const updateOrganizationSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    org_number: Joi.string().max(20),
    address: Joi.string().max(500),
    postal_code: Joi.string().max(10),
    city: Joi.string().max(100),
    phone: Joi.string().max(20),
    email: Joi.string().email().max(255),
    website: Joi.string().max(500).allow('', null),
    logo_url: Joi.string().max(500).allow('', null),
    bank_account: Joi.string().max(30),
    settings: Joi.object(),
  }).min(1),
};

/**
 * Update current organization validation
 */
export const updateCurrentOrganizationSchema = {
  body: Joi.object({
    name: Joi.string().max(200),
    org_number: Joi.string().max(20),
    address: Joi.string().max(500),
    postal_code: Joi.string().max(10),
    city: Joi.string().max(100),
    phone: Joi.string().max(20),
    email: Joi.string().email().max(255),
    website: Joi.string().max(500).allow('', null),
    logo_url: Joi.string().max(500).allow('', null),
    bank_account: Joi.string().max(30),
    settings: Joi.object(),
  }).min(1),
};

/**
 * Invite user validation
 */
export const inviteUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required().max(255),
    role: Joi.string().valid('ADMIN', 'PRACTITIONER', 'ASSISTANT').required(),
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
  }),
};

/**
 * Update organization settings validation
 */
export const updateOrganizationSettingsSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object().min(1),
};
