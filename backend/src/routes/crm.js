/**
 * CRM Routes
 * API endpoints for Customer Relationship Management
 */

import express from 'express';
import * as crmController from '../controllers/crm.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

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
router.get('/leads', crmController.getLeads);
router.get('/leads/pipeline', crmController.getLeadPipeline);
router.get('/leads/:id', crmController.getLead);
router.post('/leads', crmController.createLead);
router.put('/leads/:id', crmController.updateLead);
router.post('/leads/:id/convert', crmController.convertLead);

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================
router.get('/lifecycle', crmController.getPatientsByLifecycle);
router.get('/lifecycle/stats', crmController.getLifecycleStats);
router.put('/lifecycle/:patientId', crmController.updatePatientLifecycle);

// =============================================================================
// REFERRALS
// =============================================================================
router.get('/referrals', crmController.getReferrals);
router.get('/referrals/stats', crmController.getReferralStats);
router.post('/referrals', crmController.createReferral);
router.put('/referrals/:id', crmController.updateReferral);

// =============================================================================
// SURVEYS
// =============================================================================
router.get('/surveys', crmController.getSurveys);
router.get('/surveys/nps/stats', crmController.getNPSStats);
router.get('/surveys/:id/responses', crmController.getSurveyResponses);
router.post('/surveys', crmController.createSurvey);

// =============================================================================
// COMMUNICATIONS
// =============================================================================
router.get('/communications', crmController.getCommunications);
router.post('/communications', crmController.logCommunication);

// =============================================================================
// CAMPAIGNS
// =============================================================================
router.get('/campaigns', crmController.getCampaigns);
router.get('/campaigns/:id', crmController.getCampaign);
router.get('/campaigns/:id/stats', crmController.getCampaignStats);
router.post('/campaigns', crmController.createCampaign);
router.put('/campaigns/:id', crmController.updateCampaign);
router.post('/campaigns/:id/launch', crmController.launchCampaign);

// =============================================================================
// WORKFLOWS
// =============================================================================
router.get('/workflows', crmController.getWorkflows);
router.get('/workflows/:id', crmController.getWorkflow);
router.post('/workflows', crmController.createWorkflow);
router.put('/workflows/:id', crmController.updateWorkflow);
router.post('/workflows/:id/toggle', crmController.toggleWorkflow);

// =============================================================================
// RETENTION
// =============================================================================
router.get('/retention', crmController.getRetentionDashboard);
router.get('/retention/churn', crmController.getChurnAnalysis);
router.get('/retention/cohorts', crmController.getCohortRetention);

// =============================================================================
// WAITLIST
// =============================================================================
router.get('/waitlist', crmController.getWaitlist);
router.post('/waitlist', crmController.addToWaitlist);
router.put('/waitlist/:id', crmController.updateWaitlistEntry);
router.post('/waitlist/notify', crmController.notifyWaitlist);

// =============================================================================
// CRM SETTINGS
// =============================================================================
router.get('/settings', crmController.getCRMSettings);
router.put('/settings', requireRole(['ADMIN']), crmController.updateCRMSettings);

export default router;
