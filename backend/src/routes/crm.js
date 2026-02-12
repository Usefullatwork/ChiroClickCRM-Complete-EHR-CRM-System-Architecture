/**
 * CRM Routes
 * API endpoints for Customer Relationship Management
 */

import express from 'express';
import * as crmController from '../controllers/crm.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  listLeadsSchema,
  getLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
  lifecycleQuerySchema,
  updateLifecycleSchema,
  createReferralSchema,
  createSurveySchema,
  logCommunicationSchema,
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  createWorkflowSchema,
  addToWaitlistSchema,
  updateCRMSettingsSchema,
  retentionQuerySchema,
} from '../validators/crm.validators.js';

const router = express.Router();

// All CRM routes require authentication and organization context
router.use(requireAuth);
router.use(requireOrganization);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'crm' });
});

// =============================================================================
// CRM OVERVIEW
// =============================================================================
router.get('/overview', crmController.getCRMOverview);

// =============================================================================
// LEADS
// =============================================================================
router.get('/leads', validate(listLeadsSchema), crmController.getLeads);
router.get('/leads/pipeline', crmController.getLeadPipeline);
router.get('/leads/:id', validate(getLeadSchema), crmController.getLead);
router.post('/leads', validate(createLeadSchema), crmController.createLead);
router.put('/leads/:id', validate(updateLeadSchema), crmController.updateLead);
router.post('/leads/:id/convert', validate(convertLeadSchema), crmController.convertLead);

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================
router.get('/lifecycle', validate(lifecycleQuerySchema), crmController.getPatientsByLifecycle);
router.get('/lifecycle/stats', crmController.getLifecycleStats);
router.put(
  '/lifecycle/:patientId',
  validate(updateLifecycleSchema),
  crmController.updatePatientLifecycle
);

// =============================================================================
// REFERRALS
// =============================================================================
router.get('/referrals', crmController.getReferrals);
router.get('/referrals/stats', crmController.getReferralStats);
router.post('/referrals', validate(createReferralSchema), crmController.createReferral);
router.put('/referrals/:id', crmController.updateReferral);

// =============================================================================
// SURVEYS
// =============================================================================
router.get('/surveys', crmController.getSurveys);
router.get('/surveys/nps/stats', crmController.getNPSStats);
router.get('/surveys/:id/responses', crmController.getSurveyResponses);
router.post('/surveys', validate(createSurveySchema), crmController.createSurvey);

// =============================================================================
// COMMUNICATIONS
// =============================================================================
router.get('/communications', crmController.getCommunications);
router.post('/communications', validate(logCommunicationSchema), crmController.logCommunication);

// =============================================================================
// CAMPAIGNS
// =============================================================================
router.get('/campaigns', crmController.getCampaigns);
router.get('/campaigns/:id', crmController.getCampaign);
router.get('/campaigns/:id/stats', crmController.getCampaignStats);
router.post('/campaigns', validate(createCampaignSchema), crmController.createCampaign);
router.put('/campaigns/:id', validate(updateCampaignSchema), crmController.updateCampaign);
router.post('/campaigns/:id/launch', validate(campaignIdSchema), crmController.launchCampaign);

// =============================================================================
// WORKFLOWS
// =============================================================================
router.get('/workflows', crmController.getWorkflows);
router.get('/workflows/:id', crmController.getWorkflow);
router.post('/workflows', validate(createWorkflowSchema), crmController.createWorkflow);
router.put('/workflows/:id', crmController.updateWorkflow);
router.post('/workflows/:id/toggle', crmController.toggleWorkflow);

// =============================================================================
// RETENTION
// =============================================================================
router.get('/retention', validate(retentionQuerySchema), crmController.getRetentionDashboard);
router.get('/retention/churn', crmController.getChurnAnalysis);
router.get('/retention/cohorts', crmController.getCohortRetention);

// =============================================================================
// WAITLIST
// =============================================================================
router.get('/waitlist', crmController.getWaitlist);
router.post('/waitlist', validate(addToWaitlistSchema), crmController.addToWaitlist);
router.put('/waitlist/:id', crmController.updateWaitlistEntry);
router.post('/waitlist/notify', crmController.notifyWaitlist);

// =============================================================================
// CRM SETTINGS
// =============================================================================
router.get('/settings', crmController.getCRMSettings);
router.put(
  '/settings',
  requireRole(['ADMIN']),
  validate(updateCRMSettingsSchema),
  crmController.updateCRMSettings
);

export default router;
