/**
 * Treatment Plan Routes
 * CRUD for plans, milestones, and sessions
 */

import express from 'express';
import * as treatmentPlanService from '../services/treatmentPlans.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// TREATMENT PLANS
// ============================================================================

/**
 * @route   POST /api/v1/treatment-plans
 * @desc    Create a new treatment plan
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const practitionerId = req.user?.id;
    const plan = await treatmentPlanService.createPlan({
      ...req.body,
      organizationId,
      practitionerId,
    });
    res.status(201).json(plan);
  } catch (error) {
    logger.error('Error creating treatment plan:', error);
    res
      .status(error.message.includes('Missing required') ? 400 : 500)
      .json({ error: error.message });
  }
});

/**
 * @route   GET /api/v1/treatment-plans/patient/:patientId
 * @desc    Get all plans for a patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/patient/:patientId', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const { status } = req.query;
    const plans = await treatmentPlanService.getPatientPlans(patientId, organizationId, status);
    res.json(plans);
  } catch (error) {
    logger.error('Error getting patient plans:', error);
    res.status(500).json({ error: 'Failed to get treatment plans' });
  }
});

/**
 * @route   GET /api/v1/treatment-plans/:id
 * @desc    Get a single plan with milestones and sessions
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const plan = await treatmentPlanService.getPlan(req.params.id, organizationId);
    if (!plan) return res.status(404).json({ error: 'Treatment plan not found' });
    res.json(plan);
  } catch (error) {
    logger.error('Error getting treatment plan:', error);
    res.status(500).json({ error: 'Failed to get treatment plan' });
  }
});

/**
 * @route   PATCH /api/v1/treatment-plans/:id
 * @desc    Update a treatment plan
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const plan = await treatmentPlanService.updatePlan(req.params.id, organizationId, req.body);
    if (!plan) return res.status(404).json({ error: 'Treatment plan not found' });
    res.json(plan);
  } catch (error) {
    logger.error('Error updating treatment plan:', error);
    res.status(error.message.includes('No valid') ? 400 : 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/v1/treatment-plans/:id/progress
 * @desc    Get plan progress (sessions + milestones)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id/progress', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const progress = await treatmentPlanService.getPlanProgress(req.params.id);
    if (!progress) return res.status(404).json({ error: 'Treatment plan not found' });
    res.json(progress);
  } catch (error) {
    logger.error('Error getting plan progress:', error);
    res.status(500).json({ error: 'Failed to get plan progress' });
  }
});

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * @route   POST /api/v1/treatment-plans/:planId/milestones
 * @desc    Add a milestone to a plan
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:planId/milestones', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const milestone = await treatmentPlanService.addMilestone(req.params.planId, req.body);
    res.status(201).json(milestone);
  } catch (error) {
    logger.error('Error adding milestone:', error);
    res.status(error.message.includes('required') ? 400 : 500).json({ error: error.message });
  }
});

/**
 * @route   PATCH /api/v1/treatment-plans/milestones/:milestoneId
 * @desc    Update a milestone
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch(
  '/milestones/:milestoneId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res) => {
    try {
      const milestone = await treatmentPlanService.updateMilestone(
        req.params.milestoneId,
        req.body
      );
      if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
      res.json(milestone);
    } catch (error) {
      logger.error('Error updating milestone:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * @route   POST /api/v1/treatment-plans/:planId/sessions
 * @desc    Add a session to a plan
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:planId/sessions', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const session = await treatmentPlanService.addSession(req.params.planId, req.body);
    res.status(201).json(session);
  } catch (error) {
    logger.error('Error adding session:', error);
    res.status(error.message.includes('required') ? 400 : 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/v1/treatment-plans/sessions/:sessionId/complete
 * @desc    Mark a session as completed
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/sessions/:sessionId/complete',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res) => {
    try {
      const session = await treatmentPlanService.completeSession(req.params.sessionId, req.body);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      res.json(session);
    } catch (error) {
      logger.error('Error completing session:', error);
      res.status(500).json({ error: 'Failed to complete session' });
    }
  }
);

export default router;
