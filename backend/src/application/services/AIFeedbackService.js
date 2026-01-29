/**
 * AI Feedback Service
 * Application service for managing AI feedback collection and processing
 */

import logger from '../../utils/logger.js';
import { execute as recordFeedback } from '../commands/RecordFeedbackCommand.js';
import { execute as getMetrics } from '../queries/GetAIMetricsQuery.js';
import eventBus from '../../domain/events/EventBus.js';
import { AIEventTypes, AIRetrainingTriggeredEvent } from '../../domain/events/DomainEvents.js';

class AIFeedbackService {
  constructor() {
    this.feedbackBuffer = [];
    this.bufferFlushInterval = 30000; // 30 seconds
    this.retrainingThreshold = {
      minFeedbackCount: 50,
      maxNegativeRatio: 0.3  // 30% negative triggers retraining
    };

    // Subscribe to feedback events for aggregation
    eventBus.subscribe(AIEventTypes.AI_FEEDBACK_RECORDED, this.onFeedbackRecorded.bind(this));

    // Start buffer flush timer
    this.startBufferFlush();
  }

  /**
   * Record feedback for an AI suggestion
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Result
   */
  async recordFeedback(feedback) {
    const result = await recordFeedback(feedback);

    // Add to buffer for batch processing
    this.feedbackBuffer.push({
      ...feedback,
      recordedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Get AI performance metrics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Metrics
   */
  async getMetrics(params) {
    return getMetrics(params);
  }

  /**
   * Check if retraining is needed based on feedback
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Retraining status
   */
  async checkRetrainingStatus(organizationId) {
    const metrics = await getMetrics({ organizationId, period: 'week' });

    const { totalCount, breakdown, needsRetraining } = metrics.feedback;
    const negativeRatio = totalCount > 0
      ? breakdown.negative.count / totalCount
      : 0;

    return {
      needsRetraining,
      reason: needsRetraining
        ? `High negative feedback ratio (${(negativeRatio * 100).toFixed(1)}%)`
        : null,
      metrics: {
        totalFeedback: totalCount,
        negativeCount: breakdown.negative.count,
        negativeRatio: `${(negativeRatio * 100).toFixed(1)}%`,
        threshold: `${this.retrainingThreshold.maxNegativeRatio * 100}%`
      },
      canTrigger: totalCount >= this.retrainingThreshold.minFeedbackCount
    };
  }

  /**
   * Trigger model retraining
   * @param {Object} params - Trigger parameters
   * @returns {Promise<Object>} Result
   */
  async triggerRetraining(params) {
    const { organizationId, reason = 'manual', triggeredBy } = params;

    // Check if retraining is allowed
    const status = await this.checkRetrainingStatus(organizationId);

    if (!status.canTrigger && reason !== 'manual') {
      return {
        triggered: false,
        reason: 'Insufficient feedback data for automatic retraining',
        minRequired: this.retrainingThreshold.minFeedbackCount,
        current: status.metrics.totalFeedback
      };
    }

    logger.info('Triggering AI retraining', {
      organizationId,
      reason,
      triggeredBy,
      metrics: status.metrics
    });

    // Publish retraining event
    await eventBus.publish(new AIRetrainingTriggeredEvent({
      reason,
      feedbackCount: status.metrics.totalFeedback,
      negativeRatio: parseFloat(status.metrics.negativeRatio),
      triggeredBy
    }));

    // In a real implementation, this would queue a retraining job
    // For now, we just record the trigger
    return {
      triggered: true,
      reason,
      triggeredBy,
      triggeredAt: new Date().toISOString(),
      metrics: status.metrics,
      message: 'Retraining job queued (simulated)'
    };
  }

  /**
   * Get feedback summary for a specific suggestion
   * @param {string} suggestionId - Suggestion ID
   * @returns {Promise<Object>} Feedback summary
   */
  async getSuggestionFeedback(suggestionId) {
    // This would query the database for feedback on a specific suggestion
    // For now, return from buffer if available
    const bufferFeedback = this.feedbackBuffer.filter(f => f.suggestionId === suggestionId);

    return {
      suggestionId,
      feedbackCount: bufferFeedback.length,
      feedback: bufferFeedback.map(f => ({
        type: f.feedbackType,
        rating: f.rating,
        recordedAt: f.recordedAt
      }))
    };
  }

  /**
   * Handle feedback recorded event
   * @param {Object} event - Domain event
   */
  async onFeedbackRecorded(event) {
    const { feedbackType, organizationId } = event.payload;

    logger.debug('Processing feedback event', {
      feedbackId: event.payload.feedbackId,
      feedbackType
    });

    // Check if we should trigger retraining
    if (feedbackType === 'negative') {
      const status = await this.checkRetrainingStatus(organizationId);
      if (status.needsRetraining && status.canTrigger) {
        await this.triggerRetraining({
          organizationId,
          reason: 'threshold_reached',
          triggeredBy: 'system'
        });
      }
    }
  }

  /**
   * Start periodic buffer flush
   */
  startBufferFlush() {
    setInterval(() => {
      this.flushBuffer();
    }, this.bufferFlushInterval);
  }

  /**
   * Flush feedback buffer
   */
  flushBuffer() {
    if (this.feedbackBuffer.length === 0) {
      return;
    }

    const bufferSize = this.feedbackBuffer.length;
    logger.debug('Flushing feedback buffer', { count: bufferSize });

    // In a real implementation, this would batch-write to database
    // or send to an analytics service
    this.feedbackBuffer = [];

    logger.debug('Feedback buffer flushed', { count: bufferSize });
  }

  /**
   * Get service statistics
   * @returns {Object} Service stats
   */
  getStats() {
    return {
      bufferSize: this.feedbackBuffer.length,
      flushInterval: this.bufferFlushInterval,
      retrainingThreshold: this.retrainingThreshold
    };
  }
}

// Singleton instance
const aiFeedbackService = new AIFeedbackService();

export { AIFeedbackService };
export default aiFeedbackService;
