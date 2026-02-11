/**
 * Automation Triggers
 * Trigger type definitions and trigger evaluation logic
 */

// =============================================================================
// TRIGGER TYPES
// =============================================================================

export const TRIGGER_TYPES = {
  PATIENT_CREATED: 'PATIENT_CREATED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  APPOINTMENT_MISSED: 'APPOINTMENT_MISSED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  DAYS_SINCE_VISIT: 'DAYS_SINCE_VISIT',
  BIRTHDAY: 'BIRTHDAY',
  LIFECYCLE_CHANGE: 'LIFECYCLE_CHANGE',
  CUSTOM: 'CUSTOM',
};

/**
 * Evaluate if a trigger matches the event
 */
export const evaluateTrigger = (workflow, eventData) => {
  const config = workflow.trigger_config || {};

  switch (workflow.trigger_type) {
    case TRIGGER_TYPES.PATIENT_CREATED:
      return !!eventData.patient_id;

    case TRIGGER_TYPES.APPOINTMENT_SCHEDULED:
      if (config.appointment_type && eventData.appointment_type !== config.appointment_type) {
        return false;
      }
      return !!eventData.appointment_id;

    case TRIGGER_TYPES.APPOINTMENT_COMPLETED:
      return !!eventData.appointment_id && eventData.status === 'COMPLETED';

    case TRIGGER_TYPES.APPOINTMENT_MISSED:
      return !!eventData.appointment_id && eventData.status === 'NO_SHOW';

    case TRIGGER_TYPES.APPOINTMENT_CANCELLED:
      return !!eventData.appointment_id && eventData.status === 'CANCELLED';

    case TRIGGER_TYPES.DAYS_SINCE_VISIT:
      // Check days since last visit
      if (eventData.days_since_visit && config.days) {
        return eventData.days_since_visit >= config.days;
      }
      return false;

    case TRIGGER_TYPES.BIRTHDAY:
      // Check if today is patient's birthday
      return eventData.is_birthday === true;

    case TRIGGER_TYPES.LIFECYCLE_CHANGE:
      if (config.from_stage && eventData.previous_lifecycle !== config.from_stage) {
        return false;
      }
      if (config.to_stage && eventData.new_lifecycle !== config.to_stage) {
        return false;
      }
      return !!eventData.lifecycle_changed;

    case TRIGGER_TYPES.CUSTOM:
      // Custom triggers match if event_type matches
      return eventData.event_type === config.event_type;

    default:
      return false;
  }
};
