/**
 * AI Feedback Validation Schemas
 */

import Joi from 'joi';

export const submitFeedbackSchema = {
  body: Joi.object({
    suggestionId: Joi.string().uuid(),
    suggestionType: Joi.string().max(50).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    accepted: Joi.boolean(),
    correctedText: Joi.string().max(10000),
    comments: Joi.string().max(2000),
    contextData: Joi.object(),
  }),
};

export const getMyFeedbackSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    suggestionType: Joi.string().max(50),
  }),
};

export const getPerformanceSchema = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    modelName: Joi.string().max(100),
  }),
};

export const getSuggestionsReviewSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    suggestionType: Joi.string().max(50),
  }),
};

export const rollbackModelSchema = {
  params: Joi.object({
    versionId: Joi.string().required(),
  }),
};

export const exportFeedbackSchema = {
  query: Joi.object({
    format: Joi.string().valid('json', 'csv', 'jsonl').default('json'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    minRating: Joi.number().integer().min(1).max(5),
  }),
};
