/**
 * Retry Utility
 * Provides retry logic for transient failures
 */

import logger from './logger.js';

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Function result
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null,
    shouldRetry = (error) => true
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt > maxRetries) {
        logger.error('Max retries exceeded', {
          attempts: attempt,
          error: error.message
        });
        throw error;
      }

      // Log the retry
      logger.warn(`Retry attempt ${attempt}/${maxRetries}`, {
        error: error.message,
        nextRetryIn: `${delay}ms`
      });

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(attempt, error);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Check if error is retryable (network or temporary errors)
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is retryable
 */
export const isRetryableError = (error) => {
  // Network errors
  if (error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENETUNREACH') {
    return true;
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  // Specific error messages
  if (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('socket hang up')
  )) {
    return true;
  }

  return false;
};

/**
 * Retry SMS/Email sending with appropriate backoff
 * @param {Function} sendFn - Sending function
 * @param {Object} data - Message data
 * @returns {Promise<any>} Send result
 */
export const retryCommunication = async (sendFn, data) => {
  return retryWithBackoff(
    () => sendFn(data),
    {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 10000,
      shouldRetry: isRetryableError,
      onRetry: (attempt, error) => {
        logger.info('Retrying communication', {
          attempt,
          type: data.type,
          patientId: data.patient_id,
          error: error.message
        });
      }
    }
  );
};

export default {
  retryWithBackoff,
  isRetryableError,
  retryCommunication
};
