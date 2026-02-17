/**
 * Event Bus - Domain Event Publication and Subscription
 * Implements pub/sub pattern for loose coupling between aggregates
 *
 * @module domain/events/EventBus
 */

import logger from '../../utils/logger.js';
import { _DOMAIN_EVENTS, DomainEvent } from './DomainEvents.js';

/**
 * EventBus singleton for publishing and subscribing to domain events
 */
class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.subscribers = new Map();

    /** @type {Array<Object>} */
    this.eventHistory = [];

    /** @type {number} */
    this.maxHistorySize = 1000;

    /** @type {Object} */
    this.stats = {
      published: 0,
      delivered: 0,
      failed: 0,
      byType: {},
    };

    /** @type {boolean} */
    this.isProcessing = false;

    /** @type {Array<DomainEvent>} */
    this.pendingEvents = [];
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event type from DOMAIN_EVENTS
   * @param {Function} handler - Async handler function
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  on(eventType, handler, options = {}) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const wrappedHandler = async (event) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Event handler error for ${eventType}:`, {
          error: error.message,
          eventId: event.id,
        });
        if (!options.suppressErrors) {
          throw error;
        }
      }
    };

    this.subscribers.get(eventType).add(wrappedHandler);

    logger.debug(`Subscribed to event: ${eventType}`);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(wrappedHandler);
      logger.debug(`Unsubscribed from event: ${eventType}`);
    };
  }

  /**
   * Subscribe to multiple event types with one handler
   * @param {string[]} eventTypes - Array of event types
   * @param {Function} handler - Async handler function
   * @returns {Function} Unsubscribe function
   */
  onMany(eventTypes, handler) {
    const unsubscribers = eventTypes.map((type) => this.on(type, handler));
    return () => unsubscribers.forEach((unsub) => unsub());
  }

  /**
   * Subscribe to an event type, triggering only once
   * @param {string} eventType - Event type
   * @param {Function} handler - Handler function
   */
  once(eventType, handler) {
    const unsubscribe = this.on(eventType, async (event) => {
      unsubscribe();
      await handler(event);
    });
  }

  /**
   * Publish an event
   * @param {DomainEvent|string} eventOrType - Event instance or event type
   * @param {Object} payload - Event payload (if eventOrType is string)
   * @param {Object} metadata - Event metadata (if eventOrType is string)
   */
  async emit(eventOrType, payload, metadata) {
    let event;

    if (eventOrType instanceof DomainEvent) {
      event = eventOrType;
    } else {
      event = new DomainEvent(eventOrType, payload, metadata);
    }

    this.stats.published++;
    this.stats.byType[event.type] = (this.stats.byType[event.type] || 0) + 1;

    // Store in history
    this.eventHistory.push({
      ...event.toJSON(),
      processedAt: null,
      handlers: [],
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Add to pending queue
    this.pendingEvents.push(event);

    // Process events (non-blocking)
    this.processEvents();

    logger.debug(`Event published: ${event.type}`, { eventId: event.id });

    return event;
  }

  /**
   * Publish an event and wait for all handlers
   * @param {DomainEvent|string} eventOrType
   * @param {Object} payload
   * @param {Object} metadata
   */
  async emitAndWait(eventOrType, payload, metadata) {
    let event;

    if (eventOrType instanceof DomainEvent) {
      event = eventOrType;
    } else {
      event = new DomainEvent(eventOrType, payload, metadata);
    }

    const subscribers = this.subscribers.get(event.type);
    if (!subscribers || subscribers.size === 0) {
      logger.debug(`No subscribers for event: ${event.type}`);
      return event;
    }

    const handlers = Array.from(subscribers);
    const results = await Promise.allSettled(handlers.map((handler) => handler(event)));

    // Track failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.stats.failed++;
        logger.error(`Handler ${index} failed for ${event.type}:`, result.reason);
      } else {
        this.stats.delivered++;
      }
    });

    return event;
  }

  /**
   * Process pending events asynchronously
   * @private
   */
  async processEvents() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    try {
      while (this.pendingEvents.length > 0) {
        const event = this.pendingEvents.shift();
        const subscribers = this.subscribers.get(event.type);

        if (!subscribers || subscribers.size === 0) {
          continue;
        }

        // Fire and forget - don't block on handlers
        Promise.allSettled(Array.from(subscribers).map((handler) => handler(event))).then(
          (results) => {
            results.forEach((result) => {
              if (result.status === 'rejected') {
                this.stats.failed++;
              } else {
                this.stats.delivered++;
              }
            });

            // Update history
            const historyEntry = this.eventHistory.find((e) => e.id === event.id);
            if (historyEntry) {
              historyEntry.processedAt = new Date().toISOString();
            }
          }
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all subscribers for an event type
   * @param {string} eventType
   * @returns {number} Number of subscribers
   */
  subscriberCount(eventType) {
    return this.subscribers.get(eventType)?.size || 0;
  }

  /**
   * Get event bus statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalSubscribers: Array.from(this.subscribers.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      eventTypes: this.subscribers.size,
      historySize: this.eventHistory.length,
      pendingEvents: this.pendingEvents.length,
    };
  }

  /**
   * Get recent events of a specific type
   * @param {string} eventType
   * @param {number} limit
   */
  getRecentEvents(eventType, limit = 10) {
    return this.eventHistory.filter((e) => !eventType || e.type === eventType).slice(-limit);
  }

  /**
   * Clear all subscribers (useful for testing)
   */
  clear() {
    this.subscribers.clear();
    logger.info('EventBus cleared all subscribers');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      published: 0,
      delivered: 0,
      failed: 0,
      byType: {},
    };
    this.eventHistory = [];
  }
}

// Create singleton instance
export const eventBus = new EventBus();

/**
 * Helper to create event-driven handlers
 * Registers multiple event handlers at once
 *
 * @example
 * registerEventHandlers({
 *   [DOMAIN_EVENTS.PATIENT_CREATED]: handlePatientCreated,
 *   [DOMAIN_EVENTS.APPOINTMENT_SCHEDULED]: handleAppointmentScheduled
 * });
 */
export function registerEventHandlers(handlers) {
  const unsubscribers = [];

  for (const [eventType, handler] of Object.entries(handlers)) {
    unsubscribers.push(eventBus.on(eventType, handler));
  }

  return () => unsubscribers.forEach((unsub) => unsub());
}

/**
 * Decorator-style event emitter for service methods
 * Automatically emits events after method execution
 *
 * @param {string} eventType - Event to emit on success
 * @param {Function} payloadExtractor - Function to extract payload from result
 */
export function emitsEvent(eventType, payloadExtractor = (result) => result) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const result = await originalMethod.apply(this, args);
      const payload = payloadExtractor(result, args);

      await eventBus.emit(eventType, payload);

      return result;
    };

    return descriptor;
  };
}

export default eventBus;
