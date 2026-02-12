/**
 * Exercise Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * List exercises validation
 */
export const listExercisesSchema = {
  query: Joi.object({
    category: Joi.string(),
    bodyRegion: Joi.string(),
    body_region: Joi.string(),
    difficulty: Joi.string(),
    search: Joi.string().max(200),
    q: Joi.string().max(200),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Create exercise validation
 */
export const createExerciseSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    name_en: Joi.string().max(200),
    category: Joi.string().required(),
    body_region: Joi.string().required(),
    difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'EASY', 'MODERATE', 'HARD'),
    instructions: Joi.string().required(),
    instructions_en: Joi.string(),
    sets: Joi.number().integer().min(1),
    reps: Joi.number().integer().min(1),
    hold_seconds: Joi.number().integer().min(1),
    frequency: Joi.string(),
    image_url: Joi.string().max(500).allow('', null),
    video_url: Joi.string().max(500).allow('', null),
    contraindications: Joi.array().items(Joi.string()),
    is_active: Joi.boolean(),
  }),
};

/**
 * Update exercise validation
 */
export const updateExerciseSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    name_en: Joi.string().max(200),
    category: Joi.string(),
    body_region: Joi.string(),
    difficulty: Joi.string(),
    instructions: Joi.string(),
    instructions_en: Joi.string(),
    sets: Joi.number().integer().min(1),
    reps: Joi.number().integer().min(1),
    hold_seconds: Joi.number().integer().min(1),
    frequency: Joi.string(),
    image_url: Joi.string().max(500).allow('', null),
    video_url: Joi.string().max(500).allow('', null),
    contraindications: Joi.array().items(Joi.string()),
    is_active: Joi.boolean(),
  }).min(1),
};

/**
 * Get exercise by ID validation
 */
export const getExerciseSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create prescription validation
 */
export const createPrescriptionSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    exercises: Joi.array().items(Joi.object()).required(),
    program_id: uuidSchema,
    notes: Joi.string(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    frequency: Joi.string(),
  }),
};

/**
 * Get patient prescriptions validation
 */
export const getPatientPrescriptionsSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
};

/**
 * Get prescription by ID validation
 */
export const getPrescriptionSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Update prescription validation
 */
export const updatePrescriptionSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    exercises: Joi.array().items(Joi.object()),
    notes: Joi.string(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    frequency: Joi.string(),
    status: Joi.string(),
  }).min(1),
};

/**
 * Update prescription status validation
 */
export const updatePrescriptionStatusSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    status: Joi.string().required(),
  }),
};

/**
 * Create template validation
 */
export const createTemplateSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    description: Joi.string(),
    exercises: Joi.array().items(Joi.object()).required(),
    category: Joi.string(),
    body_region: Joi.string(),
    difficulty: Joi.string(),
  }),
};

/**
 * Update template validation
 */
export const updateTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    description: Joi.string(),
    exercises: Joi.array().items(Joi.object()),
    category: Joi.string(),
    body_region: Joi.string(),
    difficulty: Joi.string(),
  }).min(1),
};

/**
 * Delete template validation
 */
export const deleteTemplateSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Send email validation
 */
export const sendEmailSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    email: Joi.string().email(),
    patient_id: uuidSchema,
  }),
};
