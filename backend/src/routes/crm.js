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

/**
 * @swagger
 * /crm/health:
 *   get:
 *     summary: CRM module health check
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CRM module is healthy
 */
// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'crm' });
});

// =============================================================================
// CRM OVERVIEW
// =============================================================================

/**
 * @swagger
 * /crm/overview:
 *   get:
 *     summary: Get CRM dashboard overview metrics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CRM overview with lead counts, lifecycle stats, recent activity
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', asyncHandler(crmController.getCRMOverview));

// =============================================================================
// LEADS
// =============================================================================

/**
 * @swagger
 * /crm/leads:
 *   get:
 *     summary: List leads with filters and pagination
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, qualified, converted, lost]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of leads
 *       401:
 *         description: Unauthorized
 */
router.get('/leads', validate(listLeadsSchema), asyncHandler(crmController.getLeads));

/**
 * @swagger
 * /crm/leads/pipeline:
 *   get:
 *     summary: Get lead pipeline statistics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lead pipeline grouped by status with counts
 *       401:
 *         description: Unauthorized
 */
router.get('/leads/pipeline', asyncHandler(crmController.getLeadPipeline));

/**
 * @swagger
 * /crm/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead details
 *       404:
 *         description: Lead not found
 */
router.get('/leads/:id', validate(getLeadSchema), asyncHandler(crmController.getLead));

/**
 * @swagger
 * /crm/leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               source:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lead created
 *       400:
 *         description: Validation error
 */
router.post('/leads', validate(createLeadSchema), asyncHandler(crmController.createLead));

/**
 * @swagger
 * /crm/leads/{id}:
 *   put:
 *     summary: Update an existing lead
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated
 *       404:
 *         description: Lead not found
 */
router.put('/leads/:id', validate(updateLeadSchema), asyncHandler(crmController.updateLead));

/**
 * @swagger
 * /crm/leads/{id}/convert:
 *   post:
 *     summary: Convert a lead to a patient
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               national_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead converted to patient
 *       400:
 *         description: Conversion failed
 *       404:
 *         description: Lead not found
 */
router.post(
  '/leads/:id/convert',
  validate(convertLeadSchema),
  asyncHandler(crmController.convertLead)
);

// =============================================================================
// PATIENT LIFECYCLE
// =============================================================================

/**
 * @swagger
 * /crm/lifecycle:
 *   get:
 *     summary: Get patients grouped by lifecycle stage
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [new, active, inactive, at_risk, churned]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patients filtered by lifecycle stage
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/lifecycle',
  validate(lifecycleQuerySchema),
  asyncHandler(crmController.getPatientsByLifecycle)
);

/**
 * @swagger
 * /crm/lifecycle/stats:
 *   get:
 *     summary: Get lifecycle stage statistics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Count of patients per lifecycle stage
 *       401:
 *         description: Unauthorized
 */
router.get('/lifecycle/stats', asyncHandler(crmController.getLifecycleStats));

/**
 * @swagger
 * /crm/lifecycle/{patientId}:
 *   put:
 *     summary: Update a patient's lifecycle stage
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stage]
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [new, active, inactive, at_risk, churned]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lifecycle stage updated
 *       404:
 *         description: Patient not found
 */
router.put(
  '/lifecycle/:patientId',
  validate(updateLifecycleSchema),
  asyncHandler(crmController.updatePatientLifecycle)
);

// =============================================================================
// REFERRALS
// =============================================================================

/**
 * @swagger
 * /crm/referrals:
 *   get:
 *     summary: List all referrals
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of referrals
 *       401:
 *         description: Unauthorized
 */
router.get('/referrals', asyncHandler(crmController.getReferrals));

/**
 * @swagger
 * /crm/referrals/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics by source and conversion rates
 *       401:
 *         description: Unauthorized
 */
router.get('/referrals/stats', asyncHandler(crmController.getReferralStats));

/**
 * @swagger
 * /crm/referrals:
 *   post:
 *     summary: Create a new referral
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referrer_name, referred_patient_id]
 *             properties:
 *               referrer_name:
 *                 type: string
 *               referrer_patient_id:
 *                 type: string
 *                 format: uuid
 *               referred_patient_id:
 *                 type: string
 *                 format: uuid
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Referral created
 *       400:
 *         description: Validation error
 */
