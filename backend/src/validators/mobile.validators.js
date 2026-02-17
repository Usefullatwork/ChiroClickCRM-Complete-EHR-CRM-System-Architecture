/**
 * Mobile API Validation Schemas
 * Note: mobile.js uses CommonJS, so these are exported as named exports
 * and the route file uses CJS require.
 */

import Joi from 'joi';

export const sendOtpSchema = {
  body: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^(\+47)?[0-9]{8}$/)
      .required()
      .messages({ 'string.pattern.base': 'Must be a valid Norwegian phone number' }),
  }),
};

export const verifyOtpSchema = {
  body: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^(\+47)?[0-9]{8}$/)
      .required(),
    code: Joi.string().min(4).max(8).required(),
  }),
};

export const googleAuthSchema = {
  body: Joi.object({
    idToken: Joi.string().required(),
  }),
};

export const appleAuthSchema = {
  body: Joi.object({
    identityToken: Joi.string().required(),
    user: Joi.object(),
  }),
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const updateProfileSchema = {
  body: Joi.object({
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^(\+47)?[0-9]{8}$/),
    preferredLanguage: Joi.string().valid('nb', 'en'),
    notificationsEnabled: Joi.boolean(),
  }).min(1),
};

export const deviceTokenSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    deviceInfo: Joi.object({
      platform: Joi.string().valid('ios', 'android'),
      model: Joi.string().max(100),
      osVersion: Joi.string().max(50),
    }),
  }),
};

export const exercisesQuerySchema = {
  query: Joi.object({
    category: Joi.string().max(50),
    bodyRegion: Joi.string().max(50),
    difficulty: Joi.string().max(20),
    search: Joi.string().max(200),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

export const exerciseIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const programsQuerySchema = {
  query: Joi.object({
    type: Joi.string().max(50),
    difficulty: Joi.string().max(20),
    search: Joi.string().max(200),
  }),
};

export const programIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const logWorkoutSchema = {
  body: Joi.object({
    programExerciseId: Joi.string().uuid(),
    exerciseId: Joi.string().uuid(),
    enrollmentId: Joi.string().uuid(),
    setsCompleted: Joi.number().integer().min(0).max(50),
    repsCompleted: Joi.number().integer().min(0).max(500),
    weightKg: Joi.number().min(0).max(500),
    holdSecondsCompleted: Joi.number().integer().min(0).max(600),
    rirActual: Joi.number().integer().min(0).max(10),
    painRating: Joi.number().integer().min(0).max(10),
    difficultyRating: Joi.number().integer().min(1).max(5),
    sorenessRating: Joi.number().integer().min(0).max(10),
    notes: Joi.string().max(2000),
  }),
};

export const progressQuerySchema = {
  query: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30),
  }),
};
