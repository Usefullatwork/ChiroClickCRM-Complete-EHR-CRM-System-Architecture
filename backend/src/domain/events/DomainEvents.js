/**
 * Domain Events Definitions
 * Central registry of all domain events in the system
 *
 * @module domain/events/DomainEvents
 */

/**
 * All domain event types organized by aggregate
 */
export const DOMAIN_EVENTS = {
  // ============================================================================
  // PATIENT LIFECYCLE EVENTS
  // ============================================================================
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_DEACTIVATED: 'patient.deactivated',
  PATIENT_REACTIVATED: 'patient.reactivated',
  PATIENT_MERGED: 'patient.merged',
  PATIENT_GDPR_DELETED: 'patient.gdpr_deleted',

  // ============================================================================
  // CLINICAL EVENTS
  // ============================================================================
  ENCOUNTER_STARTED: 'encounter.started',
  ENCOUNTER_COMPLETED: 'encounter.completed',
  ENCOUNTER_AMENDED: 'encounter.amended',
  TREATMENT_PRESCRIBED: 'treatment.prescribed',
  TREATMENT_COMPLETED: 'treatment.completed',
  DIAGNOSIS_ADDED: 'diagnosis.added',
  DIAGNOSIS_RESOLVED: 'diagnosis.resolved',
  RED_FLAG_DETECTED: 'clinical.red_flag_detected',

  // ============================================================================
  // APPOINTMENT EVENTS
  // ============================================================================
  APPOINTMENT_SCHEDULED: 'appointment.scheduled',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  APPOINTMENT_NO_SHOW: 'appointment.no_show',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',

  // ============================================================================
  // COMMUNICATION EVENTS
  // ============================================================================
  MESSAGE_SENT: 'communication.message_sent',
  MESSAGE_DELIVERED: 'communication.message_delivered',
  MESSAGE_FAILED: 'communication.message_failed',
  FOLLOWUP_SCHEDULED: 'communication.followup_scheduled',
  FOLLOWUP_COMPLETED: 'communication.followup_completed',
  RECALL_TRIGGERED: 'communication.recall_triggered',

  // ============================================================================
  // AI/ML EVENTS - CRITICAL FOR TRAINING LOOP
  // ============================================================================
  SUGGESTION_GENERATED: 'ai.suggestion.generated',
  SUGGESTION_ACCEPTED: 'ai.suggestion.accepted',
  SUGGESTION_REJECTED: 'ai.suggestion.rejected',
  SUGGESTION_MODIFIED: 'ai.suggestion.modified',
  SUGGESTION_TIMED_OUT: 'ai.suggestion.timed_out',

  // AI Training Pipeline Events
  TRAINING_DATA_COLLECTED: 'ai.training.data_collected',
  TRAINING_THRESHOLD_REACHED: 'ai.training.threshold_reached',
  MODEL_TRAINING_STARTED: 'ai.model.training_started',
  MODEL_TRAINING_COMPLETED: 'ai.model.training_completed',
  MODEL_TRAINING_FAILED: 'ai.model.training_failed',
  MODEL_VALIDATED: 'ai.model.validated',
  MODEL_ACTIVATED: 'ai.model.activated',
  MODEL_ROLLED_BACK: 'ai.model.rolled_back',

  // ============================================================================
  // FINANCIAL EVENTS
  // ============================================================================
  INVOICE_CREATED: 'financial.invoice_created',
  INVOICE_PAID: 'financial.invoice_paid',
  INVOICE_OVERDUE: 'financial.invoice_overdue',
  PAYMENT_RECEIVED: 'financial.payment_received',
  REFUND_PROCESSED: 'financial.refund_processed',

  // ============================================================================
  // SYSTEM EVENTS
  // ============================================================================
  AUDIT_LOG_CREATED: 'system.audit_log_created',
  EXPORT_COMPLETED: 'system.export_completed',
  IMPORT_COMPLETED: 'system.import_completed',
  BACKUP_COMPLETED: 'system.backup_completed',
  INTEGRATION_SYNCED: 'system.integration_synced',

  // ============================================================================
  // EXTERNAL SERVICE EVENTS
  // ============================================================================
  HELSENORGE_SYNC_COMPLETED: 'external.helsenorge_sync_completed',
  HELSENORGE_SYNC_FAILED: 'external.helsenorge_sync_failed',
  OLLAMA_REQUEST_COMPLETED: 'external.ollama_request_completed',
  OLLAMA_REQUEST_FAILED: 'external.ollama_request_failed',
  OLLAMA_CIRCUIT_OPENED: 'external.ollama_circuit_opened',
  OLLAMA_CIRCUIT_CLOSED: 'external.ollama_circuit_closed'
};

