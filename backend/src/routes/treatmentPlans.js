/**
 * Treatment Plan Routes
 * CRUD for plans, milestones, and sessions
 */

import express from 'express';
import * as treatmentPlanService from '../services/treatmentPlans.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  createPlanSchema,
  getPatientPlansSchema,
  getPlanSchema,
  updatePlanSchema,
  getPlanProgressSchema,
  addMilestoneSchema,
  updateMilestoneSchema,
  addSessionSchema,
  completeSessionSchema,
} from '../validators/treatmentPlan.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// TREATMENT PLANS
// ============================================================================

/**
 * @swagger
 * /treatment-plans:
 *   post:
 *     summary: Create a new treatment plan
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - title
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the patient this plan belongs to
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Title of the treatment plan
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               diagnosisCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 20
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *               estimatedSessions:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 200
 *               frequency:
 *                 type: string
 *                 maxLength: 100
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *     responses:
 *       201:
 *         description: Treatment plan created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createPlanSchema),
  async (req, res) => {
    const { organizationId } = req;
    const practitionerId = req.user?.id;
    const plan = await treatmentPlanService.createPlan({
      ...req.body,
      organizationId,
      practitionerId,
    });
    res.status(201).json(plan);
  }
);

/**
 * @swagger
 * /treatment-plans/patient/{patientId}:
 *   get:
 *     summary: Get all treatment plans for a patient
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, completed, cancelled]
 *         description: Filter plans by status
 *     responses:
 *       200:
 *         description: List of treatment plans for the patient
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 */
router.get(
  '/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientPlansSchema),
  async (req, res) => {
    const { organizationId } = req;
    const { patientId } = req.params;
    const { status } = req.query;
    const plans = await treatmentPlanService.getPatientPlans(patientId, organizationId, status);
    res.json(plans);
  }
);

/**
 * @swagger
 * /treatment-plans/{planId}:
 *   get:
 *     summary: Get a single treatment plan with its milestones and sessions
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the treatment plan
 *     responses:
 *       200:
 *         description: Treatment plan with milestones and sessions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 *       404:
 *         description: Treatment plan not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPlanSchema),
  async (req, res) => {
    const { organizationId } = req;
    const plan = await treatmentPlanService.getPlan(req.params.id, organizationId);
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    res.json(plan);
  }
);

/**
 * @swagger
 * /treatment-plans/{planId}:
 *   patch:
 *     summary: Update a treatment plan
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the treatment plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               diagnosisCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 20
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *               estimatedSessions:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 200
 *               frequency:
 *                 type: string
 *                 maxLength: 100
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Treatment plan updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 *       404:
 *         description: Treatment plan not found
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updatePlanSchema),
  async (req, res) => {
    const { organizationId } = req;
    const plan = await treatmentPlanService.updatePlan(req.params.id, organizationId, req.body);
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    res.json(plan);
  }
);

/**
 * @swagger
 * /treatment-plans/{planId}/progress:
 *   get:
 *     summary: Get plan progress including sessions and milestones completion
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the treatment plan
 *     responses:
 *       200:
 *         description: Plan progress data with session and milestone summaries
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 *       404:
 *         description: Treatment plan not found
 */
router.get(
  '/:id/progress',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPlanProgressSchema),
  async (req, res) => {
    const progress = await treatmentPlanService.getPlanProgress(req.params.id);
    if (!progress) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    res.json(progress);
  }
);

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * @swagger
 * /treatment-plans/{planId}/milestones:
 *   post:
 *     summary: Add a milestone to a treatment plan
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the treatment plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Title of the milestone
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               targetDate:
 *                 type: string
 *                 format: date
 *               targetSessionNumber:
 *                 type: integer
 *                 minimum: 1
 *                 description: Session number at which this milestone should be reached
 *               criteria:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Success criteria for the milestone
 *     responses:
 *       201:
 *         description: Milestone added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 */
router.post(
  '/:planId/milestones',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(addMilestoneSchema),
  async (req, res) => {
    const milestone = await treatmentPlanService.addMilestone(req.params.planId, req.body);
    res.status(201).json(milestone);
  }
);

/**
 * @swagger
 * /treatment-plans/milestones/{milestoneId}:
 *   patch:
 *     summary: Update a milestone
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the milestone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               targetDate:
 *                 type: string
 *                 format: date
 *               targetSessionNumber:
 *                 type: integer
 *                 minimum: 1
 *               criteria:
 *                 type: string
 *                 maxLength: 1000
 *               status:
 *                 type: string
 *                 enum: [pending, achieved, missed]
 *               achievedDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Milestone updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 *       404:
 *         description: Milestone not found
 */
router.patch(
  '/milestones/:milestoneId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateMilestoneSchema),
  async (req, res) => {
    const milestone = await treatmentPlanService.updateMilestone(req.params.milestoneId, req.body);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json(milestone);
  }
);

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * @swagger
 * /treatment-plans/{planId}/sessions:
 *   post:
 *     summary: Add a session to a treatment plan
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the treatment plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the linked clinical encounter
 *               sessionNumber:
 *                 type: integer
 *                 minimum: 1
 *                 description: Sequential number of this session within the plan
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *               sessionDate:
 *                 type: string
 *                 format: date
 *               treatments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Treatment codes or details applied in this session
 *     responses:
 *       201:
 *         description: Session added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 */
router.post(
  '/:planId/sessions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(addSessionSchema),
  async (req, res) => {
    const session = await treatmentPlanService.addSession(req.params.planId, req.body);
    res.status(201).json(session);
  }
);

/**
 * @swagger
 * /treatment-plans/sessions/{sessionId}/complete:
 *   post:
 *     summary: Mark a session as completed
 *     tags: [Treatment Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the session to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Session notes
 *               outcomeNotes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Notes on treatment outcome
 *               vasScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Visual Analogue Scale pain score (0-10)
 *     responses:
 *       200:
 *         description: Session marked as completed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN or PRACTITIONER role
 *       404:
 *         description: Session not found
 */
router.post(
  '/sessions/:sessionId/complete',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(completeSessionSchema),
  async (req, res) => {
    const session = await treatmentPlanService.completeSession(req.params.sessionId, req.body);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  }
);

export default router;
