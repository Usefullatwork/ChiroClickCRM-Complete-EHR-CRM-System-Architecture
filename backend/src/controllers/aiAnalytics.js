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
      dateFilter += ` AND m.period_start >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND m.period_start <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await query(
      `SELECT
        m.model_name,
        COUNT(*) as data_points,
        ROUND(AVG(m.avg_latency_ms)::numeric, 0) as avg_latency_ms,
        ROUND(AVG(m.avg_confidence_score)::numeric, 3) as avg_confidence,
        SUM(m.total_suggestions) as total_requests,
        SUM(m.approved_count) as successful_requests,
        CASE WHEN SUM(m.total_suggestions) > 0
          THEN ROUND((SUM(m.approved_count)::numeric / SUM(m.total_suggestions) * 100), 1)
          ELSE 0
        END as success_rate
      FROM ai_performance_metrics m
      WHERE m.organization_id = $1 ${dateFilter}
      GROUP BY m.model_name
      ORDER BY total_requests DESC`,
      params
    );

    // Feedback-based approval rates (from ai_suggestions feedback columns)
    const feedbackResult = await query(
      `SELECT
        s.model_name,
        COUNT(*) as total_feedback,
        SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN s.feedback_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(s.helpfulness_rating)::numeric, 2) as avg_rating,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100), 1)
          ELSE 0
        END as approval_rate
      FROM ai_suggestions s
      WHERE s.organization_id = $1
        AND s.feedback_status != 'PENDING'
      GROUP BY s.model_name
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
        suggestion_type as task_type,
        COUNT(*) as count,
        ROUND(AVG(request_duration_ms)::numeric, 0) as avg_latency_ms
      FROM ai_suggestions
      WHERE organization_id = $1 ${dateFilter}
      GROUP BY suggestion_type
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
        s.suggestion_type as task_type,
        s.model_name,
        LEFT(s.input_text, 200) as prompt_summary,
        s.confidence_score,
        s.request_duration_ms as latency_ms,
        s.created_at,
        s.feedback_status,
        s.was_helpful as accepted,
        s.helpfulness_rating as user_rating,
        s.feedback_text as correction_text
      FROM ai_suggestions s
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
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [orgId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND s.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND s.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await query(
      `SELECT
        COUNT(*) as total_red_flag_checks,
        SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as true_positives,
        SUM(CASE WHEN s.feedback_status = 'REJECTED' THEN 1 ELSE 0 END) as false_positives,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence,
        ROUND(AVG(s.helpfulness_rating)::numeric, 2) as avg_rating,
        CASE WHEN COUNT(CASE WHEN s.feedback_status != 'PENDING' THEN 1 END) > 0
          THEN ROUND((SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END)::numeric /
            COUNT(CASE WHEN s.feedback_status != 'PENDING' THEN 1 END) * 100), 1)
          ELSE 0
        END as precision_rate
      FROM ai_suggestions s
      WHERE s.organization_id = $1
        AND s.suggestion_type = 'red_flag_analysis' ${dateFilter}`,
      params
    );

    // Monthly trend
    const trendResult = await query(
      `SELECT
        DATE_TRUNC('month', s.created_at) as month,
        COUNT(*) as total,
        SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as accepted,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence
      FROM ai_suggestions s
      WHERE s.organization_id = $1
        AND s.suggestion_type = 'red_flag_analysis' ${dateFilter}
      GROUP BY DATE_TRUNC('month', s.created_at)
      ORDER BY month DESC
      LIMIT 12`,
      params
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
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [orgId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND s.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND s.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await query(
      `SELECT
        s.model_name,
        COUNT(*) as total_suggestions,
        ROUND(AVG(s.confidence_score)::numeric, 3) as avg_confidence,
        ROUND(AVG(s.request_duration_ms)::numeric, 0) as avg_latency_ms,
        COUNT(CASE WHEN s.feedback_status != 'PENDING' THEN 1 END) as total_feedback,
        SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN s.feedback_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(s.helpfulness_rating)::numeric, 2) as avg_user_rating,
        CASE WHEN COUNT(CASE WHEN s.feedback_status != 'PENDING' THEN 1 END) > 0
          THEN ROUND((SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END)::numeric /
            COUNT(CASE WHEN s.feedback_status != 'PENDING' THEN 1 END) * 100), 1)
          ELSE 0
        END as approval_rate
      FROM ai_suggestions s
      WHERE s.organization_id = $1 ${dateFilter}
      GROUP BY s.model_name
      ORDER BY total_suggestions DESC`,
      params
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

/**
 * Submit feedback for an AI suggestion
 */
export const submitFeedback = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.userId;
    const { suggestionId, accepted, rating, correctionText, feedbackStatus } = req.body;

    if (!suggestionId) {
      return res.status(400).json({ success: false, error: 'suggestionId is required' });
    }

    // Map accepted boolean to feedback_status if not explicitly provided
    const status =
      feedbackStatus ||
      (accepted === true ? 'APPROVED' : accepted === false ? 'REJECTED' : 'PENDING');

    const result = await query(
      `UPDATE ai_suggestions SET
        feedback_status = $1,
        was_helpful = $2,
        helpfulness_rating = $3,
        feedback_text = $4,
        feedback_by = $5,
        feedback_at = NOW(),
        updated_at = NOW()
      WHERE id = $6 AND organization_id = $7
      RETURNING id, feedback_status, was_helpful, helpfulness_rating`,
      [status, accepted, rating || null, correctionText || null, userId, suggestionId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Suggestion not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res
        .status(404)
        .json({ success: false, error: 'AI suggestions table not initialized' });
    }
    logger.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
};

/**
 * Get cost per suggestion by joining ai_api_usage with ai_suggestions
 * Bridges cost data with quality data to answer: "What does each approved suggestion cost?"
 */
export const getCostPerSuggestion = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [orgId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND s.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND s.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await query(
      `SELECT
        s.suggestion_type,
        u.provider,
        COUNT(DISTINCT s.id) as total_suggestions,
        SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        CASE WHEN COUNT(DISTINCT s.id) > 0
          THEN ROUND((SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END)::numeric / COUNT(DISTINCT s.id) * 100), 1)
          ELSE 0
        END as approval_rate,
        ROUND(AVG(u.cost_usd)::numeric, 6) as avg_cost_usd,
        CASE WHEN SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END) > 0
          THEN ROUND((SUM(u.cost_usd)::numeric / SUM(CASE WHEN s.feedback_status = 'APPROVED' THEN 1 ELSE 0 END)), 6)
          ELSE NULL
        END as cost_per_approved_suggestion,
        ROUND(AVG(u.duration_ms)::numeric, 0) as avg_latency_ms
      FROM ai_suggestions s
      JOIN ai_api_usage u ON u.task_type = s.suggestion_type AND u.organization_id = s.organization_id
      WHERE s.organization_id = $1 ${dateFilter}
      GROUP BY s.suggestion_type, u.provider
      ORDER BY total_suggestions DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting cost per suggestion:', error);
    res.status(500).json({ success: false, error: 'Failed to get cost per suggestion' });
  }
};

/**
 * Get provider value comparison — merges cost metrics with quality metrics
 * Two-query approach: ai_api_usage (cost) + ai_suggestions (quality), merged by model name
 */
export const getProviderValue = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const days = Math.min(parseInt(req.query.days || '30', 10), 365);

    // Query 1: Cost metrics from ai_api_usage
    const costResult = await query(
      `SELECT
        provider,
        model,
        COUNT(*) as total_requests,
        ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_request,
        ROUND(AVG(duration_ms)::numeric, 0) as avg_latency_ms,
        ROUND(SUM(cost_usd)::numeric, 4) as total_cost,
        CASE WHEN SUM(input_tokens) > 0
          THEN ROUND((SUM(cache_read_tokens)::numeric / SUM(input_tokens) * 100), 1)
          ELSE 0
        END as cache_hit_rate
      FROM ai_api_usage
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '1 day' * $2
      GROUP BY provider, model
      ORDER BY total_requests DESC`,
      [orgId, days]
    );

    // Query 2: Quality metrics from ai_suggestions
    const qualityResult = await query(
      `SELECT
        model_name,
        ROUND(AVG(confidence_score)::numeric, 3) as avg_confidence,
        COUNT(*) as total_suggestions,
        SUM(CASE WHEN feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((SUM(CASE WHEN feedback_status = 'APPROVED' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100), 1)
          ELSE 0
        END as approval_rate
      FROM ai_suggestions
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '1 day' * $2
      GROUP BY model_name`,
      [orgId, days]
    );

    // Merge by model name
    const qualityMap = new Map();
    for (const row of qualityResult.rows) {
      qualityMap.set(row.model_name, row);
    }

    const merged = costResult.rows.map((cost) => {
      const quality = qualityMap.get(cost.model) || {};
      const totalCost = parseFloat(cost.total_cost) || 0;
      const approvedCount = parseInt(quality.approved_count) || 0;

      return {
        provider: cost.provider,
        model: cost.model,
        total_requests: cost.total_requests,
        avg_confidence: quality.avg_confidence || null,
        approval_rate: quality.approval_rate || null,
        avg_cost_per_request: cost.avg_cost_per_request,
        avg_latency_ms: cost.avg_latency_ms,
        suggestions_per_dollar:
          totalCost > 0 ? parseFloat((approvedCount / totalCost).toFixed(1)) : null,
        cache_hit_rate: cost.cache_hit_rate,
      };
    });

    res.json({ success: true, data: merged });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting provider value:', error);
    res.status(500).json({ success: false, error: 'Failed to get provider value' });
  }
};

/**
 * Get cache utilization trends — daily cache reads and estimated savings
 * Only queries ai_api_usage (cache is purely a cost optimization metric)
 */
export const getCacheTrends = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days || '30', 10), 365);

    const result = await query(
      `SELECT
        DATE(created_at) as date,
        model,
        COUNT(*) as total_requests,
        SUM(cache_read_tokens) as cache_reads,
        CASE WHEN SUM(input_tokens) > 0
          THEN ROUND((SUM(cache_read_tokens)::numeric / SUM(input_tokens) * 100), 1)
          ELSE 0
        END as cache_read_pct,
        ROUND((SUM(cache_read_tokens) * CASE
          WHEN model LIKE 'claude-haiku%' THEN (0.8 - 0.08) / 1000000.0
          ELSE (3.0 - 0.3) / 1000000.0
        END)::numeric, 6) as estimated_savings_usd
      FROM ai_api_usage
      WHERE provider = 'claude'
        AND created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at), model
      ORDER BY date DESC, model`,
      [days]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting cache trends:', error);
    res.status(500).json({ success: false, error: 'Failed to get cache trends' });
  }
};
