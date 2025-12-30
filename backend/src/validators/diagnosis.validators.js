/**
 * Diagnosis Codes Validators
 * Validation schemas for ICPC-2 and ICD-10 diagnosis code endpoints
 */

import Joi from 'joi';

/**
 * Search diagnosis codes
 * GET /api/v1/diagnosis/search
 */
export const searchDiagnosisCodesSchema = {
  query: Joi.object({
    searchTerm: Joi.string().min(1).max(100).allow(''),
    system: Joi.string().valid('ICPC2', 'ICD10').allow(null),
    chapter: Joi.string().length(1).uppercase().allow(null),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

/**
 * Get common diagnosis codes
 * GET /api/v1/diagnosis/common
 */
export const getCommonDiagnosisCodesSchema = {
  query: Joi.object({
    system: Joi.string().valid('ICPC2', 'ICD10').allow(null, '')
  })
};

/**
 * Get diagnosis statistics
 * GET /api/v1/diagnosis/statistics
 */
export const getDiagnosisStatisticsSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow(null, ''),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null, ''),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

/**
 * Get diagnosis code by code
 * GET /api/v1/diagnosis/:code
 */
export const getDiagnosisCodeSchema = {
  params: Joi.object({
    code: Joi.string().min(1).max(10).required()
  })
};

export default {
  searchDiagnosisCodesSchema,
  getCommonDiagnosisCodesSchema,
  getDiagnosisStatisticsSchema,
  getDiagnosisCodeSchema
};
