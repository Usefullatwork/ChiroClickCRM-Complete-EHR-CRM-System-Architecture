/**
 * Old Notes Validation Schemas
 */

import Joi from 'joi';

export const patientIdParamSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
};

export const noteIdParamSchema = {
  params: Joi.object({
    noteId: Joi.string().uuid().required(),
  }),
};

export const itemIdParamSchema = {
  params: Joi.object({
    itemId: Joi.string().uuid().required(),
  }),
};

export const batchIdParamSchema = {
  params: Joi.object({
    batchId: Joi.string().uuid().required(),
  }),
};

export const updateSoapDataSchema = {
  params: Joi.object({
    noteId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    subjective: Joi.object(),
    objective: Joi.object(),
    assessment: Joi.object(),
    plan: Joi.object(),
  }).min(1),
};

export const reviewNoteSchema = {
  params: Joi.object({
    noteId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('approved', 'rejected', 'needs_review').required(),
    reviewNotes: Joi.string().max(2000),
  }),
};

export const updateItemStatusSchema = {
  params: Joi.object({
    itemId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    status: Joi.string().required(),
  }),
};

export const assignItemSchema = {
  params: Joi.object({
    itemId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    assigneeId: Joi.string().uuid().required(),
  }),
};
