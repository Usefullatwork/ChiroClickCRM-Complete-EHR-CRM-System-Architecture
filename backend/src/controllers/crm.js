/**
 * CRM Controller
 * Handles HTTP requests for Customer Relationship Management features
 */

import * as crmService from '../services/crm.js';
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
  try {
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
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await crmService.getLeads(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getLeads:', error);
    res.status(500).json({ error: 'Failed to retrieve leads' });
  }
};

/**
 * Get lead by ID
 * GET /api/v1/crm/leads/:id
 */
export const getLead = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const lead = await crmService.getLeadById(organizationId, id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error in getLead:', error);
    res.status(500).json({ error: 'Failed to retrieve lead' });
  }
};

/**
 * Create new lead
 * POST /api/v1/crm/leads
 */
export const createLead = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const leadData = { ...req.body, organization_id: organizationId };

    const lead = await crmService.createLead(leadData);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'LEAD',
      resourceId: lead.id,
      ipAddress: req.ip
    });

    res.status(201).json(lead);
  } catch (error) {
    logger.error('Error in createLead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

/**
 * Update lead
 * PUT /api/v1/crm/leads/:id
 */
export const updateLead = async (req, res) => {
  try {
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
      ipAddress: req.ip
    });

    res.json(lead);
  } catch (error) {
    logger.error('Error in updateLead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

/**
 * Convert lead to patient
 * POST /api/v1/crm/leads/:id/convert
 */
export const convertLead = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await crmService.convertLeadToPatient(organizationId, id, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CONVERT',
      resourceType: 'LEAD',
      resourceId: id,
      ipAddress: req.ip
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in convertLead:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
};

/**
 * Get lead pipeline stats
 * GET /api/v1/crm/leads/pipeline
 */
export const getLeadPipeline = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getLeadPipelineStats(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getLeadPipeline:', error);
    res.status(500).json({ error: 'Failed to retrieve pipeline stats' });
  }
};

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================

/**
 * Get patients by lifecycle stage
 * GET /api/v1/crm/lifecycle
 */
export const getPatientsByLifecycle = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      stage: req.query.stage,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await crmService.getPatientsByLifecycle(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getPatientsByLifecycle:', error);
    res.status(500).json({ error: 'Failed to retrieve lifecycle data' });
  }
};

/**
 * Get lifecycle stats
 * GET /api/v1/crm/lifecycle/stats
 */
export const getLifecycleStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getLifecycleStats(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getLifecycleStats:', error);
    res.status(500).json({ error: 'Failed to retrieve lifecycle stats' });
  }
};

/**
 * Update patient lifecycle stage
 * PUT /api/v1/crm/lifecycle/:patientId
 */
export const updatePatientLifecycle = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const { stage, engagementScore, tags } = req.body;

    const result = await crmService.updatePatientLifecycle(organizationId, patientId, {
      stage,
      engagementScore,
      tags
    });

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'PATIENT_LIFECYCLE',
      resourceId: patientId,
      ipAddress: req.ip
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in updatePatientLifecycle:', error);
    res.status(500).json({ error: 'Failed to update lifecycle' });
  }
};

// =============================================================================
// REFERRALS
// =============================================================================

/**
 * Get all referrals
 * GET /api/v1/crm/referrals
 */
export const getReferrals = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status
    };

    const result = await crmService.getReferrals(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getReferrals:', error);
    res.status(500).json({ error: 'Failed to retrieve referrals' });
  }
};

/**
 * Create referral
 * POST /api/v1/crm/referrals
 */
export const createReferral = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const referralData = { ...req.body, organization_id: organizationId };

    const referral = await crmService.createReferral(referralData);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'REFERRAL',
      resourceId: referral.id,
      ipAddress: req.ip
    });

    res.status(201).json(referral);
  } catch (error) {
    logger.error('Error in createReferral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
};

/**
 * Update referral status
 * PUT /api/v1/crm/referrals/:id
 */
export const updateReferral = async (req, res) => {
  try {
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
      ipAddress: req.ip
    });

    res.json(referral);
  } catch (error) {
    logger.error('Error in updateReferral:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
};

/**
 * Get referral stats
 * GET /api/v1/crm/referrals/stats
 */
export const getReferralStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getReferralStats(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getReferralStats:', error);
    res.status(500).json({ error: 'Failed to retrieve referral stats' });
  }
};

// =============================================================================
// SURVEYS
// =============================================================================

/**
 * Get all surveys
 * GET /api/v1/crm/surveys
 */
export const getSurveys = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getSurveys(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getSurveys:', error);
    res.status(500).json({ error: 'Failed to retrieve surveys' });
  }
};

/**
 * Create survey
 * POST /api/v1/crm/surveys
 */
