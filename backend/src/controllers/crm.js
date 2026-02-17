/**
 * CRM Controller
 * Handles HTTP requests for Customer Relationship Management features
 */

import * as crmService from '../services/crm/index.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';
// =============================================================================
// LEADS
// =============================================================================

/**
 * Get all leads with filters
 * GET /api/v1/crm/leads
 */
export const getLeads = async (req, res) => {
  const { organizationId } = req;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
    source: req.query.source,
    assignedTo: req.query.assignedTo,
    temperature: req.query.temperature,
    search: req.query.search,
    sortBy: req.query.sortBy || 'created_at',
    sortOrder: req.query.sortOrder || 'desc',
  };

  const result = await crmService.getLeads(organizationId, options);
  res.json(result);
};

/**
 * Get lead by ID
 * GET /api/v1/crm/leads/:id
 */
export const getLead = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const lead = await crmService.getLeadById(organizationId, id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
};

/**
 * Create new lead
 * POST /api/v1/crm/leads
 */
export const createLead = async (req, res) => {
  const { organizationId, user } = req;
  const leadData = { ...req.body, organization_id: organizationId };

  const lead = await crmService.createLead(leadData);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'LEAD',
    resourceId: lead.id,
    ipAddress: req.ip,
  });

  res.status(201).json(lead);
};

/**
 * Update lead
 * PUT /api/v1/crm/leads/:id
 */
export const updateLead = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const lead = await crmService.updateLead(organizationId, id, req.body);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'LEAD',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(lead);
};

/**
 * Convert lead to patient
 * POST /api/v1/crm/leads/:id/convert
 */
export const convertLead = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const result = await crmService.convertLeadToPatient(organizationId, id, req.body);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CONVERT',
    resourceType: 'LEAD',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(result);
};

/**
 * Get lead pipeline stats
 * GET /api/v1/crm/leads/pipeline
 */
export const getLeadPipeline = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getLeadPipelineStats(organizationId);
  res.json(result);
};

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================

/**
 * Get patients by lifecycle stage
 * GET /api/v1/crm/lifecycle
 */
export const getPatientsByLifecycle = async (req, res) => {
  const { organizationId } = req;
  const options = {
    stage: req.query.stage,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await crmService.getPatientsByLifecycle(organizationId, options);
  res.json(result);
};

/**
 * Get lifecycle stats
 * GET /api/v1/crm/lifecycle/stats
 */
export const getLifecycleStats = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getLifecycleStats(organizationId);
  res.json(result);
};

/**
 * Update patient lifecycle stage
 * PUT /api/v1/crm/lifecycle/:patientId
 */
export const updatePatientLifecycle = async (req, res) => {
  const { organizationId, user } = req;
  const { patientId } = req.params;
  const { stage, engagementScore, tags } = req.body;

  const result = await crmService.updatePatientLifecycle(organizationId, patientId, {
    stage,
    engagementScore,
    tags,
  });

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'PATIENT_LIFECYCLE',
    resourceId: patientId,
    ipAddress: req.ip,
  });

  res.json(result);
};

// =============================================================================
// REFERRALS
// =============================================================================

/**
 * Get all referrals
 * GET /api/v1/crm/referrals
 */
export const getReferrals = async (req, res) => {
  const { organizationId } = req;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
  };

  const result = await crmService.getReferrals(organizationId, options);
  res.json(result);
};

/**
 * Create referral
 * POST /api/v1/crm/referrals
 */
export const createReferral = async (req, res) => {
  const { organizationId, user } = req;
  const referralData = { ...req.body, organization_id: organizationId };

  const referral = await crmService.createReferral(referralData);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'REFERRAL',
    resourceId: referral.id,
    ipAddress: req.ip,
  });

  res.status(201).json(referral);
};

/**
 * Update referral status
 * PUT /api/v1/crm/referrals/:id
 */
export const updateReferral = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const referral = await crmService.updateReferral(organizationId, id, req.body);
  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'REFERRAL',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(referral);
};

/**
 * Get referral stats
 * GET /api/v1/crm/referrals/stats
 */
