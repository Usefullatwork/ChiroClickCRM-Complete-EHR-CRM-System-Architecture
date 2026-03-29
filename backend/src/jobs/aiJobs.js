/**
 * AI Jobs
 * Scheduled handlers for AI metrics, retraining checks,
 * weekly digest, and training data backup.
 *
 * @module jobs/aiJobs
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Update daily AI metrics.
 * DAILY: At midnight (00:00) Europe/Oslo.
 *
 * @param {Object} services - Loaded service references
 * @returns {Promise<Object>}
 */
export const updateDailyAIMetrics = async (services) => {
  const { aiLearningService } = services;

  if (!aiLearningService) {
    logger.debug('AI Learning service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    logger.info('Updating daily AI metrics for', yesterday.toISOString().split('T')[0]);
    await aiLearningService.updateDailyMetrics(yesterday);

    const metricsResult = await query(
      `SELECT
        suggestion_type,
        COUNT(*) as total,
        SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END) as accepted,
        ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
        ROUND(AVG(user_rating)::numeric, 2) as avg_rating
       FROM ai_feedback
       WHERE DATE(created_at) = $1
       GROUP BY suggestion_type`,
      [yesterday.toISOString().split('T')[0]]
    );

    const result = {
      date: yesterday.toISOString().split('T')[0],
      metrics: metricsResult.rows,
    };

    logger.info('Daily AI metrics updated:', result);
    return result;
  } catch (error) {
    logger.error('Error updating daily AI metrics:', error);
    throw error;
  }
};

/**
 * Check if AI retraining is needed.
 * WEEKLY: Monday at 06:00 Europe/Oslo.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const checkRetrainingNeeded = async (services) => {
  const { aiLearningService, aiRetrainingService } = services;

  if (!aiLearningService || !aiRetrainingService) {
    logger.debug('AI services not available for retraining check');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Checking if AI retraining is needed...');
    const result = await aiRetrainingService.checkAndTriggerRetraining();

    if (result.triggered) {
      logger.info('Retraining triggered:', result);
    } else {
      logger.info('No retraining needed:', result.reason);
    }

    return result;
  } catch (error) {
    logger.error('Error checking retraining threshold:', error);
    throw error;
  }
};

/**
 * Send weekly AI analytics digest report.
 * WEEKLY: Monday at 07:00 Europe/Oslo.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const sendWeeklyAIDigest = async (services) => {
  const { reportService } = services;

  if (!reportService) {
    logger.debug('Report service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Sending weekly AI analytics digest...');
    const result = await reportService.generateWeeklyAIDigest();
    logger.info('Weekly AI digest complete:', {
      totalSuggestions: result.stats.totalSuggestions,
    });
    return result.stats;
  } catch (error) {
    logger.error('Error sending weekly AI digest:', error);
    throw error;
  }
};

/**
 * Backup AI training data.
 * DAILY: At 01:00 Europe/Oslo.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const backupTrainingData = async (services) => {
  const { aiLearningService } = services;

  if (!aiLearningService) {
    logger.debug('AI Learning service not available for backup');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Backing up training data...');

    const fs = await import('fs');
    const path = await import('path');

    const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
    const BACKUP_DIR = path.default.join(TRAINING_DIR, 'backup');

    if (!fs.default.existsSync(BACKUP_DIR)) {
      fs.default.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const feedbackData = await aiLearningService.exportFeedbackForTraining({
      days: 30,
      format: 'json',
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.default.join(BACKUP_DIR, `feedback_backup_${timestamp}.json`);

    fs.default.writeFileSync(backupPath, JSON.stringify(feedbackData, null, 2));

    // Clean up old backups (keep 7 days)
    const backupFiles = fs.default
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('feedback_backup_'))
      .sort()
      .reverse();

    let removed = 0;
    for (let i = 7; i < backupFiles.length; i++) {
      fs.default.unlinkSync(path.default.join(BACKUP_DIR, backupFiles[i]));
      removed++;
    }

    const result = {
      backupPath,
      recordsBackedUp: Array.isArray(feedbackData) ? feedbackData.length : 0,
      oldBackupsRemoved: removed,
    };

    logger.info('Training data backup complete:', result);
    return result;
  } catch (error) {
    logger.error('Error backing up training data:', error);
    throw error;
  }
};
