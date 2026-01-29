/**
 * Event Bus - Pub/Sub implementation for domain events
 * Provides async event handling with optional persistence
 */

import logger from '../../utils/logger.js';

class EventBus {
  constructor() {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe to a specific event type
   * @param {string} eventType - Event type to subscribe to (supports wildcards with *)
   * @param {Function} handler - Async handler function (event) => Promise<void>
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler, options = {}) {
    const { priority = 0, once = false } = options;

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const subscription = {
      handler,
      priority,
      once,
      id: crypto.randomUUID()
    };

    this.subscribers.get(eventType).push(subscription);

    // Sort by priority (higher priority first)
    this.subscribers.get(eventType).sort((a, b) => b.priority - a.priority);

    logger.debug('Event subscription added', { eventType, subscriptionId: subscription.id });

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, subscription.id);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventType - Event type
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(eventType, subscriptionId) {
    if (!this.subscribers.has(eventType)) {
      return;
    }

    const subscribers = this.subscribers.get(eventType);
    const index = subscribers.findIndex(s => s.id === subscriptionId);

    if (index !== -1) {
      subscribers.splice(index, 1);
      logger.debug('Event subscription removed', { eventType, subscriptionId });
    }
  }

  /**
   * Publish an event to all subscribers
   * @param {DomainEvent} event - Event to publish
   * @returns {Promise<void>}
   */
  async publish(event) {
    const eventType = event.type;
    const startTime = Date.now();

    // Store in history
    this.addToHistory(event);

    // Get all matching subscribers (including wildcards)
    const matchingSubscribers = this.getMatchingSubscribers(eventType);

    if (matchingSubscribers.length === 0) {
      logger.debug('No subscribers for event', { eventType });
      return;
    }

    logger.info('Publishing event', {
      eventType,
      eventId: event.id,
      subscriberCount: matchingSubscribers.length
    });

    // Execute all handlers
    const results = await Promise.allSettled(
      matchingSubscribers.map(async ({ subscription, pattern }) => {
        try {
          await subscription.handler(event);

          // Remove one-time subscriptions
          if (subscription.once) {
            this.unsubscribe(pattern, subscription.id);
          }

          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          logger.error('Event handler error', {
            eventType,
            eventId: event.id,
            subscriptionId: subscription.id,
            error: error.message
          });
          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    const duration = Date.now() - startTime;
    const failures = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    logger.info('Event published', {
      eventType,
      eventId: event.id,
      duration,
      successCount: matchingSubscribers.length - failures,
      failureCount: failures
    });
  }

  /**
   * Publish multiple events
   * @param {DomainEvent[]} events - Events to publish
   * @returns {Promise<void>}
   */
  async publishAll(events) {
    await Promise.all(events.map(event => this.publish(event)));
  }

  /**
   * Get subscribers matching an event type (including wildcards)
   * @param {string} eventType - Event type
   * @returns {Array} Matching subscriptions with their patterns
   */
  getMatchingSubscribers(eventType) {
    const matches = [];

    for (const [pattern, subscribers] of this.subscribers.entries()) {
      if (this.matchesPattern(eventType, pattern)) {
        subscribers.forEach(subscription => {
          matches.push({ subscription, pattern });
        });
      }
    }

    // Sort all matches by priority
    matches.sort((a, b) => b.subscription.priority - a.subscription.priority);

    return matches;
  }

  /**
   * Check if event type matches a pattern (supports wildcards)
   * @param {string} eventType - Event type
   * @param {string} pattern - Pattern to match against
   * @returns {boolean}
   */
  matchesPattern(eventType, pattern) {
    if (pattern === '*') {
      return true;
    }

    if (pattern === eventType) {
      return true;
    }

    // Support patterns like 'ai.*' or 'ai.feedback.*'
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return eventType.startsWith(prefix);
    }

    return false;
  }

  /**
   * Add event to history
   * @param {DomainEvent} event - Event to store
   */
  addToHistory(event) {
    this.eventHistory.push({
      ...event.toJSON(),
      processedAt: new Date().toISOString()
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get recent events from history
   * @param {Object} options - Query options
   * @returns {Array} Recent events
   */
  getRecentEvents(options = {}) {
    const { limit = 100, eventType = null, since = null } = options;

    let events = [...this.eventHistory];

    if (eventType) {
      events = events.filter(e => this.matchesPattern(e.type, eventType));
    }

    if (since) {
      const sinceDate = new Date(since);
      events = events.filter(e => new Date(e.metadata.timestamp) >= sinceDate);
    }

    return events.slice(-limit);
  }

  /**
   * Get event bus statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const subscriberCount = Array.from(this.subscribers.values())
      .reduce((sum, subs) => sum + subs.length, 0);

    return {
      subscriberCount,
      eventTypeCount: this.subscribers.size,
      historySize: this.eventHistory.length,
      maxHistorySize: this.maxHistorySize
    };
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions() {
    this.subscribers.clear();
    logger.info('All event subscriptions cleared');
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    logger.info('Event history cleared');
  }
}

// Singleton instance
const eventBus = new EventBus();

export { EventBus };
export default eventBus;
