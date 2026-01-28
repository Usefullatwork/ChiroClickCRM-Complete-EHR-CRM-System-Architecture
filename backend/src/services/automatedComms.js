/**
 * Automated Communications Service
 *
 * Automation engine for patient communications including:
 * - Appointment reminders (24h, 1h before)
 * - Exercise program reminders (if not logged in X days)
 * - Follow-up scheduling reminders
 * - Birthday greetings
 *
 * Integrates with message_templates and sent_messages tables.
 * Norwegian text as default language.
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// Default templates (Norwegian)
const DEFAULT_TEMPLATES = {
  APPOINTMENT_24H: {
    name: '24-timers paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Paminnelse om time i morgen {{appointment_date}} kl {{appointment_time}} hos {{provider_name}}. Avbud? Ring {{clinic_phone}}.'
  },
  APPOINTMENT_1H: {
    name: '1-times paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Husk timen din i dag kl {{appointment_time}} hos {{clinic_name}}. Vi gleder oss til a se deg!'
  },
  EXERCISE_INACTIVE: {
    name: 'Ovelsesprogram paminnelse',
    category: 'exercise_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Vi savner deg! Det er {{days_since_login}} dager siden sist du logget inn pa ovelsesprogrammet. Logg inn her: {{portal_link}}'
  },
  FOLLOWUP_DUE: {
    name: 'Oppfolging - bestill ny time',
    category: 'followup_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Det er pa tide med en oppfolgingstime. Ring oss pa {{clinic_phone}} eller bestill online. Hilsen {{clinic_name}}'
  },
  BIRTHDAY: {
    name: 'Gratulerer med dagen!',
    category: 'birthday',
    type: 'SMS',
    subject: null,
    body: 'Gratulerer med dagen, {{patient_first_name}}! Vi onsker deg en fantastisk dag! Hilsen alle oss pa {{clinic_name}}'
  },
  DAYS_SINCE_VISIT: {
    name: 'Innkalling etter X dager',
    category: 'followup_reminder',
    type: 'SMS',
    subject: null,
    body: 'Hei {{patient_first_name}}! Det er {{days_since_visit}} dager siden siste besok. Er det pa tide med en ny time? Ring oss pa {{clinic_phone}} eller bestill online. Hilsen {{clinic_name}}'
  }
};

/**
 * Replace template variables with actual values
 */
export const substituteVariables = (template, variables) => {
  if (!template) return '';

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
const formatNorwegianDate = (date) => {
  const months = [
    'januar', 'februar', 'mars', 'april', 'mai', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'desember'
  ];
  const d = new Date(date);
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format time HH:MM
 */
const formatTime = (date) => {
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
      `SELECT * FROM message_templates
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
        messageData.priority || 'normal'
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
        data.status || 'SENT'
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    logger.error('Error logging sent message:', error);
    throw error;
  }
};

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
        clinic_phone: apt.clinic_phone
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(apt.organization_id, apt.patient_id, {
        type: template.type || 'SMS',
        content,
        subject: template.subject ? substituteVariables(template.subject, variables) : null,
        triggerType: 'APPOINTMENT_24H',
        priority: 'high'
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
        clinic_name: apt.clinic_name
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(apt.organization_id, apt.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'APPOINTMENT_1H',
        priority: 'high'
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
      const template = await getTemplate(patient.organization_id, 'EXERCISE_INACTIVE');

      const variables = {
        patient_first_name: patient.first_name,
        days_since_login: Math.floor(patient.days_since_login),
        clinic_name: patient.clinic_name,
        portal_link: patient.portal_link || 'https://portal.chiroclick.no'
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'EXERCISE_INACTIVE',
        priority: 'normal'
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
        clinic_phone: fu.clinic_phone
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(fu.organization_id, fu.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'FOLLOWUP_DUE',
        priority: 'normal'
      });

      queued.push({ queueId, patientId: fu.patient_id, followupId: fu.followup_id });
    }

    return { count: queued.length, queued };
  } catch (error) {
    logger.error('Error checking follow-up reminders:', error);
    throw error;
  }
};

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
        clinic_name: patient.clinic_name
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'BIRTHDAY',
        priority: 'low'
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
        clinic_phone: patient.clinic_phone
      };

      const content = substituteVariables(template.body, variables);

      const queueId = await queueMessage(patient.organization_id, patient.patient_id, {
        type: template.type || 'SMS',
        content,
        triggerType: 'DAYS_SINCE_VISIT',
        priority: 'normal'
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
    daysSinceVisit: { count: 0, error: null }
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

export default {
  substituteVariables,
  getTemplate,
  queueMessage,
  logSentMessage,
  checkAppointmentReminders24h,
  checkAppointmentReminders1h,
  checkExerciseInactivity,
  checkFollowUpReminders,
  checkBirthdayGreetings,
  checkDaysSinceVisit,
  runAutomatedChecks,
  getAutomationStats
};
