/**
 * AI Feedback Service
 * Handles collection and processing of AI suggestion feedback
 * Implements event-driven training data collection
 *
 * @module application/services/AIFeedbackService
 */

import { eventBus, registerEventHandlers } from '../../domain/events/EventBus.js';
import { DOMAIN_EVENTS, EventFactory } from '../../domain/events/DomainEvents.js';
import { cacheManager, CacheKeys, CacheTTL } from '../../infrastructure/cache/CacheManager.js';
import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';

/**
 * AI Feedback Service - Manages feedback loop for model improvement
 */
class AIFeedbackService {
  constructor() {
    this.feedbackBuffer = [];
    this.bufferFlushInterval = 60000; // Flush every minute
    this.retrainingThreshold = 100; // New examples before considering retraining

    // Initialize event handlers
    this.initEventHandlers();

    // Start buffer flush interval
    this.flushIntervalId = setInterval(() => {
      this.flushFeedbackBuffer();
    }, this.bufferFlushInterval);

    logger.info('AIFeedbackService initialized');
  }

  /**
   * Initialize event handlers for AI feedback
   */
  initEventHandlers() {
    registerEventHandlers({
      [DOMAIN_EVENTS.SUGGESTION_ACCEPTED]: this.handleSuggestionAccepted.bind(this),
      [DOMAIN_EVENTS.SUGGESTION_REJECTED]: this.handleSuggestionRejected.bind(this),
      [DOMAIN_EVENTS.SUGGESTION_MODIFIED]: this.handleSuggestionModified.bind(this),
    });

    logger.debug('AI feedback event handlers registered');
  }

  /**
   * Handle accepted suggestion - positive training example
   */
  async handleSuggestionAccepted(event) {
    const { suggestionId, responseTime } = event.payload;

    try {
      // Record as positive example
      this.feedbackBuffer.push({
        suggestionId,
        action: 'ACCEPTED',
        responseTime,
        timestamp: event.metadata.timestamp,
        userId: event.metadata.userId,
        organizationId: event.metadata.organizationId,
      });

      // Update acceptance metrics
      await this.incrementMetric('suggestions_accepted');

      logger.debug('Suggestion accepted recorded', { suggestionId });
    } catch (error) {
      logger.error('Error handling suggestion accepted:', error);
    }
  }

  /**
   * Handle rejected suggestion - negative training example
   */
  async handleSuggestionRejected(event) {
    const { suggestionId, reason } = event.payload;

    try {
      this.feedbackBuffer.push({
        suggestionId,
        action: 'REJECTED',
        reason,
        timestamp: event.metadata.timestamp,
        userId: event.metadata.userId,
        organizationId: event.metadata.organizationId,
      });

      // Update rejection metrics
      await this.incrementMetric('suggestions_rejected');

      logger.debug('Suggestion rejected recorded', { suggestionId, reason });
    } catch (error) {
      logger.error('Error handling suggestion rejected:', error);
    }
  }

  /**
   * Handle modified suggestion - correction for training
   */
  async handleSuggestionModified(event) {
    const { suggestionId, originalContent, modifiedContent } = event.payload;

    try {
      this.feedbackBuffer.push({
        suggestionId,
        action: 'MODIFIED',
        originalContent,
        modifiedContent,
        timestamp: event.metadata.timestamp,
        userId: event.metadata.userId,
        organizationId: event.metadata.organizationId,
      });

      // Update modification metrics
      await this.incrementMetric('suggestions_modified');

      logger.debug('Suggestion modified recorded', { suggestionId });
    } catch (error) {
      logger.error('Error handling suggestion modified:', error);
    }
  }

