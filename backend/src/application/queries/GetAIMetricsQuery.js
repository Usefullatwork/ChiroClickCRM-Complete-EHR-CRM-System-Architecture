/**
 * Get AI Metrics Query
 * CQRS Query for retrieving AI performance metrics
 *
 * @module application/queries/GetAIMetricsQuery
 */

import { aiFeedbackService } from '../services/AIFeedbackService.js';
import { aiRetrainingService } from '../services/AIRetrainingService.js';
import {
  CircuitBreakers,
  circuitBreakerRegistry,
} from '../../infrastructure/resilience/CircuitBreaker.js';
import { cacheManager } from '../../infrastructure/cache/CacheManager.js';
import logger from '../../utils/logger.js';

/**
 * Query for AI performance metrics
 */
export class GetAIMetricsQuery {
  /**
   * @param {Object} params
   * @param {number} params.days - Number of days to analyze (default: 7)
   * @param {boolean} params.includeHistory - Include training history
   * @param {boolean} params.includeCircuitStatus - Include circuit breaker status
   */
  constructor(params = {}) {
    this.days = params.days || 7;
    this.includeHistory = params.includeHistory !== false;
    this.includeCircuitStatus = params.includeCircuitStatus !== false;
  }
}

/**
 * Handler for GetAIMetricsQuery
 */
export class GetAIMetricsQueryHandler {
  /**
   * Execute the query
   * @param {GetAIMetricsQuery} query
   * @returns {Promise<Object>} AI metrics data
   */
  async handle(query) {
    logger.debug('Handling GetAIMetricsQuery', { days: query.days });

    const [feedbackMetrics, modelInfo, trainingHistory, circuitStatus, cacheStats] =
      await Promise.all([
        aiFeedbackService.getMetrics(query.days),
        aiRetrainingService.getCurrentModelInfo(),
        query.includeHistory ? aiRetrainingService.getTrainingHistory(5) : [],
        query.includeCircuitStatus ? circuitBreakerRegistry.getAllStatus() : {},
        cacheManager.getStats(),
      ]);

    return {
      feedback: feedbackMetrics,
      model: modelInfo,
      trainingHistory,
      circuitBreakers: circuitStatus,
      cache: cacheStats,
      queriedAt: new Date().toISOString(),
    };
  }
}

/**
 * Query for AI dashboard metrics (optimized for frontend)
 */
export class GetAIDashboardQuery {
  constructor(params = {}) {
    this.organizationId = params.organizationId;
  }
}

/**
 * Handler for GetAIDashboardQuery
 */
export class GetAIDashboardQueryHandler {
  async handle(_query) {
    const metrics = await aiFeedbackService.getMetrics(7);
    const modelInfo = await aiRetrainingService.getCurrentModelInfo();

    return {
      acceptanceRate: metrics.acceptanceRate?.acceptanceRate || '0',
      totalSuggestions: metrics.acceptanceRate?.total || 0,
      modificationRate: metrics.acceptanceRate?.modificationRate || '0',
      dailyTrend: metrics.dailyStats || [],
      activeModel: modelInfo.version,
      circuitStatus: CircuitBreakers.ollama.getStatus().state,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Create singleton handlers
export const getAIMetricsHandler = new GetAIMetricsQueryHandler();
export const getAIDashboardHandler = new GetAIDashboardQueryHandler();

export default {
  GetAIMetricsQuery,
  GetAIMetricsQueryHandler,
  GetAIDashboardQuery,
  GetAIDashboardQueryHandler,
  getAIMetricsHandler,
  getAIDashboardHandler,
};
