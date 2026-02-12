/**
 * Macro Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Search macros validation
 */
export const searchMacrosSchema = {
  query: Joi.object({
    q: Joi.string().max(200),
    category: Joi.string(),
    field: Joi.string(),
  }),
};

/**
 * Create macro validation
 */
export const createMacroSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    content: Joi.string().required(),
    category: Joi.string().required(),
    shortcut: Joi.string().max(50),
    field: Joi.string(),
    variables: Joi.array().items(Joi.object()),
    is_active: Joi.boolean(),
    sort_order: Joi.number().integer(),
  }),
};

/**
 * Macro ID param validation
 */
export const macroIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Expand macro validation
 */
export const expandMacroSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    variables: Joi.object(),
    context: Joi.object(),
  }),
};
