/**
 * CRM Controller — Analytics & Management
 * Campaigns, workflows, retention, waitlist, overview, settings
 */

import * as crmService from '../services/crm/index.js';
import { logAudit } from '../utils/audit.js';

// CAMPAIGNS
export const getCampaigns = async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
    type: req.query.type,
  };
  res.json(await crmService.getCampaigns(req.organizationId, options));
};

export const getCampaign = async (req, res) => {
  const campaign = await crmService.getCampaignById(req.organizationId, req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
};

export const createCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const campaign = await crmService.createCampaign({
    ...req.body,
    organization_id: organizationId,
    created_by: user.id,
  });
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

export const updateCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const campaign = await crmService.updateCampaign(organizationId, req.params.id, req.body);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'CAMPAIGN',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(campaign);
};

export const launchCampaign = async (req, res) => {
  const { organizationId, user } = req;
  const campaign = await crmService.launchCampaign(organizationId, req.params.id);
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'LAUNCH',
    resourceType: 'CAMPAIGN',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(campaign);
};

export const getCampaignStats = async (req, res) => {
  res.json(await crmService.getCampaignStats(req.organizationId, req.params.id));
};

// WORKFLOWS
export const getWorkflows = async (req, res) => {
  res.json(await crmService.getWorkflows(req.organizationId));
};

export const getWorkflow = async (req, res) => {
  const workflow = await crmService.getWorkflowById(req.organizationId, req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
};

export const createWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const workflow = await crmService.createWorkflow({
    ...req.body,
    organization_id: organizationId,
    created_by: user.id,
  });
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

export const updateWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const workflow = await crmService.updateWorkflow(organizationId, req.params.id, req.body);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'WORKFLOW',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(workflow);
};

export const toggleWorkflow = async (req, res) => {
  const { organizationId, user } = req;
  const workflow = await crmService.toggleWorkflowActive(organizationId, req.params.id);
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'TOGGLE',
    resourceType: 'WORKFLOW',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(workflow);
};

// RETENTION
export const getRetentionDashboard = async (req, res) => {
  res.json(await crmService.getRetentionDashboard(req.organizationId, req.query.period || '30d'));
};

export const getChurnAnalysis = async (req, res) => {
  res.json(await crmService.getChurnAnalysis(req.organizationId));
};

export const getCohortRetention = async (req, res) => {
  res.json(
    await crmService.getCohortRetention(req.organizationId, parseInt(req.query.months) || 6)
  );
};

// WAITLIST
export const getWaitlist = async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status || 'ACTIVE',
    practitionerId: req.query.practitionerId,
  };
  res.json(await crmService.getWaitlist(req.organizationId, options));
};

export const addToWaitlist = async (req, res) => {
  const { organizationId, user } = req;
  const entry = await crmService.addToWaitlist({ ...req.body, organization_id: organizationId });
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

export const updateWaitlistEntry = async (req, res) => {
  const { organizationId, user } = req;
  const entry = await crmService.updateWaitlistEntry(organizationId, req.params.id, req.body);
  if (!entry) {
    return res.status(404).json({ error: 'Waitlist entry not found' });
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'WAITLIST',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(entry);
};

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

// OVERVIEW & SETTINGS
export const getCRMOverview = async (req, res) => {
  res.json(await crmService.getCRMOverview(req.organizationId));
};
export const getCRMSettings = async (req, res) => {
  res.json(await crmService.getCRMSettings(req.organizationId));
};

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
