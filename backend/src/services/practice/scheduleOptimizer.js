/**
 * Schedule Optimizer — Core scheduling, follow-up rules, and communication processing.
 *
 * @module services/practice/scheduleOptimizer
 */

import { query } from '../../config/database.js';
import { sendSMS } from '../communication/communications.js';
import logger from '../../utils/logger.js';

/**
 * Schedule a communication for a patient
 */
export async function scheduleCommuncation({
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
export async function scheduleFollowUpAfterVisit(appointmentId, organizationId) {
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
    SELECT
      id, organization_id, name, description,
      trigger_type, trigger_days,
      condition_no_appointment_scheduled, condition_patient_status, condition_visit_types,
      communication_type, template_id, default_message,
      on_new_appointment, extend_days, is_active,
      created_at, updated_at
    FROM communication_rules
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
 * Process scheduled communications that are due today
 */
export async function processDueCommunications() {
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
export async function importAppointments(
  organizationId,
  appointments,
  source = 'solvitjournal',
  userId
) {
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