router.post(
  '/referrals',
  validate(createReferralSchema),
  asyncHandler(crmController.createReferral)
);

/**
 * @swagger
 * /crm/referrals/{id}:
 *   put:
 *     summary: Update a referral
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral updated
 *       404:
 *         description: Referral not found
 */
router.put('/referrals/:id', asyncHandler(crmController.updateReferral));

// =============================================================================
// SURVEYS
// =============================================================================

/**
 * @swagger
 * /crm/surveys:
 *   get:
 *     summary: List all surveys
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of surveys
 *       401:
 *         description: Unauthorized
 */
router.get('/surveys', asyncHandler(crmController.getSurveys));

/**
 * @swagger
 * /crm/surveys/nps/stats:
 *   get:
 *     summary: Get NPS (Net Promoter Score) statistics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: NPS score breakdown with promoters, passives, detractors
 *       401:
 *         description: Unauthorized
 */
router.get('/surveys/nps/stats', asyncHandler(crmController.getNPSStats));

/**
 * @swagger
 * /crm/surveys/{id}/responses:
 *   get:
 *     summary: Get responses for a survey
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Survey responses
 *       404:
 *         description: Survey not found
 */
router.get('/surveys/:id/responses', asyncHandler(crmController.getSurveyResponses));

/**
 * @swagger
 * /crm/surveys:
 *   post:
 *     summary: Create a new survey
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type]
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [nps, satisfaction, custom]
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Survey created
 *       400:
 *         description: Validation error
 */
router.post('/surveys', validate(createSurveySchema), asyncHandler(crmController.createSurvey));

// =============================================================================
// COMMUNICATIONS
// =============================================================================

/**
 * @swagger
 * /crm/communications:
 *   get:
 *     summary: Get communication history
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of communications (calls, emails, SMS)
 *       401:
 *         description: Unauthorized
 */
router.get('/communications', asyncHandler(crmController.getCommunications));

/**
 * @swagger
 * /crm/communications:
 *   post:
 *     summary: Log a communication event
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, type, content]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [call, email, sms, in_person]
 *               content:
 *                 type: string
 *               direction:
 *                 type: string
 *                 enum: [inbound, outbound]
 *     responses:
 *       201:
 *         description: Communication logged
 *       400:
 *         description: Validation error
 */
router.post(
  '/communications',
  validate(logCommunicationSchema),
  asyncHandler(crmController.logCommunication)
);

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * @swagger
 * /crm/campaigns:
 *   get:
 *     summary: List all campaigns
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of marketing campaigns
 *       401:
 *         description: Unauthorized
 */
router.get('/campaigns', asyncHandler(crmController.getCampaigns));

/**
 * @swagger
 * /crm/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign details
 *       404:
 *         description: Campaign not found
 */
router.get('/campaigns/:id', asyncHandler(crmController.getCampaign));

/**
 * @swagger
 * /crm/campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign performance statistics
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign stats (sent, opened, clicked, converted)
 *       404:
 *         description: Campaign not found
 */
router.get('/campaigns/:id/stats', asyncHandler(crmController.getCampaignStats));

/**
 * @swagger
 * /crm/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms, push]
 *               target_audience:
 *                 type: object
 *               content:
 *                 type: string
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created
 *       400:
 *         description: Validation error
 */
router.post(
  '/campaigns',
  validate(createCampaignSchema),
  asyncHandler(crmController.createCampaign)
);

/**
 * @swagger
 * /crm/campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               target_audience:
 *                 type: object
 *     responses:
 *       200:
 *         description: Campaign updated
 *       404:
 *         description: Campaign not found
 */
router.put(
  '/campaigns/:id',
  validate(updateCampaignSchema),
  asyncHandler(crmController.updateCampaign)
);

/**
 * @swagger
 * /crm/campaigns/{id}/launch:
 *   post:
 *     summary: Launch a campaign
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign launched successfully
 *       400:
 *         description: Campaign cannot be launched
 *       404:
 *         description: Campaign not found
 */
router.post(
  '/campaigns/:id/launch',
  validate(campaignIdSchema),
  asyncHandler(crmController.launchCampaign)
);

// =============================================================================
// WORKFLOWS
// =============================================================================

/**
 * @swagger
 * /crm/workflows:
 *   get:
 *     summary: List all automation workflows
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of CRM automation workflows
 *       401:
 *         description: Unauthorized
 */
