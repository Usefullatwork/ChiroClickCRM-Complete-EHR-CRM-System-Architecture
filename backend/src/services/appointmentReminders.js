/**
 * Appointment Reminders Service
 * Schedules and processes appointment reminders via SMS/Email providers
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { sendSMS, sendEmail } from './communications.js';

const REMINDER_HOURS_BEFORE = (process.env.REMINDER_HOURS_BEFORE || '24,48')
  .split(',')
  .map((h) => parseInt(h.trim(), 10))
  .filter((h) => !isNaN(h));

/**
 * Schedule reminders for an appointment
 * Creates reminder entries in the database for each configured time window
 */
export const scheduleReminder = async (appointment, hoursBeforeArray = null) => {
  const hours = hoursBeforeArray || REMINDER_HOURS_BEFORE;

  try {
    const results = [];

    for (const hoursBefore of hours) {
      const sendAt = new Date(
        new Date(appointment.start_time).getTime() - hoursBefore * 60 * 60 * 1000
      );

      // Don't schedule reminders in the past
      if (sendAt <= new Date()) {
        logger.debug(`Skipping reminder ${hoursBefore}h before — send time is in the past`, {
          appointmentId: appointment.id,
          sendAt,
        });
        continue;
      }

      const result = await query(
        `INSERT INTO appointment_reminders (
          organization_id,
          appointment_id,
          patient_id,
          reminder_type,
          hours_before,
          scheduled_send_at,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
        ON CONFLICT (appointment_id, hours_before) DO NOTHING
        RETURNING *`,
        [
          appointment.organization_id,
          appointment.id,
          appointment.patient_id,
          'SMS', // Default to SMS; could be extended to EMAIL
          hoursBefore,
          sendAt,
        ]
      );

      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    logger.info('Reminders scheduled', {
      appointmentId: appointment.id,
      count: results.length,
      hours,
    });

    return results;
  } catch (error) {
    logger.error('Error scheduling reminders:', error);
    throw error;
  }
};

/**
 * Process due reminders — called by cron job
 * Sends all pending reminders that are due
 */
export const processReminders = async () => {
  try {
    // Find all pending reminders that are due
    const dueReminders = await query(
      `SELECT
        r.*,
        a.start_time as appointment_time,
        a.appointment_type,
        a.organization_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email
      FROM appointment_reminders r
      JOIN appointments a ON a.id = r.appointment_id
      JOIN patients p ON p.id = r.patient_id
      WHERE r.status = 'PENDING'
        AND r.scheduled_send_at <= NOW()
      ORDER BY r.scheduled_send_at ASC
      LIMIT 50`
    );

    if (dueReminders.rows.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    logger.info(`Processing ${dueReminders.rows.length} due reminders`);

    let sent = 0;
    let failed = 0;

    for (const reminder of dueReminders.rows) {
      try {
        const appointmentDate = new Date(reminder.appointment_time);
        const dateStr = appointmentDate.toLocaleDateString('nb-NO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        const timeStr = appointmentDate.toLocaleTimeString('nb-NO', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const message =
          `Hei ${reminder.patient_first_name}! ` +
          `Påminnelse om din time ${dateStr} kl. ${timeStr}. ` +
          `Vennligst gi beskjed om du ikke kan komme. Mvh ChiroClickCRM`;

        if (reminder.reminder_type === 'SMS' && reminder.patient_phone) {
          await sendSMS(
            reminder.organization_id,
            {
              patient_id: reminder.patient_id,
              recipient_phone: reminder.patient_phone,
              content: message,
            },
            null // System-initiated, no user
          );
        } else if (reminder.reminder_type === 'EMAIL' && reminder.patient_email) {
          await sendEmail(
            reminder.organization_id,
            {
              patient_id: reminder.patient_id,
              recipient_email: reminder.patient_email,
              subject: `Påminnelse: Time ${dateStr}`,
              content: message,
            },
            null
          );
        } else {
          logger.warn('Cannot send reminder — no contact method', {
            reminderId: reminder.id,
            type: reminder.reminder_type,
            hasPhone: !!reminder.patient_phone,
            hasEmail: !!reminder.patient_email,
          });
          await query(
            `UPDATE appointment_reminders SET status = 'FAILED', failure_reason = $1, sent_at = NOW() WHERE id = $2`,
            ['No contact method available', reminder.id]
          );
          failed++;
          continue;
        }

        // Mark as sent
        await query(
          `UPDATE appointment_reminders SET status = 'SENT', sent_at = NOW() WHERE id = $1`,
          [reminder.id]
        );
        sent++;
      } catch (sendError) {
        logger.error('Failed to send reminder:', {
          reminderId: reminder.id,
          error: sendError.message,
        });

        await query(
          `UPDATE appointment_reminders SET status = 'FAILED', failure_reason = $1, sent_at = NOW() WHERE id = $2`,
          [sendError.message, reminder.id]
        );
        failed++;
      }
    }

    logger.info('Reminder processing complete', {
      processed: dueReminders.rows.length,
      sent,
      failed,
    });

    return {
      processed: dueReminders.rows.length,
      sent,
      failed,
    };
  } catch (error) {
    logger.error('Error processing reminders:', error);
    throw error;
  }
};

/**
 * Cancel reminders for an appointment (e.g., when appointment is cancelled)
 */
export const cancelReminders = async (appointmentId) => {
  try {
    const result = await query(
      `UPDATE appointment_reminders SET status = 'CANCELLED' WHERE appointment_id = $1 AND status = 'PENDING' RETURNING id`,
      [appointmentId]
    );

    logger.info('Reminders cancelled', {
      appointmentId,
      count: result.rows.length,
    });

    return result.rows.length;
  } catch (error) {
    logger.error('Error cancelling reminders:', error);
    throw error;
  }
};

export default {
  scheduleReminder,
  processReminders,
  cancelReminders,
};
