/**
 * Communication Jobs
 * Scheduled handlers for communication queue processing,
 * appointment reminders, and smart scheduling.
 *
 * @module jobs/communicationJobs
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Process pending communications queue.
 * HOURLY: At minute 0 of every hour.
 *
 * @param {Object} services - Loaded service references
 * @returns {Promise<Object>} Processing result
 */
export const processCommunicationQueue = async (services) => {
  const { bulkCommunicationService, communicationsService } = services;

  if (!bulkCommunicationService && !communicationsService) {
    logger.debug('Communication services not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  logger.info('Processing communication queue...');

  const result = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  try {
    const pendingResult = await query(
      `SELECT cq.*, p.first_name, p.last_name, p.phone, p.email, p.organization_id
       FROM communication_queue cq
       JOIN patients p ON p.id = cq.patient_id
       WHERE cq.status = 'pending'
         AND cq.scheduled_at <= NOW()
       ORDER BY cq.priority DESC, cq.scheduled_at ASC
       LIMIT 100`
    );

    const pendingItems = pendingResult.rows;
    logger.info(`Found ${pendingItems.length} pending communications`);

    for (const item of pendingItems) {
      result.processed++;

      try {
        const prefsResult = await query(
          `SELECT patient_id, sms_enabled, email_enabled, reminder_enabled,
                  exercise_reminder_enabled, recall_enabled, marketing_enabled
           FROM patient_communication_preferences
           WHERE patient_id = $1`,
          [item.patient_id]
        );

        const prefs = prefsResult.rows[0];

        if (prefs && !prefs[`${item.type.toLowerCase()}_enabled`]) {
          await query(
            `UPDATE communication_queue
             SET status = 'skipped', processed_at = NOW(), notes = 'Patient opted out'
             WHERE id = $1`,
            [item.id]
          );
          result.skipped++;
          continue;
        }

        if (item.type === 'SMS' && item.phone && communicationsService) {
          await communicationsService.sendSMS(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_phone: item.phone,
              content: item.content,
              template_id: item.template_id,
            },
            null
          );
        } else if (item.type === 'EMAIL' && item.email && communicationsService) {
          await communicationsService.sendEmail(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_email: item.email,
              subject: item.subject,
              content: item.content,
              template_id: item.template_id,
            },
            null
          );
        } else {
          throw new Error(`Missing contact info or service for ${item.type}`);
        }

        await query(
          `UPDATE communication_queue
           SET status = 'sent', processed_at = NOW()
           WHERE id = $1`,
          [item.id]
        );
        result.sent++;
      } catch (sendError) {
        logger.error(`Failed to send communication ${item.id}:`, sendError);

        await query(
          `UPDATE communication_queue
           SET status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END,
               retry_count = retry_count + 1,
               last_error = $2,
               processed_at = NOW()
           WHERE id = $1`,
          [item.id, sendError.message]
        );
        result.failed++;
      }
    }

    logger.info('Communication queue processing complete:', result);
    return result;
  } catch (error) {
    logger.error('Error processing communication queue:', error);
    throw error;
  }
};

/**
 * Send scheduled appointment reminders.
 * HOURLY: At minute 0 of every hour.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const sendAppointmentReminders = async (services) => {
  const { automationsService } = services;

  if (!automationsService) {
    logger.debug('Automations service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Checking for appointment reminders...');
    const result = await automationsService.checkAppointmentReminders();
    logger.info('Appointment reminders processed:', result);
    return result;
  } catch (error) {
    logger.error('Error sending appointment reminders:', error);
    throw error;
  }
};

/**
 * Process smart scheduled communications.
 * HOURLY: At minute 30 of every hour.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const processSmartScheduledComms = async (services) => {
  const { smartSchedulerService } = services;

  if (!smartSchedulerService) {
    logger.debug('Smart Scheduler service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Processing smart scheduled communications...');
    const result = await smartSchedulerService.processDueCommunications();
    logger.info('Smart scheduled communications processed:', result);
    return result;
  } catch (error) {
    logger.error('Error processing smart scheduled communications:', error);
    throw error;
  }
};

/**
 * Process due appointment reminders (SMS/Email) queue.
 * EVERY 15 MINUTES.
 *
 * @param {Object} services
 * @returns {Promise<Object>}
 */
export const processAppointmentRemindersQueue = async (services) => {
  const { appointmentRemindersService } = services;

  if (!appointmentRemindersService) {
    logger.debug('Appointment Reminders service not available');
    return { skipped: true, reason: 'service_not_available' };
  }

  try {
    logger.info('Processing appointment reminders queue...');
    const result = await appointmentRemindersService.processReminders();
    logger.info('Appointment reminders processed:', result);
    return result;
  } catch (error) {
    logger.error('Error processing appointment reminders:', error);
    throw error;
  }
};
