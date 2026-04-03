/**
 * One-time AES-CBC → AES-256-GCM data migration.
 * Re-encrypts all patient encrypted_personal_number fields from CBC to GCM format.
 * Idempotent: skips records already in GCM format.
 * Transaction-safe: atomic commit or full rollback.
 */

import { encrypt, decrypt } from './encryption.js';
import { query } from '../config/database.js';
import logger from './logger.js';

/**
 * Migrate all CBC-encrypted patient records to GCM format.
 * Runs inside a single transaction for atomicity.
 * @returns {{ migrated: number, skipped: number, total: number }}
 */
export const migrateEncryptionToGcm = async () => {
  let migrated = 0;
  let skipped = 0;

  try {
    // Check if patients table has the column
    const tableCheck = await query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'encrypted_personal_number' LIMIT 1"
    );
    if (tableCheck.rows.length === 0) {
      return { migrated: 0, skipped: 0, total: 0 };
    }

    // Find records still in CBC format
    const result = await query(
      "SELECT id, encrypted_personal_number FROM patients WHERE encrypted_personal_number IS NOT NULL AND encrypted_personal_number NOT LIKE 'gcm:%'"
    );

    const total = result.rows.length;
    if (total === 0) {
      return { migrated: 0, skipped: 0, total: 0 };
    }

    logger.info(`GCM migration: found ${total} CBC-format records to migrate`);

    await query('BEGIN');

    for (const row of result.rows) {
      try {
        const plaintext = decrypt(row.encrypted_personal_number);
        if (plaintext == null) {
          skipped++;
          continue;
        }
        const gcmCiphertext = encrypt(plaintext);
        await query('UPDATE patients SET encrypted_personal_number = $1 WHERE id = $2', [
          gcmCiphertext,
          row.id,
        ]);
        migrated++;
      } catch (err) {
        logger.error(`GCM migration failed on patient id=${row.id}: ${err.message}`);
        await query('ROLLBACK');
        throw new Error(`GCM migration aborted: failed on patient id=${row.id}`);
      }
    }

    await query('COMMIT');
    logger.info(`GCM migration complete: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped, total };
  } catch (error) {
    try {
      await query('ROLLBACK');
    } catch {
      // Already rolled back or no transaction
    }
    throw error;
  }
};
