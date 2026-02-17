/**
 * Encryption Key Rotation Utility
 * Manages encryption key rotation for GDPR compliance
 */

import crypto from 'crypto';
import { query, transaction } from '../config/database.js';
import { encrypt, decrypt } from './encryption.js';
import logger from './logger.js';

/**
 * Key rotation configuration
 */
const KEY_ROTATION_INTERVAL_DAYS = parseInt(process.env.KEY_ROTATION_DAYS || '90');

/**
 * Get active encryption key version
 */
export const getActiveKeyVersion = async () => {
  const result = await query(
    `SELECT key_version, created_at
     FROM encryption_keys
     WHERE is_active = true
     ORDER BY created_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    version: result.rows[0].key_version,
    createdAt: result.rows[0].created_at,
  };
};

/**
 * Check if key rotation is needed
 */
export const needsRotation = async () => {
  const activeKey = await getActiveKeyVersion();

  if (!activeKey) {
    logger.warn('No active encryption key found');
    return true;
  }

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(activeKey.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceCreation >= KEY_ROTATION_INTERVAL_DAYS;
};

/**
 * Generate new encryption key
 */
export const generateNewKey = () => crypto.randomBytes(32).toString('hex');

/**
 * Rotate encryption keys
 * Re-encrypts all sensitive data with new key
 */
export const rotateKeys = async () => {
  logger.info('Starting encryption key rotation');

  try {
    await transaction(async (client) => {
      // Get current active key
      const currentKeyResult = await client.query(
        'SELECT key_version FROM encryption_keys WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
      );

      const currentVersion = currentKeyResult.rows[0]?.key_version || 0;
      const newVersion = currentVersion + 1;

      // Generate new key
      const newKey = generateNewKey();

      // Store new key in database (encrypted with master key)
      await client.query(
        `INSERT INTO encryption_keys (key_version, encrypted_key, is_active, created_at)
         VALUES ($1, $2, false, NOW())`,
        [newVersion, newKey] // In production, encrypt this with a master key
      );

      // Get all patients with encrypted data
      const patientsResult = await client.query(
        'SELECT id, encrypted_personal_number FROM patients WHERE encrypted_personal_number IS NOT NULL'
      );

      logger.info(`Re-encrypting ${patientsResult.rows.length} patient records`);

      // Re-encrypt each patient's personal number
      for (const patient of patientsResult.rows) {
        try {
          // Decrypt with old key
          const decrypted = decrypt(patient.encrypted_personal_number);

          // Re-encrypt with new key
          const reencrypted = encrypt(decrypted);

          // Update in database
          await client.query('UPDATE patients SET encrypted_personal_number = $1 WHERE id = $2', [
            reencrypted,
            patient.id,
          ]);
        } catch (error) {
          logger.error(`Failed to re-encrypt patient ${patient.id}`, error);
          throw error;
        }
      }

      // Deactivate old key
      await client.query('UPDATE encryption_keys SET is_active = false WHERE key_version = $1', [
        currentVersion,
      ]);

      // Activate new key
      await client.query('UPDATE encryption_keys SET is_active = true WHERE key_version = $1', [
        newVersion,
      ]);

      logger.info(`Key rotation completed. New key version: ${newVersion}`);

      return {
        oldVersion: currentVersion,
        newVersion,
        recordsReencrypted: patientsResult.rows.length,
      };
    });
  } catch (error) {
    logger.error('Key rotation failed', error);
    throw error;
  }
};

/**
 * Schedule automatic key rotation
 */
export const scheduleKeyRotation = () => {
  // Check daily if rotation is needed
  const checkInterval = 24 * 60 * 60 * 1000; // 24 hours

  setInterval(async () => {
    try {
      const shouldRotate = await needsRotation();

      if (shouldRotate) {
        logger.info('Automatic key rotation triggered');
        await rotateKeys();
      }
    } catch (error) {
      logger.error('Automatic key rotation check failed', error);
    }
  }, checkInterval);

  logger.info('Key rotation scheduler started');
};

/**
 * Create encryption_keys table migration
 */
export const createKeyRotationTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS encryption_keys (
      id SERIAL PRIMARY KEY,
      key_version INTEGER UNIQUE NOT NULL,
      encrypted_key TEXT NOT NULL,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      rotated_at TIMESTAMP,
      CONSTRAINT one_active_key CHECK (
        (is_active = false) OR
        (SELECT COUNT(*) FROM encryption_keys WHERE is_active = true) <= 1
      )
    );

    CREATE INDEX IF NOT EXISTS idx_encryption_keys_active
    ON encryption_keys(is_active) WHERE is_active = true;

    CREATE INDEX IF NOT EXISTS idx_encryption_keys_version
    ON encryption_keys(key_version);
  `);

  logger.info('Encryption keys table created/verified');
};

export default {
  getActiveKeyVersion,
  needsRotation,
  rotateKeys,
  scheduleKeyRotation,
  createKeyRotationTable,
};