/**
 * Domain Event base class
 * All events should extend or conform to this structure
 */
export class DomainEvent {
  /**
   * @param {string} type - Event type from DOMAIN_EVENTS
   * @param {Object} payload - Event data
   * @param {Object} metadata - Additional metadata
   */
  constructor(type, payload, metadata = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.payload = payload;
    this.metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: metadata.source || 'chiroclickcrm',
      correlationId: metadata.correlationId || crypto.randomUUID(),
      userId: metadata.userId || null,
      organizationId: metadata.organizationId || null,
      ...metadata
    };
  }

  /**
   * Convert to JSON for logging/storage
   */
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
 * Event factory functions for type safety
 */
export const EventFactory = {
  // Patient Events
  patientCreated: (patient, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.PATIENT_CREATED, { patient }, metadata),

  patientUpdated: (patientId, changes, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.PATIENT_UPDATED, { patientId, changes }, metadata),

  // Appointment Events
  appointmentScheduled: (appointment, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.APPOINTMENT_SCHEDULED, { appointment }, metadata),

  appointmentCancelled: (appointmentId, reason, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.APPOINTMENT_CANCELLED, { appointmentId, reason }, metadata),

  // AI Events
  suggestionGenerated: (suggestionId, type, content, confidence, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.SUGGESTION_GENERATED, {
      suggestionId,
      type,
      content,
      confidence
    }, metadata),

  suggestionAccepted: (suggestionId, responseTime, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.SUGGESTION_ACCEPTED, {
      suggestionId,
      responseTime,
      acceptedAt: new Date().toISOString()
    }, metadata),

  suggestionRejected: (suggestionId, reason, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.SUGGESTION_REJECTED, {
      suggestionId,
      reason,
      rejectedAt: new Date().toISOString()
    }, metadata),

  suggestionModified: (suggestionId, originalContent, modifiedContent, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.SUGGESTION_MODIFIED, {
      suggestionId,
      originalContent,
      modifiedContent,
      modifiedAt: new Date().toISOString()
    }, metadata),

  trainingThresholdReached: (stats, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.TRAINING_THRESHOLD_REACHED, { stats }, metadata),

  modelTrainingCompleted: (modelName, metrics, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.MODEL_TRAINING_COMPLETED, { modelName, metrics }, metadata),

  // Clinical Events
  encounterCompleted: (encounterId, patientId, diagnoses, treatments, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.ENCOUNTER_COMPLETED, {
      encounterId,
      patientId,
      diagnoses,
      treatments
    }, metadata),

  redFlagDetected: (patientId, encounterId, flags, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.RED_FLAG_DETECTED, {
      patientId,
      encounterId,
      flags,
      severity: 'HIGH'
    }, metadata),

  // External Service Events
  ollamaCircuitOpened: (service, failureCount, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.OLLAMA_CIRCUIT_OPENED, {
      service,
      failureCount,
      openedAt: new Date().toISOString()
    }, metadata),

  ollamaCircuitClosed: (service, metadata) =>
    new DomainEvent(DOMAIN_EVENTS.OLLAMA_CIRCUIT_CLOSED, {
      service,
      closedAt: new Date().toISOString()
    }, metadata)
};

export default { DOMAIN_EVENTS, DomainEvent, EventFactory };
