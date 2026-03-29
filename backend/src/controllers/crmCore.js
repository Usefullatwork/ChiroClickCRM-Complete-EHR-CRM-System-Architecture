/**
 * CRM Controller — Core CRUD
 * Leads, lifecycle, referrals, surveys, communications
 */

import * as crmService from '../services/crm/index.js';
import { logAudit } from '../utils/audit.js';

// LEADS
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

export const getLead = async (req, res) => {
  const { organizationId } = req;
  const lead = await crmService.getLeadById(organizationId, req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
};

export const createLead = async (req, res) => {
  const { organizationId, user } = req;
  const lead = await crmService.createLead({ ...req.body, organization_id: organizationId });
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

export const updateLead = async (req, res) => {
  const { organizationId, user } = req;
  const lead = await crmService.updateLead(organizationId, req.params.id, req.body);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'LEAD',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(lead);
};

export const convertLead = async (req, res) => {
  const { organizationId, user } = req;
  let result;
  try {
    result = await crmService.convertLeadToPatient(organizationId, req.params.id, req.body);
  } catch (err) {
    if (err.message === 'Lead not found') {
      return res.status(404).json({ error: 'Lead not found' });
    }
    throw err;
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CONVERT',
    resourceType: 'LEAD',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(result);
};

export const getLeadPipeline = async (req, res) => {
  const result = await crmService.getLeadPipelineStats(req.organizationId);
  res.json(result);
};

// LIFECYCLE
export const getPatientsByLifecycle = async (req, res) => {
  const options = {
    stage: req.query.stage,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };
  const result = await crmService.getPatientsByLifecycle(req.organizationId, options);
  res.json(result);
};

export const getLifecycleStats = async (req, res) => {
  const result = await crmService.getLifecycleStats(req.organizationId);
  res.json(result);
};

export const updatePatientLifecycle = async (req, res) => {
  const { organizationId, user } = req;
  const { stage, engagementScore, tags } = req.body;
  const result = await crmService.updatePatientLifecycle(organizationId, req.params.patientId, {
    stage,
    engagementScore,
    tags,
  });
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'PATIENT_LIFECYCLE',
    resourceId: req.params.patientId,
    ipAddress: req.ip,
  });
  res.json(result);
};

// REFERRALS
export const getReferrals = async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
  };
  const result = await crmService.getReferrals(req.organizationId, options);
  res.json(result);
};

export const createReferral = async (req, res) => {
  const { organizationId, user } = req;
  const referral = await crmService.createReferral({
    ...req.body,
    organization_id: organizationId,
  });
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

export const updateReferral = async (req, res) => {
  const { organizationId, user } = req;
  const referral = await crmService.updateReferral(organizationId, req.params.id, req.body);
  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'REFERRAL',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json(referral);
};

export const getReferralStats = async (req, res) => {
  const result = await crmService.getReferralStats(req.organizationId);
  res.json(result);
};

// SURVEYS
export const getSurveys = async (req, res) => {
  res.json(await crmService.getSurveys(req.organizationId));
};

export const createSurvey = async (req, res) => {
  const { organizationId, user } = req;
  const survey = await crmService.createSurvey({ ...req.body, organization_id: organizationId });
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

export const getSurveyResponses = async (req, res) => {
  const options = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 };
  const result = await crmService.getSurveyResponses(req.organizationId, req.params.id, options);
  res.json(result);
};

export const getNPSStats = async (req, res) => {
  const result = await crmService.getNPSStats(req.organizationId, req.query.period || '30d');
  res.json(result);
};

// COMMUNICATIONS
export const getCommunications = async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    patientId: req.query.patientId,
    leadId: req.query.leadId,
    channel: req.query.channel,
    direction: req.query.direction,
  };
  res.json(await crmService.getCommunicationHistory(req.organizationId, options));
};

export const logCommunication = async (req, res) => {
  const comm = await crmService.logCommunication({
    ...req.body,
    organization_id: req.organizationId,
    user_id: req.user.id,
  });
  res.status(201).json(comm);
};
