/**
 * Phone Bridge Service
 * Sends SMS through connected phone using various methods:
 * - KDE Connect (Linux)
 * - Android Debug Bridge (ADB)
 * - Phone Companion API (Windows/Android app)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

const PHONE_BRIDGE_METHOD = process.env.PHONE_BRIDGE_METHOD || 'kdeconnect'; // 'kdeconnect', 'adb', 'api'
const PHONE_DEVICE_ID = process.env.PHONE_DEVICE_ID || null;
const PHONE_API_URL = process.env.PHONE_API_URL || 'http://localhost:8080';
const PHONE_API_KEY = process.env.PHONE_API_KEY || null;

/**
 * Send SMS via KDE Connect
 */
const sendViaKDEConnect = async (phoneNumber, message) => {
  try {
    if (!PHONE_DEVICE_ID) {
      throw new Error('PHONE_DEVICE_ID not configured for KDE Connect');
    }

    const command = `kdeconnect-cli -d ${PHONE_DEVICE_ID} --send-sms "${message}" --destination ${phoneNumber}`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      logger.warn('KDE Connect stderr:', stderr);
    }

    logger.info('SMS sent via KDE Connect:', { phoneNumber, stdout });
    return {
      success: true,
      method: 'kdeconnect',
      externalId: `KDE-${Date.now()}`,
      response: stdout
    };
  } catch (error) {
    logger.error('KDE Connect SMS error:', error);
    throw new Error(`KDE Connect failed: ${error.message}`);
  }
};

/**
 * Send SMS via Android Debug Bridge (ADB)
 */
const sendViaADB = async (phoneNumber, message) => {
  try {
    // Escape special characters for shell
    const escapedMessage = message.replace(/'/g, "'\\''");

    const command = `adb shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "${phoneNumber}" s16 "null" s16 "${escapedMessage}" s16 "null" s16 "null"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Parcel')) {
      logger.warn('ADB stderr:', stderr);
    }

    logger.info('SMS sent via ADB:', { phoneNumber });
    return {
      success: true,
      method: 'adb',
      externalId: `ADB-${Date.now()}`,
      response: stdout
    };
  } catch (error) {
    logger.error('ADB SMS error:', error);
    throw new Error(`ADB failed: ${error.message}`);
  }
};

/**
 * Send SMS via Phone Companion API (Custom Android/Windows app)
 */
const sendViaAPI = async (phoneNumber, message) => {
  try {
    if (!PHONE_API_URL) {
      throw new Error('PHONE_API_URL not configured');
    }

    const response = await axios.post(
      `${PHONE_API_URL}/api/sms/send`,
      {
        to: phoneNumber,
        message: message
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': PHONE_API_KEY || ''
        },
        timeout: 10000
      }
    );

    logger.info('SMS sent via Phone API:', { phoneNumber, status: response.status });
    return {
      success: true,
      method: 'api',
      externalId: response.data.messageId || `API-${Date.now()}`,
      response: response.data
    };
  } catch (error) {
    logger.error('Phone API SMS error:', error);
    throw new Error(`Phone API failed: ${error.message}`);
  }
};

/**
 * Main SMS sending function
 */
export const sendSMS = async (phoneNumber, message) => {
  // Clean phone number (Norwegian format)
  const cleanNumber = phoneNumber.replace(/\s/g, '');
  const formattedNumber = cleanNumber.startsWith('+47') ? cleanNumber : `+47${cleanNumber}`;

  logger.info(`Sending SMS via ${PHONE_BRIDGE_METHOD}:`, { to: formattedNumber });

  switch (PHONE_BRIDGE_METHOD) {
    case 'kdeconnect':
      return await sendViaKDEConnect(formattedNumber, message);

    case 'adb':
      return await sendViaADB(formattedNumber, message);

    case 'api':
      return await sendViaAPI(formattedNumber, message);

    default:
      throw new Error(`Unknown phone bridge method: ${PHONE_BRIDGE_METHOD}`);
  }
};

/**
 * Check phone connectivity
 */
export const checkPhoneConnection = async () => {
  try {
    switch (PHONE_BRIDGE_METHOD) {
      case 'kdeconnect': {
        const { stdout } = await execAsync('kdeconnect-cli -l');
        const isConnected = stdout.includes(PHONE_DEVICE_ID) && stdout.includes('reachable');
        return {
          method: 'kdeconnect',
          connected: isConnected,
          deviceId: PHONE_DEVICE_ID,
          details: stdout
        };
      }

      case 'adb': {
        const { stdout } = await execAsync('adb devices');
        const isConnected = stdout.includes('device') && !stdout.includes('offline');
        return {
          method: 'adb',
          connected: isConnected,
          details: stdout
        };
      }

      case 'api': {
        const response = await axios.get(`${PHONE_API_URL}/api/status`, {
          headers: { 'X-API-Key': PHONE_API_KEY || '' },
          timeout: 5000
        });
        return {
          method: 'api',
          connected: response.status === 200,
          details: response.data
        };
      }

      default:
        return {
          method: PHONE_BRIDGE_METHOD,
          connected: false,
          error: 'Unknown method'
        };
    }
  } catch (error) {
    logger.error('Phone connection check failed:', error);
    return {
      method: PHONE_BRIDGE_METHOD,
      connected: false,
      error: error.message
    };
  }
};

/**
 * Get received SMS (if supported)
 */
export const getReceivedSMS = async (since = null) => {
  try {
    if (PHONE_BRIDGE_METHOD !== 'api') {
      throw new Error('Receiving SMS only supported via API method');
    }

    const response = await axios.get(`${PHONE_API_URL}/api/sms/inbox`, {
      params: { since },
      headers: { 'X-API-Key': PHONE_API_KEY || '' },
      timeout: 10000
    });

    return response.data.messages || [];
  } catch (error) {
    logger.error('Error getting received SMS:', error);
    return [];
  }
};

export default {
  sendSMS,
  checkPhoneConnection,
  getReceivedSMS
};
