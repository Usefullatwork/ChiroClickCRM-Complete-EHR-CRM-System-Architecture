/**
 * Neuroexam Validation Schemas
 * Replaces express-validator usage with Joi
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * List neuroexams validation
 */
export const listNeuroexamsSchema = {
  query: Joi.object({
    patientId: uuidSchema,
    status: Joi.string().valid('IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'AMENDED'),
    hasRedFlags: Joi.string().valid('true', 'false'),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

/**
 * Get neuroexam by ID validation
 */
export const getNeuroexamSchema = {
  params: Joi.object({
    examId: uuidSchema.required(),
  }),
};

/**
 * Create neuroexam validation
 */
export const createNeuroexamSchema = {
  body: Joi.object({
    patientId: uuidSchema.required(),
    encounterId: uuidSchema,
    examType: Joi.string().valid('COMPREHENSIVE', 'SCREENING', 'FOLLOW_UP'),
    testResults: Joi.object().default({}),
    clusterScores: Joi.object(),
    redFlags: Joi.array().items(Joi.object()),
    bppvDiagnosis: Joi.object(),
    narrativeText: Joi.string(),
  }),
};

/**
 * Update neuroexam validation
 */
export const updateNeuroexamSchema = {
  params: Joi.object({
    examId: uuidSchema.required(),
  }),
  body: Joi.object({
    testResults: Joi.object(),
    clusterScores: Joi.object(),
    redFlags: Joi.array().items(Joi.object()),
    bppvDiagnosis: Joi.object(),
    narrativeText: Joi.string(),
    status: Joi.string().valid('IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'AMENDED'),
  }),
};

/**
 * Complete neuroexam validation
 */
export const completeNeuroexamSchema = {
  params: Joi.object({
    examId: uuidSchema.required(),
  }),
  body: Joi.object({
    narrativeText: Joi.string(),
  }),
};

/**
 * Record referral validation
 */
export const recordReferralSchema = {
  params: Joi.object({
    examId: uuidSchema.required(),
  }),
  body: Joi.object({
    specialty: Joi.string().required(),
    urgency: Joi.string().valid('ROUTINE', 'URGENT', 'EMERGENT').required(),
    notes: Joi.string(),
  }),
};

/**
 * Log BPPV treatment validation
 */
export const logBPPVTreatmentSchema = {
  body: Joi.object({
    examId: uuidSchema,
    patientId: uuidSchema.required(),
    canalAffected: Joi.string().valid('POSTERIOR', 'LATERAL', 'ANTERIOR').required(),
    sideAffected: Joi.string().valid('LEFT', 'RIGHT').required(),
    variant: Joi.string(),
    treatmentManeuver: Joi.string().required(),
    repetitions: Joi.number().integer().min(1),
    preVAS: Joi.number().min(0).max(10),
    postVAS: Joi.number().min(0).max(10),
    immediateResolution: Joi.boolean(),
    homeExercises: Joi.boolean(),
    notes: Joi.string(),
  }),
};

/**
 * Get patient neuroexam history validation
 */
export const getPatientHistorySchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};
