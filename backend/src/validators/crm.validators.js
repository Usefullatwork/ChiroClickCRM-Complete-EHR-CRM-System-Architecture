/**
 * CRM Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateSchema = Joi.date().iso();

/**
 * Lead list query validation
 */
export const listLeadsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string(),
    temperature: Joi.string(),
    source: Joi.string(),
    search: Joi.string().max(200),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
  }),
};

/**
 * Get lead by ID validation
 */
export const getLeadSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create lead validation
 */
export const createLeadSchema = {
  body: Joi.object({
    first_name: Joi.string().required().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email().max(255),
    phone: Joi.string().max(50),
    source: Joi.string().max(50),
    source_detail: Joi.string(),
    status: Joi.string(),
    temperature: Joi.string(),
    primary_interest: Joi.string().max(255),
    chief_complaint: Joi.string(),
    main_complaint: Joi.string(),
    notes: Joi.string(),
    assigned_to: uuidSchema,
  }),
};

/**
 * Update lead validation
 */
export const updateLeadSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email().max(255),
    phone: Joi.string().max(50),
    source: Joi.string().max(50),
    status: Joi.string(),
    temperature: Joi.string(),
    primary_interest: Joi.string().max(255),
    chief_complaint: Joi.string(),
    main_complaint: Joi.string(),
    notes: Joi.string(),
    score: Joi.number().integer(),
    assigned_to: uuidSchema.allow(null),
    next_follow_up_date: dateSchema.allow(null),
    lost_reason: Joi.string().max(255),
  }).min(1),
};

/**
 * Convert lead validation
 */
export const convertLeadSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Lifecycle query validation
 */
export const lifecycleQuerySchema = {
  query: Joi.object({
    stage: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Update patient lifecycle validation
 */
export const updateLifecycleSchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  body: Joi.object({
    stage: Joi.string().required(),
  }),
};

/**
 * Create referral validation
 */
export const createReferralSchema = {
  body: Joi.object({
    referrer_patient_id: uuidSchema,
    referrer_name: Joi.string().max(200),
    referrer_email: Joi.string().email().max(255),
    referrer_phone: Joi.string().max(50),
    referred_name: Joi.string().max(200),
    referred_email: Joi.string().email().max(255),
    referred_phone: Joi.string().max(50),
    notes: Joi.string(),
  }),
};

/**
 * Create survey validation
 */
export const createSurveySchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    survey_type: Joi.string().required(),
    description: Joi.string(),
    questions: Joi.array().items(Joi.object()),
    is_active: Joi.boolean(),
    auto_send: Joi.boolean(),
    send_after_days: Joi.number().integer().min(0),
  }),
};

/**
 * Log communication validation
 */
export const logCommunicationSchema = {
  body: Joi.object({
    patient_id: uuidSchema,
    lead_id: uuidSchema,
    channel: Joi.string().required(),
    direction: Joi.string().required(),
    subject: Joi.string().max(255),
    message: Joi.string(),
    template_used: Joi.string().max(100),
    contact_value: Joi.string().max(255),
    notes: Joi.string(),
  }),
};

/**
 * Create campaign validation
 */
export const createCampaignSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    campaign_type: Joi.string().required(),
    description: Joi.string(),
    channels: Joi.array().items(Joi.string()),
    target_segment: Joi.object(),
    sms_template: Joi.string(),
    email_subject: Joi.string().max(255),
    email_template: Joi.string(),
    scheduled_at: dateSchema.allow(null),
  }),
};

/**
 * Update campaign validation
 */
export const updateCampaignSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    campaign_type: Joi.string(),
    description: Joi.string(),
    channels: Joi.array().items(Joi.string()),
    target_segment: Joi.object(),
    sms_template: Joi.string(),
    email_subject: Joi.string().max(255),
    email_template: Joi.string(),
    scheduled_at: dateSchema.allow(null),
    status: Joi.string(),
  }).min(1),
};

/**
 * Campaign ID param validation
 */
export const campaignIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create workflow validation
 */
export const createWorkflowSchema = {
  body: Joi.object({
    name: Joi.string().required().max(200),
    trigger_type: Joi.string().required(),
    trigger_config: Joi.object(),
    actions: Joi.array().items(Joi.object()),
    conditions: Joi.array().items(Joi.object()),
    description: Joi.string(),
    max_runs_per_patient: Joi.number().integer().min(0),
  }),
};

/**
 * Waitlist entry validation
 */
export const addToWaitlistSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    preferred_practitioner_id: uuidSchema,
    preferred_days: Joi.array().items(Joi.string()),
    preferred_time_start: Joi.string(),
    preferred_time_end: Joi.string(),
    service_type: Joi.string().max(100),
    duration_minutes: Joi.number().integer().min(5).max(240),
    priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    notes: Joi.string(),
  }),
};

/**
 * Update CRM settings validation
 */
export const updateCRMSettingsSchema = {
  body: Joi.object().min(1),
};

/**
 * Retention query validation
 */
export const retentionQuerySchema = {
  query: Joi.object({
    period: Joi.string(),
    startDate: dateSchema,
    endDate: dateSchema,
  }),
};