export const createSurvey = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const surveyData = { ...req.body, organization_id: organizationId };

    const survey = await crmService.createSurvey(surveyData);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'SURVEY',
      resourceId: survey.id,
      ipAddress: req.ip
    });

    res.status(201).json(survey);
  } catch (error) {
    logger.error('Error in createSurvey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

/**
 * Get survey responses
 * GET /api/v1/crm/surveys/:id/responses
 */
export const getSurveyResponses = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await crmService.getSurveyResponses(organizationId, id, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getSurveyResponses:', error);
    res.status(500).json({ error: 'Failed to retrieve survey responses' });
  }
};

/**
 * Get NPS stats
 * GET /api/v1/crm/surveys/nps/stats
 */
export const getNPSStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const period = req.query.period || '30d';
    const result = await crmService.getNPSStats(organizationId, period);
    res.json(result);
  } catch (error) {
    logger.error('Error in getNPSStats:', error);
    res.status(500).json({ error: 'Failed to retrieve NPS stats' });
  }
};

// =============================================================================
// COMMUNICATIONS
// =============================================================================

/**
 * Get communication history
 * GET /api/v1/crm/communications
 */
export const getCommunications = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      patientId: req.query.patientId,
      leadId: req.query.leadId,
      channel: req.query.channel,
      direction: req.query.direction
    };

    const result = await crmService.getCommunicationHistory(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCommunications:', error);
    res.status(500).json({ error: 'Failed to retrieve communications' });
  }
};

/**
 * Log communication
 * POST /api/v1/crm/communications
 */
export const logCommunication = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const commData = {
      ...req.body,
      organization_id: organizationId,
      user_id: user.id
    };

    const comm = await crmService.logCommunication(commData);
    res.status(201).json(comm);
  } catch (error) {
    logger.error('Error in logCommunication:', error);
    res.status(500).json({ error: 'Failed to log communication' });
  }
};

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * Get all campaigns
 * GET /api/v1/crm/campaigns
 */
export const getCampaigns = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      type: req.query.type
    };

    const result = await crmService.getCampaigns(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCampaigns:', error);
    res.status(500).json({ error: 'Failed to retrieve campaigns' });
  }
};

/**
 * Get campaign by ID
 * GET /api/v1/crm/campaigns/:id
 */
export const getCampaign = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const campaign = await crmService.getCampaignById(organizationId, id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    logger.error('Error in getCampaign:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign' });
  }
};

/**
 * Create campaign
 * POST /api/v1/crm/campaigns
 */
export const createCampaign = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const campaignData = {
      ...req.body,
      organization_id: organizationId,
      created_by: user.id
    };

    const campaign = await crmService.createCampaign(campaignData);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'CAMPAIGN',
      resourceId: campaign.id,
      ipAddress: req.ip
    });

    res.status(201).json(campaign);
  } catch (error) {
    logger.error('Error in createCampaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

/**
 * Update campaign
 * PUT /api/v1/crm/campaigns/:id
 */
export const updateCampaign = async (req, res) => {
  try {
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
      ipAddress: req.ip
    });

    res.json(campaign);
  } catch (error) {
    logger.error('Error in updateCampaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

/**
 * Launch campaign
 * POST /api/v1/crm/campaigns/:id/launch
 */
export const launchCampaign = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const campaign = await crmService.launchCampaign(organizationId, id);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'LAUNCH',
      resourceType: 'CAMPAIGN',
      resourceId: id,
      ipAddress: req.ip
    });

    res.json(campaign);
  } catch (error) {
    logger.error('Error in launchCampaign:', error);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
};

/**
 * Get campaign stats
 * GET /api/v1/crm/campaigns/:id/stats
 */
export const getCampaignStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const stats = await crmService.getCampaignStats(organizationId, id);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getCampaignStats:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign stats' });
  }
};

// =============================================================================
// WORKFLOWS
// =============================================================================

/**
 * Get all workflows
 * GET /api/v1/crm/workflows
 */
export const getWorkflows = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getWorkflows(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getWorkflows:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
};

/**
 * Get workflow by ID
 * GET /api/v1/crm/workflows/:id
 */
export const getWorkflow = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const workflow = await crmService.getWorkflowById(organizationId, id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    logger.error('Error in getWorkflow:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow' });
  }
};

/**
 * Create workflow
 * POST /api/v1/crm/workflows
 */
