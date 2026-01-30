/**
 * AI Feedback Routes
 * Endpoints for AI feedback, performance metrics, and retraining
 */

import express from 'express';
import * as aiFeedbackController from '../controllers/aiFeedback.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// =====================================================
// USER FEEDBACK ENDPOINTS
// =====================================================

/**
 * @route   POST /api/v1/ai/feedback
 * @desc    Submit feedback on an AI suggestion
 * @access  Private (All authenticated users)
 */
router.post('/feedback', aiFeedbackController.submitFeedback);

/**
 * @route   GET /api/v1/ai/feedback/me
 * @desc    Get current user's feedback history
 * @access  Private (All authenticated users)
 */
router.get('/feedback/me', aiFeedbackController.getMyFeedback);

/**
 * @route   GET /api/v1/ai/feedback/me/stats
 * @desc    Get current user's feedback statistics
 * @access  Private (All authenticated users)
 */
router.get('/feedback/me/stats', aiFeedbackController.getMyStats);

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

/**
 * @route   GET /api/v1/ai/performance
 * @desc    Get overall AI performance metrics
 * @access  Private (ADMIN only)
 */
router.get('/performance',
  requireRole(['ADMIN']),
  aiFeedbackController.getPerformanceMetrics
);

/**
 * @route   GET /api/v1/ai/suggestions/review
 * @desc    Get suggestions that need human review
 * @access  Private (ADMIN only)
 */
router.get('/suggestions/review',
  requireRole(['ADMIN']),
  aiFeedbackController.getSuggestionsNeedingReview
);

/**
 * @route   GET /api/v1/ai/corrections/common
 * @desc    Get common correction patterns
 * @access  Private (ADMIN only)
 */
router.get('/corrections/common',
  requireRole(['ADMIN']),
  aiFeedbackController.getCommonCorrections
);

// =====================================================
// RETRAINING ENDPOINTS
// =====================================================

/**
 * @route   POST /api/v1/ai/retraining/trigger
 * @desc    Manually trigger AI model retraining
 * @access  Private (ADMIN only)
 */
router.post('/retraining/trigger',
  requireRole(['ADMIN']),
  aiFeedbackController.triggerRetraining
);

/**
 * @route   GET /api/v1/ai/retraining/status
 * @desc    Get current retraining status
 * @access  Private (ADMIN only)
 */
router.get('/retraining/status',
  requireRole(['ADMIN']),
  aiFeedbackController.getRetrainingStatus
);

/**
 * @route   GET /api/v1/ai/retraining/history
 * @desc    Get retraining history
 * @access  Private (ADMIN only)
 */
router.get('/retraining/history',
  requireRole(['ADMIN']),
  aiFeedbackController.getRetrainingHistory
);

/**
 * @route   POST /api/v1/ai/model/rollback/:versionId
 * @desc    Rollback to a previous model version
 * @access  Private (ADMIN only)
 */
router.post('/model/rollback/:versionId',
  requireRole(['ADMIN']),
  aiFeedbackController.rollbackModel
);

// =====================================================
// EXPORT ENDPOINTS
// =====================================================

/**
 * @route   GET /api/v1/ai/feedback/export
 * @desc    Export feedback data for training
 * @access  Private (ADMIN only)
 */
router.get('/feedback/export',
  requireRole(['ADMIN']),
  aiFeedbackController.exportFeedback
);

export default router;
