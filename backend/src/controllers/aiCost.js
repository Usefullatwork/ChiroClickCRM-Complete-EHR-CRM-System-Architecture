/**
 * AI Cost Analytics Controller
 * Provides cost visibility for Claude API usage: spend vs budget,
 * task breakdown, cache hit rate, provider comparison.
 */

import { query } from '../config/database.js';
import budgetTracker from '../services/providers/budgetTracker.js';
import logger from '../utils/logger.js';

/**
 * Get current budget status (daily/monthly spend vs limits)
 */
export const getBudgetStatus = async (req, res) => {
  try {
    const status = budgetTracker.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error getting budget status:', error);
    res.status(500).json({ success: false, error: 'Failed to get budget status' });
  }
};

/**
 * Get cost breakdown by task type
 */
export const getCostByTask = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

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

    const result = await query(
      `SELECT
        task_type,
        provider,
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
        ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_request,
        ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms
      FROM ai_api_usage
      WHERE 1=1 ${dateFilter}
      GROUP BY task_type, provider, model
      ORDER BY total_cost_usd DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting cost by task:', error);
    res.status(500).json({ success: false, error: 'Failed to get cost breakdown' });
  }
};

/**
 * Get cache efficiency metrics
 */
export const getCacheEfficiency = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        model,
        COUNT(*) as total_requests,
        SUM(cache_read_tokens) as total_cache_reads,
        SUM(input_tokens) as total_input_tokens,
        CASE WHEN SUM(input_tokens) > 0
          THEN ROUND((SUM(cache_read_tokens)::numeric / SUM(input_tokens) * 100), 1)
          ELSE 0
        END as cache_hit_rate_pct,
        ROUND(SUM(cost_usd)::numeric, 4) as total_cost,
        ROUND(AVG(cost_usd)::numeric, 6) as avg_cost
      FROM ai_api_usage
      WHERE provider = 'claude'
      GROUP BY model
      ORDER BY total_requests DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting cache efficiency:', error);
    res.status(500).json({ success: false, error: 'Failed to get cache metrics' });
  }
};

/**
 * Get daily cost trend
 */
export const getDailyCostTrend = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days || '30', 10), 365);

    const result = await query(
      `SELECT
        DATE(created_at) as date,
        provider,
        COUNT(*) as request_count,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        ROUND(SUM(cost_usd)::numeric, 4) as cost_usd
      FROM ai_api_usage
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at), provider
      ORDER BY date DESC`,
      [days]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting daily cost trend:', error);
    res.status(500).json({ success: false, error: 'Failed to get cost trend' });
  }
};

/**
 * Get provider comparison (Ollama vs Claude side-by-side)
 */
export const getProviderComparison = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        provider,
        COUNT(*) as total_requests,
        SUM(input_tokens + output_tokens) as total_tokens,
        ROUND(AVG(duration_ms)::numeric, 0) as avg_latency_ms,
        ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd
      FROM ai_api_usage
      GROUP BY provider
      ORDER BY provider`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.message?.includes('does not exist')) {
      return res.json({ success: true, data: [] });
    }
    logger.error('Error getting provider comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to get provider comparison' });
  }
};
