/**
 * AI Feedback Routes
 * Endpoints for AI feedback, performance metrics, and retraining
 */

import express from 'express';
import * as aiFeedbackController from '../controllers/aiFeedback.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  submitFeedbackSchema,
  getMyFeedbackSchema,
  getPerformanceSchema,
  getSuggestionsReviewSchema,
  rollbackModelSchema,
  exportFeedbackSchema,
} from '../validators/aiFeedback.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// =====================================================
// USER FEEDBACK ENDPOINTS
// =====================================================

/**
 * @swagger
 * /ai-feedback/feedback:
 *   post:
 *     summary: Submit feedback on an AI suggestion
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suggestionId, accepted]
 *             properties:
 *               suggestionId:
 *                 type: string
 *                 format: uuid
 *               accepted:
 *                 type: boolean
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               correctedText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
router.post('/feedback', validate(submitFeedbackSchema), aiFeedbackController.submitFeedback);

/**
 * @swagger
 * /ai-feedback/feedback/me:
 *   get:
 *     summary: Get current user's feedback history
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's feedback history
 */
router.get('/feedback/me', validate(getMyFeedbackSchema), aiFeedbackController.getMyFeedback);

/**
 * @swagger
 * /ai-feedback/feedback/me/stats:
 *   get:
 *     summary: Get current user's feedback statistics
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User feedback stats (acceptance rate, avg rating)
 */
router.get('/feedback/me/stats', aiFeedbackController.getMyStats);

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

/**
 * @swagger
 * /ai-feedback/performance:
 *   get:
 *     summary: Get overall AI performance metrics
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overall AI performance metrics
 */
router.get(
  '/performance',
  requireRole(['ADMIN']),
  validate(getPerformanceSchema),
  aiFeedbackController.getPerformanceMetrics
);

/**
 * @swagger
 * /ai-feedback/suggestions/review:
 *   get:
 *     summary: Get suggestions that need human review
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Suggestions pending review
 */
router.get(
  '/suggestions/review',
  requireRole(['ADMIN']),
  validate(getSuggestionsReviewSchema),
  aiFeedbackController.getSuggestionsNeedingReview
);

/**
 * @swagger
 * /ai-feedback/corrections/common:
 *   get:
 *     summary: Get common correction patterns
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Common correction patterns for model improvement
 */
router.get(
  '/corrections/common',
  requireRole(['ADMIN']),
  aiFeedbackController.getCommonCorrections
);

// =====================================================
// RETRAINING ENDPOINTS
// =====================================================

/**
 * @swagger
 * /ai-feedback/retraining/trigger:
 *   post:
 *     summary: Manually trigger AI model retraining
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retraining triggered
 */
router.post('/retraining/trigger', requireRole(['ADMIN']), aiFeedbackController.triggerRetraining);

/**
 * @swagger
 * /ai-feedback/retraining/status:
 *   get:
 *     summary: Get current retraining status
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current retraining status
 */
router.get('/retraining/status', requireRole(['ADMIN']), aiFeedbackController.getRetrainingStatus);

/**
 * @swagger
 * /ai-feedback/retraining/history:
 *   get:
 *     summary: Get retraining history
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retraining history list
 */
router.get(
  '/retraining/history',
  requireRole(['ADMIN']),
  aiFeedbackController.getRetrainingHistory
);

/**
 * @swagger
 * /ai-feedback/model/rollback/{versionId}:
 *   post:
 *     summary: Rollback to a previous model version
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model rolled back
 */
router.post(
  '/model/rollback/:versionId',
  requireRole(['ADMIN']),
  validate(rollbackModelSchema),
  aiFeedbackController.rollbackModel
);

// =====================================================
// EXPORT ENDPOINTS
// =====================================================

/**
 * @swagger
 * /ai-feedback/feedback/export:
 *   get:
 *     summary: Export feedback data for training
 *     tags: [AI Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *     responses:
 *       200:
 *         description: Exported feedback data
 */
router.get(
  '/feedback/export',
  requireRole(['ADMIN']),
  validate(exportFeedbackSchema),
  aiFeedbackController.exportFeedback
);

export default router;
