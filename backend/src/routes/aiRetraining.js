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
 * @route   POST /api/v1/ai-retraining/trigger-retraining
 * @desc    Trigger manual retraining pipeline
 * @access  Private (ADMIN only)
 * @body    { dryRun: boolean, options: object }
 */
router.post(
  '/trigger-retraining',
  validate(triggerRetrainingSchema),
  aiRetrainingController.triggerRetraining
);

/**
 * @route   GET /api/v1/ai-retraining/status
 * @desc    Get current retraining status and thresholds
 * @access  Private (ADMIN only)
 */
router.get('/status', aiRetrainingController.getRetrainingStatus);

/**
 * @route   GET /api/v1/ai-retraining/history
 * @desc    Get past retraining events
 * @access  Private (ADMIN only)
 * @query   { limit: number }
 */
router.get('/history', validate(getHistorySchema), aiRetrainingController.getRetrainingHistory);

/**
 * @route   POST /api/v1/ai-retraining/export-feedback
 * @desc    Export feedback data for training review
 * @access  Private (ADMIN only)
 * @body    { minRating: number, days: number, includeRejected: boolean }
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
 * @route   POST /api/v1/ai-retraining/model/rollback
 * @desc    Rollback to a previous model version
 * @access  Private (ADMIN only)
 * @body    { targetVersion: string }
 */
router.post('/model/rollback', validate(rollbackModelSchema), aiRetrainingController.rollbackModel);

/**
 * @route   POST /api/v1/ai-retraining/model/test
 * @desc    Test current or specified model with test cases
 * @access  Private (ADMIN only)
 * @body    { modelName: string }
 */
router.post('/model/test', validate(testModelSchema), aiRetrainingController.testModel);

// ============================================================
// RLAIF (AI-ASSISTED FEEDBACK) ROUTES
// ============================================================

/**
 * @route   POST /api/v1/ai-retraining/rlaif/generate-pairs
 * @desc    Generate preference pairs from suggestions using Claude
 * @access  Private (ADMIN only)
 * @body    { suggestions: array, suggestionType: string, maxPairs: number }
 */
router.post(
  '/rlaif/generate-pairs',
  validate(generatePairsSchema),
  aiRetrainingController.generatePreferencePairs
);

/**
 * @route   POST /api/v1/ai-retraining/rlaif/evaluate
 * @desc    Evaluate suggestion quality using RLAIF
 * @access  Private (ADMIN only)
 * @body    { suggestion: string, suggestionType: string, contextData: object }
 */
router.post(
  '/rlaif/evaluate',
  validate(evaluateSuggestionSchema),
  aiRetrainingController.evaluateSuggestion
);

/**
 * @route   GET /api/v1/ai-retraining/rlaif/stats
 * @desc    Get RLAIF statistics (pairs generated, evaluations, etc.)
 * @access  Private (ADMIN only)
 */
router.get('/rlaif/stats', aiRetrainingController.getRLAIFStats);

/**
 * @route   GET /api/v1/ai-retraining/rlaif/criteria
 * @desc    Get quality criteria used for RLAIF evaluation
 * @access  Private (ADMIN only)
 */
router.get('/rlaif/criteria', aiRetrainingController.getQualityCriteria);

/**
 * @route   POST /api/v1/ai-retraining/rlaif/augment
 * @desc    Augment training data with RLAIF-generated pairs
 * @access  Private (ADMIN only)
 * @body    { baseExamples: array, targetCount: number, suggestionType: string }
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
 * @route   POST /api/v1/ai-retraining/scheduler/trigger
 * @desc    Manually trigger a scheduled job
 * @access  Private (ADMIN only)
 * @body    { jobName: string }
 */
router.post(
  '/scheduler/trigger',
  validate(triggerJobSchema),
  aiRetrainingController.triggerScheduledJob
);

/**
 * @route   GET /api/v1/ai-retraining/scheduler/status
 * @desc    Get scheduler status for all jobs
 * @access  Private (ADMIN only)
 */
router.get('/scheduler/status', aiRetrainingController.getSchedulerStatus);

export default router;
