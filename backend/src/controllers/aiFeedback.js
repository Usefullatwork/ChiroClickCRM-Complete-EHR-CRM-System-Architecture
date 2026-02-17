/**
 * AI Feedback Controller
 * Handle AI feedback, performance metrics, and retraining triggers
 */

import * as aiLearningService from '../services/aiLearning.js';
import logger from '../utils/logger.js';

/**
 * Submit feedback on an AI suggestion
 */
export const submitFeedback = async (req, res) => {
  try {
    const { userId, organizationId } = req;
    const feedbackData = {
      ...req.body,
      userId,
      organizationId,
    };

    const feedback = await aiLearningService.recordFeedback(feedbackData);

    res.json({
      success: true,
      data: feedback,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    logger.error('Error submitting AI feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  }
};

/**
 * Get current user's feedback history
 */
export const getMyFeedback = async (req, res) => {
  try {
    const { userId } = req;
    const { _limit = 50, _offset = 0, _suggestionType } = req.query;

    const feedback = await aiLearningService.getUserFeedbackPattern(userId);

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Error getting user feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback history',
    });
  }
};

/**
 * Get current user's feedback statistics
 */
export const getMyStats = async (req, res) => {
  try {
    const { userId } = req;

    const stats = await aiLearningService.getUserFeedbackPattern(userId);

    // Calculate summary stats
    let totalInteractions = 0;
    let totalAccepted = 0;
    let totalRejected = 0;
    let totalRatingSum = 0;
    let ratingCount = 0;

    stats.forEach((s) => {
      totalInteractions += parseInt(s.total_interactions) || 0;
      totalAccepted += parseInt(s.accepted) || 0;
      totalRejected += parseInt(s.rejected) || 0;
      if (s.avg_rating) {
        totalRatingSum += parseFloat(s.avg_rating) * parseInt(s.total_interactions);
        ratingCount += parseInt(s.total_interactions);
      }
    });

    res.json({
      success: true,
      data: {
        totalInteractions,
        totalAccepted,
        totalRejected,
        acceptanceRate:
          totalInteractions > 0 ? ((totalAccepted / totalInteractions) * 100).toFixed(1) : 0,
        avgRating: ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(2) : null,
        byType: stats,
      },
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
    });
  }
};

/**
 * Get overall AI performance metrics (admin only)
 */
export const getPerformanceMetrics = async (req, res) => {
  try {
    const { suggestionType, startDate, endDate, groupBy = 'day' } = req.query;

    const metrics = await aiLearningService.getPerformanceMetrics({
      suggestionType,
      startDate,
      endDate,
      groupBy,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
    });
  }
};

/**
 * Get suggestions that need human review
 */
export const getSuggestionsNeedingReview = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const suggestions = await aiLearningService.getSuggestionsNeedingReview(parseInt(limit));

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error('Error getting suggestions for review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions for review',
    });
  }
};

/**
 * Get common correction patterns
 */
export const getCommonCorrections = async (req, res) => {
  try {
    const { suggestionType, days = 30, minOccurrences = 3 } = req.query;

    const corrections = await aiLearningService.analyzeCommonCorrections({
      suggestionType,
      days: parseInt(days),
      minOccurrences: parseInt(minOccurrences),
    });

    res.json({
      success: true,
      data: corrections,
    });
  } catch (error) {
    logger.error('Error getting common corrections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get common corrections',
    });
  }
};

/**
 * Trigger manual retraining (admin only)
 */
export const triggerRetraining = async (req, res) => {
  try {
    const { userId } = req;
    const { suggestionTypes } = req.body;

    // Check if aiRetraining service exists
    let aiRetrainingService;
    try {
      aiRetrainingService = await import('../services/aiRetraining.js');
    } catch (e) {
      logger.warn('AI retraining service not available');
      return res.status(503).json({
        success: false,
        error: 'AI retraining service is not configured',
      });
    }

    const result = await aiRetrainingService.runRetrainingPipeline({
      triggeredBy: userId,
      suggestionTypes,
      triggerType: 'manual',
    });

    res.json({
      success: true,
      data: result,
      message: 'Retraining triggered successfully',
    });
  } catch (error) {
    logger.error('Error triggering retraining:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger retraining',
    });
  }
};

/**
 * Get retraining status
 */
export const getRetrainingStatus = async (req, res) => {
  try {
    // Check threshold status
    const thresholdResults = await aiLearningService.checkRetrainingThreshold();

    res.json({
      success: true,
      data: {
        needsRetraining: thresholdResults.length > 0,
        triggeredTypes: thresholdResults,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error getting retraining status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retraining status',
    });
  }
};

/**
 * Get retraining history
 */
export const getRetrainingHistory = async (req, res) => {
  try {
    const { _organizationId } = req;
    const { _limit = 10 } = req.query;

    // This would query the ai_retraining_events table
    // For now, return empty array if table doesn't exist
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    logger.error('Error getting retraining history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retraining history',
    });
  }
};

/**
 * Rollback to previous model version
 */
export const rollbackModel = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { userId } = req;

    let aiRetrainingService;
    try {
      aiRetrainingService = await import('../services/aiRetraining.js');
    } catch (e) {
      return res.status(503).json({
        success: false,
        error: 'AI retraining service is not configured',
      });
    }

    const result = await aiRetrainingService.rollbackModel(versionId, userId);

    res.json({
      success: true,
      data: result,
      message: 'Model rolled back successfully',
    });
  } catch (error) {
    logger.error('Error rolling back model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback model',
    });
  }
};

/**
 * Export feedback data for training
 */
export const exportFeedback = async (req, res) => {
  try {
    const { format = 'jsonl', suggestionType, minRating, days } = req.query;

    const data = await aiLearningService.exportFeedbackForTraining({
      format,
      suggestionType,
      minRating: minRating ? parseInt(minRating) : undefined,
      days: days ? parseInt(days) : undefined,
    });

    if (format === 'jsonl') {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Content-Disposition', 'attachment; filename=ai_feedback.jsonl');
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ai_feedback.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(data);
  } catch (error) {
    logger.error('Error exporting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback',
    });
  }
};

export default {
  submitFeedback,
  getMyFeedback,
  getMyStats,
  getPerformanceMetrics,
  getSuggestionsNeedingReview,
  getCommonCorrections,
  triggerRetraining,
  getRetrainingStatus,
  getRetrainingHistory,
  rollbackModel,
  exportFeedback,
};