router.get('/workflows', asyncHandler(crmController.getWorkflows));

/**
 * @swagger
 * /crm/workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow details with trigger and action config
 *       404:
 *         description: Workflow not found
 */
router.get('/workflows/:id', asyncHandler(crmController.getWorkflow));

/**
 * @swagger
 * /crm/workflows:
 *   post:
 *     summary: Create a new automation workflow
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, trigger, actions]
 *             properties:
 *               name:
 *                 type: string
 *               trigger:
 *                 type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *               enabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Workflow created
 *       400:
 *         description: Validation error
 */
router.post(
  '/workflows',
  validate(createWorkflowSchema),
  asyncHandler(crmController.createWorkflow)
);

/**
 * @swagger
 * /crm/workflows/{id}:
 *   put:
 *     summary: Update a workflow
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               trigger:
 *                 type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Workflow updated
 *       404:
 *         description: Workflow not found
 */
router.put('/workflows/:id', asyncHandler(crmController.updateWorkflow));

/**
 * @swagger
 * /crm/workflows/{id}/toggle:
 *   post:
 *     summary: Toggle workflow enabled/disabled
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow toggled
 *       404:
 *         description: Workflow not found
 */
router.post('/workflows/:id/toggle', asyncHandler(crmController.toggleWorkflow));

// =============================================================================
// RETENTION
// =============================================================================

/**
 * @swagger
 * /crm/retention:
 *   get:
 *     summary: Get retention dashboard data
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Retention metrics and trends
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/retention',
  validate(retentionQuerySchema),
  asyncHandler(crmController.getRetentionDashboard)
);

/**
 * @swagger
 * /crm/retention/churn:
 *   get:
 *     summary: Get churn analysis
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Churn rate, reasons, and at-risk patients
 *       401:
 *         description: Unauthorized
 */
router.get('/retention/churn', asyncHandler(crmController.getChurnAnalysis));

/**
 * @swagger
 * /crm/retention/cohorts:
 *   get:
 *     summary: Get cohort retention analysis
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retention rates grouped by patient cohort
 *       401:
 *         description: Unauthorized
 */
router.get('/retention/cohorts', asyncHandler(crmController.getCohortRetention));

// =============================================================================
// WAITLIST
// =============================================================================

/**
 * @swagger
 * /crm/waitlist:
 *   get:
 *     summary: Get waitlist entries
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients on waitlist
 *       401:
 *         description: Unauthorized
 */
router.get('/waitlist', asyncHandler(crmController.getWaitlist));

/**
 * @swagger
 * /crm/waitlist:
 *   post:
 *     summary: Add a patient to the waitlist
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               preferred_times:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient added to waitlist
 *       400:
 *         description: Validation error
 */
router.post('/waitlist', validate(addToWaitlistSchema), asyncHandler(crmController.addToWaitlist));

/**
 * @swagger
 * /crm/waitlist/{id}:
 *   put:
 *     summary: Update a waitlist entry
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferred_times:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Waitlist entry updated
 *       404:
 *         description: Entry not found
 */
router.put('/waitlist/:id', asyncHandler(crmController.updateWaitlistEntry));

/**
 * @swagger
 * /crm/waitlist/notify:
 *   post:
 *     summary: Notify waitlisted patients about availability
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slot_time:
 *                 type: string
 *                 format: date-time
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications sent to eligible waitlisted patients
 *       400:
 *         description: Notification failed
 */
router.post('/waitlist/notify', asyncHandler(crmController.notifyWaitlist));

// =============================================================================
// CRM SETTINGS
// =============================================================================

/**
 * @swagger
 * /crm/settings:
 *   get:
 *     summary: Get CRM settings for the organization
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CRM configuration settings
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', asyncHandler(crmController.getCRMSettings));

/**
 * @swagger
 * /crm/settings:
 *   put:
 *     summary: Update CRM settings
 *     tags: [CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lead_auto_assign:
 *                 type: boolean
 *               default_lifecycle_rules:
 *                 type: object
 *               notification_preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: CRM settings updated
 *       403:
 *         description: Admin access required
 */
router.put(
  '/settings',
  requireRole(['ADMIN']),
  validate(updateCRMSettingsSchema),
  asyncHandler(crmController.updateCRMSettings)
);

export default router;
