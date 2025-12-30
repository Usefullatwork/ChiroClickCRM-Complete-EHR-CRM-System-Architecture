/**
 * Treatment Codes Validators
 * Validation schemas for Norwegian Takster (treatment codes) endpoints
 */

import Joi from 'joi';

/**
 * Search treatment codes
 * GET /api/v1/treatments/search
 */
export const searchTreatmentCodesSchema = {
  query: Joi.object({
    searchTerm: Joi.string().min(1).max(100).allow(''),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

/**
 * Get treatment statistics
 * GET /api/v1/treatments/statistics
 */
export const getTreatmentStatisticsSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow(null, ''),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null, ''),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

/**
 * Calculate treatment price
 * POST /api/v1/treatments/calculate-price
 */
export const calculatePriceSchema = {
  body: Joi.object({
    treatmentCodes: Joi.array()
      .items(Joi.string().min(1).max(10))
      .min(1)
      .max(20)
      .required()
      .messages({
        'array.min': 'At least one treatment code is required',
        'array.max': 'Maximum 20 treatment codes allowed per calculation'
      })
  })
};

/**
 * Get treatment code by code
 * GET /api/v1/treatments/:code
 */
export const getTreatmentCodeSchema = {
  params: Joi.object({
    code: Joi.string().min(1).max(10).required()
  })
};

export default {
  searchTreatmentCodesSchema,
  getTreatmentStatisticsSchema,
  calculatePriceSchema,
  getTreatmentCodeSchema
};
