/**
 * Schedule Availability — Rules, stats, and message management.
 *
 * @module services/practice/scheduleAvailability
 */

import { query } from '../../config/database.js';
import { sendSMS } from '../communication/communications.js';
import logger from '../../utils/logger.js';

/**
 * Get communication rules for organization
 */
export async function getCommunicationRules(organizationId) {
  const result = await query(
    `
    SELECT
      id, organization_id, name, description,
      trigger_type, trigger_days,
      condition_no_appointment_scheduled, condition_patient_status, condition_visit_types,
      communication_type, template_id, default_message,
      on_new_appointment, extend_days, is_active,
      created_at, updated_at
    FROM communication_rules
    WHERE organization_id = $1
    ORDER BY trigger_type, trigger_days
  `,
    [organizationId]
  );
  return result.rows;
}

/**
 * Update a communication rule
 */
export async function updateCommunicationRule(ruleId, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    'name',
    'description',
    'trigger_days',
    'communication_type',
    'template_id',
    'default_message',
    'on_new_appointment',
    'extend_days',
    'is_active',
    'condition_no_appointment_scheduled',
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(ruleId);
  const result = await query(
    `
    UPDATE communication_rules
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *
  `,
    values
  );

  return result.rows[0];
}

/**
 * Get scheduled communications for a patient
 */
export async function getPatientScheduledComms(patientId) {
  const result = await query(
    `
    SELECT
      sc.*,
      sd.status as decision_status,
      sd.decision,
      sd.suggested_new_date
    FROM scheduled_communications sc
    LEFT JOIN scheduler_decisions sd ON sd.scheduled_communication_id = sc.id
    WHERE sc.patient_id = $1
    ORDER BY sc.scheduled_date DESC
  `,
    [patientId]
  );
  return result.rows;
}

/**
 * Get dashboard stats for scheduled communications
 */
export async function getSchedulerStats(organizationId) {
  const result = await query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'conflict') as conflicts_count,
      COUNT(*) FILTER (WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '7 days') as sent_last_week,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count
    FROM scheduled_communications
    WHERE organization_id = $1
  `,
    [organizationId]
  );

  const decisionsResult = await query(
    `
    SELECT COUNT(*) as pending_decisions
    FROM scheduler_decisions
    WHERE organization_id = $1 AND status = 'pending'
  `,
    [organizationId]
  );

  return {
    ...result.rows[0],
    pending_decisions: parseInt(decisionsResult.rows[0].pending_decisions),
  };
}

/**
 * Get today's scheduled messages for review before sending
 */
export async function getTodaysMessages(organizationId) {
  const result = await query(
    `
    SELECT
      sc.*,
      p.first_name,
      p.last_name,
      p.phone,
      p.email
    FROM scheduled_communications sc
    JOIN patients p ON p.id = sc.patient_id
    WHERE sc.organization_id = $1
    AND sc.status = 'pending'
    AND sc.scheduled_date = CURRENT_DATE
    ORDER BY sc.scheduled_time ASC
  `,
    [organizationId]
  );

  return result.rows;
}

/**
 * Cancel a scheduled message
 */
export async function cancelScheduledMessage(messageId, userId) {
  await query(
    `
    UPDATE scheduled_communications
    SET status = 'cancelled', conflict_resolution = 'user_cancelled', resolved_by = $1, resolved_at = NOW()
    WHERE id = $2
  `,
    [userId, messageId]
  );

  logger.info(`Cancelled scheduled message ${messageId}`);
  return { success: true, cancelled: true };
}

/**
 * Send approved messages immediately
 */
export async function sendApprovedMessages(organizationId, messageIds) {
  const result = await query(
    `
    SELECT
      sc.*,
      p.first_name,
      p.last_name,
      p.phone,
      p.email,
      o.name as org_name,
      o.phone as org_phone,
      o.settings
    FROM scheduled_communications sc
    JOIN patients p ON p.id = sc.patient_id
    JOIN organizations o ON o.id = sc.organization_id
    WHERE sc.id = ANY($1)
    AND sc.organization_id = $2
    AND sc.status = 'pending'
  `,
    [messageIds, organizationId]
  );

  let sent = 0;
  let failed = 0;

  for (const comm of result.rows) {
    try {
      // Replace template variables
      let message = comm.custom_message || '';
      message = message.replace(/{fornavn}/g, comm.first_name);
      message = message.replace(/{etternavn}/g, comm.last_name);
      message = message.replace(/{klinikk}/g, comm.org_name);
      message = message.replace(/{telefon}/g, comm.org_phone || '');
      message = message.replace(/{booking_url}/g, comm.settings?.booking_url || '');

      // Send SMS
      if (comm.communication_type === 'sms' && comm.phone) {
        await sendSMS({
          organizationId: comm.organization_id,
          patientId: comm.patient_id,
          to: comm.phone,
          message,
          type: comm.trigger_type,
        });

        await query(
          `
          UPDATE scheduled_communications
          SET status = 'sent', sent_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `,
          [comm.id]
        );

        sent++;
        logger.info(`Sent approved message to ${comm.first_name} ${comm.last_name}`);
      }
    } catch (error) {
      failed++;
      logger.error(`Failed to send message ${comm.id}:`, error);
    }
  }

  return { sent, failed, total: messageIds.length };
}
