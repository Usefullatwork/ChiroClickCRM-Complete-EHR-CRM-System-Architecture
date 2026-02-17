/**
 * AI Retraining Validation Schemas
 */

import Joi from 'joi';

export const triggerRetrainingSchema = {
  body: Joi.object({
    dryRun: Joi.boolean().default(false),
    options: Joi.object({
      modelName: Joi.string().max(100),
      epochs: Joi.number().integer().min(1).max(100),
      learningRate: Joi.number().min(0).max(1),
      batchSize: Joi.number().integer().min(1).max(256),
    }),
  }),
};

export const getHistorySchema = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

export const exportFeedbackSchema = {
  body: Joi.object({
    minRating: Joi.number().integer().min(1).max(5),
    days: Joi.number().integer().min(1).max(365),
    includeRejected: Joi.boolean().default(false),
  }),
};

export const rollbackModelSchema = {
  body: Joi.object({
    targetVersion: Joi.string().required(),
  }),
};

export const testModelSchema = {
  body: Joi.object({
    modelName: Joi.string().max(100),
  }),
};

export const generatePairsSchema = {
  body: Joi.object({
    suggestions: Joi.array().items(Joi.object()).min(1).required(),
    suggestionType: Joi.string().max(50).required(),
    maxPairs: Joi.number().integer().min(1).max(1000).default(50),
  }),
};

export const evaluateSuggestionSchema = {
  body: Joi.object({
    suggestion: Joi.string().required(),
    suggestionType: Joi.string().max(50).required(),
    contextData: Joi.object(),
  }),
};

export const augmentDataSchema = {
  body: Joi.object({
    baseExamples: Joi.array().items(Joi.object()).min(1).required(),
    targetCount: Joi.number().integer().min(1).max(10000).required(),
    suggestionType: Joi.string().max(50).required(),
  }),
};

export const triggerJobSchema = {
  body: Joi.object({
    jobName: Joi.string().required(),
  }),
};
