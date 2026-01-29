/**
 * Domain Event Types
 * Defines all domain events for the AI feedback and monitoring system
 */

/**
 * AI-related domain events
 */
export const AIEventTypes = {
  // Feedback events
  AI_FEEDBACK_RECORDED: 'ai.feedback.recorded',
  AI_FEEDBACK_POSITIVE: 'ai.feedback.positive',
  AI_FEEDBACK_NEGATIVE: 'ai.feedback.negative',

  // Retraining events
  AI_RETRAINING_TRIGGERED: 'ai.retraining.triggered',
  AI_RETRAINING_STARTED: 'ai.retraining.started',
  AI_RETRAINING_COMPLETED: 'ai.retraining.completed',
  AI_RETRAINING_FAILED: 'ai.retraining.failed',

  // Model deployment events
  AI_MODEL_DEPLOYED: 'ai.model.deployed',
  AI_MODEL_ROLLBACK: 'ai.model.rollback',

  // Service health events
  AI_SERVICE_HEALTH_CHANGED: 'ai.service.health_changed',
  AI_SERVICE_DEGRADED: 'ai.service.degraded',
  AI_SERVICE_RECOVERED: 'ai.service.recovered',

  // Circuit breaker events
  AI_CIRCUIT_OPENED: 'ai.circuit.opened',
  AI_CIRCUIT_CLOSED: 'ai.circuit.closed',
  AI_CIRCUIT_HALF_OPEN: 'ai.circuit.half_open'
};

/**
 * Patient-related domain events
 */
export const PatientEventTypes = {
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_LIFECYCLE_CHANGED: 'patient.lifecycle_changed'
};

/**
 * Encounter-related domain events
 */
export const EncounterEventTypes = {
  ENCOUNTER_CREATED: 'encounter.created',
  ENCOUNTER_SIGNED: 'encounter.signed',
  ENCOUNTER_AMENDED: 'encounter.amended'
};

/**
 * Base domain event class
 */
export class DomainEvent {
  constructor(type, payload, metadata = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.payload = payload;
    this.metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...metadata
    };
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      metadata: this.metadata
    };
  }
}

/**
 * AI Feedback Recorded Event
 */
export class AIFeedbackRecordedEvent extends DomainEvent {
  constructor(payload) {
    super(AIEventTypes.AI_FEEDBACK_RECORDED, {
      feedbackId: payload.feedbackId,
      suggestionId: payload.suggestionId,
      feedbackType: payload.feedbackType, // 'positive' | 'negative' | 'correction'
      rating: payload.rating, // 1-5
      correctedText: payload.correctedText,
      context: payload.context,
      organizationId: payload.organizationId,
      userId: payload.userId
    });
  }
}

/**
 * AI Retraining Triggered Event
 */
export class AIRetrainingTriggeredEvent extends DomainEvent {
  constructor(payload) {
    super(AIEventTypes.AI_RETRAINING_TRIGGERED, {
      reason: payload.reason, // 'threshold_reached' | 'manual' | 'scheduled'
      feedbackCount: payload.feedbackCount,
      negativeRatio: payload.negativeRatio,
      triggeredBy: payload.triggeredBy
    });
  }
}

/**
 * AI Service Health Changed Event
 */
export class AIServiceHealthChangedEvent extends DomainEvent {
  constructor(payload) {
    super(AIEventTypes.AI_SERVICE_HEALTH_CHANGED, {
      service: payload.service, // 'ollama' | 'openai' | 'local'
      previousState: payload.previousState,
      currentState: payload.currentState, // 'healthy' | 'degraded' | 'unavailable'
      latency: payload.latency,
      errorRate: payload.errorRate
    });
  }
}

/**
 * AI Circuit Breaker State Changed Event
 */
export class AICircuitStateChangedEvent extends DomainEvent {
  constructor(payload) {
    super(
      payload.state === 'OPEN' ? AIEventTypes.AI_CIRCUIT_OPENED :
      payload.state === 'CLOSED' ? AIEventTypes.AI_CIRCUIT_CLOSED :
      AIEventTypes.AI_CIRCUIT_HALF_OPEN,
      {
        service: payload.service,
        previousState: payload.previousState,
        currentState: payload.state,
        failureCount: payload.failureCount,
        lastFailure: payload.lastFailure
      }
    );
  }
}

export default {
  AIEventTypes,
  PatientEventTypes,
  EncounterEventTypes,
  DomainEvent,
  AIFeedbackRecordedEvent,
  AIRetrainingTriggeredEvent,
  AIServiceHealthChangedEvent,
  AICircuitStateChangedEvent
};
