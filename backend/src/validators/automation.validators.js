/**
 * Automation Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();

/**
 * List workflows validation
 */
export const listWorkflowsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string(),
    trigger_type: Joi.string(),
  }),
};

/**
 * Get workflow by ID validation
 */
export const getWorkflowSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create workflow validation
 */
export const createWorkflowSchema = {
  body: Joi.object({
    name: Joi.string().required().max(255),
    description: Joi.string(),
    trigger_type: Joi.string().required(),
    trigger_config: Joi.object(),
    conditions: Joi.array().items(Joi.object()),
    actions: Joi.array().items(Joi.object()).required(),
    max_runs_per_patient: Joi.number().integer().min(0),
    run_at_time: Joi.string(),
    timezone: Joi.string().max(50),
    max_per_day: Joi.number().integer().min(1),
    is_active: Joi.boolean(),
  }),
};

/**
 * Update workflow validation
 */
export const updateWorkflowSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(255),
    description: Joi.string(),
    trigger_type: Joi.string(),
    trigger_config: Joi.object(),
    conditions: Joi.array().items(Joi.object()),
    actions: Joi.array().items(Joi.object()),
    max_runs_per_patient: Joi.number().integer().min(0),
    run_at_time: Joi.string(),
    timezone: Joi.string().max(50),
    max_per_day: Joi.number().integer().min(1),
    is_active: Joi.boolean(),
  }).min(1),
};

/**
 * Delete workflow validation
 */
export const deleteWorkflowSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Toggle workflow validation
 */
export const toggleWorkflowSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Workflow executions validation
 */
export const workflowExecutionsSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string(),
  }),
};

/**
 * All executions query validation
 */
export const allExecutionsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string(),
    workflow_id: uuidSchema,
  }),
};

/**
 * Test workflow validation
 */
export const testWorkflowSchema = {
  body: Joi.object({
    trigger_type: Joi.string().required(),
    trigger_data: Joi.object(),
    actions: Joi.array().items(Joi.object()),
    conditions: Joi.array().items(Joi.object()),
  }),
};
