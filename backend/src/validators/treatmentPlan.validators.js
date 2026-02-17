/**
 * Treatment Plan Validation Schemas
 */

import Joi from 'joi';

export const createPlanSchema = {
  body: Joi.object({
    patientId: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000),
    diagnosisCodes: Joi.array().items(Joi.string().max(20)),
    goals: Joi.array().items(Joi.string().max(500)),
    estimatedSessions: Joi.number().integer().min(1).max(200),
    frequency: Joi.string().max(100),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled'),
  }),
};

export const getPatientPlansSchema = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled'),
  }),
};

export const getPlanSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const updatePlanSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(2000),
    diagnosisCodes: Joi.array().items(Joi.string().max(20)),
    goals: Joi.array().items(Joi.string().max(500)),
    estimatedSessions: Joi.number().integer().min(1).max(200),
    frequency: Joi.string().max(100),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled'),
  }).min(1),
};

export const getPlanProgressSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const addMilestoneSchema = {
  params: Joi.object({
    planId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    targetDate: Joi.date().iso(),
    targetSessionNumber: Joi.number().integer().min(1),
    criteria: Joi.string().max(1000),
  }),
};

export const updateMilestoneSchema = {
  params: Joi.object({
    milestoneId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    targetDate: Joi.date().iso(),
    targetSessionNumber: Joi.number().integer().min(1),
    criteria: Joi.string().max(1000),
    status: Joi.string().valid('pending', 'achieved', 'missed'),
    achievedDate: Joi.date().iso(),
  }).min(1),
};

export const addSessionSchema = {
  params: Joi.object({
    planId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    encounterId: Joi.string().uuid(),
    sessionNumber: Joi.number().integer().min(1),
    notes: Joi.string().max(2000),
    sessionDate: Joi.date().iso(),
    treatments: Joi.array().items(Joi.object()),
  }),
};

export const completeSessionSchema = {
  params: Joi.object({
    sessionId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    notes: Joi.string().max(2000),
    outcomeNotes: Joi.string().max(2000),
    vasScore: Joi.number().integer().min(0).max(10),
  }),
};
