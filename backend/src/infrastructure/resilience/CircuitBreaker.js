/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when external services are unavailable
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 *
 * @module infrastructure/resilience/CircuitBreaker
 */

import logger from '../../utils/logger.js';
import { eventBus } from '../../domain/events/EventBus.js';
import { DOMAIN_EVENTS } from '../../domain/events/DomainEvents.js';

/**
 * Circuit Breaker states
 */
export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.name - Circuit breaker name (for logging/metrics)
   * @param {number} options.failureThreshold - Number of failures before opening (default: 5)
   * @param {number} options.successThreshold - Successes needed in half-open to close (default: 2)
   * @param {number} options.timeout - Time in ms before attempting reset (default: 30000)
   * @param {number} options.requestTimeout - Max time for a single request in ms (default: 10000)
   * @param {Function} options.fallback - Fallback function when circuit is open
   * @param {Function} options.onStateChange - Callback on state change
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 30000;
    this.requestTimeout = options.requestTimeout || 10000;
    this.fallback = options.fallback || null;
    this.onStateChange = options.onStateChange || null;

    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      fallbackExecutions: 0,
      stateChanges: []
    };

    logger.info(`CircuitBreaker "${this.name}" initialized`, {
      failureThreshold: this.failureThreshold,
      timeout: this.timeout
    });
  }

  /**
   * Execute a function through the circuit breaker
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of the function or fallback
   */
  async execute(fn) {
    this.stats.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        return this.handleRejection();
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      return this.onFailure(error);
    }
  }

  /**
   * Execute function with timeout
   * @private
   */
  async executeWithTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`CircuitBreaker "${this.name}" request timeout after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful execution
   * @private
   */
  onSuccess() {
    this.stats.successfulRequests++;
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed execution
   * @private
   */
  async onFailure(error) {
    this.stats.failedRequests++;
    this.failures++;
    this.lastFailureTime = Date.now();

    logger.warn(`CircuitBreaker "${this.name}" failure #${this.failures}`, {
      error: error.message,
      state: this.state
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Single failure in half-open returns to open
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }

    // Try fallback if available
    if (this.fallback) {
      this.stats.fallbackExecutions++;
      try {
        return await this.fallback(error);
      } catch (fallbackError) {
        logger.error(`CircuitBreaker "${this.name}" fallback also failed`, {
          originalError: error.message,
          fallbackError: fallbackError.message
        });
        throw error;
      }
    }

    throw error;
  }

  /**
   * Handle request rejection when circuit is open
   * @private
   */
  async handleRejection() {
    this.stats.rejectedRequests++;

    logger.debug(`CircuitBreaker "${this.name}" rejected request`, {
      state: this.state,
      nextAttempt: new Date(this.nextAttempt).toISOString()
    });

    if (this.fallback) {
      this.stats.fallbackExecutions++;
      return await this.fallback(new Error('Circuit is OPEN'));
    }

    throw new CircuitBreakerOpenError(
      `CircuitBreaker "${this.name}" is OPEN. Retry after ${new Date(this.nextAttempt).toISOString()}`
    );
  }

  /**
   * Transition to a new state
   * @private
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;

    this.stats.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString()
    });

    logger.info(`CircuitBreaker "${this.name}" state change`, {
      from: oldState,
      to: newState,
      failures: this.failures
    });

    // Reset counters on state change
    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;

      // Emit circuit closed event
      eventBus.emit(DOMAIN_EVENTS.OLLAMA_CIRCUIT_CLOSED, {
        name: this.name
      });
    } else if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.timeout;
      this.successes = 0;

      // Emit circuit opened event
      eventBus.emit(DOMAIN_EVENTS.OLLAMA_CIRCUIT_OPENED, {
        name: this.name,
        failures: this.failures
      });
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
    }

    // Call callback if provided
    if (this.onStateChange) {
      this.onStateChange(oldState, newState, this);
    }
  }

  /**
   * Force the circuit to a specific state (for testing/admin)
   */
  forceState(state) {
    if (!Object.values(CircuitState).includes(state)) {
      throw new Error(`Invalid state: ${state}`);
    }
    this.transitionTo(state);
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
      nextAttempt: this.nextAttempt
        ? new Date(this.nextAttempt).toISOString()
        : null,
      stats: this.stats
    };
  }

  /**
   * Check if circuit is allowing requests
   */
  isAvailable() {
    if (this.state === CircuitState.CLOSED) return true;
    if (this.state === CircuitState.HALF_OPEN) return true;
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) return true;
    return false;
  }

  /**
   * Reset the circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;

    logger.info(`CircuitBreaker "${this.name}" reset`);
  }
}

/**
 * Custom error for circuit breaker rejections
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.isCircuitBreakerError = true;
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerRegistry {
  constructor() {
    /** @type {Map<string, CircuitBreaker>} */
    this.breakers = new Map();
  }

  /**
   * Get or create a circuit breaker
   * @param {string} name
   * @param {Object} options
   */
  get(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ name, ...options }));
    }
    return this.breakers.get(name);
  }

  /**
   * Get status of all circuit breakers
   */
  getAllStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Create singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Pre-configured circuit breakers for common services
 */
export const CircuitBreakers = {
  /**
   * Ollama AI service circuit breaker
   */
  ollama: circuitBreakerRegistry.get('ollama', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    requestTimeout: 60000, // AI requests can be slow
    fallback: async (error) => {
      logger.warn('Ollama fallback triggered', { error: error.message });
      return {
        fallback: true,
        message: 'AI service temporarily unavailable. Please try again later.',
        suggestion: null
      };
    }
  }),

  /**
   * Helsenorge integration circuit breaker
   */
  helsenorge: circuitBreakerRegistry.get('helsenorge', {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000,
    requestTimeout: 15000,
    fallback: async (error) => {
      logger.warn('Helsenorge fallback triggered', { error: error.message });
      return {
        fallback: true,
        message: 'Helsenorge integration temporarily unavailable',
        data: null
      };
    }
  }),

  /**
   * External SMS service circuit breaker
   */
  sms: circuitBreakerRegistry.get('sms', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    requestTimeout: 10000
  }),

  /**
   * Email service circuit breaker
   */
  email: circuitBreakerRegistry.get('email', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    requestTimeout: 10000
  })
};

export default { CircuitBreaker, CircuitBreakerOpenError, circuitBreakerRegistry, CircuitBreakers };
