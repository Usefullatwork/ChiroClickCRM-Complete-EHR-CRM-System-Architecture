/**
 * Push Notification Service
 * Expo Push API wrapper with mock-mode support for desktop development.
 * All push payloads include { type, id, route } in data for client-side routing.
 *
 * @module services/pushNotification
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

const DESKTOP_MODE = process.env.DESKTOP_MODE === 'true';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification to one or more Expo push tokens.
 * In DESKTOP_MODE, logs the payload and returns a mock result.
 *
 * @param {string[]} deviceTokens - Expo push tokens
 * @param {string} title - Notification title (Norwegian for patient-facing)
 * @param {string} body - Notification body text
 * @param {Object} data - Client-side routing payload { type, id, route }
 * @returns {Promise<Object>} { success, mock?, tickets? }
 */
export async function sendPush(deviceTokens, title, body, data = {}) {
  if (!deviceTokens || deviceTokens.length === 0) {
    logger.debug('sendPush called with no device tokens — skipping');
    return { success: true, skipped: true };
  }

  if (DESKTOP_MODE) {
    logger.info('Push notification (mock mode)', {
      tokens: deviceTokens.length,
      title,
      body,
      data,
    });
    return { success: true, mock: true };
  }

  try {
    const messages = deviceTokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    logger.info('Push notification sent', {
      tokens: deviceTokens.length,
      title,
      status: response.status,
    });

    return { success: response.ok, tickets: result.data || [] };
  } catch (error) {
    logger.error('Push notification failed', { error: error.message, title });
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to a patient by looking up their mobile device tokens.
 *
 * @param {string} patientId - Patient UUID
 * @param {Object} notification - { title, body, data }
 * @returns {Promise<Object>} { success, tokenCount }
 */
export async function sendPushToPatient(patientId, notification) {
  try {
    const result = await query(`SELECT device_tokens FROM mobile_users WHERE patient_id = $1`, [
      patientId,
    ]);

    if (result.rows.length === 0 || !result.rows[0].device_tokens) {
      logger.debug('No mobile user linked for patient — push skipped', {
        patientId: `${patientId.slice(0, 8)}...`,
      });
      return { success: true, tokenCount: 0 };
    }

    const tokens = result.rows[0].device_tokens;
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    return await sendPush(
      tokenArray,
      notification.title,
      notification.body,
      notification.data || {}
    );
  } catch (error) {
    logger.error('sendPushToPatient failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to a mobile user by their mobile_users.id.
 *
 * @param {string} mobileUserId - mobile_users UUID
 * @param {Object} notification - { title, body, data }
 * @returns {Promise<Object>} { success, tokenCount }
 */
export async function sendPushToMobileUser(mobileUserId, notification) {
  try {
    const result = await query(`SELECT device_tokens FROM mobile_users WHERE id = $1`, [
      mobileUserId,
    ]);

    if (result.rows.length === 0 || !result.rows[0].device_tokens) {
      logger.debug('No device tokens for mobile user — push skipped', {
        mobileUserId: `${mobileUserId.slice(0, 8)}...`,
      });
      return { success: true, tokenCount: 0 };
    }

    const tokens = result.rows[0].device_tokens;
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    return await sendPush(
      tokenArray,
      notification.title,
      notification.body,
      notification.data || {}
    );
  } catch (error) {
    logger.error('sendPushToMobileUser failed', { error: error.message });
    return { success: false, error: error.message };
  }
}
