/**
 * Smart Communication Scheduler Service
 *
 * Appointment-aware automation that:
 * - Schedules follow-up texts based on rules
 * - Detects conflicts when patients book before scheduled outreach
 * - Queues decisions for user approval
 * - Auto-extends/cancels based on user preferences
 */

import { query } from '../config/database.js';
import { sendSMS } from './communications.js';
import logger from '../utils/logger.js';

/**
 * Schedule a communication for a patient
 */
async function scheduleCommuncation({
  organizationId,
  patientId,
  communicationType = 'sms',
  templateId,
  customMessage,
  scheduledDate,
  scheduledTime = '10:00:00',
  triggerType,
  triggerAppointmentId,
  triggerDaysAfter,
  createdBy,
}) {
  const result = await query(
    `
    INSERT INTO scheduled_communications (
      organization_id, patient_id, communication_type, template_id,
      custom_message, scheduled_date, scheduled_time, trigger_type,
      trigger_appointment_id, trigger_days_after, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `,
    [
      organizationId,
      patientId,
      communicationType,
      templateId,
      customMessage,
      scheduledDate,
      scheduledTime,
      triggerType,
      triggerAppointmentId,
      triggerDaysAfter,
      createdBy,
    ]
  );

  logger.info(`Scheduled ${communicationType} for patient ${patientId} on ${scheduledDate}`);
  return result.rows[0];
}

/**
 * Schedule follow-up based on rules after an appointment
 */
async function scheduleFollowUpAfterVisit(appointmentId, organizationId) {
  // Get appointment and patient info
  const apptResult = await query(
    `
    SELECT a.*, p.first_name, p.last_name, p.phone, p.email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.id = $1
  `,
    [appointmentId]
  );

  if (apptResult.rows.length === 0) {
    return null;
  }

  const appointment = apptResult.rows[0];

  // Get active rules for this organization
  const rulesResult = await query(
    `
    SELECT * FROM communication_rules
    WHERE organization_id = $1
    AND is_active = true
    AND trigger_type = 'after_visit'
  `,
    [organizationId]
  );

  const scheduledComms = [];

  for (const rule of rulesResult.rows) {
    // Check if patient already has a future appointment
    if (rule.condition_no_appointment_scheduled) {
      const futureAppt = await query(
        `
        SELECT id FROM appointments
        WHERE patient_id = $1
        AND appointment_date > CURRENT_DATE
        AND status NOT IN ('cancelled', 'no_show')
        LIMIT 1
      `,
        [appointment.patient_id]
      );

      if (futureAppt.rows.length > 0) {
        logger.info(
          `Skipping follow-up for patient ${appointment.patient_id} - has future appointment`
        );
        continue;
      }
    }

    // Calculate scheduled date
    const scheduledDate = new Date(appointment.appointment_date);
    scheduledDate.setDate(scheduledDate.getDate() + rule.trigger_days);

    // Schedule the communication
    const scheduled = await scheduleCommuncation({
      organizationId,
      patientId: appointment.patient_id,
      communicationType: rule.communication_type,
      templateId: rule.template_id,
      customMessage: rule.default_message,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      triggerType: 'follow_up',
      triggerAppointmentId: appointmentId,
      triggerDaysAfter: rule.trigger_days,
    });

    scheduledComms.push(scheduled);
  }

  return scheduledComms;
}

/**
 * Get pending decisions for user
 */
async function getPendingDecisions(organizationId) {
  const result = await query(
    `
    SELECT
      sd.*,
      sc.communication_type,
      sc.trigger_type,
      sc.custom_message,
      p.first_name,
      p.last_name,
      p.phone,
      a_new.appointment_date as new_appointment_date,
      a_new.appointment_time as new_appointment_time
    FROM scheduler_decisions sd
    JOIN scheduled_communications sc ON sc.id = sd.scheduled_communication_id
    JOIN patients p ON p.id = sd.patient_id
    LEFT JOIN appointments a_new ON a_new.id = sc.conflict_appointment_id
    WHERE sd.organization_id = $1
    AND sd.status = 'pending'
    ORDER BY sd.priority ASC, sd.created_at ASC
  `,
    [organizationId]
  );

  return result.rows;
}

/**
 * Resolve a scheduling decision
 */
