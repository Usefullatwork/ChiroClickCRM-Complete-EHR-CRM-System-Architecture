/**
 * Record Feedback Command
 * CQRS command for recording AI suggestion feedback
 */

import logger from '../../utils/logger.js';
import eventBus from '../../domain/events/EventBus.js';
import { AIFeedbackRecordedEvent } from '../../domain/events/DomainEvents.js';
import { query } from '../../db/index.js';

/**
 * Command payload for recording feedback
 * @typedef {Object} RecordFeedbackPayload
 * @property {string} suggestionId - ID of the AI suggestion
 * @property {string} feedbackType - Type: 'positive' | 'negative' | 'correction'
 * @property {number} rating - Rating 1-5
 * @property {string} [correctedText] - User's corrected version (if correction)
 * @property {string} [comment] - Additional feedback comment
 * @property {Object} context - Original context of the suggestion
 * @property {string} organizationId - Organization ID
 * @property {string} userId - User who provided feedback
 */

/**
 * Execute the record feedback command
 * @param {RecordFeedbackPayload} payload - Command payload
 * @returns {Promise<Object>} Created feedback record
 */
export async function execute(payload) {
  const {
    suggestionId,
    feedbackType,
    rating,
    correctedText,
    comment,
    context,
    organizationId,
    userId
  } = payload;

  // Validate payload
  if (!suggestionId) {
    throw new Error('suggestionId is required');
  }
  if (!feedbackType || !['positive', 'negative', 'correction'].includes(feedbackType)) {
    throw new Error('feedbackType must be positive, negative, or correction');
  }
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw new Error('rating must be between 1 and 5');
  }

  logger.info('Recording AI feedback', {
    suggestionId,
    feedbackType,
    rating,
    organizationId
  });

  try {
    // Store feedback in database
    const result = await query(
      `INSERT INTO ai_feedback (
        id,
        suggestion_id,
        feedback_type,
        rating,
        corrected_text,
        comment,
        context,
        organization_id,
        user_id,
        created_at
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      ) RETURNING *`,
      [
        suggestionId,
        feedbackType,
        rating,
        correctedText,
        comment,
        JSON.stringify(context || {}),
        organizationId,
        userId
      ]
    );

    const feedback = result.rows[0];

    // Publish domain event
    await eventBus.publish(new AIFeedbackRecordedEvent({
      feedbackId: feedback.id,
      suggestionId,
      feedbackType,
      rating,
      correctedText,
      context,
      organizationId,
      userId
    }));

    logger.info('AI feedback recorded', {
      feedbackId: feedback.id,
      suggestionId,
      feedbackType
    });

    return {
      success: true,
      feedbackId: feedback.id,
      feedbackType,
      rating,
      recordedAt: feedback.created_at
    };
  } catch (error) {
    // If table doesn't exist, log but don't fail
    if (error.code === '42P01') {
      logger.warn('AI feedback table does not exist, skipping database storage');

      // Still publish event for in-memory processing
      await eventBus.publish(new AIFeedbackRecordedEvent({
        feedbackId: `temp-${Date.now()}`,
        suggestionId,
        feedbackType,
        rating,
        correctedText,
        context,
        organizationId,
        userId
      }));

      return {
        success: true,
        feedbackId: `temp-${Date.now()}`,
        feedbackType,
        rating,
        stored: false,
        message: 'Feedback recorded (in-memory only, database table not configured)'
      };
    }

    logger.error('Failed to record AI feedback', { error: error.message });
    throw error;
  }
}

/**
 * Command handler class (alternative OOP style)
 */
export class RecordFeedbackCommandHandler {
  async handle(command) {
    return execute(command);
  }
}

export default { execute, RecordFeedbackCommandHandler };
