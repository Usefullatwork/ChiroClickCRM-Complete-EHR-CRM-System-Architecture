/**
 * Record Feedback Command
 * CQRS Command for recording AI suggestion feedback
 *
 * @module application/commands/RecordFeedbackCommand
 */

import { aiFeedbackService } from '../services/AIFeedbackService.js';
import logger from '../../utils/logger.js';

/**
 * Command to record AI suggestion feedback
 */
export class RecordFeedbackCommand {
  /**
   * @param {Object} params
   * @param {string} params.suggestionId - The suggestion being rated
   * @param {string} params.action - ACCEPTED, REJECTED, or MODIFIED
   * @param {string} params.originalContent - Original suggestion content
   * @param {string} params.modifiedContent - User's modified version (if action=MODIFIED)
   * @param {string} params.reason - Rejection reason (if action=REJECTED)
   * @param {number} params.responseTime - Time user took to respond (ms)
   * @param {string} params.userId - User providing feedback
   * @param {string} params.organizationId - User's organization
   */
  constructor(params) {
    this.suggestionId = params.suggestionId;
    this.action = params.action;
    this.originalContent = params.originalContent;
    this.modifiedContent = params.modifiedContent;
    this.reason = params.reason;
    this.responseTime = params.responseTime;
    this.userId = params.userId;
    this.organizationId = params.organizationId;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Validate the command
   */
  validate() {
    const errors = [];

    if (!this.suggestionId) {
      errors.push('suggestionId is required');
    }

    if (!['ACCEPTED', 'REJECTED', 'MODIFIED'].includes(this.action)) {
      errors.push('action must be ACCEPTED, REJECTED, or MODIFIED');
    }

    if (this.action === 'MODIFIED' && !this.modifiedContent) {
      errors.push('modifiedContent is required when action is MODIFIED');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Handler for RecordFeedbackCommand
 */
export class RecordFeedbackCommandHandler {
  /**
   * Execute the command
   * @param {RecordFeedbackCommand} command
   * @returns {Promise<Object>} Result with feedbackId
   */
  async handle(command) {
    const validation = command.validate();

    if (!validation.isValid) {
      throw new Error(`Invalid command: ${validation.errors.join(', ')}`);
    }

    logger.debug('Handling RecordFeedbackCommand', {
      suggestionId: command.suggestionId,
      action: command.action
    });

    return await aiFeedbackService.recordFeedback({
      suggestionId: command.suggestionId,
      action: command.action,
      originalContent: command.originalContent,
      modifiedContent: command.modifiedContent,
      reason: command.reason,
      responseTime: command.responseTime,
      userId: command.userId,
      organizationId: command.organizationId
    });
  }
}

// Create singleton handler
export const recordFeedbackHandler = new RecordFeedbackCommandHandler();

export default { RecordFeedbackCommand, RecordFeedbackCommandHandler, recordFeedbackHandler };
