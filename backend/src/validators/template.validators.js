/**
 * Template Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Create template validation
 */
export const createTemplateSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    content: Joi.string().required(),
    type: Joi.string(),
    category: Joi.string(),
    language: Joi.string().valid('NO', 'EN', 'no', 'en').default('NO'),
    is_active: Joi.boolean(),
    metadata: Joi.object(),
  }),
};

/**
 * Update template validation
 */
export const updateTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    content: Joi.string(),
    type: Joi.string(),
    category: Joi.string(),
    language: Joi.string().valid('NO', 'EN', 'no', 'en'),
    is_active: Joi.boolean(),
    metadata: Joi.object(),
  }).min(1),
};

/**
 * Get template by ID validation
 */
export const getTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Search templates validation
 */
export const searchTemplatesSchema = {
  query: Joi.object({
    q: Joi.string().max(200),
    category: Joi.string(),
    type: Joi.string(),
    language: Joi.string(),
  }),
};

/**
 * Template by category validation
 */
export const templatesByCategorySchema = {
  query: Joi.object({
    category: Joi.string(),
    language: Joi.string(),
  }),
};

/**
 * Get templates for document type validation
 */
export const templatesForDocumentSchema = {
  params: Joi.object({
    type: Joi.string().required(),
  }),
};

/**
 * Create custom template set validation
 */
export const createCustomSetSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    document_type: Joi.string().required(),
    templates: Joi.array().items(Joi.object()),
  }),
};

/**
 * Expand abbreviations validation
 */
export const expandAbbreviationsSchema = {
  body: Joi.object({
    text: Joi.string().required().max(5000),
    context: Joi.string(),
  }),
};

/**
 * Abbreviate text validation
 */
export const abbreviateTextSchema = {
  body: Joi.object({
    text: Joi.string().required().max(5000),
  }),
};

/**
 * Favorite/unfavorite template validation
 */
export const favoriteTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Screen red flags validation
 */
export const screenRedFlagsSchema = {
  body: Joi.object({
    symptoms: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    region: Joi.string(),
    patient_age: Joi.number().integer(),
    context: Joi.object(),
  }),
};

/**
 * Terminology param validation
 */
export const terminologyParamSchema = {
  params: Joi.object({
    term: Joi.string().required(),
  }),
};

/**
 * Terms by category validation
 */
export const termsByCategorySchema = {
  params: Joi.object({
    category: Joi.string().required(),
  }),
};

/**
 * Test cluster by condition validation
 */
export const testClusterSchema = {
  params: Joi.object({
    condition: Joi.string().required(),
  }),
};

/**
 * Phrases by region validation
 */
export const phrasesByRegionSchema = {
  params: Joi.object({
    region: Joi.string().required(),
  }),
};

/**
 * Test by code validation
 */
export const testByCodeSchema = {
  params: Joi.object({
    code: Joi.string().required(),
  }),
};

/**
 * Template preferences favorite validation
 */
export const preferenceFavoriteSchema = {
  params: Joi.object({
    templateId: uuidSchema.required(),
  }),
};
