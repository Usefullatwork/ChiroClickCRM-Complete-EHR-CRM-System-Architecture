/**
 * Audit Log Validation Schemas
 */

import Joi from 'joi';

/**
 * List audit logs validation
 */
export const listAuditLogsSchema = {
  query: Joi.object({
    page: Joi.number().integer().default(1),
    limit: Joi.number().integer().default(50),
    action: Joi.string().max(100),
    resourceType: Joi.string().max(100),
    userRole: Joi.string().max(50),
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    search: Joi.string().max(200),
  }),
};
