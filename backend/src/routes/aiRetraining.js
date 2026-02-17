/**
 * AI Retraining Routes
 * Admin-only endpoints for managing AI model retraining pipeline
 */

import express from 'express';
import * as aiRetrainingController from '../controllers/aiRetraining.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  triggerRetrainingSchema,
  getHistorySchema,
  exportFeedbackSchema,
  rollbackModelSchema,
  testModelSchema,
  generatePairsSchema,
  evaluateSuggestionSchema,
  augmentDataSchema,
  triggerJobSchema,
} from '../validators/aiRetraining.validators.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireOrganization);
router.use(requireRole(['ADMIN']));

// ============================================================
// RETRAINING PIPELINE ROUTES
// ============================================================

/**
 * @swagger
 * /ai-retraining/trigger-retraining:
 *   post:
 *     summary: Trigger manual retraining pipeline
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dryRun:
 *                 type: boolean
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Retraining triggered
 *       403:
 *         description: Admin only
 */
router.post(
  '/trigger-retraining',
  validate(triggerRetrainingSchema),
  aiRetrainingController.triggerRetraining
);

/**
 * @swagger
 * /ai-retraining/status:
 *   get:
 *     summary: Get current retraining status and thresholds
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retraining status with threshold data
 */
router.get('/status', aiRetrainingController.getRetrainingStatus);

/**
 * @swagger
 * /ai-retraining/history:
 *   get:
 *     summary: Get past retraining events
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Retraining event history
 */
router.get('/history', validate(getHistorySchema), aiRetrainingController.getRetrainingHistory);

/**
 * @swagger
 * /ai-retraining/export-feedback:
 *   post:
 *     summary: Export feedback data for training review
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minRating:
 *                 type: number
 *               days:
 *                 type: integer
 *               includeRejected:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Exported feedback data
 */
router.post(
  '/export-feedback',
  validate(exportFeedbackSchema),
  aiRetrainingController.exportFeedback
);

// ============================================================
// MODEL MANAGEMENT ROUTES
// ============================================================

/**
 * @swagger
 * /ai-retraining/model/rollback:
 *   post:
 *     summary: Rollback to a previous model version
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetVersion]
 *             properties:
 *               targetVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rollback completed
 */
router.post('/model/rollback', validate(rollbackModelSchema), aiRetrainingController.rollbackModel);

/**
 * @swagger
 * /ai-retraining/model/test:
 *   post:
 *     summary: Test current or specified model with test cases
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test results
 */
router.post('/model/test', validate(testModelSchema), aiRetrainingController.testModel);

// ============================================================
// RLAIF (AI-ASSISTED FEEDBACK) ROUTES
// ============================================================

/**
 * @swagger
 * /ai-retraining/rlaif/generate-pairs:
 *   post:
 *     summary: Generate preference pairs from suggestions using RLAIF
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suggestions]
 *             properties:
 *               suggestions:
 *                 type: array
 *                 items:
 *                   type: object
 *               suggestionType:
 *                 type: string
 *               maxPairs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Generated preference pairs
 */
router.post(
  '/rlaif/generate-pairs',
  validate(generatePairsSchema),
  aiRetrainingController.generatePreferencePairs
);

/**
 * @swagger
 * /ai-retraining/rlaif/evaluate:
 *   post:
 *     summary: Evaluate suggestion quality using RLAIF
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suggestion, suggestionType]
 *             properties:
 *               suggestion:
 *                 type: string
 *               suggestionType:
 *                 type: string
 *               contextData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quality evaluation result
 */
router.post(
  '/rlaif/evaluate',
  validate(evaluateSuggestionSchema),
  aiRetrainingController.evaluateSuggestion
);

/**
 * @swagger
 * /ai-retraining/rlaif/stats:
 *   get:
 *     summary: Get RLAIF statistics
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: RLAIF stats (pairs generated, evaluations)
 */
router.get('/rlaif/stats', aiRetrainingController.getRLAIFStats);

/**
 * @swagger
 * /ai-retraining/rlaif/criteria:
 *   get:
 *     summary: Get quality criteria used for RLAIF evaluation
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Quality criteria configuration
 */
router.get('/rlaif/criteria', aiRetrainingController.getQualityCriteria);

/**
 * @swagger
 * /ai-retraining/rlaif/augment:
 *   post:
 *     summary: Augment training data with RLAIF-generated pairs
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [baseExamples]
 *             properties:
 *               baseExamples:
 *                 type: array
 *                 items:
 *                   type: object
 *               targetCount:
 *                 type: integer
 *               suggestionType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Augmented training data
 */
router.post(
  '/rlaif/augment',
  validate(augmentDataSchema),
  aiRetrainingController.augmentTrainingData
);

// ============================================================
// SCHEDULER MANAGEMENT ROUTES
// ============================================================

/**
 * @swagger
 * /ai-retraining/scheduler/trigger:
 *   post:
 *     summary: Manually trigger a scheduled job
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobName]
 *             properties:
 *               jobName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job triggered
 */
router.post(
  '/scheduler/trigger',
  validate(triggerJobSchema),
  aiRetrainingController.triggerScheduledJob
);

/**
 * @swagger
 * /ai-retraining/scheduler/status:
 *   get:
 *     summary: Get scheduler status for all jobs
 *     tags: [AI Retraining]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status for all jobs
 */
router.get('/scheduler/status', aiRetrainingController.getSchedulerStatus);

export default router;
