/**
 * AI Learning and Feedback Service
 * Handles continuous learning from user corrections
 * Implements active learning and feedback loops
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { notifyByRole, NOTIFICATION_TYPES } from './notifications.js';

/**
 * Record user feedback on AI suggestion
 */
export const recordFeedback = async (feedback) => {
  const {
    encounterId,
    suggestionType,
    originalSuggestion,
    userCorrection,
    accepted,
    correctionType,
    confidenceScore,
    feedbackNotes,
    userId,
    templateId,
    contextData,
    userRating,
    timeToDecision,
  } = feedback;

  try {
    const result = await pool.query(
      `INSERT INTO ai_feedback (
        encounter_id,
        suggestion_type,
        original_suggestion,
        user_correction,
        accepted,
        correction_type,
        confidence_score,
        feedback_notes,
        user_id,
        template_id,
        context_data,
        user_rating,
        time_to_decision
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        encounterId,
        suggestionType,
        originalSuggestion,
        userCorrection,
        accepted,
        correctionType,
        confidenceScore,
        feedbackNotes,
        userId,
        templateId,
        contextData ? JSON.stringify(contextData) : null,
        userRating,
        timeToDecision,
      ]
    );

    // Check if retraining threshold reached
    await checkRetrainingThreshold(suggestionType);

    return result.rows[0];
  } catch (error) {
    logger.error('Error recording AI feedback:', error);
    throw error;
  }
};

/**
 * Check if enough feedback accumulated to trigger retraining
 */
export const checkRetrainingThreshold = async (suggestionType = null) => {
  const whereClause = suggestionType ? `WHERE suggestion_type = $1 AND` : 'WHERE';

  const params = suggestionType ? [suggestionType] : [];

  const result = await pool.query(
    `SELECT
      suggestion_type,
      COUNT(*) as feedback_count,
      SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejection_count
    FROM ai_feedback
    ${whereClause} created_at > NOW() - INTERVAL '7 days'
    GROUP BY suggestion_type
    HAVING COUNT(*) >= 50 OR SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) >= 20`,
    params
  );

  if (result.rows.length > 0) {
    // Trigger retraining notification
    logger.info('🔄 Retraining threshold reached:', result.rows);

    for (const row of result.rows) {
      await notifyRetrainingNeeded(row.suggestion_type, {
        feedbackCount: row.feedback_count,
        rejectionCount: row.rejection_count,
      });
    }

    return result.rows;
  }

  return [];
};

/**
 * Analyze common corrections to identify patterns
 */
export const analyzeCommonCorrections = async (options = {}) => {
  const { suggestionType = null, days = 30, minOccurrences = 3 } = options;

  const typeFilter = suggestionType ? 'AND suggestion_type = $1' : '';
  const params = suggestionType ? [suggestionType] : [];

  const result = await pool.query(
    `SELECT
      suggestion_type,
      correction_type,
      COUNT(*) as correction_count,
      ROUND(AVG(confidence_score), 2) as avg_confidence_when_corrected,
      jsonb_agg(
        jsonb_build_object(
          'original', SUBSTRING(original_suggestion, 1, 200),
          'corrected', SUBSTRING(user_correction, 1, 200),
          'confidence', confidence_score
        )
        ORDER BY created_at DESC
      ) FILTER (WHERE user_correction IS NOT NULL) as examples
    FROM ai_feedback
    WHERE created_at > NOW() - make_interval(days => $${params.length + 1})
      ${typeFilter}
    GROUP BY suggestion_type, correction_type
    HAVING COUNT(*) >= $${params.length + 2}
    ORDER BY correction_count DESC`,
    [...params, days, minOccurrences]
  );

  return result.rows;
};

/**
 * Get AI performance metrics
 */
export const getPerformanceMetrics = async (options = {}) => {
  const {
    suggestionType = null,
    startDate = null,
    endDate = null,
    groupBy = 'day', // 'day', 'week', 'month'
  } = options;

  const dateGrouping = {
    day: 'DATE(created_at)',
    week: "DATE_TRUNC('week', created_at)::DATE",
    month: "DATE_TRUNC('month', created_at)::DATE",
  }[groupBy];

  const whereConditions = [];
  const params = [];
  let paramCount = 0;

  if (suggestionType) {
    paramCount++;
    whereConditions.push(`suggestion_type = $${paramCount}`);
    params.push(suggestionType);
  }

  if (startDate) {
    paramCount++;
    whereConditions.push(`created_at >= $${paramCount}`);
    params.push(startDate);
  }

  if (endDate) {
    paramCount++;
    whereConditions.push(`created_at <= $${paramCount}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT
      ${dateGrouping} as period,
      suggestion_type,
      COUNT(*) as total_suggestions,
      SUM(CASE WHEN accepted = true AND correction_type = 'accepted_as_is' THEN 1 ELSE 0 END) as accepted_as_is,
      SUM(CASE WHEN correction_type IN ('minor', 'major') THEN 1 ELSE 0 END) as modified,
      SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejected,
      ROUND(
        (SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
        2
      ) as acceptance_rate,
      ROUND(AVG(confidence_score), 2) as avg_confidence,
      ROUND(AVG(user_rating), 2) as avg_rating,
      ROUND(AVG(time_to_decision) / 1000, 1) as avg_decision_time_seconds
    FROM ai_feedback
    ${whereClause}
    GROUP BY period, suggestion_type
    ORDER BY period DESC, suggestion_type`,
    params
  );

  return result.rows;
};

/**
 * Get suggestions that need review (low confidence, high rejection rate)
 */
export const getSuggestionsNeedingReview = async (limit = 20) => {
  const result = await pool.query(
    `SELECT
      suggestion_type,
      COUNT(*) as occurrence_count,
      AVG(confidence_score) as avg_confidence,
      ROUND(
        (SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
        2
      ) as rejection_rate,
      array_agg(
        DISTINCT SUBSTRING(original_suggestion, 1, 150)
      ) as suggestion_samples
    FROM ai_feedback
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY suggestion_type
    HAVING
      AVG(confidence_score) < 0.7
      OR (SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) > 0.4
    ORDER BY rejection_rate DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows;
};

/**
 * Get user-specific feedback patterns
 */
export const getUserFeedbackPattern = async (userId) => {
  const result = await pool.query(
    `SELECT
      suggestion_type,
      COUNT(*) as total_interactions,
      SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejected,
      ROUND(AVG(user_rating), 2) as avg_rating,
      ROUND(AVG(time_to_decision) / 1000, 1) as avg_decision_seconds,
      MIN(created_at) as first_use,
      MAX(created_at) as last_use
    FROM ai_feedback
    WHERE user_id = $1
    GROUP BY suggestion_type
    ORDER BY total_interactions DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Generate training data from accepted corrections
 * This creates new templates based on user improvements
 */
export const generateTrainingDataFromFeedback = async (options = {}) => {
  const { minRating = 4, days = 90, limit = 100 } = options;

  const result = await pool.query(
    `SELECT
      af.suggestion_type,
      af.user_correction as improved_text,
      af.context_data,
      af.user_rating,
      u.id as practitioner_id,
      u.name as practitioner_name
    FROM ai_feedback af
    JOIN users u ON af.user_id = u.id
    WHERE af.created_at > NOW() - make_interval(days => $1)
      AND af.user_rating >= $2
      AND af.correction_type IN ('minor', 'major')
      AND af.user_correction IS NOT NULL
      AND LENGTH(af.user_correction) > 20
    ORDER BY af.user_rating DESC, af.created_at DESC
    LIMIT $3`,
    [days, minRating, limit]
  );

  return result.rows;
};

/**
 * Notify about retraining needs (implement based on your notification system)
 */
const notifyRetrainingNeeded = async (suggestionType, metrics) => {
  logger.warn('AI retraining threshold reached', {
    alert: true,
    severity: 'WARNING',
    category: 'AI_RETRAINING',
    suggestionType,
    feedbackCount: metrics.feedbackCount,
    rejectionCount: metrics.rejectionCount,
    timestamp: new Date().toISOString(),
  });

  // Persist notification to database for admin dashboard
  try {
    await pool.query(
      `INSERT INTO system_alerts (alert_type, severity, message, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [
        'AI_RETRAINING_NEEDED',
        'WARNING',
        `AI retraining recommended for ${suggestionType}`,
        JSON.stringify({
          suggestionType,
          feedbackCount: metrics.feedbackCount,
          rejectionCount: metrics.rejectionCount,
        }),
      ]
    );
  } catch (alertError) {
    logger.error('Failed to persist retraining notification', { error: alertError.message });
  }

  // Notify admins via in-app notification
  try {
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    if (orgResult.rows.length > 0) {
      await notifyByRole(orgResult.rows[0].id, ['ADMIN', 'PRACTITIONER'], {
        type: NOTIFICATION_TYPES.AI_RETRAINING_READY,
        title: 'AI modell trenger opplæring',
        message: `${metrics.feedbackCount} tilbakemeldinger (${metrics.rejectionCount} avvist) for ${suggestionType}. Vurder ny trening.`,
        priority: 'MEDIUM',
        metadata: { suggestionType, ...metrics },
      });
    }
  } catch (_) {
    // Best-effort
  }
};

/**
 * Export feedback data for external AI training
 * Format compatible with common ML frameworks
 */
export const exportFeedbackForTraining = async (options = {}) => {
  const {
    suggestionType = null,
    minRating = 3,
    days = 180,
    format = 'jsonl', // 'jsonl', 'csv', 'json'
  } = options;

  const params = [days, minRating];
  let paramIndex = 3;
  let typeFilter = '';

  if (suggestionType) {
    typeFilter = `AND suggestion_type = $${paramIndex}`;
    params.push(suggestionType);
    paramIndex++;
  }

  const result = await pool.query(
    `SELECT
      suggestion_type as type,
      original_suggestion as input,
      COALESCE(user_correction, original_suggestion) as output,
      confidence_score as confidence,
      accepted,
      correction_type,
      context_data as context,
      user_rating as rating
    FROM ai_feedback
    WHERE created_at > NOW() - make_interval(days => $1)
      AND user_rating >= $2
      ${typeFilter}
    ORDER BY created_at DESC`,
    params
  );

  if (format === 'jsonl') {
    return result.rows.map((row) => JSON.stringify(row)).join('\n');
  } else if (format === 'csv') {
    // Simple CSV conversion
    const headers = Object.keys(result.rows[0] || {}).join(',');
    const rows = result.rows
      .map((row) =>
        Object.values(row)
          .map((v) => (typeof v === 'object' ? JSON.stringify(v) : v))
          .join(',')
      )
      .join('\n');
    return `${headers}\n${rows}`;
  }

  return result.rows;
};

/**
 * Update daily metrics (should be run via cron job)
 */
export const updateDailyMetrics = async (date = new Date()) => {
  try {
    await pool.query('SELECT update_daily_ai_metrics($1)', [date]);
    logger.info(`✅ Updated AI metrics for ${date.toISOString().split('T')[0]}`);
  } catch (error) {
    logger.error('Error updating daily AI metrics:', error);
    throw error;
  }
};

export default {
  recordFeedback,
  checkRetrainingThreshold,
  analyzeCommonCorrections,
  getPerformanceMetrics,
  getSuggestionsNeedingReview,
  getUserFeedbackPattern,
  generateTrainingDataFromFeedback,
  exportFeedbackForTraining,
  updateDailyMetrics,
};
