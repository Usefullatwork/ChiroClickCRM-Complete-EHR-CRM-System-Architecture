/**
 * Analytics Validation Schemas
 */

import Joi from 'joi';

export const dashboardSchema = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

export const revenueSchema = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

export const topExercisesSchema = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const exportSchema = {
  params: Joi.object({
    type: Joi.string()
      .valid('patients', 'revenue', 'exercises', 'appointments', 'compliance')
      .required(),
  }),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};
