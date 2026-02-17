/**
 * Progress Tracking Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * Get patient progress stats validation
 */
export const getPatientStatsSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

/**
 * Get weekly compliance validation
 */
export const getWeeklyComplianceSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    weeks: Joi.number().integer().min(1).max(52).default(12),
  }),
};

/**
 * Get daily progress validation
 */
export const getDailyProgressSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    months: Joi.number().integer().min(1).max(12).default(3),
  }),
};

/**
 * Get pain history validation
 */
export const getPainHistorySchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(90),
  }),
};

/**
 * Log pain entry validation
 */
export const logPainEntrySchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  body: Joi.object({
    painLevel: Joi.number().min(0).max(10).required(),
    notes: Joi.string(),
  }),
};

/**
 * Get all patients compliance validation
 */
export const getAllComplianceSchema = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string()
      .valid('compliance_rate', 'patient_name', 'last_activity')
      .default('compliance_rate'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};
