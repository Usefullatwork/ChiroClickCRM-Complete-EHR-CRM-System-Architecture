/**
 * Comms Templating — Template management, variable substitution, and message queuing.
 *
 * @module services/communication/commsTemplating
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

// Default templates (Norwegian)
export const DEFAULT_TEMPLATES = {
  APPOINTMENT_24H: {
    name: '24-timers paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Paminnelse om time i morgen {{appointment_date}} kl {{appointment_time}} hos {{provider_name}}. Avbud? Ring {{clinic_phone}}.',
  },
  APPOINTMENT_1H: {
    name: '1-times paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Husk timen din i dag kl {{appointment_time}} hos {{clinic_name}}. Vi gleder oss til a se deg!',
  },
  EXERCISE_INACTIVE: {
    name: 'Ovelsesprogram paminnelse',
    category: 'exercise_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Vi savner deg! Det er {{days_since_login}} dager siden sist du logget inn pa ovelsesprogrammet. Logg inn her: {{portal_link}}',
  },
  FOLLOWUP_DUE: {
    name: 'Oppfolging - bestill ny time',
    category: 'followup_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Det er pa tide med en oppfolgingstime. Ring oss pa {{clinic_phone}} eller bestill online. Hilsen {{clinic_name}}',
  },
  BIRTHDAY: {
    name: 'Gratulerer med dagen!',
    category: 'birthday',
    type: 'SMS',
    subject: null,
    body: 'Gratulerer med dagen, {{patient_first_name}}! Vi onsker deg en fantastisk dag! Hilsen alle oss pa {{clinic_name}}',
  },
  DAYS_SINCE_VISIT: {
    name: 'Innkalling etter X dager',
    category: 'followup_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Det er {{days_since_visit}} dager siden siste besok. Er det pa tide med en ny time? Ring oss pa {{clinic_phone}} eller bestill online. Hilsen {{clinic_name}}',
  },
};

/**
 * Replace template variables with actual values
 */
export const substituteVariables = (template, variables) => {
  if (!template) {
    return '';
  }

  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  });

  return result;
};

/**
 * Format Norwegian date
 */
export const formatNorwegianDate = (date) => {
  const months = [
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'desember',
  ];
  const d = new Date(date);
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format time HH:MM
 */
export const formatTime = (date) => {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Get organization settings
 */
export const getOrganizationSettings = async (organizationId) => {
  try {
    const result = await query(
      `SELECT name, phone, email, settings
       FROM organizations
       WHERE id = $1`,
      [organizationId]
    );

    return result.rows[0] || {};
  } catch (error) {
    logger.error('Error fetching organization settings:', error);
    return {};
  }
};

/**
 * Get message template by type and organization
 */
export const getTemplate = async (organizationId, templateType) => {
  try {
    // First try to get organization-specific template
    const result = await query(
      `SELECT
         id, organization_id, name, type, category, language,
         subject, body, trigger_type, available_variables,
         times_used, success_rate, last_used_at,
         is_active, is_default, created_at, updated_at
       FROM message_templates
       WHERE organization_id = $1
         AND trigger_type = $2
         AND is_active = true
       LIMIT 1`,
      [organizationId, templateType]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Fall back to default template
    return DEFAULT_TEMPLATES[templateType] || null;
  } catch (error) {
    logger.error('Error fetching template:', error);
    return DEFAULT_TEMPLATES[templateType] || null;
  }
};

/**
 * Queue a message for sending
 */
export const queueMessage = async (organizationId, patientId, messageData, scheduledAt = null) => {
  try {
    const result = await query(
      `INSERT INTO communication_queue (
        organization_id,
        patient_id,
        type,
        content,
        subject,
        template_id,
        trigger_type,
        scheduled_at,
        priority,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
      RETURNING id`,
      [
        organizationId,
        patientId,
        messageData.type || 'SMS',
        messageData.content,
        messageData.subject || null,
        messageData.templateId || null,
        messageData.triggerType || null,
        scheduledAt || new Date(),
        messageData.priority || 'normal',
      ]
    );

    logger.info(`Queued message for patient ${patientId}:`, { queueId: result.rows[0].id });
    return result.rows[0].id;
  } catch (error) {
    logger.error('Error queuing message:', error);
    throw error;
  }
};

/**
 * Log sent message
 */
export const logSentMessage = async (organizationId, data) => {
  try {
    const result = await query(
      `INSERT INTO sent_messages (
        organization_id,
        patient_id,
        type,
        recipient_phone,
        recipient_email,
        subject,
        content,
        template_id,
        trigger_type,
        is_automated,
        sent_by,
        status,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        organizationId,
        data.patientId,
        data.type,
        data.phone || null,
        data.email || null,
        data.subject || null,
        data.content,
        data.templateId || null,
        data.triggerType || null,
        data.isAutomated !== false,
        data.sentBy || null,
        data.status || 'SENT',
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    logger.error('Error logging sent message:', error);
    throw error;
  }
};
