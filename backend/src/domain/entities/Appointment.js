/**
 * Appointment Domain Entity
 * Encapsulates business rules for scheduling
 */

export class Appointment {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id;
    this.patientId = data.patient_id;
    this.practitionerId = data.practitioner_id;
    this.startTime = data.start_time ? new Date(data.start_time) : null;
    this.endTime = data.end_time ? new Date(data.end_time) : null;
    this.appointmentType = data.appointment_type || 'FOLLOWUP';
    this.status = data.status || 'SCHEDULED';
    this.notes = data.notes;
    this.reminderSent = data.reminder_sent || false;
    this.confirmedAt = data.confirmed_at;
    this.cancelledAt = data.cancelled_at;
    this.cancellationReason = data.cancellation_reason;
    this.checkedInAt = data.checked_in_at;
    this.recurringPattern = data.recurring_pattern;
    this.recurringEndDate = data.recurring_end_date;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Valid appointment types
   */
  static get APPOINTMENT_TYPES() {
    return ['INITIAL', 'FOLLOWUP', 'REASSESSMENT', 'EMERGENCY', 'PHONE', 'VIDEO'];
  }

  /**
   * Valid statuses
   */
  static get STATUSES() {
    return ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  }

  /**
   * Recurring patterns
   */
  static get RECURRING_PATTERNS() {
    return ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
  }

  /**
   * Default durations by type (in minutes)
   */
  static get DEFAULT_DURATIONS() {
    return {
      INITIAL: 60,
      FOLLOWUP: 30,
      REASSESSMENT: 45,
      EMERGENCY: 30,
      PHONE: 15,
      VIDEO: 30,
    };
  }

  /**
   * Get duration in minutes
   */
  getDurationMinutes() {
    if (!this.startTime || !this.endTime) return 0;
    return Math.round((this.endTime - this.startTime) / 60000);
  }

  /**
   * Check if appointment is in the past
   */
  isInPast() {
    return this.startTime && this.startTime < new Date();
  }

  /**
   * Check if appointment is today
   */
  isToday() {
    if (!this.startTime) return false;
    const today = new Date();
    return this.startTime.toDateString() === today.toDateString();
  }

  /**
   * Check if appointment can be cancelled
   */
  canCancel() {
    const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
    return !nonCancellableStatuses.includes(this.status);
  }

  /**
   * Check if appointment can be confirmed
   */
  canConfirm() {
    return this.status === 'SCHEDULED' && !this.isInPast();
  }

  /**
   * Check if patient can check in
   */
  canCheckIn() {
    if (this.status !== 'SCHEDULED' && this.status !== 'CONFIRMED') return false;

    // Can check in up to 15 minutes before appointment
    const checkInWindow = new Date(this.startTime);
    checkInWindow.setMinutes(checkInWindow.getMinutes() - 15);

    return new Date() >= checkInWindow;
  }

  /**
   * Cancel the appointment
   */
  cancel(reason) {
    if (!this.canCancel()) {
      throw new Error('Appointment cannot be cancelled');
    }

    this.status = 'CANCELLED';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }

  /**
   * Confirm the appointment
   */
  confirm() {
    if (!this.canConfirm()) {
      throw new Error('Appointment cannot be confirmed');
    }

    this.status = 'CONFIRMED';
    this.confirmedAt = new Date();
  }

  /**
   * Check in patient
   */
  checkIn() {
    if (!this.canCheckIn()) {
      throw new Error('Cannot check in at this time');
    }

    this.status = 'CHECKED_IN';
    this.checkedInAt = new Date();
  }

  /**
   * Mark as no-show
   */
  markNoShow() {
    if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
      throw new Error('Cannot mark as no-show');
    }

    this.status = 'NO_SHOW';
  }

  /**
   * Complete the appointment
   */
  complete() {
    if (this.status === 'CANCELLED' || this.status === 'NO_SHOW') {
      throw new Error('Cannot complete cancelled or no-show appointment');
    }

    this.status = 'COMPLETED';
  }

  /**
   * Check for scheduling conflicts
   */
  conflictsWith(otherAppointment) {
    if (!this.startTime || !this.endTime ||
        !otherAppointment.startTime || !otherAppointment.endTime) {
      return false;
    }

    // Different practitioners don't conflict
    if (this.practitionerId !== otherAppointment.practitionerId) {
      return false;
    }

    // Check for time overlap
    return this.startTime < otherAppointment.endTime &&
           this.endTime > otherAppointment.startTime;
  }

  /**
   * Generate reminder message
   */
  generateReminderMessage(patientName) {
    const dateStr = this.startTime.toLocaleDateString('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = this.startTime.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `Hei ${patientName}! Du har time ${dateStr} kl. ${timeStr}. ` +
           `Vennligst bekreft eller avbestill minst 24 timer før.`;
  }

  /**
   * Check if reminder should be sent
   */
  shouldSendReminder() {
    if (this.reminderSent) return false;
    if (this.status !== 'SCHEDULED') return false;

    // Send reminder 24 hours before
    const reminderTime = new Date(this.startTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    return new Date() >= reminderTime;
  }

  /**
   * Validate appointment data
   */
  validate() {
    const errors = [];

    if (!this.patientId) {
      errors.push('Patient ID is required');
    }

    if (!this.practitionerId) {
      errors.push('Practitioner ID is required');
    }

    if (!this.startTime) {
      errors.push('Start time is required');
    }

    if (!this.endTime) {
      errors.push('End time is required');
    }

    if (this.startTime && this.endTime && this.startTime >= this.endTime) {
      errors.push('End time must be after start time');
    }

    if (!Appointment.APPOINTMENT_TYPES.includes(this.appointmentType)) {
      errors.push(`Appointment type must be one of: ${Appointment.APPOINTMENT_TYPES.join(', ')}`);
    }

    if (!Appointment.STATUSES.includes(this.status)) {
      errors.push(`Status must be one of: ${Appointment.STATUSES.join(', ')}`);
    }

    if (this.recurringPattern && !Appointment.RECURRING_PATTERNS.includes(this.recurringPattern)) {
      errors.push(`Recurring pattern must be one of: ${Appointment.RECURRING_PATTERNS.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database format
   */
  toDatabase() {
    return {
      id: this.id,
      organization_id: this.organizationId,
      patient_id: this.patientId,
      practitioner_id: this.practitionerId,
      start_time: this.startTime?.toISOString(),
      end_time: this.endTime?.toISOString(),
      appointment_type: this.appointmentType,
      status: this.status,
      notes: this.notes,
      reminder_sent: this.reminderSent,
      confirmed_at: this.confirmedAt,
      cancelled_at: this.cancelledAt,
      cancellation_reason: this.cancellationReason,
      checked_in_at: this.checkedInAt,
      recurring_pattern: this.recurringPattern,
      recurring_end_date: this.recurringEndDate,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new Appointment(row);
  }
}

export default Appointment;
