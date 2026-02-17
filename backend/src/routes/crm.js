/**
 * CRM Routes
 * API endpoints for Customer Relationship Management
 */

import express from 'express';
import * as crmController from '../controllers/crm.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
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
router.get('/overview', asyncHandler(crmController.getCRMOverview));

// =============================================================================
// LEADS
// =============================================================================
router.get('/leads', validate(listLeadsSchema), asyncHandler(crmController.getLeads));
router.get('/leads/pipeline', asyncHandler(crmController.getLeadPipeline));
router.get('/leads/:id', validate(getLeadSchema), asyncHandler(crmController.getLead));
router.post('/leads', validate(createLeadSchema), asyncHandler(crmController.createLead));
router.put('/leads/:id', validate(updateLeadSchema), asyncHandler(crmController.updateLead));
router.post(
  '/leads/:id/convert',
  validate(convertLeadSchema),
  asyncHandler(crmController.convertLead)
);

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================
router.get(
  '/lifecycle',
  validate(lifecycleQuerySchema),
  asyncHandler(crmController.getPatientsByLifecycle)
);
router.get('/lifecycle/stats', asyncHandler(crmController.getLifecycleStats));
router.put(
  '/lifecycle/:patientId',
  validate(updateLifecycleSchema),
  asyncHandler(crmController.updatePatientLifecycle)
);

// =============================================================================
// REFERRALS
// =============================================================================
router.get('/referrals', asyncHandler(crmController.getReferrals));
router.get('/referrals/stats', asyncHandler(crmController.getReferralStats));
router.post(
  '/referrals',
  validate(createReferralSchema),
  asyncHandler(crmController.createReferral)
);
router.put('/referrals/:id', asyncHandler(crmController.updateReferral));

// =============================================================================
// SURVEYS
// =============================================================================
router.get('/surveys', asyncHandler(crmController.getSurveys));
router.get('/surveys/nps/stats', asyncHandler(crmController.getNPSStats));
router.get('/surveys/:id/responses', asyncHandler(crmController.getSurveyResponses));
router.post('/surveys', validate(createSurveySchema), asyncHandler(crmController.createSurvey));

// =============================================================================
// COMMUNICATIONS
// =============================================================================
router.get('/communications', asyncHandler(crmController.getCommunications));
router.post(
  '/communications',
  validate(logCommunicationSchema),
  asyncHandler(crmController.logCommunication)
);

// =============================================================================
// CAMPAIGNS
// =============================================================================
router.get('/campaigns', asyncHandler(crmController.getCampaigns));
router.get('/campaigns/:id', asyncHandler(crmController.getCampaign));
router.get('/campaigns/:id/stats', asyncHandler(crmController.getCampaignStats));
router.post(
  '/campaigns',
  validate(createCampaignSchema),
  asyncHandler(crmController.createCampaign)
);
router.put(
  '/campaigns/:id',
  validate(updateCampaignSchema),
  asyncHandler(crmController.updateCampaign)
);
router.post(
  '/campaigns/:id/launch',
  validate(campaignIdSchema),
  asyncHandler(crmController.launchCampaign)
);

// =============================================================================
// WORKFLOWS
// =============================================================================
router.get('/workflows', asyncHandler(crmController.getWorkflows));
router.get('/workflows/:id', asyncHandler(crmController.getWorkflow));
router.post(
  '/workflows',
  validate(createWorkflowSchema),
  asyncHandler(crmController.createWorkflow)
);
router.put('/workflows/:id', asyncHandler(crmController.updateWorkflow));
router.post('/workflows/:id/toggle', asyncHandler(crmController.toggleWorkflow));

// =============================================================================
// RETENTION
// =============================================================================
router.get(
  '/retention',
  validate(retentionQuerySchema),
  asyncHandler(crmController.getRetentionDashboard)
);
router.get('/retention/churn', asyncHandler(crmController.getChurnAnalysis));
router.get('/retention/cohorts', asyncHandler(crmController.getCohortRetention));

// =============================================================================
// WAITLIST
// =============================================================================
router.get('/waitlist', asyncHandler(crmController.getWaitlist));
router.post('/waitlist', validate(addToWaitlistSchema), asyncHandler(crmController.addToWaitlist));
router.put('/waitlist/:id', asyncHandler(crmController.updateWaitlistEntry));
router.post('/waitlist/notify', asyncHandler(crmController.notifyWaitlist));

// =============================================================================
// CRM SETTINGS
// =============================================================================
router.get('/settings', asyncHandler(crmController.getCRMSettings));
router.put(
  '/settings',
  requireRole(['ADMIN']),
  validate(updateCRMSettingsSchema),
  asyncHandler(crmController.updateCRMSettings)
);

export default router;
