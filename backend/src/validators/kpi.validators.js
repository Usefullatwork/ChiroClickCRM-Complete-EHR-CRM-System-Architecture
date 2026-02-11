/**
 * KPI Validation Schemas
 */

import Joi from 'joi';

const dateSchema = Joi.date().iso();

/**
 * Date range query validation (shared by daily/weekly/monthly)
 */
export const dateRangeQuerySchema = {
  query: Joi.object({
    date: dateSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    start_date: dateSchema,
    end_date: dateSchema,
    month: Joi.string().pattern(/^\d{4}-\d{2}$/),
    year: Joi.number().integer().min(2000).max(2100),
    period: Joi.string(),
  }),
};

/**
 * Import KPI data validation
 */
export const importKPIDataSchema = {
  body: Joi.object({
    data: Joi.array().items(Joi.object()).required(),
    source: Joi.string(),
    date: dateSchema,
  }),
};