export const getReferralStats = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getReferralStats(organizationId);
  res.json(result);
};

// =============================================================================
// SURVEYS
// =============================================================================

/**
 * Get all surveys
 * GET /api/v1/crm/surveys
 */
export const getSurveys = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getSurveys(organizationId);
  res.json(result);
};

/**
 * Create survey
 * POST /api/v1/crm/surveys
 */
export const createSurvey = async (req, res) => {
  const { organizationId, user } = req;
  const surveyData = { ...req.body, organization_id: organizationId };

  const survey = await crmService.createSurvey(surveyData);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'SURVEY',
    resourceId: survey.id,
    ipAddress: req.ip,
  });

  res.status(201).json(survey);
};

/**
 * Get survey responses
 * GET /api/v1/crm/surveys/:id/responses
 */
export const getSurveyResponses = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await crmService.getSurveyResponses(organizationId, id, options);
  res.json(result);
};

/**
 * Get NPS stats
 * GET /api/v1/crm/surveys/nps/stats
 */
export const getNPSStats = async (req, res) => {
  const { organizationId } = req;
  const period = req.query.period || '30d';
  const result = await crmService.getNPSStats(organizationId, period);
  res.json(result);
};

// =============================================================================
// COMMUNICATIONS
// =============================================================================

/**
 * Get communication history
 * GET /api/v1/crm/communications
 */
export const getCommunications = async (req, res) => {
  const { organizationId } = req;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    patientId: req.query.patientId,
    leadId: req.query.leadId,
    channel: req.query.channel,
    direction: req.query.direction,
  };

  const result = await crmService.getCommunicationHistory(organizationId, options);
  res.json(result);
};

/**
 * Log communication
 * POST /api/v1/crm/communications
 */
export const logCommunication = async (req, res) => {
  const { organizationId, user } = req;
  const commData = {
    ...req.body,
    organization_id: organizationId,
    user_id: user.id,
  };

  const comm = await crmService.logCommunication(commData);
  res.status(201).json(comm);
};

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * Get all campaigns
 * GET /api/v1/crm/campaigns
 */
export const getCampaigns = async (req, res) => {
  const { organizationId } = req;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
    type: req.query.type,
  };

  const result = await crmService.getCampaigns(organizationId, options);
  res.json(result);
};

/**
 * Get campaign by ID
 * GET /api/v1/crm/campaigns/:id
 */
export const getCampaign = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const campaign = await crmService.getCampaignById(organizationId, id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
};

/**
 * Create campaign
 * POST /api/v1/crm/campaigns
 */
export const createCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const campaignData = {
    ...req.body,
    organization_id: organizationId,
    created_by: user.id,
  };

  const campaign = await crmService.createCampaign(campaignData);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'CAMPAIGN',
    resourceId: campaign.id,
    ipAddress: req.ip,
  });

  res.status(201).json(campaign);
};

/**
 * Update campaign
 * PUT /api/v1/crm/campaigns/:id
 */
export const updateCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const campaign = await crmService.updateCampaign(organizationId, id, req.body);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'CAMPAIGN',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(campaign);
};

/**
 * Launch campaign
 * POST /api/v1/crm/campaigns/:id/launch
 */
export const launchCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const campaign = await crmService.launchCampaign(organizationId, id);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'LAUNCH',
    resourceType: 'CAMPAIGN',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(campaign);
};

/**
 * Get campaign stats
 * GET /api/v1/crm/campaigns/:id/stats
 */
export const getCampaignStats = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const stats = await crmService.getCampaignStats(organizationId, id);
  res.json(stats);
};

// =============================================================================
// WORKFLOWS
// =============================================================================

/**
 * Get all workflows
 * GET /api/v1/crm/workflows
 */
export const getWorkflows = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getWorkflows(organizationId);
  res.json(result);
};

/**
 * Get workflow by ID
 * GET /api/v1/crm/workflows/:id
 */
export const getWorkflow = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const workflow = await crmService.getWorkflowById(organizationId, id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
};

/**
 * Create workflow
 * POST /api/v1/crm/workflows
 */
