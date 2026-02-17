/**
 * Bulk Communication Validation Schemas
 */

import Joi from 'joi';

export const queueBulkSendSchema = {
  body: Joi.object({
    templateId: Joi.string().uuid(),
    channel: Joi.string().valid('SMS', 'EMAIL').required(),
    patientIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    subject: Joi.string().max(255),
    content: Joi.string().max(5000).required(),
    scheduledAt: Joi.date().iso(),
    variables: Joi.object(),
  }),
};

export const getBatchStatusSchema = {
  params: Joi.object({
    batchId: Joi.string().uuid().required(),
  }),
};

export const cancelBatchSchema = {
  params: Joi.object({
    batchId: Joi.string().uuid().required(),
  }),
};

export const getBatchesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'failed'),
  }),
};

export const previewMessageSchema = {
  body: Joi.object({
    templateId: Joi.string().uuid(),
    content: Joi.string().max(5000).required(),
    patientId: Joi.string().uuid(),
    variables: Joi.object(),
  }),
};

export const getPatientsSchema = {
  query: Joi.object({
    search: Joi.string().max(200),
    status: Joi.string().max(50),
    category: Joi.string().max(50),
    limit: Joi.number().integer().min(1).max(500).default(50),
  }),
};
