/**
 * Circuit Breaker Pattern Implementation
 * Protects external service calls with automatic failure detection and recovery
 *
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered
 */

import logger from '../../utils/logger.js';
import eventBus from '../../domain/events/EventBus.js';
import { AICircuitStateChangedEvent } from '../../domain/events/DomainEvents.js';

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

export class CircuitBreaker {
  /**
   * Create a new circuit breaker
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.halfOpenRequests = options.halfOpenRequests || 3;
    this.monitorInterval = options.monitorInterval || 10000; // 10 seconds
    this.successThreshold = options.successThreshold || 3; // Successes needed to close from half-open

    // State
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.halfOpenSuccessCount = 0;
    this.halfOpenFailureCount = 0;
    this.resetTimer = null;

    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      stateChanges: [],
      averageLatency: 0,
      lastLatency: 0
    };

    logger.info('Circuit breaker created', {
      name: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout
    });
  }

  /**
   * Execute a function through the circuit breaker
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of the function
   * @throws {Error} If circuit is open or function fails
   */
  async execute(fn) {
    this.metrics.totalRequests++;

    // Check if we should allow the request
    if (!this.canExecute()) {
      this.metrics.rejectedRequests++;
      const error = new Error(`Circuit breaker ${this.name} is OPEN`);
      error.code = 'CIRCUIT_OPEN';
      error.retryAfter = this.getTimeUntilReset();
      throw error;
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      this.onSuccess(startTime);
      return result;
    } catch (error) {
      this.onFailure(error, startTime);
      throw error;
    }
  }

  /**
   * Check if circuit allows requests
   * @returns {boolean}
   */
  canExecute() {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
        return true;
      }
      return false;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // Allow limited requests in half-open state
      const halfOpenTotal = this.halfOpenSuccessCount + this.halfOpenFailureCount;
      return halfOpenTotal < this.halfOpenRequests;
    }

    return false;
  }

  /**
   * Handle successful request
   * @param {number} startTime - Request start time
   */
  onSuccess(startTime) {
    const latency = Date.now() - startTime;
    this.updateLatencyMetrics(latency);
    this.metrics.successfulRequests++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount++;

      // Check if we have enough successes to close the circuit
      if (this.halfOpenSuccessCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
      this.successCount++;
    }
  }

  /**
   * Handle failed request
   * @param {Error} error - The error that occurred
   * @param {number} startTime - Request start time
   */
  onFailure(error, startTime) {
    const latency = Date.now() - startTime;
    this.updateLatencyMetrics(latency);
    this.metrics.failedRequests++;
    this.lastFailureTime = Date.now();

    logger.warn('Circuit breaker recorded failure', {
      name: this.name,
      state: this.state,
      error: error.message,
      failureCount: this.failureCount + 1
    });

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenFailureCount++;
      // Any failure in half-open state opens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;

      // Check if we've exceeded the threshold
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   * @param {string} newState - New circuit state
   */
  transitionTo(newState) {
    const previousState = this.state;

    if (previousState === newState) {
      return;
    }

    this.state = newState;

    // Record state change
    this.metrics.stateChanges.push({
      from: previousState,
      to: newState,
      timestamp: new Date().toISOString(),
      failureCount: this.failureCount
    });

    // Keep only last 100 state changes
    if (this.metrics.stateChanges.length > 100) {
      this.metrics.stateChanges = this.metrics.stateChanges.slice(-100);
    }

    logger.info('Circuit breaker state changed', {
      name: this.name,
      from: previousState,
      to: newState,
      failureCount: this.failureCount
    });

    // Publish domain event
    eventBus.publish(new AICircuitStateChangedEvent({
      service: this.name,
      previousState,
      state: newState,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
    }));

    // Reset counters on state change
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenSuccessCount = 0;
      this.halfOpenFailureCount = 0;
      this.clearResetTimer();
    } else if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount = 0;
      this.halfOpenFailureCount = 0;
    } else if (newState === CircuitState.OPEN) {
      this.scheduleReset();
    }
  }

  /**
   * Schedule automatic transition to half-open
   */
  scheduleReset() {
    this.clearResetTimer();

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }, this.resetTimeout);
  }

  /**
   * Clear the reset timer
   */
  clearResetTimer() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Force reset the circuit to closed state
   */
  reset() {
    logger.info('Circuit breaker manually reset', { name: this.name });
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Force trip the circuit to open state
   */
  trip() {
    logger.info('Circuit breaker manually tripped', { name: this.name });
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Update latency metrics
   * @param {number} latency - Request latency in ms
   */
  updateLatencyMetrics(latency) {
    this.metrics.lastLatency = latency;

    // Rolling average
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (totalRequests > 0) {
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (totalRequests - 1) + latency) / totalRequests;
    }
  }

  /**
   * Get time until circuit might reset
   * @returns {number} Milliseconds until reset, or 0 if not open
   */
  getTimeUntilReset() {
    if (this.state !== CircuitState.OPEN || !this.lastFailureTime) {
      return 0;
    }

    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.resetTimeout - elapsed);
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      timeUntilReset: this.getTimeUntilReset(),
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalRequests > 0
          ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : 'N/A'
      }
    };
  }

  /**
   * Check if circuit is healthy (closed state)
   * @returns {boolean}
   */
  isHealthy() {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.clearResetTimer();
    logger.info('Circuit breaker destroyed', { name: this.name });
  }
}

export default CircuitBreaker;
