/**
 * Auto-Accept Service
 * Handles automatic acceptance of appointments and referrals
 *
 * @module services/autoAccept
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { sendEmail } from './email.js';

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Get auto-accept settings for an organization
 */
export const getSettings = async (organizationId) => {
  try {
    const result = await query(`SELECT * FROM auto_accept_settings WHERE organization_id = $1`, [
      organizationId,
    ]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting auto-accept settings:', error);
    throw error;
  }
};

/**
 * Create or update auto-accept settings
 */
export const upsertSettings = async (organizationId, userId, settings) => {
  try {
    const {
      autoAcceptAppointments,
      appointmentAcceptDelayMinutes,
      appointmentTypesIncluded,
      appointmentTypesExcluded,
      appointmentMaxDailyLimit,
      appointmentBusinessHoursOnly,
      autoAcceptReferrals,
      referralAcceptDelayMinutes,
      referralSourcesIncluded,
      referralSourcesExcluded,
      referralRequireCompleteInfo,
      notifyOnAutoAccept,
      notificationEmail,
      notificationSms,
    } = settings;

    const result = await query(
      `INSERT INTO auto_accept_settings (
        organization_id,
        auto_accept_appointments,
        appointment_accept_delay_minutes,
        appointment_types_included,
        appointment_types_excluded,
        appointment_max_daily_limit,
        appointment_business_hours_only,
        auto_accept_referrals,
        referral_accept_delay_minutes,
        referral_sources_included,
        referral_sources_excluded,
        referral_require_complete_info,
        notify_on_auto_accept,
        notification_email,
        notification_sms,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (organization_id) DO UPDATE SET
        auto_accept_appointments = $2,
        appointment_accept_delay_minutes = $3,
        appointment_types_included = $4,
        appointment_types_excluded = $5,
        appointment_max_daily_limit = $6,
        appointment_business_hours_only = $7,
        auto_accept_referrals = $8,
        referral_accept_delay_minutes = $9,
        referral_sources_included = $10,
        referral_sources_excluded = $11,
        referral_require_complete_info = $12,
        notify_on_auto_accept = $13,
        notification_email = $14,
        notification_sms = $15,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        organizationId,
        autoAcceptAppointments ?? false,
        appointmentAcceptDelayMinutes ?? 0,
        appointmentTypesIncluded || null,
        appointmentTypesExcluded || null,
        appointmentMaxDailyLimit || null,
        appointmentBusinessHoursOnly ?? true,
        autoAcceptReferrals ?? false,
        referralAcceptDelayMinutes ?? 0,
        referralSourcesIncluded || null,
        referralSourcesExcluded || null,
        referralRequireCompleteInfo ?? true,
        notifyOnAutoAccept ?? true,
        notificationEmail || null,
        notificationSms || null,
        userId,
      ]
    );

    logger.info('Auto-accept settings updated:', { organizationId });
    return result.rows[0];
  } catch (error) {
    logger.error('Error upserting auto-accept settings:', error);
    throw error;
  }
};

// ============================================================================
// APPOINTMENT AUTO-ACCEPT
// ============================================================================

/**
 * Check if an appointment should be auto-accepted
 */
export const shouldAutoAcceptAppointment = async (organizationId, appointment) => {
  try {
    const settings = await getSettings(organizationId);

    if (!settings || !settings.auto_accept_appointments) {
      return { shouldAccept: false, reason: 'Auto-accept not enabled' };
    }

    // Check if appointment type is excluded
    if (settings.appointment_types_excluded && settings.appointment_types_excluded.length > 0) {
      if (settings.appointment_types_excluded.includes(appointment.appointment_type)) {
        return { shouldAccept: false, reason: 'Appointment type is excluded' };
      }
    }

    // Check if appointment type is in included list (if specified)
    if (settings.appointment_types_included && settings.appointment_types_included.length > 0) {
      if (!settings.appointment_types_included.includes(appointment.appointment_type)) {
        return { shouldAccept: false, reason: 'Appointment type not in included list' };
      }
    }

    // Check daily limit
    if (settings.appointment_max_daily_limit) {
      const todayCount = await getDailyAutoAcceptCount(organizationId, 'appointment');
      if (todayCount >= settings.appointment_max_daily_limit) {
        return { shouldAccept: false, reason: 'Daily auto-accept limit reached' };
      }
    }

    // Check business hours (if enabled)
    if (settings.appointment_business_hours_only) {
      const appointmentTime = new Date(appointment.start_time);
      const hour = appointmentTime.getHours();
      const dayOfWeek = appointmentTime.getDay();

      // Weekend check
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { shouldAccept: false, reason: 'Appointment is on weekend' };
      }

      // Business hours check (8 AM - 6 PM)
      if (hour < 8 || hour >= 18) {
        return { shouldAccept: false, reason: 'Appointment is outside business hours' };
      }
    }

    return { shouldAccept: true, reason: null };
  } catch (error) {
    logger.error('Error checking if should auto-accept appointment:', error);
    return { shouldAccept: false, reason: 'Error checking auto-accept rules' };
  }
};

/**
 * Auto-accept an appointment
 */
export const autoAcceptAppointment = async (organizationId, appointmentId) => {
  const client = await transaction.start();

  try {
    // Get the appointment
    const appointmentResult = await client.query(
      `SELECT * FROM appointments WHERE organization_id = $1 AND id = $2`,
      [organizationId, appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentResult.rows[0];

    // Check if should auto-accept
    const { shouldAccept, reason } = await shouldAutoAcceptAppointment(organizationId, appointment);

    // Log the action
    await client.query(
      `INSERT INTO auto_accept_log (organization_id, resource_type, resource_id, action, reason, processed_at)
       VALUES ($1, 'appointment', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [organizationId, appointmentId, shouldAccept ? 'accepted' : 'rejected', reason]
    );

    if (!shouldAccept) {
      await transaction.commit(client);
      return { accepted: false, reason };
    }

    // Update appointment status to confirmed
    await client.query(
      `UPDATE appointments
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [appointmentId]
    );

    await transaction.commit(client);

    // Send notifications
    const settings = await getSettings(organizationId);
    if (settings?.notify_on_auto_accept) {
      await sendAutoAcceptNotification(organizationId, 'appointment', appointment, settings);
    }

    logger.info('Appointment auto-accepted:', { organizationId, appointmentId });
    return { accepted: true, reason: null };
  } catch (error) {
    await transaction.rollback(client);
    logger.error('Error auto-accepting appointment:', error);
    throw error;
  }
};

/**
 * Process pending appointments for auto-accept (called by scheduler)
 */
export const processPendingAppointments = async () => {
  try {
    // Get organizations with auto-accept enabled
    const orgsResult = await query(
      `SELECT organization_id, appointment_accept_delay_minutes
       FROM auto_accept_settings
       WHERE auto_accept_appointments = true`
    );

    for (const org of orgsResult.rows) {
      // Get pending appointments that are past the delay period
      const appointmentsResult = await query(
        `SELECT id FROM appointments
         WHERE organization_id = $1
           AND status = 'pending'
           AND created_at <= NOW() - INTERVAL '1 minute' * $2`,
        [org.organization_id, org.appointment_accept_delay_minutes || 0]
      );

      for (const apt of appointmentsResult.rows) {
        try {
          await autoAcceptAppointment(org.organization_id, apt.id);
        } catch (err) {
          logger.error('Error processing auto-accept for appointment:', {
            appointmentId: apt.id,
            error: err.message,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error processing pending appointments:', error);
  }
};

// ============================================================================
// REFERRAL AUTO-ACCEPT
// ============================================================================

/**
 * Check if a referral should be auto-accepted
 */
export const shouldAutoAcceptReferral = async (organizationId, referral) => {
  try {
    const settings = await getSettings(organizationId);

    if (!settings || !settings.auto_accept_referrals) {
      return { shouldAccept: false, reason: 'Auto-accept not enabled for referrals' };
    }

    // Check if referral source is excluded
    if (settings.referral_sources_excluded && settings.referral_sources_excluded.length > 0) {
      if (settings.referral_sources_excluded.includes(referral.source)) {
        return { shouldAccept: false, reason: 'Referral source is excluded' };
      }
    }

    // Check if referral source is in included list (if specified)
    if (settings.referral_sources_included && settings.referral_sources_included.length > 0) {
      if (!settings.referral_sources_included.includes(referral.source)) {
        return { shouldAccept: false, reason: 'Referral source not in included list' };
      }
    }

    // Check if referral has complete required information
    if (settings.referral_require_complete_info) {
      const requiredFields = ['patient_name', 'referring_provider', 'reason'];
      const missingFields = requiredFields.filter((field) => !referral[field]);

      if (missingFields.length > 0) {
        return {
          shouldAccept: false,
          reason: `Missing required information: ${missingFields.join(', ')}`,
        };
      }
    }

    return { shouldAccept: true, reason: null };
  } catch (error) {
    logger.error('Error checking if should auto-accept referral:', error);
    return { shouldAccept: false, reason: 'Error checking auto-accept rules' };
  }
};

/**
 * Auto-accept a referral
 */
export const autoAcceptReferral = async (organizationId, referralId) => {
  const client = await transaction.start();

  try {
    // Get the referral
    const referralResult = await client.query(
      `SELECT * FROM referrals WHERE organization_id = $1 AND id = $2`,
      [organizationId, referralId]
    );

    if (referralResult.rows.length === 0) {
      throw new Error('Referral not found');
    }

    const referral = referralResult.rows[0];

    // Check if should auto-accept
    const { shouldAccept, reason } = await shouldAutoAcceptReferral(organizationId, referral);

    // Log the action
    await client.query(
      `INSERT INTO auto_accept_log (organization_id, resource_type, resource_id, action, reason, processed_at)
       VALUES ($1, 'referral', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [organizationId, referralId, shouldAccept ? 'accepted' : 'rejected', reason]
    );

    if (!shouldAccept) {
      await transaction.commit(client);
      return { accepted: false, reason };
    }

    // Update referral status to accepted
    await client.query(
      `UPDATE referrals
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [referralId]
    );

    // Create a patient record if needed
    if (referral.patient_name && !referral.patient_id) {
      const [firstName, ...lastNameParts] = referral.patient_name.split(' ');
      const lastName = lastNameParts.join(' ');

      const patientResult = await client.query(
        `INSERT INTO patients (organization_id, first_name, last_name, referral_source, status)
         VALUES ($1, $2, $3, 'referral', 'active')
         RETURNING id`,
        [organizationId, firstName, lastName || '']
      );

      // Link patient to referral
      await client.query(`UPDATE referrals SET patient_id = $1 WHERE id = $2`, [
        patientResult.rows[0].id,
        referralId,
      ]);
    }

    await transaction.commit(client);

    // Send notifications
    const settings = await getSettings(organizationId);
    if (settings?.notify_on_auto_accept) {
      await sendAutoAcceptNotification(organizationId, 'referral', referral, settings);
    }

    logger.info('Referral auto-accepted:', { organizationId, referralId });
    return { accepted: true, reason: null };
  } catch (error) {
    await transaction.rollback(client);
    logger.error('Error auto-accepting referral:', error);
    throw error;
  }
};

/**
 * Process pending referrals for auto-accept (called by scheduler)
 */
export const processPendingReferrals = async () => {
  try {
    // Get organizations with auto-accept enabled
    const orgsResult = await query(
      `SELECT organization_id, referral_accept_delay_minutes
       FROM auto_accept_settings
       WHERE auto_accept_referrals = true`
    );

    for (const org of orgsResult.rows) {
      // Get pending referrals that are past the delay period
      const referralsResult = await query(
        `SELECT id FROM referrals
         WHERE organization_id = $1
           AND status = 'pending'
           AND created_at <= NOW() - INTERVAL '1 minute' * $2`,
        [org.organization_id, org.referral_accept_delay_minutes || 0]
      );

      for (const ref of referralsResult.rows) {
        try {
          await autoAcceptReferral(org.organization_id, ref.id);
        } catch (err) {
          logger.error('Error processing auto-accept for referral:', {
            referralId: ref.id,
            error: err.message,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error processing pending referrals:', error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get daily auto-accept count
 */
const getDailyAutoAcceptCount = async (organizationId, resourceType) => {
  const result = await query(
    `SELECT COUNT(*) as count FROM auto_accept_log
     WHERE organization_id = $1
       AND resource_type = $2
       AND action = 'accepted'
       AND DATE(created_at) = CURRENT_DATE`,
    [organizationId, resourceType]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Send auto-accept notification
 */
const sendAutoAcceptNotification = async (organizationId, resourceType, resource, settings) => {
  try {
    if (!settings.notification_email) {
      return;
    }

    const subject =
      resourceType === 'appointment'
        ? `Avtale automatisk bekreftet - ${resource.patient_name || 'Pasient'}`
        : `Henvisning automatisk godtatt - ${resource.patient_name || 'Pasient'}`;

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>${resourceType === 'appointment' ? 'Avtale automatisk bekreftet' : 'Henvisning automatisk godtatt'}</h2>
        <p>En ${resourceType === 'appointment' ? 'avtale' : 'henvisning'} har blitt automatisk godtatt:</p>
        <ul>
          ${resource.patient_name ? `<li><strong>Pasient:</strong> ${resource.patient_name}</li>` : ''}
          ${resource.start_time ? `<li><strong>Tidspunkt:</strong> ${new Date(resource.start_time).toLocaleString('nb-NO')}</li>` : ''}
          ${resource.appointment_type ? `<li><strong>Type:</strong> ${resource.appointment_type}</li>` : ''}
          ${resource.referring_provider ? `<li><strong>Henvisende lege:</strong> ${resource.referring_provider}</li>` : ''}
          ${resource.reason ? `<li><strong>Årsak:</strong> ${resource.reason}</li>` : ''}
        </ul>
        <p>Logg inn for å se flere detaljer.</p>
      </div>
    `;

    await sendEmail({
      to: settings.notification_email,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Error sending auto-accept notification:', error);
  }
};

/**
 * Get auto-accept log
 */
export const getAutoAcceptLog = async (organizationId, filters = {}) => {
  try {
    const { resourceType, action, limit = 50, offset = 0 } = filters;

    let sql = `
      SELECT * FROM auto_accept_log
      WHERE organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (resourceType) {
      sql += ` AND resource_type = $${paramIndex}`;
      params.push(resourceType);
      paramIndex++;
    }

    if (action) {
      sql += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting auto-accept log:', error);
    throw error;
  }
};

export default {
  getSettings,
  upsertSettings,
  shouldAutoAcceptAppointment,
  autoAcceptAppointment,
  processPendingAppointments,
  shouldAutoAcceptReferral,
  autoAcceptReferral,
  processPendingReferrals,
  getAutoAcceptLog,
};
