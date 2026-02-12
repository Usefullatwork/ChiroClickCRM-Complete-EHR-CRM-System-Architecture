/**
 * Training Validation Schemas
 */

import Joi from 'joi';

/**
 * Add training examples validation
 */
export const addExamplesSchema = {
  body: Joi.object({
    examples: Joi.array().items(Joi.object()).required().min(1),
    model: Joi.string(),
    source: Joi.string(),
  }),
};

/**
 * Test model validation
 */
export const testModelSchema = {
  params: Joi.object({
    model: Joi.string().required(),
  }),
  query: Joi.object({
    prompt: Joi.string().max(5000),
  }),
};

/**
 * Parse journal entry validation
 */
export const parseJournalEntrySchema = {
  body: Joi.object({
    text: Joi.string().required(),
    practitioner: Joi.string(),
    date: Joi.date().iso(),
  }),
};

/**
 * Detect practitioner style validation
 */
export const detectStyleSchema = {
  body: Joi.object({
    text: Joi.string().required().max(50000),
  }),
};

/**
 * Combined journals validation
 */
export const combinedJournalsSchema = {
  body: Joi.object({
    text: Joi.string(),
    file: Joi.string(),
    practitioner: Joi.string(),
    auto_detect: Joi.boolean(),
  }),
};

/**
 * Analytics date range query validation
 */
export const analyticsQuerySchema = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    period: Joi.string(),
    model: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};
