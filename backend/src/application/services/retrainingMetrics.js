/**
 * Retraining Metrics
 * Database recording, status queries, and history for AI retraining runs.
 *
 * @module application/services/retrainingMetrics
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';

const RETRAINING_FEEDBACK_THRESHOLD = parseInt(process.env.RETRAINING_FEEDBACK_THRESHOLD || '50');
const RETRAINING_REJECTION_THRESHOLD = parseInt(process.env.RETRAINING_REJECTION_THRESHOLD || '20');

/**
 * Record a training run in the database.
 *
 * @param {string} runId - Unique run identifier
 * @param {string} status - STARTED | COMPLETED | FAILED | VALIDATION_FAILED
 * @param {Object} metadata - Additional metadata to store
 */
export const recordTrainingRun = async (runId, status, metadata = {}) => {
  try {
    await query(
      `INSERT INTO ai_training_runs (id, status, metadata, created_at, completed_at)
       VALUES ($1, $2, $3, NOW(), ${status === 'COMPLETED' || status === 'FAILED' ? 'NOW()' : 'NULL'})
       ON CONFLICT (id) DO UPDATE SET
         status = $2,
         metadata = $3,
         completed_at = ${status === 'COMPLETED' || status === 'FAILED' ? 'NOW()' : 'ai_training_runs.completed_at'}`,
      [runId, status, JSON.stringify(metadata)]
    );
  } catch (error) {
    logger.warn('Error recording training run:', error.message);
  }
};

/**
 * Get the most recent completed training run.
 *
 * @returns {Promise<Object|null>}
 */
export const getLastTrainingRun = async () => {
  try {
    const result = await query(`
      SELECT id, status, metadata, created_at, completed_at
      FROM ai_training_runs
      WHERE status = 'COMPLETED'
      ORDER BY completed_at DESC
      LIMIT 1
    `);
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
};

/**
 * Get training history (ai_training_runs table).
 *
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTrainingHistory = async (limit = 10) => {
  try {
    const result = await query(
      `SELECT id, status, metadata, created_at, completed_at
       FROM ai_training_runs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    logger.warn('Error getting training history:', error.message);
    return [];
  }
};

/**
 * Get retraining status from ai_retraining_events and feedback thresholds.
 *
 * @param {boolean} isRetraining - Whether a run is currently in progress
 * @param {string|null} currentModelVersion
 * @returns {Promise<Object>}
 */
export const getRetrainingStatus = async (isRetraining, currentModelVersion) => {
  try {
    const eventResult = await query(`
      SELECT * FROM ai_retraining_events
      ORDER BY started_at DESC
      LIMIT 1
    `);
    const currentEvent = eventResult.rows[0] || null;

    const thresholdResult = await query(`
      SELECT
        COUNT(*) as feedback_count,
        SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejection_count
      FROM ai_feedback
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND processed_for_training = false
    `);
    const metrics = thresholdResult.rows[0];

    return {
      currentEvent,
      currentModelVersion,
      isRetraining,
      thresholds: {
        feedbackThreshold: RETRAINING_FEEDBACK_THRESHOLD,
        rejectionThreshold: RETRAINING_REJECTION_THRESHOLD,
        currentFeedbackCount: parseInt(metrics.feedback_count || 0),
        currentRejectionCount: parseInt(metrics.rejection_count || 0),
        thresholdReached:
          parseInt(metrics.feedback_count || 0) >= RETRAINING_FEEDBACK_THRESHOLD ||
          parseInt(metrics.rejection_count || 0) >= RETRAINING_REJECTION_THRESHOLD,
      },
    };
  } catch (error) {
    logger.error('Error getting retraining status:', error);
    throw error;
  }
};

/**
 * Get retraining history from ai_retraining_events table.
 *
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRetrainingHistory = async (limit = 20) => {
  try {
    const result = await query(
      `SELECT
        id, model_version, previous_version, status, trigger_type,
        feedback_count, training_examples, started_at, completed_at,
        error_message, test_results, activated_at
       FROM ai_retraining_events
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting retraining history:', error.message);
    return [];
  }
};
