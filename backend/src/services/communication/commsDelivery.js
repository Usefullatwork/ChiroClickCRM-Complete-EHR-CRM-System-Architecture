/**
 * Comms Delivery — Birthday greetings, visit recalls, batch runner, and stats.
 *
 * @module services/communication/commsDelivery
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { substituteVariables, getTemplate, queueMessage } from './commsTemplating.js';
import {
  checkAppointmentReminders24h,
  checkAppointmentReminders1h,
  checkExerciseInactivity,
  checkFollowUpReminders,
} from './commsScheduling.js';

/**
 * Check for patient birthdays today
 */
export const checkBirthdayGreetings = async () => {
  logger.info('Checking for birthday greetings...');

  try {
    const result = await query(
      `SELECT
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.organization_id,
        o.name as clinic_name
       FROM patients p
       JOIN organizations o ON o.id = p.organization_id
       WHERE EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY FROM p.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
         AND p.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = p.id
             AND cq.trigger_type = 'BIRTHDAY'
             AND DATE(cq.created_at) = CURRENT_DATE
         )`
    );

    const patients = result.rows;
    logger.info(`Found ${patients.length} patients with birthdays today`);

    const queued = [];
    for (const patient of patients) {
      const template = await getTemplate(patient.organization_id, 'BIRTHDAY');

      const variables = {
        patient_first_name: patient.first_name,
        clinic_name: patient.clinic_name,
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'BIRTHDAY',
        priority: 'low',
      });

      queued.push({ queueId, patientId: patient.patient_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking birthday greetings:', error);
    throw error;
  }
};

/**
 * Check for patients who haven't visited in X days
 */
export const checkDaysSinceVisit = async (daysThreshold = 90) => {
  logger.info(`Checking for patients inactive for ${daysThreshold} days...`);

  try {
    const result = await query(
      `SELECT
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.phone,
        p.organization_id,
        o.name as clinic_name,
        o.phone as clinic_phone,
        MAX(e.encounter_date) as last_visit,
        EXTRACT(DAY FROM NOW() - MAX(e.encounter_date)) as days_since_visit
       FROM patients p
       JOIN organizations o ON o.id = p.organization_id
       LEFT JOIN encounters e ON e.patient_id = p.id
       WHERE p.is_active = true
       GROUP BY p.id, p.first_name, p.last_name, p.phone, p.organization_id, o.name, o.phone
       HAVING MAX(e.encounter_date) < NOW() - ($1 || ' days')::interval
         AND MAX(e.encounter_date) > NOW() - ($1 + 30 || ' days')::interval
         AND NOT EXISTS (
           SELECT 1 FROM communication_queue cq
           WHERE cq.patient_id = p.id
             AND cq.trigger_type = 'DAYS_SINCE_VISIT'
             AND cq.created_at > NOW() - INTERVAL '30 days'
         )`,
      [daysThreshold]
    );

    const patients = result.rows;
    logger.info(`Found ${patients.length} patients for visit recall`);

    const queued = [];
    for (const patient of patients) {
      const template = await getTemplate(patient.organization_id, 'DAYS_SINCE_VISIT');

      const variables = {
        patient_first_name: patient.first_name,
        days_since_visit: Math.floor(patient.days_since_visit),
        clinic_name: patient.clinic_name,
        clinic_phone: patient.clinic_phone,
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'DAYS_SINCE_VISIT',
        priority: 'normal',
      });

      queued.push({ queueId, patientId: patient.patient_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking days since visit:', error);
    throw error;
  }
};

/**
 * Run all automated communication checks
 */
export const runAutomatedChecks = async () => {
  logger.info('Running all automated communication checks...');

  const results = {
    appointment24h: { count: 0, error: null },
    appointment1h: { count: 0, error: null },
    exerciseInactive: { count: 0, error: null },
    followupDue: { count: 0, error: null },
    birthday: { count: 0, error: null },
    daysSinceVisit: { count: 0, error: null },
  };

  try {
    const apt24h = await checkAppointmentReminders24h();
    results.appointment24h.count = apt24h.count;
  } catch (error) {
    results.appointment24h.error = error.message;
  }

  try {
    const apt1h = await checkAppointmentReminders1h();
    results.appointment1h.count = apt1h.count;
  } catch (error) {
    results.appointment1h.error = error.message;
  }

  try {
    const exercise = await checkExerciseInactivity(7);
    results.exerciseInactive.count = exercise.count;
  } catch (error) {
    results.exerciseInactive.error = error.message;
  }

  try {
    const followup = await checkFollowUpReminders();
    results.followupDue.count = followup.count;
  } catch (error) {
    results.followupDue.error = error.message;
  }

  try {
    const birthday = await checkBirthdayGreetings();
    results.birthday.count = birthday.count;
  } catch (error) {
    results.birthday.error = error.message;
  }

  try {
    const daysSince = await checkDaysSinceVisit(90);
    results.daysSinceVisit.count = daysSince.count;
  } catch (error) {
    results.daysSinceVisit.error = error.message;
  }

  const totalQueued = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);
  logger.info(`Automated checks complete. Total messages queued: ${totalQueued}`);

  return results;
};

/**
 * Get automation statistics
 */
export const getAutomationStats = async (organizationId) => {
  try {
    const result = await query(
      `SELECT
        trigger_type,
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'SENT' OR status = 'DELIVERED' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        MAX(sent_at) as last_sent
       FROM sent_messages
       WHERE organization_id = $1
         AND is_automated = true
         AND sent_at > NOW() - INTERVAL '30 days'
       GROUP BY trigger_type`,
      [organizationId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting automation stats:', error);
    throw error;
  }
};
