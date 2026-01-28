/**
 * CRM Routes
 * Customer Relationship Management API endpoints
 */

import { Router } from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as crmController from '../controllers/crm.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * GET /api/v1/crm/overview
 * Get CRM dashboard overview with key metrics
 */
router.get('/overview', crmController.getCRMOverview);

// =============================================================================
// LEADS
// =============================================================================

/**
 * GET /api/v1/crm/leads
 * Get all leads with filtering and pagination
 * Query params: page, limit, status, source, assignedTo, temperature, search, sortBy, sortOrder
 */
router.get('/leads', crmController.getLeads);

/**
 * GET /api/v1/crm/leads/pipeline
 * Get lead pipeline statistics
 */
router.get('/leads/pipeline', crmController.getLeadPipeline);

/**
 * GET /api/v1/crm/leads/:id
 * Get single lead by ID with activity history
 */
router.get('/leads/:id', crmController.getLead);

/**
 * POST /api/v1/crm/leads
 * Create a new lead
 */
router.post('/leads', crmController.createLead);

/**
 * PUT /api/v1/crm/leads/:id
 * Update a lead
 */
router.put('/leads/:id', crmController.updateLead);

/**
 * POST /api/v1/crm/leads/:id/convert
 * Convert a lead to a patient
 */
router.post('/leads/:id/convert', crmController.convertLead);

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================

/**
 * GET /api/v1/crm/lifecycle
 * Get patients by lifecycle stage
 * Query params: stage, page, limit
 */
router.get('/lifecycle', crmController.getPatientsByLifecycle);

/**
 * GET /api/v1/crm/lifecycle/stats
 * Get lifecycle statistics
 */
router.get('/lifecycle/stats', crmController.getLifecycleStats);

/**
 * PUT /api/v1/crm/lifecycle/:patientId
 * Update patient lifecycle stage
 */
router.put('/lifecycle/:patientId', crmController.updatePatientLifecycle);

// =============================================================================
// REFERRALS
// =============================================================================

/**
 * GET /api/v1/crm/referrals
 * Get all referrals
 * Query params: page, limit, status
 */
router.get('/referrals', crmController.getReferrals);

/**
 * GET /api/v1/crm/referrals/stats
 * Get referral statistics
 */
router.get('/referrals/stats', crmController.getReferralStats);

/**
 * POST /api/v1/crm/referrals
 * Create a new referral
 */
router.post('/referrals', crmController.createReferral);

/**
 * PUT /api/v1/crm/referrals/:id
 * Update a referral
 */
router.put('/referrals/:id', crmController.updateReferral);

// =============================================================================
// SURVEYS
// =============================================================================

/**
 * GET /api/v1/crm/surveys
 * Get all surveys
 */
router.get('/surveys', crmController.getSurveys);

/**
 * GET /api/v1/crm/surveys/nps/stats
 * Get NPS statistics
 * Query params: period (e.g., '30d', '90d')
 */
router.get('/surveys/nps/stats', crmController.getNPSStats);

/**
 * POST /api/v1/crm/surveys
 * Create a new survey
 */
router.post('/surveys', crmController.createSurvey);

/**
 * GET /api/v1/crm/surveys/:id/responses
 * Get responses for a survey
 * Query params: page, limit
 */
router.get('/surveys/:id/responses', crmController.getSurveyResponses);

// =============================================================================
// COMMUNICATIONS
// =============================================================================

/**
 * GET /api/v1/crm/communications
 * Get communication history
 * Query params: page, limit, patientId, leadId, channel, direction
 */
router.get('/communications', crmController.getCommunications);

/**
 * POST /api/v1/crm/communications
 * Log a new communication
 */
router.post('/communications', crmController.logCommunication);

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * GET /api/v1/crm/campaigns
 * Get all campaigns
 * Query params: page, limit, status, type
 */
router.get('/campaigns', crmController.getCampaigns);

/**
 * GET /api/v1/crm/campaigns/:id
 * Get single campaign by ID
 */
router.get('/campaigns/:id', crmController.getCampaign);

/**
 * GET /api/v1/crm/campaigns/:id/stats
 * Get campaign statistics
 */
router.get('/campaigns/:id/stats', crmController.getCampaignStats);

/**
 * POST /api/v1/crm/campaigns
 * Create a new campaign
 */
router.post('/campaigns', crmController.createCampaign);

/**
 * PUT /api/v1/crm/campaigns/:id
 * Update a campaign
 */
router.put('/campaigns/:id', crmController.updateCampaign);

/**
 * POST /api/v1/crm/campaigns/:id/launch
 * Launch a campaign
 */
router.post('/campaigns/:id/launch', crmController.launchCampaign);

// =============================================================================
// WORKFLOWS
// =============================================================================

/**
 * GET /api/v1/crm/workflows
 * Get all workflows
 */
router.get('/workflows', crmController.getWorkflows);

/**
 * GET /api/v1/crm/workflows/:id
 * Get single workflow by ID
 */
router.get('/workflows/:id', crmController.getWorkflow);

/**
 * POST /api/v1/crm/workflows
 * Create a new workflow
 */
router.post('/workflows', crmController.createWorkflow);

/**
 * PUT /api/v1/crm/workflows/:id
 * Update a workflow
 */
router.put('/workflows/:id', crmController.updateWorkflow);

/**
 * POST /api/v1/crm/workflows/:id/toggle
 * Toggle workflow active status
 */
router.post('/workflows/:id/toggle', crmController.toggleWorkflow);

// =============================================================================
// RETENTION
// =============================================================================

/**
 * GET /api/v1/crm/retention
 * Get retention dashboard data
 * Query params: period (e.g., '30d', '90d')
 */
router.get('/retention', crmController.getRetentionDashboard);

/**
 * GET /api/v1/crm/retention/churn
 * Get churn analysis
 */
router.get('/retention/churn', crmController.getChurnAnalysis);

/**
 * GET /api/v1/crm/retention/cohorts
 * Get cohort retention data
 * Query params: months (default: 6)
 */
router.get('/retention/cohorts', crmController.getCohortRetention);

// =============================================================================
// WAITLIST
// =============================================================================

/**
 * GET /api/v1/crm/waitlist
 * Get waitlist entries
 * Query params: page, limit, status, practitionerId
 */
router.get('/waitlist', crmController.getWaitlist);

/**
 * POST /api/v1/crm/waitlist
 * Add patient to waitlist
 */
router.post('/waitlist', crmController.addToWaitlist);

/**
 * PUT /api/v1/crm/waitlist/:id
 * Update waitlist entry
 */
router.put('/waitlist/:id', crmController.updateWaitlistEntry);

/**
 * POST /api/v1/crm/waitlist/notify
 * Notify waitlist patients about available slot
 */
router.post('/waitlist/notify', crmController.notifyWaitlist);

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * GET /api/v1/crm/settings
 * Get CRM settings
 */
router.get('/settings', crmController.getCRMSettings);

/**
 * PUT /api/v1/crm/settings
 * Update CRM settings
 */
router.put('/settings', requireRole('ADMIN'), crmController.updateCRMSettings);

export default router;
