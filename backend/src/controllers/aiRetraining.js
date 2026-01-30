/**
 * AI Retraining Controller
 * Admin endpoints for managing AI model retraining
 */

import * as aiRetrainingService from '../services/aiRetraining.js';
import * as rlaifService from '../services/rlaif.js';
import * as schedulerService from '../jobs/scheduler.js';
import logger from '../utils/logger.js';

/**
 * Trigger manual retraining pipeline
 * POST /api/v1/ai-retraining/trigger-retraining
 */
export const triggerRetraining = async (req, res) => {
  try {
    const { dryRun = false, options = {} } = req.body;

    logger.info('Manual retraining triggered by admin', {
      userId: req.user?.id,
      dryRun
    });

    // Check if retraining is already in progress
    const status = await aiRetrainingService.getRetrainingStatus();
    if (status.currentEvent?.status === 'running') {
      return res.status(409).json({
        success: false,
        error: 'Retraining already in progress',
        currentEvent: status.currentEvent
      });
    }

    // Run pipeline (in background for non-dry-run)
    if (dryRun) {
      const result = await aiRetrainingService.runRetrainingPipeline({
        trigger: 'manual',
        dryRun: true,
        ...options
      });

      return res.json({
        success: true,
        message: 'Dry run completed',
        data: result
      });
    }

    // Start pipeline in background
    setImmediate(async () => {
      try {
        await aiRetrainingService.runRetrainingPipeline({
          trigger: 'manual',
          dryRun: false,
          ...options
        });
      } catch (error) {
        logger.error('Background retraining failed:', error);
      }
    });

    res.json({
      success: true,
      message: 'Retraining pipeline started in background',
      note: 'Check /retraining/status for progress'
    });
  } catch (error) {
    logger.error('Error triggering retraining:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger retraining',
      details: error.message
    });
  }
};

/**
 * Get current retraining status
 * GET /api/v1/ai-retraining/status
 */
export const getRetrainingStatus = async (req, res) => {
  try {
    const status = await aiRetrainingService.getRetrainingStatus();

    // Get RLAIF stats as well
    let rlaifStats = null;
    try {
      rlaifStats = await rlaifService.getRLAIFStats();
    } catch (e) {
      logger.warn('Could not fetch RLAIF stats:', e.message);
    }

    // Get scheduler status
    let schedulerStatus = null;
    try {
      schedulerStatus = schedulerService.getSchedulerStatus();
    } catch (e) {
      logger.warn('Could not fetch scheduler status:', e.message);
    }

    res.json({
      success: true,
      data: {
        retraining: status,
        rlaif: rlaifStats,
        scheduler: schedulerStatus ? {
          timezone: schedulerStatus.timezone,
          retrainingJob: schedulerStatus.jobs?.find(j => j.name === 'checkRetrainingNeeded')
        } : null
      }
    });
  } catch (error) {
    logger.error('Error getting retraining status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retraining status',
      details: error.message
    });
  }
};

/**
 * Get retraining history
 * GET /api/v1/ai-retraining/history
 */
export const getRetrainingHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const history = await aiRetrainingService.getRetrainingHistory(parseInt(limit));

    res.json({
      success: true,
      data: {
        count: history.length,
        events: history
      }
    });
  } catch (error) {
    logger.error('Error getting retraining history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retraining history',
      details: error.message
    });
  }
};

/**
 * Rollback to previous model version
 * POST /api/v1/ai-retraining/model/rollback
 */
export const rollbackModel = async (req, res) => {
  try {
    const { targetVersion = null } = req.body;

    logger.info('Model rollback requested', {
      userId: req.user?.id,
      targetVersion
    });

    const result = await aiRetrainingService.rollbackModel(targetVersion);

    res.json({
      success: true,
      message: 'Model rolled back successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error rolling back model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback model',
      details: error.message
    });
  }
};

/**
 * Test current or specified model
 * POST /api/v1/ai-retraining/model/test
 */
