/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers for different services
 */

import { CircuitBreaker, CircuitState } from './CircuitBreaker.js';
import logger from '../../utils/logger.js';

class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
    this.defaultConfig = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRequests: 3,
      successThreshold: 3
    };
  }

  /**
   * Get or create a circuit breaker for a service
   * @param {string} name - Service name
   * @param {Object} config - Optional custom configuration
   * @returns {CircuitBreaker}
   */
  getBreaker(name, config = {}) {
    if (!this.breakers.has(name)) {
      const breakerConfig = {
        name,
        ...this.defaultConfig,
        ...config
      };
      this.breakers.set(name, new CircuitBreaker(breakerConfig));
      logger.info('Circuit breaker registered', { name, config: breakerConfig });
    }
    return this.breakers.get(name);
  }

  /**
   * Register a circuit breaker with specific configuration
   * @param {string} name - Service name
   * @param {Object} config - Configuration options
   * @returns {CircuitBreaker}
   */
  register(name, config = {}) {
    if (this.breakers.has(name)) {
      logger.warn('Circuit breaker already exists, replacing', { name });
      this.breakers.get(name).destroy();
    }

    const breakerConfig = {
      name,
      ...this.defaultConfig,
      ...config
    };

    const breaker = new CircuitBreaker(breakerConfig);
    this.breakers.set(name, breaker);

    logger.info('Circuit breaker registered', { name, config: breakerConfig });
    return breaker;
  }

  /**
   * Execute a function through a named circuit breaker
   * @param {string} name - Service name
   * @param {Function} fn - Function to execute
   * @param {Object} config - Optional config for auto-registration
   * @returns {Promise<any>}
   */
  async execute(name, fn, config = {}) {
    const breaker = this.getBreaker(name, config);
    return breaker.execute(fn);
  }

  /**
   * Reset a specific circuit breaker
   * @param {string} name - Service name
   */
  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    } else {
      logger.warn('Circuit breaker not found for reset', { name });
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    logger.info('All circuit breakers reset');
  }

  /**
   * Get status of all circuit breakers
   * @returns {Object} Status of all breakers
   */
  getAllStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers.entries()) {
      status[name] = breaker.getStatus();
    }
    return status;
  }

  /**
   * Get status of a specific circuit breaker
   * @param {string} name - Service name
   * @returns {Object|null} Status or null if not found
   */
  getStatus(name) {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.getStatus() : null;
  }

  /**
   * Check overall health (all breakers healthy)
   * @returns {boolean}
   */
  isHealthy() {
    for (const breaker of this.breakers.values()) {
      if (!breaker.isHealthy()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get list of unhealthy services
   * @returns {string[]}
   */
  getUnhealthyServices() {
    const unhealthy = [];
    for (const [name, breaker] of this.breakers.entries()) {
      if (!breaker.isHealthy()) {
        unhealthy.push(name);
      }
    }
    return unhealthy;
  }

  /**
   * Get health summary
   * @returns {Object}
   */
  getHealthSummary() {
    const services = {};
    let healthyCount = 0;
    let totalCount = 0;

    for (const [name, breaker] of this.breakers.entries()) {
      totalCount++;
      const isHealthy = breaker.isHealthy();
      if (isHealthy) {
        healthyCount++;
      }
      services[name] = {
        state: breaker.state,
        healthy: isHealthy,
        failureCount: breaker.failureCount
      };
    }

    return {
      healthy: healthyCount === totalCount,
      healthyCount,
      totalCount,
      unhealthyServices: this.getUnhealthyServices(),
      services
    };
  }

  /**
   * Remove a circuit breaker
   * @param {string} name - Service name
   */
  remove(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.destroy();
      this.breakers.delete(name);
      logger.info('Circuit breaker removed', { name });
    }
  }

  /**
   * Clear all circuit breakers
   */
  clear() {
    for (const breaker of this.breakers.values()) {
      breaker.destroy();
    }
    this.breakers.clear();
    logger.info('All circuit breakers cleared');
  }

  /**
   * Get list of registered services
   * @returns {string[]}
   */
  getRegisteredServices() {
    return Array.from(this.breakers.keys());
  }
}

// Singleton instance
const registry = new CircuitBreakerRegistry();

// Pre-register common services with custom config
registry.register('ollama', {
  failureThreshold: 5,
  resetTimeout: 30000,  // 30 seconds
  halfOpenRequests: 3,
  successThreshold: 3
});

registry.register('openai', {
  failureThreshold: 3,
  resetTimeout: 60000,  // 1 minute
  halfOpenRequests: 2,
  successThreshold: 2
});

export { CircuitBreakerRegistry, CircuitState };
export default registry;