async function resolveDecision(decisionId, decision, userId, note = null) {
  // Get the decision and scheduled communication
  const decisionResult = await query(
    `
    SELECT sd.*, sc.scheduled_date, sc.trigger_days_after
    FROM scheduler_decisions sd
    JOIN scheduled_communications sc ON sc.id = sd.scheduled_communication_id
    WHERE sd.id = $1
  `,
    [decisionId]
  );

  if (decisionResult.rows.length === 0) {
    throw new Error('Decision not found');
  }

  const decisionRecord = decisionResult.rows[0];

  // Update decision record
  await query(
    `
    UPDATE scheduler_decisions
    SET status = 'approved', decision = $1, decided_by = $2, decided_at = NOW(), decision_note = $3
    WHERE id = $4
  `,
    [decision, userId, note, decisionId]
  );

  // Handle based on decision
  switch (decision) {
    case 'extend':
      // Extend the scheduled communication to new date
      await query(
        `
        UPDATE scheduled_communications
        SET
          scheduled_date = $1,
          status = 'pending',
          conflict_resolution = 'extended',
          resolved_by = $2,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
      `,
        [decisionRecord.suggested_new_date, userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(
        `Extended scheduled communication ${decisionRecord.scheduled_communication_id} to ${decisionRecord.suggested_new_date}`
      );
      break;

    case 'cancel':
      // Cancel the scheduled communication
      await query(
        `
        UPDATE scheduled_communications
        SET
          status = 'cancelled',
          conflict_resolution = 'user_cancelled',
          resolved_by = $1,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `,
        [userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(`Cancelled scheduled communication ${decisionRecord.scheduled_communication_id}`);
      break;

    case 'send_anyway':
      // Keep original date, mark conflict as resolved
      await query(
        `
        UPDATE scheduled_communications
        SET
          status = 'pending',
          conflict_resolution = 'sent_anyway',
          resolved_by = $1,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `,
        [userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(
        `Keeping original date for scheduled communication ${decisionRecord.scheduled_communication_id}`
      );
      break;
  }

  return { success: true, decision };
}

/**
 * Bulk resolve decisions
 */
async function bulkResolveDecisions(decisionIds, decision, userId) {
  const results = [];
  for (const id of decisionIds) {
    try {
      const result = await resolveDecision(id, decision, userId);
      results.push({ id, ...result });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return results;
}

/**
 * Process scheduled communications that are due today
 */
async function processDueCommunications() {
  const result = await query(`
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
    WHERE sc.status = 'pending'
    AND sc.scheduled_date <= CURRENT_DATE
    AND sc.scheduled_time <= CURRENT_TIME
  `);

  const sent = [];
  const failed = [];

  for (const comm of result.rows) {
    try {
      // Check one more time if patient has upcoming appointment
      const futureAppt = await query(
        `
        SELECT id, appointment_date FROM appointments
        WHERE patient_id = $1
        AND appointment_date > CURRENT_DATE
        AND status NOT IN ('cancelled', 'no_show')
        LIMIT 1
      `,
        [comm.patient_id]
      );

      if (futureAppt.rows.length > 0) {
        // Patient booked, cancel this communication
        await query(
          `
          UPDATE scheduled_communications
          SET status = 'cancelled', conflict_resolution = 'auto_cancelled_has_appointment', updated_at = NOW()
          WHERE id = $1
        `,
          [comm.id]
        );
        logger.info(
          `Auto-cancelled communication ${comm.id} - patient has appointment on ${futureAppt.rows[0].appointment_date}`
        );
        continue;
      }

      // Replace template variables
      let message = comm.custom_message || '';
      message = message.replace(/{fornavn}/g, comm.first_name);
      message = message.replace(/{etternavn}/g, comm.last_name);
      message = message.replace(/{klinikk}/g, comm.org_name);
      message = message.replace(/{telefon}/g, comm.org_phone || '');
      message = message.replace(/{booking_url}/g, comm.settings?.booking_url || '');

      // Send the communication
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

        sent.push(comm.id);
        logger.info(
          `Sent scheduled ${comm.communication_type} to ${comm.first_name} ${comm.last_name}`
        );
      }
    } catch (error) {
      failed.push({ id: comm.id, error: error.message });
      logger.error(`Failed to send scheduled communication ${comm.id}:`, error);
    }
  }

  return { sent: sent.length, failed: failed.length, details: { sent, failed } };
}

/**
 * Import appointments from external source (SolvitJournal format)
 */
async function importAppointments(organizationId, appointments, source = 'solvitjournal', userId) {
  const stats = {
    total: appointments.length,
    created: 0,
    updated: 0,
    patientsCreated: 0,
    errors: 0,
    errorLog: [],
  };

  for (const appt of appointments) {
    try {
      // Find or create patient
      let patientId;
      const patientSearch = await query(
        `
        SELECT id FROM patients
        WHERE organization_id = $1
        AND (
          (phone IS NOT NULL AND phone = $2)
          OR (LOWER(first_name) = LOWER($3) AND LOWER(last_name) = LOWER($4))
        )
        LIMIT 1
      `,
        [organizationId, appt.phone, appt.firstName, appt.lastName]
      );

      if (patientSearch.rows.length > 0) {
        patientId = patientSearch.rows[0].id;
      } else {
        // Create new patient
        const newPatient = await query(
          `
          INSERT INTO patients (organization_id, first_name, last_name, phone, email, status)
          VALUES ($1, $2, $3, $4, $5, 'active')
          RETURNING id
        `,
          [organizationId, appt.firstName, appt.lastName, appt.phone, appt.email]
        );
        patientId = newPatient.rows[0].id;
        stats.patientsCreated++;
      }

      // Check if appointment already exists
      const existingAppt = await query(
        `
        SELECT id FROM appointments
        WHERE organization_id = $1
        AND patient_id = $2
        AND appointment_date = $3
        AND appointment_time = $4
      `,
        [organizationId, patientId, appt.date, appt.time]
      );

      if (existingAppt.rows.length > 0) {
        // Update existing
        await query(
          `
          UPDATE appointments
          SET status = $1, visit_type = $2, notes = $3, updated_at = NOW()
          WHERE id = $4
        `,
          [appt.status || 'scheduled', appt.visitType, appt.notes, existingAppt.rows[0].id]
        );
        stats.updated++;
      } else {
        // Create new appointment
        await query(
          `
          INSERT INTO appointments (
            organization_id, patient_id, appointment_date, appointment_time,
            duration, status, visit_type, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            organizationId,
            patientId,
            appt.date,
            appt.time,
            appt.duration || 30,
            appt.status || 'scheduled',
            appt.visitType || 'behandling',
            appt.notes,
          ]
        );
        stats.created++;
      }
    } catch (error) {
      stats.errors++;
      stats.errorLog.push({ appointment: appt, error: error.message });
    }
  }

  // Log the import
  await query(
    `
    INSERT INTO appointment_imports (
      organization_id, source, total_rows, appointments_created,
      appointments_updated, patients_created, errors, error_log, imported_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `,
    [
      organizationId,
      source,
      stats.total,
      stats.created,
      stats.updated,
      stats.patientsCreated,
      stats.errors,
      JSON.stringify(stats.errorLog),
      userId,
    ]
  );

  return stats;
}

/**
 * Get communication rules for organization
 */
async function getCommunicationRules(organizationId) {
  const result = await query(
    `
    SELECT * FROM communication_rules
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
async function updateCommunicationRule(ruleId, updates) {
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
async function getPatientScheduledComms(patientId) {
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
async function getSchedulerStats(organizationId) {
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
async function getTodaysMessages(organizationId) {
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
async function cancelScheduledMessage(messageId, userId) {
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
async function sendApprovedMessages(organizationId, messageIds) {
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

export {
  scheduleCommuncation,
  scheduleFollowUpAfterVisit,
  getPendingDecisions,
  resolveDecision,
  bulkResolveDecisions,
  processDueCommunications,
  importAppointments,
  getCommunicationRules,
  updateCommunicationRule,
  getPatientScheduledComms,
  getSchedulerStats,
  getTodaysMessages,
  cancelScheduledMessage,
  sendApprovedMessages,
};

export default {
  scheduleCommuncation,
  scheduleFollowUpAfterVisit,
  getPendingDecisions,
  resolveDecision,
  bulkResolveDecisions,
  processDueCommunications,
  importAppointments,
  getCommunicationRules,
  updateCommunicationRule,
  getPatientScheduledComms,
  getSchedulerStats,
  getTodaysMessages,
  cancelScheduledMessage,
  sendApprovedMessages,
};
