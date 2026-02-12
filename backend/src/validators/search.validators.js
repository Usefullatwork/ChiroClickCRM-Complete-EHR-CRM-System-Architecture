/**
 * Search Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Search patients validation
 */
export const searchPatientsSchema = {
  query: Joi.object({
    q: Joi.string().required().min(2).max(200),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    status: Joi.string(),
    includeInactive: Joi.string().valid('true', 'false'),
  }),
};

/**
 * Search diagnosis validation
 */
export const searchDiagnosisSchema = {
  query: Joi.object({
    q: Joi.string().required().min(1).max(200),
    limit: Joi.number().integer().min(1).max(100).default(30),
    system: Joi.string().valid('ICPC-2', 'ICD-10', 'icpc-2', 'icd-10'),
  }),
};

/**
 * Search encounters validation
 */
export const searchEncountersSchema = {
  query: Joi.object({
    q: Joi.string().required().min(2).max(200),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    patientId: uuidSchema,
    practitionerId: uuidSchema,
  }),
};

/**
 * Global search validation
 */
export const globalSearchSchema = {
  query: Joi.object({
    q: Joi.string().required().min(2).max(200),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

/**
 * Suggest completions validation
 */
export const suggestSchema = {
  query: Joi.object({
    q: Joi.string().min(2).max(200),
    limit: Joi.number().integer().min(1).max(20).default(5),
    entity: Joi.string().valid('patient', 'diagnosis', 'encounter').default('patient'),
  }),
};
