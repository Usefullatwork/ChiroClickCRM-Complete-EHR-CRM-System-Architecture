/**
 * Clinical Notes Validation Schemas
 */

import Joi from 'joi';

export const listNotesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    patientId: Joi.string().uuid(),
    practitionerId: Joi.string().uuid(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    noteType: Joi.string().max(50),
    templateType: Joi.string().max(50),
    status: Joi.string().max(50),
    isDraft: Joi.string().valid('true', 'false'),
    search: Joi.string().max(200),
  }),
};

export const getTemplatesSchema = {
  query: Joi.object({
    templateType: Joi.string().max(50),
    category: Joi.string().max(50),
    activeOnly: Joi.string().valid('true', 'false'),
  }),
};

export const searchNotesSchema = {
  query: Joi.object({
    q: Joi.string().min(1).max(200).required(),
    patientId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

export const getPatientNotesSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100),
    includeDrafts: Joi.string().valid('true', 'false'),
  }),
};

export const getNoteByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const createNoteSchema = {
  body: Joi.object({
    patientId: Joi.string().uuid().required(),
    encounterId: Joi.string().uuid(),
    noteType: Joi.string().max(50),
    templateType: Joi.string().max(50),
    encounterType: Joi.string().max(50),
    subjective: Joi.object(),
    objective: Joi.object(),
    assessment: Joi.object(),
    plan: Joi.object(),
    isDraft: Joi.boolean().default(true),
    noteDate: Joi.date().iso(),
  }),
};

export const updateNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    subjective: Joi.object(),
    objective: Joi.object(),
    assessment: Joi.object(),
    plan: Joi.object(),
    isDraft: Joi.boolean(),
    noteType: Joi.string().max(50),
  }).min(1),
};

export const validateNoteSchema = {
  body: Joi.object({
    encounterType: Joi.string().max(50),
    subjective: Joi.object(),
    objective: Joi.object(),
    assessment: Joi.object(),
    plan: Joi.object(),
  }),
};

export const autosaveNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    subjective: Joi.object(),
    objective: Joi.object(),
    assessment: Joi.object(),
    plan: Joi.object(),
  }),
};

export const signNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const generateNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const amendNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    text: Joi.string().min(1).max(5000).required(),
    reason: Joi.string().max(500),
  }),
};

export const deleteNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};
