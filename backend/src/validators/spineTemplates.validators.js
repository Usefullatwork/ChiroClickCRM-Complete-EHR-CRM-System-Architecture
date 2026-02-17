/**
 * Spine Templates Validation Schemas
 */

import Joi from 'joi';

/**
 * Get all templates validation (query filters)
 */
export const getAllTemplatesSchema = {
  query: Joi.object({
    segment: Joi.string(),
    direction: Joi.string(),
    finding_type: Joi.string(),
    language: Joi.string().valid('NO', 'EN').default('NO'),
  }),
};

/**
 * Get template by segment and direction
 */
export const getBySegmentDirectionSchema = {
  params: Joi.object({
    segment: Joi.string().required(),
    direction: Joi.string().required(),
  }),
};

/**
 * Create template validation
 */
export const createTemplateSchema = {
  body: Joi.object({
    segment: Joi.string().required(),
    direction: Joi.string().required(),
    finding_type: Joi.string(),
    text_template: Joi.string().required(),
    language: Joi.string().valid('NO', 'EN').default('NO'),
    sort_order: Joi.number().integer(),
  }),
};

/**
 * Bulk update templates validation
 */
export const bulkUpdateTemplatesSchema = {
  body: Joi.object({
    templates: Joi.array()
      .items(
        Joi.object({
          segment: Joi.string().required(),
          direction: Joi.string().required(),
          finding_type: Joi.string(),
          text_template: Joi.string().required(),
          language: Joi.string().valid('NO', 'EN'),
          sort_order: Joi.number().integer(),
        })
      )
      .required(),
  }),
};

/**
 * Update template validation
 */
export const updateTemplateSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    text_template: Joi.string(),
    finding_type: Joi.string(),
    sort_order: Joi.number().integer(),
  }).min(1),
};

/**
 * Delete template validation
 */
export const deleteTemplateSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};