export const testModel = async (req, res) => {
  try {
    const { modelName = null } = req.body;

    logger.info('Model test requested', {
      userId: req.user?.id,
      modelName
    });

    const result = await aiRetrainingService.testNewModel(modelName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error testing model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test model',
      details: error.message
    });
  }
};

/**
 * Export feedback data for training
 * POST /api/v1/ai-retraining/export-feedback
 */
export const exportFeedback = async (req, res) => {
  try {
    const { minRating = 3, days = 90, includeRejected = false } = req.body;

    const result = await aiRetrainingService.exportFeedbackToTrainingFormat({
      minRating,
      days,
      includeRejected
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error exporting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback',
      details: error.message
    });
  }
};

/**
 * Generate RLAIF preference pairs
 * POST /api/v1/ai-retraining/rlaif/generate-pairs
 */
export const generatePreferencePairs = async (req, res) => {
  try {
    const { suggestions, suggestionType, maxPairs = 50 } = req.body;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 suggestions required to generate preference pairs'
      });
    }

    const result = await rlaifService.generatePreferencePairs(suggestions, {
      suggestionType,
      maxPairs
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error generating preference pairs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preference pairs',
      details: error.message
    });
  }
};

/**
 * Evaluate suggestion quality using RLAIF
 * POST /api/v1/ai-retraining/rlaif/evaluate
 */
export const evaluateSuggestion = async (req, res) => {
  try {
    const { suggestion, suggestionType, contextData = {} } = req.body;

    if (!suggestion) {
      return res.status(400).json({
        success: false,
        error: 'Suggestion text required'
      });
    }

    const result = await rlaifService.evaluateSuggestionQuality(suggestion, {
      suggestionType,
      contextData
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error evaluating suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate suggestion',
      details: error.message
    });
  }
};

/**
 * Get RLAIF statistics
 * GET /api/v1/ai-retraining/rlaif/stats
 */
export const getRLAIFStats = async (req, res) => {
  try {
    const stats = await rlaifService.getRLAIFStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting RLAIF stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get RLAIF stats',
      details: error.message
    });
  }
};

/**
 * Manually trigger a scheduled job
 * POST /api/v1/ai-retraining/scheduler/trigger
 */
export const triggerScheduledJob = async (req, res) => {
  try {
    const { jobName } = req.body;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: 'Job name required'
      });
    }

    logger.info('Scheduled job manually triggered', {
      userId: req.user?.id,
      jobName
    });

    const result = await schedulerService.triggerJob(jobName);

    res.json({
      success: true,
      message: `Job ${jobName} triggered`,
      data: result
    });
  } catch (error) {
    logger.error('Error triggering scheduled job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scheduled job',
      details: error.message
    });
  }
};

/**
 * Get scheduler status
 * GET /api/v1/ai-retraining/scheduler/status
 */
export const getSchedulerStatus = async (req, res) => {
  try {
    const status = schedulerService.getSchedulerStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error.message
    });
  }
};

/**
 * Get quality criteria used for RLAIF evaluation
 * GET /api/v1/ai-retraining/rlaif/criteria
 */
export const getQualityCriteria = async (req, res) => {
  try {
    res.json({
      success: true,
      data: rlaifService.QUALITY_CRITERIA
    });
  } catch (error) {
    logger.error('Error getting quality criteria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quality criteria'
    });
  }
};

/**
 * Augment training data with RLAIF pairs
 * POST /api/v1/ai-retraining/rlaif/augment
 */
export const augmentTrainingData = async (req, res) => {
  try {
    const { baseExamples = [], targetCount = 100, suggestionType = null } = req.body;

    const result = await rlaifService.augmentTrainingData({
      baseExamples,
      targetCount,
      suggestionType
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error augmenting training data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to augment training data',
      details: error.message
    });
  }
};

export default {
  triggerRetraining,
  getRetrainingStatus,
  getRetrainingHistory,
  rollbackModel,
  testModel,
  exportFeedback,
  generatePreferencePairs,
  evaluateSuggestion,
  getRLAIFStats,
  triggerScheduledJob,
  getSchedulerStatus,
  getQualityCriteria,
  augmentTrainingData
};
