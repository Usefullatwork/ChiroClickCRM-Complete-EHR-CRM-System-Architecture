/**
 * Communication Domain Entity
 * Encapsulates business rules for patient communications (SMS, Email)
 */

export class Communication {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id;
    this.patientId = data.patient_id;
    this.userId = data.user_id;
    this.type = data.type || 'SMS';
    this.direction = data.direction || 'OUTBOUND';
    this.status = data.status || 'PENDING';
    this.recipient = data.recipient;
    this.subject = data.subject;
    this.content = data.content;
    this.templateId = data.template_id;
    this.templateVariables = data.template_variables || {};
    this.scheduledAt = data.scheduled_at ? new Date(data.scheduled_at) : null;
    this.sentAt = data.sent_at ? new Date(data.sent_at) : null;
    this.deliveredAt = data.delivered_at ? new Date(data.delivered_at) : null;
    this.failedAt = data.failed_at ? new Date(data.failed_at) : null;
    this.failureReason = data.failure_reason;
    this.externalId = data.external_id;
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Valid communication types
   */
  static get TYPES() {
    return ['SMS', 'EMAIL', 'PUSH', 'LETTER'];
  }

  /**
   * Valid directions
   */
  static get DIRECTIONS() {
    return ['INBOUND', 'OUTBOUND'];
  }

  /**
   * Valid statuses
   */
  static get STATUSES() {
    return ['PENDING', 'SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED'];
  }

  /**
   * Communication purposes (for consent tracking)
   */
  static get PURPOSES() {
    return ['APPOINTMENT_REMINDER', 'RECALL', 'MARKETING', 'ADMINISTRATIVE', 'CLINICAL'];
  }

  /**
   * SMS character limits
   */
  static get SMS_LIMITS() {
    return {
      SINGLE_SMS: 160,
      CONCATENATED_SMS: 153, // Per segment when concatenated
      MAX_SEGMENTS: 10,
    };
  }

  /**
   * Check if communication can be sent
   */
  canSend() {
    return this.status === 'PENDING' || this.status === 'SCHEDULED';
  }

  /**
   * Check if communication is scheduled for future
   */
  isScheduled() {
    return this.status === 'SCHEDULED' && this.scheduledAt && this.scheduledAt > new Date();
  }

  /**
   * Check if it's time to send scheduled communication
   */
  shouldSendNow() {
    if (this.status !== 'SCHEDULED') {
      return false;
    }
    return this.scheduledAt && this.scheduledAt <= new Date();
  }

  /**
   * Mark as sent
   */
  markSent(externalId = null) {
    this.status = 'SENT';
    this.sentAt = new Date();
    if (externalId) {
      this.externalId = externalId;
    }
  }

  /**
   * Mark as delivered
   */
  markDelivered() {
    this.status = 'DELIVERED';
    this.deliveredAt = new Date();
  }

  /**
   * Mark as failed
   */
  markFailed(reason) {
    this.status = 'FAILED';
    this.failedAt = new Date();
    this.failureReason = reason;
  }

  /**
   * Calculate SMS segment count
   */
  getSmsSegmentCount() {
    if (this.type !== 'SMS' || !this.content) {
      return 0;
    }

    const length = this.content.length;
    if (length <= Communication.SMS_LIMITS.SINGLE_SMS) {
      return 1;
    }

    return Math.ceil(length / Communication.SMS_LIMITS.CONCATENATED_SMS);
  }

  /**
   * Check if SMS is within limits
   */
  isWithinSmsLimits() {
    if (this.type !== 'SMS') {
      return true;
    }
    return this.getSmsSegmentCount() <= Communication.SMS_LIMITS.MAX_SEGMENTS;
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, patient = {}) {
    let rendered = template;

    const variables = {
      patient_name: patient.first_name || '',
      patient_full_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      clinic_name: 'ChiroClick Klinikk',
      ...this.templateVariables,
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      rendered = rendered.replace(regex, value);
    }

    return rendered;
  }

  /**
   * Format phone number for Norwegian carriers
   */
  static formatNorwegianPhone(phone) {
    if (!phone) {
      return null;
    }

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Handle Norwegian numbers
    if (cleaned.startsWith('47')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0047')) {
      return `+${cleaned.slice(2)}`;
    } else if (cleaned.length === 8) {
      return `+47${cleaned}`;
    }

    // Return with + prefix if not present
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }

  /**
   * Validate email address
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if recipient has consent for this communication type
   */
  hasConsent(patient) {
    if (!patient) {
      return false;
    }

    switch (this.type) {
      case 'SMS':
        return patient.consent_sms === true;
      case 'EMAIL':
        return patient.consent_email === true;
      default:
        return true;
    }
  }

  /**
   * Validate communication data
   */
  validate() {
    const errors = [];

    if (!this.patientId) {
      errors.push('Patient ID is required');
    }

    if (!Communication.TYPES.includes(this.type)) {
      errors.push(`Type must be one of: ${Communication.TYPES.join(', ')}`);
    }

    if (!Communication.DIRECTIONS.includes(this.direction)) {
      errors.push(`Direction must be one of: ${Communication.DIRECTIONS.join(', ')}`);
    }

    if (!Communication.STATUSES.includes(this.status)) {
      errors.push(`Status must be one of: ${Communication.STATUSES.join(', ')}`);
    }

    if (!this.recipient) {
      errors.push('Recipient is required');
    }

    if (this.type === 'SMS' && !this.content) {
      errors.push('Content is required for SMS');
    }

    if (this.type === 'EMAIL' && !this.subject) {
      errors.push('Subject is required for email');
    }

    if (this.type === 'EMAIL' && this.recipient && !Communication.isValidEmail(this.recipient)) {
      errors.push('Invalid email address');
    }

    if (this.type === 'SMS' && !this.isWithinSmsLimits()) {
      errors.push(
        `SMS content exceeds maximum length (${Communication.SMS_LIMITS.MAX_SEGMENTS} segments)`
      );
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
      user_id: this.userId,
      type: this.type,
      direction: this.direction,
      status: this.status,
      recipient: this.recipient,
      subject: this.subject,
      content: this.content,
      template_id: this.templateId,
      template_variables: this.templateVariables,
      scheduled_at: this.scheduledAt?.toISOString(),
      sent_at: this.sentAt?.toISOString(),
      delivered_at: this.deliveredAt?.toISOString(),
      failed_at: this.failedAt?.toISOString(),
      failure_reason: this.failureReason,
      external_id: this.externalId,
      metadata: this.metadata,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new Communication(row);
  }
}

export default Communication;