export const createWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const workflowData = {
    ...req.body,
    organization_id: organizationId,
    created_by: user.id,
  };

  const workflow = await crmService.createWorkflow(workflowData);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'WORKFLOW',
    resourceId: workflow.id,
    ipAddress: req.ip,
  });

  res.status(201).json(workflow);
};

/**
 * Update workflow
 * PUT /api/v1/crm/workflows/:id
 */
export const updateWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const workflow = await crmService.updateWorkflow(organizationId, id, req.body);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'WORKFLOW',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(workflow);
};

/**
 * Toggle workflow active status
 * POST /api/v1/crm/workflows/:id/toggle
 */
export const toggleWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const workflow = await crmService.toggleWorkflowActive(organizationId, id);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'TOGGLE',
    resourceType: 'WORKFLOW',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(workflow);
};

// =============================================================================
// RETENTION
// =============================================================================

/**
 * Get retention dashboard data
 * GET /api/v1/crm/retention
 */
export const getRetentionDashboard = async (req, res) => {
  const { organizationId } = req;
  const period = req.query.period || '30d';

  const result = await crmService.getRetentionDashboard(organizationId, period);
  res.json(result);
};

/**
 * Get churn analysis
 * GET /api/v1/crm/retention/churn
 */
export const getChurnAnalysis = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getChurnAnalysis(organizationId);
  res.json(result);
};

/**
 * Get cohort retention
 * GET /api/v1/crm/retention/cohorts
 */
export const getCohortRetention = async (req, res) => {
  const { organizationId } = req;
  const months = parseInt(req.query.months) || 6;

  const result = await crmService.getCohortRetention(organizationId, months);
  res.json(result);
};

// =============================================================================
// WAITLIST
// =============================================================================

/**
 * Get waitlist
 * GET /api/v1/crm/waitlist
 */
export const getWaitlist = async (req, res) => {
  const { organizationId } = req;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status || 'ACTIVE',
    practitionerId: req.query.practitionerId,
  };

  const result = await crmService.getWaitlist(organizationId, options);
  res.json(result);
};

/**
 * Add to waitlist
 * POST /api/v1/crm/waitlist
 */
export const addToWaitlist = async (req, res) => {
  const { organizationId, user } = req;
  const data = { ...req.body, organization_id: organizationId };

  const entry = await crmService.addToWaitlist(data);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'WAITLIST',
    resourceId: entry.id,
    ipAddress: req.ip,
  });

  res.status(201).json(entry);
};

/**
 * Update waitlist entry
 * PUT /api/v1/crm/waitlist/:id
 */
export const updateWaitlistEntry = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const entry = await crmService.updateWaitlistEntry(organizationId, id, req.body);
  if (!entry) {
    return res.status(404).json({ error: 'Waitlist entry not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'WAITLIST',
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(entry);
};

/**
 * Notify waitlist patients
 * POST /api/v1/crm/waitlist/notify
 */
export const notifyWaitlist = async (req, res) => {
  const { organizationId, user } = req;
  const { slotDate, slotTime, practitionerId } = req.body;

  const result = await crmService.notifyWaitlistPatients(organizationId, {
    slotDate,
    slotTime,
    practitionerId,
  });

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'NOTIFY',
    resourceType: 'WAITLIST',
    ipAddress: req.ip,
  });

  res.json(result);
};

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * Get CRM dashboard overview
 * GET /api/v1/crm/overview
 */
export const getCRMOverview = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getCRMOverview(organizationId);
  res.json(result);
};

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * Get CRM settings
 * GET /api/v1/crm/settings
 */
export const getCRMSettings = async (req, res) => {
  const { organizationId } = req;
  const result = await crmService.getCRMSettings(organizationId);
  res.json(result);
};

/**
 * Update CRM settings
 * PUT /api/v1/crm/settings
 */
export const updateCRMSettings = async (req, res) => {
  const { organizationId, user } = req;

  const result = await crmService.updateCRMSettings(organizationId, req.body);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'CRM_SETTINGS',
    ipAddress: req.ip,
  });

  res.json(result);
};
