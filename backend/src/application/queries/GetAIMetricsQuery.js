/**
 * Get AI Metrics Query
 * CQRS query for retrieving AI performance metrics
 */

import logger from '../../utils/logger.js';
import { query } from '../../db/index.js';
import circuitBreakerRegistry from '../../infrastructure/resilience/CircuitBreakerRegistry.js';
import eventBus from '../../domain/events/EventBus.js';
import { AIEventTypes } from '../../domain/events/DomainEvents.js';

/**
 * Query payload for getting AI metrics
 * @typedef {Object} GetAIMetricsPayload
 * @property {string} organizationId - Organization ID
 * @property {string} [period] - Time period: 'day' | 'week' | 'month' | 'all'
 * @property {string} [fieldType] - Filter by field type
 */

/**
 * Execute the get AI metrics query
 * @param {GetAIMetricsPayload} payload - Query payload
 * @returns {Promise<Object>} AI metrics
 */
export async function execute(payload) {
  const { organizationId, period = 'week', fieldType = null } = payload;

  logger.debug('Fetching AI metrics', { organizationId, period, fieldType });

  try {
    // Get feedback metrics from database
    const feedbackMetrics = await getFeedbackMetrics(organizationId, period, fieldType);

    // Get circuit breaker health
    const circuitHealth = circuitBreakerRegistry.getHealthSummary();

    // Get recent events
    const recentEvents = eventBus.getRecentEvents({
      eventType: 'ai.*',
      limit: 50
    });

    // Calculate derived metrics
    const metrics = {
      feedback: feedbackMetrics,
      health: {
        circuit: circuitHealth,
        overall: circuitHealth.healthy ? 'healthy' : 'degraded'
      },
      recentActivity: {
        eventCount: recentEvents.length,
        lastEvent: recentEvents[recentEvents.length - 1]?.metadata?.timestamp || null
      },
      period,
      generatedAt: new Date().toISOString()
    };

    return metrics;
  } catch (error) {
    logger.error('Failed to get AI metrics', { error: error.message });

    // Return partial metrics if database fails
    return {
      feedback: getEmptyFeedbackMetrics(),
      health: {
        circuit: circuitBreakerRegistry.getHealthSummary(),
        overall: 'unknown'
      },
      recentActivity: {
        eventCount: 0,
        lastEvent: null
      },
      period,
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Get feedback metrics from database
 */
async function getFeedbackMetrics(organizationId, period, fieldType) {
  const periodFilter = getPeriodFilter(period);

  try {
    // Total feedback count by type
    const countQuery = `
      SELECT
        feedback_type,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM ai_feedback
      WHERE organization_id = $1
        ${periodFilter}
        ${fieldType ? `AND context->>'fieldType' = $2` : ''}
      GROUP BY feedback_type
    `;

    const countParams = fieldType
      ? [organizationId, fieldType]
      : [organizationId];

    const countResult = await query(countQuery, countParams);

    // Build feedback breakdown
    const breakdown = {
      positive: { count: 0, avgRating: null },
      negative: { count: 0, avgRating: null },
      correction: { count: 0, avgRating: null }
    };

    let totalCount = 0;
    let totalRatingSum = 0;
    let ratedCount = 0;

    for (const row of countResult.rows) {
      breakdown[row.feedback_type] = {
        count: parseInt(row.count),
        avgRating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(2) : null
      };
      totalCount += parseInt(row.count);
      if (row.avg_rating) {
        totalRatingSum += parseFloat(row.avg_rating) * parseInt(row.count);
        ratedCount += parseInt(row.count);
      }
    }

    // Calculate acceptance rate
    const positiveCount = breakdown.positive.count;
    const negativeCount = breakdown.negative.count;
    const acceptanceRate = totalCount > 0
      ? ((positiveCount / totalCount) * 100).toFixed(1)
      : null;

    // Get trend data (last 7 periods)
    const trendQuery = `
      SELECT
        DATE_TRUNC('day', created_at) as date,
        feedback_type,
        COUNT(*) as count
      FROM ai_feedback
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at), feedback_type
      ORDER BY date
    `;

    const trendResult = await query(trendQuery, [organizationId]);

    // Process trend data
    const trendByDate = {};
    for (const row of trendResult.rows) {
      const date = row.date.toISOString().split('T')[0];
      if (!trendByDate[date]) {
        trendByDate[date] = { positive: 0, negative: 0, correction: 0 };
      }
      trendByDate[date][row.feedback_type] = parseInt(row.count);
    }

    return {
      totalCount,
      breakdown,
      acceptanceRate: acceptanceRate ? `${acceptanceRate}%` : 'N/A',
      averageRating: ratedCount > 0 ? (totalRatingSum / ratedCount).toFixed(2) : null,
      trend: Object.entries(trendByDate).map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.positive + counts.negative + counts.correction
      })),
      needsRetraining: negativeCount > 10 && parseFloat(acceptanceRate) < 70
    };
  } catch (error) {
    // Table might not exist
    if (error.code === '42P01') {
      logger.debug('AI feedback table does not exist');
      return getEmptyFeedbackMetrics();
    }
    throw error;
  }
}

/**
 * Get SQL period filter
 */
function getPeriodFilter(period) {
  switch (period) {
    case 'day':
      return "AND created_at >= NOW() - INTERVAL '1 day'";
    case 'week':
      return "AND created_at >= NOW() - INTERVAL '7 days'";
    case 'month':
      return "AND created_at >= NOW() - INTERVAL '30 days'";
    case 'all':
    default:
      return '';
  }
}

/**
 * Get empty feedback metrics structure
 */
function getEmptyFeedbackMetrics() {
  return {
    totalCount: 0,
    breakdown: {
      positive: { count: 0, avgRating: null },
      negative: { count: 0, avgRating: null },
      correction: { count: 0, avgRating: null }
    },
    acceptanceRate: 'N/A',
    averageRating: null,
    trend: [],
    needsRetraining: false
  };
}

/**
 * Query handler class (alternative OOP style)
 */
export class GetAIMetricsQueryHandler {
  async handle(query) {
    return execute(query);
  }
}

export default { execute, GetAIMetricsQueryHandler };