  /**
   * Record feedback for a suggestion
   * @param {Object} feedbackData
   */
  async recordFeedback(feedbackData) {
    const {
      suggestionId,
      action,
      originalContent,
      modifiedContent,
      reason,
      responseTime,
      userId,
      organizationId,
    } = feedbackData;

    // Emit appropriate event based on action
    const metadata = { userId, organizationId };

    switch (action) {
      case 'ACCEPTED':
        await eventBus.emit(EventFactory.suggestionAccepted(suggestionId, responseTime, metadata));
        break;
      case 'REJECTED':
        await eventBus.emit(EventFactory.suggestionRejected(suggestionId, reason, metadata));
        break;
      case 'MODIFIED':
        await eventBus.emit(
          EventFactory.suggestionModified(suggestionId, originalContent, modifiedContent, metadata)
        );
        break;
      default:
        logger.warn('Unknown feedback action:', action);
    }

    return { success: true, feedbackId: crypto.randomUUID() };
  }

  /**
   * Flush feedback buffer to database
   */
  async flushFeedbackBuffer() {
    if (this.feedbackBuffer.length === 0) {
      return;
    }

    const batch = [...this.feedbackBuffer];
    this.feedbackBuffer = [];

    try {
      // Batch insert to database
      const values = batch
        .map((f, i) => {
          const offset = i * 7;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
        })
        .join(', ');

      const params = batch.flatMap((f) => [
        f.suggestionId,
        f.action,
        f.reason || null,
        JSON.stringify({ original: f.originalContent, modified: f.modifiedContent }),
        f.timestamp,
        f.userId,
        f.organizationId,
      ]);

      await query(
        `
        INSERT INTO ai_feedback (suggestion_id, action, reason, modification_data, created_at, user_id, organization_id)
        VALUES ${values}
        ON CONFLICT (suggestion_id) DO UPDATE SET
          action = EXCLUDED.action,
          reason = EXCLUDED.reason,
          modification_data = EXCLUDED.modification_data,
          updated_at = NOW()
      `,
        params
      );

      logger.info(`Flushed ${batch.length} feedback records to database`);

      // Check if retraining threshold reached
      await this.checkRetrainingThreshold();
    } catch (error) {
      // Put failed items back in buffer
      this.feedbackBuffer.unshift(...batch);
      logger.error('Error flushing feedback buffer:', error);
    }
  }

  /**
   * Increment a metric counter
   */
  async incrementMetric(metricName) {
    try {
      await query(
        `
        INSERT INTO ai_metrics (metric_name, value, recorded_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (metric_name, DATE(recorded_at))
        DO UPDATE SET value = ai_metrics.value + 1
      `,
        [metricName]
      );

      // Invalidate cached metrics
      await cacheManager.delete(CacheKeys.aiMetrics());
    } catch (error) {
      logger.warn('Error incrementing metric:', error.message);
    }
  }

