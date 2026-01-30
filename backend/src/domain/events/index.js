/**
 * Domain Events Module Exports
 *
 * @module domain/events
 */

export { DOMAIN_EVENTS, DomainEvent, EventFactory } from './DomainEvents.js';
export { eventBus, registerEventHandlers, emitsEvent } from './EventBus.js';

export default {
  DomainEvents: './DomainEvents.js',
  EventBus: './EventBus.js'
};
