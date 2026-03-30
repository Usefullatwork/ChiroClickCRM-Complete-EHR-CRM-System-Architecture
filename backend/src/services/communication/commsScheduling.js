/**
 * Comms Scheduling — Automated reminder checks (appointment, exercise, follow-up, birthday, recall).
 *
 * @module services/communication/commsScheduling
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import {
  substituteVariables,
  formatNorwegianDate,
  formatTime,
  getTemplate,
  queueMessage,
} from './commsTemplating.js';

/**
 * Check appointments due for 24-hour reminder
 */
export const checkAppointmentReminders24h = async () => {
  logger.info('Checking for 24-hour appointment reminders...');

  try {
    // Find appointments 24 hours from now (within a 1-hour window)
    const result = await query(
      `SELECT
        a.id as appointment_id,
        a.start_time,
        a.end_time,
        a.organization_id,
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        o.name as clinic_name,
        o.phone as clinic_phone
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN users u ON u.id = a.provider_id
       JOIN organizations o ON o.id = a.organization_id
       WHERE a.status IN ('scheduled', 'confirmed')
         AND a.start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = a.patient_id
             AND cq.trigger_type = 'APPOINTMENT_24H'
             AND DATE(cq.created_at) = CURRENT_DATE
         )`
    );

    const appointments = result.rows;
    logger.info(`Found ${appointments.length} appointments for 24h reminder`);

    const queued = [];
    for (const apt of appointments) {
      const template = await getTemplate(apt.organization_id, 'APPOINTMENT_24H');

      const variables = {
        patient_first_name: apt.first_name,
        patient_name: `${apt.first_name} ${apt.last_name}`,
        appointment_date: formatNorwegianDate(apt.start_time),
        appointment_time: formatTime(apt.start_time),
        provider_name: apt.provider_first_name
          ? `${apt.provider_first_name} ${apt.provider_last_name}`
          : 'din behandler',
        clinic_name: apt.clinic_name,
        clinic_phone: apt.clinic_phone,
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(apt.organization_id, apt.patient_id, {
        type: template.type || 'SMS',
        content,
        subject: template.subject ? substituteVariables(template.subject, variables) : null,
        triggerType: 'APPOINTMENT_24H',
        priority: 'high',
      });

      queued.push({ queueId, patientId: apt.patient_id, appointmentId: apt.appointment_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking 24h appointment reminders:', error);
    throw error;
  }
};

/**
 * Check appointments due for 1-hour reminder
 */
export const checkAppointmentReminders1h = async () => {
  logger.info('Checking for 1-hour appointment reminders...');

  try {
    const result = await query(
      `SELECT
        a.id as appointment_id,
        a.start_time,
        a.organization_id,
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        o.name as clinic_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN organizations o ON o.id = a.organization_id
       WHERE a.status IN ('scheduled', 'confirmed')
         AND a.start_time BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes'
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = a.patient_id
             AND cq.trigger_type = 'APPOINTMENT_1H'
             AND DATE(cq.created_at) = CURRENT_DATE
         )`
    );

    const appointments = result.rows;
    logger.info(`Found ${appointments.length} appointments for 1h reminder`);

    const queued = [];
    for (const apt of appointments) {
      const template = await getTemplate(apt.organization_id, 'APPOINTMENT_1H');

      const variables = {
        patient_first_name: apt.first_name,
        appointment_time: formatTime(apt.start_time),
        clinic_name: apt.clinic_name,
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(apt.organization_id, apt.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'APPOINTMENT_1H',
        priority: 'high',
      });

      queued.push({ queueId, patientId: apt.patient_id, appointmentId: apt.appointment_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking 1h appointment reminders:', error);
    throw error;
  }
};

/**
 * Check for patients inactive on exercise program
 */
export const checkExerciseInactivity = async (daysThreshold = 7) => {
  logger.info(`Checking for exercise inactivity (${daysThreshold} days)...`);

  try {
    const result = await query(
      `SELECT
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.organization_id,
        o.name as clinic_name,
        o.settings->>'portal_link' as portal_link,
        EXTRACT(DAY FROM NOW() - ep.last_login) as days_since_login
       FROM patients p
       JOIN organizations o ON o.id = p.organization_id
       JOIN exercise_programs ep ON ep.patient_id = p.id
       WHERE ep.is_active = true
         AND ep.last_login < NOW() - ($1 || ' days')::interval
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = p.id
             AND cq.trigger_type = 'EXERCISE_INACTIVE'
             AND cq.created_at > NOW() - INTERVAL '7 days'
         )`,
      [daysThreshold]
    );

    const patients = result.rows;
    logger.info(`Found ${patients.length} inactive exercise patients`);

    const queued = [];
    for (const patient of patients) {
      // Check patient exercise reminder preference
      try {
        const prefsResult = await query(
          `SELECT exercise_reminder_enabled FROM patient_communication_preferences WHERE patient_id = $1`,
          [patient.patient_id]
        );
        if (prefsResult.rows[0]?.exercise_reminder_enabled === false) {
          continue;
        }
      } catch (_prefErr) {
        // Table may not exist — proceed
      }

      // Check org-level toggle
      try {
        const orgSettings = await query(
          `SELECT settings->>'reminder_exercise_enabled' as enabled FROM organizations WHERE id = $1`,
          [patient.organization_id]
        );
        if (orgSettings.rows[0]?.enabled === 'false') {
          continue;
        }
      } catch (_orgErr) {
        // Org setting not available — proceed
      }

      const template = await getTemplate(patient.organization_id, 'EXERCISE_INACTIVE');

      const variables = {
        patient_first_name: patient.first_name,
        days_since_login: Math.floor(patient.days_since_login),
        clinic_name: patient.clinic_name,
        portal_link: patient.portal_link || 'https://portal.chiroclick.no',
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'EXERCISE_INACTIVE',
        priority: 'normal',
      });

      queued.push({ queueId, patientId: patient.patient_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking exercise inactivity:', error);
    throw error;
  }
};

/**
 * Check for patients with overdue follow-ups
 */
export const checkFollowUpReminders = async () => {
  logger.info('Checking for follow-up reminders...');

  try {
    const result = await query(
      `SELECT
        f.id as followup_id,
        f.due_date,
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.organization_id,
        o.name as clinic_name,
        o.phone as clinic_phone
       FROM follow_ups f
       JOIN patients p ON p.id = f.patient_id
       JOIN organizations o ON o.id = p.organization_id
       WHERE f.status = 'pending'
         AND f.due_date <= CURRENT_DATE
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = p.id
             AND cq.trigger_type = 'FOLLOWUP_DUE'
             AND cq.created_at > NOW() - INTERVAL '7 days'
         )`
    );

    const followups = result.rows;
    logger.info(`Found ${followups.length} follow-ups due`);

    const queued = [];
    for (const fu of followups) {
      const template = await getTemplate(fu.organization_id, 'FOLLOWUP_DUE');

      const variables = {
        patient_first_name: fu.first_name,
        clinic_name: fu.clinic_name,
        clinic_phone: fu.clinic_phone,
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(fu.organization_id, fu.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'FOLLOWUP_DUE',
        priority: 'normal',
      });

      queued.push({ queueId, patientId: fu.patient_id, followupId: fu.followup_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking follow-up reminders:', error);
    throw error;
  }
};
