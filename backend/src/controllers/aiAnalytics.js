/**
 * AI Analytics Controller
 * Provides analytics endpoints for AI model performance, usage, and comparison
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get model performance metrics (approval rate, accuracy, latency)
 */
export const getModelPerformance = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [orgId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND m.metric_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND m.metric_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await query(
      `SELECT
        m.model_name,
        COUNT(*) as data_points,
        ROUND(AVG(m.avg_latency_ms)::numeric, 0) as avg_latency_ms,
        ROUND(AVG(m.avg_confidence)::numeric, 3) as avg_confidence,
        SUM(m.total_requests) as total_requests,
        SUM(m.successful_requests) as successful_requests,
        CASE WHEN SUM(m.total_requests) > 0
          THEN ROUND((SUM(m.successful_requests)::numeric / SUM(m.total_requests) * 100), 1)
          ELSE 0
        END as success_rate
      FROM ai_performance_metrics m
      WHERE m.organization_id = $1 ${dateFilter}
      GROUP BY m.model_name
      ORDER BY total_requests DESC`,
      params
    );

    // Also get feedback-based approval rates
    const feedbackResult = await query(
      `SELECT
        f.model_name,
        COUNT(*) as total_feedback,
        SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN f.accepted = false THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(f.user_rating)::numeric, 2) as avg_rating,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100), 1)
          ELSE 0
        END as approval_rate
      FROM ai_feedback f
      WHERE f.organization_id = $1
      GROUP BY f.model_name
      ORDER BY total_feedback DESC`,
      [orgId]
    );

    res.json({
      success: true,
      data: {
        metrics: result.rows,
        feedback: feedbackResult.rows,
      },
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: { metrics: [], feedback: [] } });
    }
    logger.error('Error getting model performance:', error);
    res.status(500).json({ success: false, error: 'Failed to get model performance' });
  }
};

/**
 * Get usage statistics (request volume by day, task type distribution)
 */
export const getUsageStats = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [orgId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Daily request volume
    const dailyResult = await query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as request_count
      FROM ai_suggestions
      WHERE organization_id = $1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 90`,
      params
    );

    // Task type distribution
    const taskTypeResult = await query(
      `SELECT
        task_type,
        COUNT(*) as count,
        ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms
      FROM ai_suggestions
      WHERE organization_id = $1 ${dateFilter}
      GROUP BY task_type
      ORDER BY count DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        daily: dailyResult.rows,
        taskTypes: taskTypeResult.rows,
      },
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: { daily: [], taskTypes: [] } });
    }
    logger.error('Error getting usage stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get usage stats' });
  }
};

/**
 * Get recent AI suggestions with feedback status
 */
export const getRecentSuggestions = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const result = await query(
      `SELECT
        s.id,
        s.task_type,
        s.model_name,
        s.prompt_summary,
        s.confidence_score,
        s.latency_ms,
        s.created_at,
        f.accepted,
        f.user_rating,
        f.correction_text
      FROM ai_suggestions s
      LEFT JOIN ai_feedback f ON f.suggestion_id = s.id
      WHERE s.organization_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2`,
      [orgId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting recent suggestions:', error);
    res.status(500).json({ success: false, error: 'Failed to get recent suggestions' });
  }
};

/**
 * Get red flag detection accuracy
 */
export const getRedFlagAccuracy = async (req, res) => {
  try {
    const orgId = req.organizationId;

    const result = await query(
      `SELECT
        COUNT(*) as total_red_flag_checks,
        SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END) as true_positives,
        SUM(CASE WHEN f.accepted = false THEN 1 ELSE 0 END) as false_positives,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence,
        ROUND(AVG(f.user_rating)::numeric, 2) as avg_rating,
        CASE WHEN COUNT(f.id) > 0
          THEN ROUND((SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END)::numeric / COUNT(f.id) * 100), 1)
          ELSE 0
        END as precision_rate
      FROM ai_suggestions s
      LEFT JOIN ai_feedback f ON f.suggestion_id = s.id
      WHERE s.organization_id = $1
        AND s.task_type = 'red_flag_analysis'`,
      [orgId]
    );

    // Monthly trend
    const trendResult = await query(
      `SELECT
        DATE_TRUNC('month', s.created_at) as month,
        COUNT(*) as total,
        SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END) as accepted,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence
      FROM ai_suggestions s
      LEFT JOIN ai_feedback f ON f.suggestion_id = s.id
      WHERE s.organization_id = $1
        AND s.task_type = 'red_flag_analysis'
      GROUP BY DATE_TRUNC('month', s.created_at)
      ORDER BY month DESC
      LIMIT 12`,
      [orgId]
    );

    res.json({
      success: true,
      data: {
        summary: result.rows[0],
        trend: trendResult.rows,
      },
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: { summary: {}, trend: [] } });
    }
    logger.error('Error getting red flag accuracy:', error);
    res.status(500).json({ success: false, error: 'Failed to get red flag accuracy' });
  }
};

/**
 * Get side-by-side model comparison
 */
export const getModelComparison = async (req, res) => {
  try {
    const orgId = req.organizationId;

    const result = await query(
      `SELECT
        s.model_name,
        COUNT(*) as total_suggestions,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence,
        ROUND(AVG(s.latency_ms)::numeric, 0) as avg_latency_ms,
        COUNT(f.id) as total_feedback,
        SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN f.accepted = false THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(f.user_rating)::numeric, 2) as avg_user_rating,
        CASE WHEN COUNT(f.id) > 0
          THEN ROUND((SUM(CASE WHEN f.accepted = true THEN 1 ELSE 0 END)::numeric / COUNT(f.id) * 100), 1)
          ELSE 0
        END as approval_rate
      FROM ai_suggestions s
      LEFT JOIN ai_feedback f ON f.suggestion_id = s.id
      WHERE s.organization_id = $1
      GROUP BY s.model_name
      ORDER BY total_suggestions DESC`,
      [orgId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting model comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to get model comparison' });
  }
};
