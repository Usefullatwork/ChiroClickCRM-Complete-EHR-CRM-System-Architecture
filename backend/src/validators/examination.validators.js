/**
 * Examination Validation Schemas
 */

import Joi from 'joi';

export const searchProtocolsSchema = {
  query: Joi.object({
    q: Joi.string().max(200),
    bodyRegion: Joi.string().max(50),
    category: Joi.string().max(50),
  }),
};

export const getProtocolsByRegionSchema = {
  params: Joi.object({
    region: Joi.string().max(50).required(),
  }),
};

export const getProtocolsByCategorySchema = {
  params: Joi.object({
    category: Joi.string().max(50).required(),
  }),
};

export const getProtocolByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getFindingsByEncounterSchema = {
  params: Joi.object({
    encounterId: Joi.string().uuid().required(),
  }),
};

export const getFindingByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const createFindingSchema = {
  body: Joi.object({
    encounterId: Joi.string().uuid().required(),
    protocolId: Joi.string().uuid(),
    testName: Joi.string().max(255).required(),
    bodyRegion: Joi.string().max(50),
    side: Joi.string().valid('left', 'right', 'bilateral', 'midline'),
    result: Joi.string().max(50).required(),
    value: Joi.alternatives().try(Joi.string(), Joi.number()),
    unit: Joi.string().max(20),
    notes: Joi.string().max(2000),
    isRedFlag: Joi.boolean().default(false),
  }),
};

export const updateFindingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    result: Joi.string().max(50),
    value: Joi.alternatives().try(Joi.string(), Joi.number()),
    unit: Joi.string().max(20),
    notes: Joi.string().max(2000),
    isRedFlag: Joi.boolean(),
  }).min(1),
};

export const deleteFindingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const createBatchFindingsSchema = {
  body: Joi.object({
    encounterId: Joi.string().uuid().required(),
    findings: Joi.array()
      .items(
        Joi.object({
          protocolId: Joi.string().uuid(),
          testName: Joi.string().max(255).required(),
          bodyRegion: Joi.string().max(50),
          side: Joi.string().valid('left', 'right', 'bilateral', 'midline'),
          result: Joi.string().max(50).required(),
          value: Joi.alternatives().try(Joi.string(), Joi.number()),
          unit: Joi.string().max(20),
          notes: Joi.string().max(2000),
          isRedFlag: Joi.boolean().default(false),
        })
      )
      .min(1)
      .required(),
  }),
};

export const getSummarySchema = {
  params: Joi.object({
    encounterId: Joi.string().uuid().required(),
  }),
};

export const getRedFlagsSchema = {
  params: Joi.object({
    encounterId: Joi.string().uuid().required(),
  }),
};

export const getTemplateSetByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getTemplateSetsByComplaintSchema = {
  params: Joi.object({
    complaint: Joi.string().max(100).required(),
  }),
};

export const createTemplateSetSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    complaint: Joi.string().max(100),
    description: Joi.string().max(1000),
    protocols: Joi.array()
      .items(
        Joi.object({
          protocolId: Joi.string().uuid().required(),
          order: Joi.number().integer().min(0),
        })
      )
      .min(1)
      .required(),
  }),
};

export const incrementUsageSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};