export const createWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const workflowData = {
      ...req.body,
      organization_id: organizationId,
      created_by: user.id
    };

    const workflow = await crmService.createWorkflow(workflowData);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'WORKFLOW',
      resourceId: workflow.id,
      ipAddress: req.ip
    });

    res.status(201).json(workflow);
  } catch (error) {
    logger.error('Error in createWorkflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

/**
 * Update workflow
 * PUT /api/v1/crm/workflows/:id
 */
export const updateWorkflow = async (req, res) => {
  try {
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
      ipAddress: req.ip
    });

    res.json(workflow);
  } catch (error) {
    logger.error('Error in updateWorkflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

/**
 * Toggle workflow active status
 * POST /api/v1/crm/workflows/:id/toggle
 */
export const toggleWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const workflow = await crmService.toggleWorkflowActive(organizationId, id);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'TOGGLE',
      resourceType: 'WORKFLOW',
      resourceId: id,
      ipAddress: req.ip
    });

    res.json(workflow);
  } catch (error) {
    logger.error('Error in toggleWorkflow:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
};

// =============================================================================
// RETENTION
// =============================================================================

/**
 * Get retention dashboard data
 * GET /api/v1/crm/retention
 */
export const getRetentionDashboard = async (req, res) => {
  try {
    const { organizationId } = req;
    const period = req.query.period || '30d';

    const result = await crmService.getRetentionDashboard(organizationId, period);
    res.json(result);
  } catch (error) {
    logger.error('Error in getRetentionDashboard:', error);
    res.status(500).json({ error: 'Failed to retrieve retention data' });
  }
};

/**
 * Get churn analysis
 * GET /api/v1/crm/retention/churn
 */
export const getChurnAnalysis = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getChurnAnalysis(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getChurnAnalysis:', error);
    res.status(500).json({ error: 'Failed to retrieve churn analysis' });
  }
};

/**
 * Get cohort retention
 * GET /api/v1/crm/retention/cohorts
 */
export const getCohortRetention = async (req, res) => {
  try {
    const { organizationId } = req;
    const months = parseInt(req.query.months) || 6;

    const result = await crmService.getCohortRetention(organizationId, months);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCohortRetention:', error);
    res.status(500).json({ error: 'Failed to retrieve cohort data' });
  }
};

// =============================================================================
// WAITLIST
// =============================================================================

/**
 * Get waitlist
 * GET /api/v1/crm/waitlist
 */
export const getWaitlist = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status || 'ACTIVE',
      practitionerId: req.query.practitionerId
    };

    const result = await crmService.getWaitlist(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getWaitlist:', error);
    res.status(500).json({ error: 'Failed to retrieve waitlist' });
  }
};

/**
 * Add to waitlist
 * POST /api/v1/crm/waitlist
 */
export const addToWaitlist = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const data = { ...req.body, organization_id: organizationId };

    const entry = await crmService.addToWaitlist(data);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'WAITLIST',
      resourceId: entry.id,
      ipAddress: req.ip
    });

    res.status(201).json(entry);
  } catch (error) {
    logger.error('Error in addToWaitlist:', error);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
};

/**
 * Update waitlist entry
 * PUT /api/v1/crm/waitlist/:id
 */
export const updateWaitlistEntry = async (req, res) => {
  try {
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
      ipAddress: req.ip
    });

    res.json(entry);
  } catch (error) {
    logger.error('Error in updateWaitlistEntry:', error);
    res.status(500).json({ error: 'Failed to update waitlist entry' });
  }
};

/**
 * Notify waitlist patients
 * POST /api/v1/crm/waitlist/notify
 */
export const notifyWaitlist = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { slotDate, slotTime, practitionerId } = req.body;

    const result = await crmService.notifyWaitlistPatients(organizationId, {
      slotDate,
      slotTime,
      practitionerId
    });

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'NOTIFY',
      resourceType: 'WAITLIST',
      ipAddress: req.ip
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in notifyWaitlist:', error);
    res.status(500).json({ error: 'Failed to notify waitlist' });
  }
};

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * Get CRM dashboard overview
 * GET /api/v1/crm/overview
 */
export const getCRMOverview = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getCRMOverview(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCRMOverview:', error);
    res.status(500).json({ error: 'Failed to retrieve CRM overview' });
  }
};

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * Get CRM settings
 * GET /api/v1/crm/settings
 */
export const getCRMSettings = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await crmService.getCRMSettings(organizationId);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCRMSettings:', error);
    res.status(500).json({ error: 'Failed to retrieve CRM settings' });
  }
};

/**
 * Update CRM settings
 * PUT /api/v1/crm/settings
 */
export const updateCRMSettings = async (req, res) => {
  try {
    const { organizationId, user } = req;

    const result = await crmService.updateCRMSettings(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'CRM_SETTINGS',
      ipAddress: req.ip
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in updateCRMSettings:', error);
    res.status(500).json({ error: 'Failed to update CRM settings' });
  }
};
