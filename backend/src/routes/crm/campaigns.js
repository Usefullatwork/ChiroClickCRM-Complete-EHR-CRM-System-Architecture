/**
 * CRM Campaigns Routes
 * Campaigns, workflows, retention, waitlist, and CRM settings
 */

import express from 'express';
import * as crmController from '../../controllers/crm.js';
import { requireRole } from '../../middleware/auth.js';
import validate from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  createWorkflowSchema,
  addToWaitlistSchema,
  updateCRMSettingsSchema,
  retentionQuerySchema,
} from '../../validators/crm.validators.js';

const router = express.Router();

// Campaigns
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

// Workflows
router.get('/workflows', asyncHandler(crmController.getWorkflows));
router.get('/workflows/:id', asyncHandler(crmController.getWorkflow));
router.post(
  '/workflows',
  validate(createWorkflowSchema),
  asyncHandler(crmController.createWorkflow)
);
router.put('/workflows/:id', asyncHandler(crmController.updateWorkflow));
router.post('/workflows/:id/toggle', asyncHandler(crmController.toggleWorkflow));

// Retention
router.get(
  '/retention',
  validate(retentionQuerySchema),
  asyncHandler(crmController.getRetentionDashboard)
);
router.get('/retention/churn', asyncHandler(crmController.getChurnAnalysis));
router.get('/retention/cohorts', asyncHandler(crmController.getCohortRetention));

// Waitlist
router.get('/waitlist', asyncHandler(crmController.getWaitlist));
router.post('/waitlist', validate(addToWaitlistSchema), asyncHandler(crmController.addToWaitlist));
router.put('/waitlist/:id', asyncHandler(crmController.updateWaitlistEntry));
router.post('/waitlist/notify', asyncHandler(crmController.notifyWaitlist));

// CRM Settings
router.get('/settings', asyncHandler(crmController.getCRMSettings));
router.put(
  '/settings',
  requireRole(['ADMIN']),
  validate(updateCRMSettingsSchema),
  asyncHandler(crmController.updateCRMSettings)
);

export default router;