  /**
   * Check if retraining threshold has been reached
   */
  async checkRetrainingThreshold() {
    try {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM ai_feedback
        WHERE created_at > (
          SELECT COALESCE(MAX(completed_at), '1970-01-01')
          FROM ai_training_runs
          WHERE status = 'COMPLETED'
        )
      `);

      const newExamples = parseInt(result.rows[0].count, 10);

      if (newExamples >= this.retrainingThreshold) {
        logger.info(`Retraining threshold reached: ${newExamples} new examples`);

        // Emit training threshold event
        await eventBus.emit(EventFactory.trainingThresholdReached({ newExamples }, {}));
      }
    } catch (error) {
      logger.warn('Error checking retraining threshold:', error.message);
    }
  }

  /**
   * Get AI performance metrics
   */
  async getMetrics(days = 7) {
    const cacheKey = CacheKeys.aiMetrics();

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const [acceptanceRate, dailyStats, topCorrections] = await Promise.all([
          this.getAcceptanceRate(days),
          this.getDailyStats(days),
          this.getTopCorrections(10),
        ]);

        return {
          acceptanceRate,
          dailyStats,
          topCorrections,
          generatedAt: new Date().toISOString(),
        };
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get acceptance rate for period
   */
  async getAcceptanceRate(days) {
    try {
      const result = await query(
        `
        SELECT
          COUNT(*) FILTER (WHERE action = 'ACCEPTED') as accepted,
          COUNT(*) FILTER (WHERE action = 'REJECTED') as rejected,
          COUNT(*) FILTER (WHERE action = 'MODIFIED') as modified,
          COUNT(*) as total
        FROM ai_feedback
        WHERE created_at > NOW() - make_interval(days => $1)
      `,
        [days]
      );

      const { accepted, rejected, modified, total } = result.rows[0];
      const totalInt = parseInt(total, 10) || 1;

      return {
        accepted: parseInt(accepted, 10),
        rejected: parseInt(rejected, 10),
        modified: parseInt(modified, 10),
        total: parseInt(total, 10),
        acceptanceRate: ((parseInt(accepted, 10) / totalInt) * 100).toFixed(2),
        modificationRate: ((parseInt(modified, 10) / totalInt) * 100).toFixed(2),
      };
    } catch (error) {
      logger.warn('Error getting acceptance rate:', error.message);
      return {
        accepted: 0,
        rejected: 0,
        modified: 0,
        total: 0,
        acceptanceRate: '0',
        modificationRate: '0',
      };
    }
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(days) {
    try {
      const result = await query(
        `
        SELECT
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE action = 'ACCEPTED') as accepted,
          COUNT(*) FILTER (WHERE action = 'REJECTED') as rejected,
          COUNT(*) FILTER (WHERE action = 'MODIFIED') as modified
        FROM ai_feedback
        WHERE created_at > NOW() - make_interval(days => $1)
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        [days]
      );

      return result.rows;
    } catch (error) {
      logger.warn('Error getting daily stats:', error.message);
      return [];
    }
  }

  /**
   * Get most common corrections/modifications
   */
  async getTopCorrections(limit) {
    try {
      const result = await query(
        `
        SELECT
          modification_data->>'original' as original,
          modification_data->>'modified' as modified,
          COUNT(*) as count
        FROM ai_feedback
        WHERE action = 'MODIFIED'
          AND modification_data IS NOT NULL
        GROUP BY modification_data->>'original', modification_data->>'modified'
        ORDER BY count DESC
        LIMIT $1
      `,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.warn('Error getting top corrections:', error.message);
      return [];
    }
  }

  /**
   * Export training data as JSONL for model fine-tuning
   */
  async exportTrainingData(options = {}) {
    const { startDate, endDate, _minConfidence = 0.7, includeRejected = false } = options;

    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (startDate) {
        params.push(startDate);
        whereClause += ` AND f.created_at >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        whereClause += ` AND f.created_at <= $${params.length}`;
      }
      if (!includeRejected) {
        whereClause += ` AND f.action != 'REJECTED'`;
      }

      const result = await query(
        `
        SELECT
          s.id as suggestion_id,
          s.type as suggestion_type,
          s.context as input_context,
          CASE
            WHEN f.action = 'MODIFIED' THEN f.modification_data->>'modified'
            ELSE s.content
          END as output_content,
          s.confidence,
          f.action as feedback_action
        FROM ai_suggestions s
        JOIN ai_feedback f ON f.suggestion_id = s.id
        ${whereClause}
        ORDER BY f.created_at
      `,
        params
      );

      // Format as JSONL
      const jsonl = result.rows
        .map((row) =>
          JSON.stringify({
            input: row.input_context,
            output: row.output_content,
            type: row.suggestion_type,
            metadata: {
              suggestionId: row.suggestion_id,
              confidence: row.confidence,
              feedbackAction: row.feedback_action,
            },
          })
        )
        .join('\n');

      return {
        count: result.rows.length,
        data: jsonl,
      };
    } catch (error) {
      logger.error('Error exporting training data:', error);
      throw error;
    }
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    clearInterval(this.flushIntervalId);
    this.flushFeedbackBuffer();
    logger.info('AIFeedbackService shutdown');
  }
}

// Create singleton instance
export const aiFeedbackService = new AIFeedbackService();

export default aiFeedbackService;
