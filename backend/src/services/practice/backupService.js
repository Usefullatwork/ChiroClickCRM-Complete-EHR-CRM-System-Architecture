/**
 * Backup Service
 * Creates encrypted AES-256-GCM backups of the PGlite data directory.
 * Handles scheduling, retention, restore, and integrity verification.
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, stat, rm, readFile, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getPGliteDataDir, getBackupDir } from '../../config/data-paths.js';
import { closePGlite, reopenPGlite } from '../../config/database-pglite.js';
import { encryptDirectory, decryptToDirectory, hashFile } from '../../utils/backupCrypto.js';
import logger from '../../utils/logger.js';

// --- State ---

let isBackingUp = false;
let lastBackupDate = null;
let schedulerInterval = null;
let backupSettings = {
  scheduleHour: 2,
  retentionCount: 7,
};

// --- Constants ---

const CLOSE_TIMEOUT_MS = 10_000;

// --- Helpers ---

/** Filename-safe ISO timestamp. */
const fileTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

/** Close PGlite with a hard timeout. */
const closePGliteWithTimeout = async () => {
  await Promise.race([
    closePGlite(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('PGlite lukking tok for lang tid (timeout)')),
        CLOSE_TIMEOUT_MS
      )
    ),
  ]);
};

// --- Public API ---

/**
 * Check if a backup is currently in progress.
 */
export const getIsBackingUp = () => isBackingUp;

/**
 * Create an encrypted backup of the PGlite data directory.
 * @returns {Object} Backup result with filename and size
 */
export const createBackup = async () => {
  if (isBackingUp) {
    throw new Error('En sikkerhetskopi kjorer allerede. Prov igjen senere.');
  }

  const dataDir = getPGliteDataDir();
  const backupDir = getBackupDir();
  const ts = fileTimestamp();
  const tmpDir = path.join(backupDir, `tmp-${ts}`);
  const encFile = path.join(backupDir, `backup-${ts}.enc`);
  const shaFile = path.join(backupDir, `backup-${ts}.sha256`);

  isBackingUp = true;
  logger.info('Starter sikkerhetskopi av PGlite-databasen');

  try {
    await mkdir(backupDir, { recursive: true });

    if (!existsSync(dataDir)) {
      throw new Error(`PGlite-datamappen finnes ikke: ${dataDir}`);
    }

    // 1. Close PGlite for safe copy
    logger.info('Lukker PGlite for sikker kopiering...');
    try {
      await closePGliteWithTimeout();
    } catch (closeErr) {
      logger.error('Feil ved lukking av PGlite:', { error: closeErr.message });
      throw closeErr;
    }

    // 2. Copy data directory to tmp
    logger.info('Kopierer PGlite-data til midlertidig mappe...');
    try {
      await cp(dataDir, tmpDir, { recursive: true });
    } catch (copyErr) {
      if (copyErr.code === 'ENOSPC') {
        throw new Error('Ikke nok diskplass for sikkerhetskopi.');
      }
      if (copyErr.code === 'EACCES') {
        throw new Error('Mangler tilgang til PGlite-datamappen.');
      }
      throw copyErr;
    }

    // 3. Reopen PGlite immediately after copy
    logger.info('Gjenopner PGlite-databasen...');
    try {
      await reopenPGlite();
    } catch (reopenErr) {
      logger.error('Kritisk: Kunne ikke gjenopne PGlite etter kopiering:', {
        error: reopenErr.message,
      });
      isBackingUp = false;
      throw reopenErr;
    }

    // 4. Encrypt the copied directory
    logger.info('Krypterer sikkerhetskopi...');
    const encryptedData = await encryptDirectory(tmpDir);
    await writeFile(encFile, encryptedData);

    // 5. Write SHA-256 checksum
    const checksum = createHash('sha256').update(encryptedData).digest('hex');
    await writeFile(shaFile, `${checksum}  ${path.basename(encFile)}\n`, 'utf8');

    // 6. Verify integrity
    const verifyHash = await hashFile(encFile);
    if (verifyHash !== checksum) {
      throw new Error('Integritetssjekk feilet: SHA-256 stemmer ikke.');
    }

    // 7. Clean up tmp dir
    await rm(tmpDir, { recursive: true, force: true });

    // 8. Prune old backups
    await pruneBackups(backupSettings.retentionCount);

    const encStat = await stat(encFile);
    lastBackupDate = new Date();

    logger.info('Sikkerhetskopi fullfort', {
      file: path.basename(encFile),
      size: encStat.size,
    });

    return {
      filename: path.basename(encFile),
      size: encStat.size,
      checksum,
      date: lastBackupDate.toISOString(),
    };
  } catch (error) {
    logger.error('Sikkerhetskopi feilet:', { error: error.message });
    // Ensure PGlite is reopened if it was closed
    try {
      await reopenPGlite();
    } catch (reopenErr) {
      logger.error('Kritisk: Kunne ikke gjenopne PGlite etter feil:', {
        error: reopenErr.message,
      });
    }
    if (existsSync(tmpDir)) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
    throw error;
  } finally {
    isBackingUp = false;
  }
};

/**
 * Restore a backup to data/pglite-restored/ (non-destructive).
 * @param {string} filename - The .enc backup file name
 * @returns {Object} Restore result with path
 */
export const restoreBackup = async (filename) => {
  if (isBackingUp) {
    throw new Error('Kan ikke gjenopprette mens sikkerhetskopi kjorer.');
  }

  // Validate filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Ugyldig filnavn.');
  }

  const backupDir = getBackupDir();
  const encFile = path.join(backupDir, filename);
  const shaFile = encFile.replace(/\.enc$/, '.sha256');

  if (!existsSync(encFile)) {
    throw new Error(`Sikkerhetskopi ikke funnet: ${filename}`);
  }

  // Verify SHA-256 if checksum file exists
  if (existsSync(shaFile)) {
    const shaContent = await readFile(shaFile, 'utf8');
    const expectedHash = shaContent.trim().split(/\s+/)[0];
    const actualHash = await hashFile(encFile);
    if (actualHash !== expectedHash) {
      throw new Error('SHA-256 stemmer ikke. Sikkerhetskopien kan vaere skadet.');
    }
    logger.info('SHA-256 verifisering bestatt');
  } else {
    logger.warn('SHA-256 fil mangler, hopper over integritetssjekk');
  }

  const ts = fileTimestamp();
  const dataDir = path.dirname(getPGliteDataDir());
  const restoreDir = path.join(dataDir, `pglite-restored-${ts}`);

  logger.info('Dekrypterer og gjenoppretter sikkerhetskopi...', {
    filename,
    target: restoreDir,
  });

  try {
    await mkdir(restoreDir, { recursive: true });
    await decryptToDirectory(encFile, restoreDir);
  } catch (decryptErr) {
    if (existsSync(restoreDir)) {
      await rm(restoreDir, { recursive: true, force: true }).catch(() => {});
    }
    if (
      decryptErr.message.includes('Unsupported state') ||
      decryptErr.code === 'ERR_OSSL_EVP_BAD_DECRYPT'
    ) {
      throw new Error('Dekryptering feilet. Feil krypteringsnokkel eller skadet fil.');
    }
    throw decryptErr;
  }

  logger.info('Gjenoppretting fullfort', { target: restoreDir });

  return {
    restoredTo: restoreDir,
    filename,
    date: new Date().toISOString(),
  };
};

/**
 * List all backups in the backup directory.
 * @returns {Array} Sorted list of backups (newest first)
 */
export const listBackups = async () => {
  const backupDir = getBackupDir();

  if (!existsSync(backupDir)) {
    return [];
  }

  const entries = await readdir(backupDir);
  const encFiles = entries.filter((f) => f.endsWith('.enc'));

  const backups = [];
  for (const filename of encFiles) {
    const filePath = path.join(backupDir, filename);
    const shaPath = filePath.replace(/\.enc$/, '.sha256');
    const fileStat = await stat(filePath);

    const match = filename.match(/backup-(\d{4}-\d{2}-\d{2}T[\d-]+Z)/);
    const date = match
      ? match[1].replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, '$1:$2:$3.$4Z')
      : fileStat.mtime.toISOString();

    backups.push({
      filename,
      date,
      size: fileStat.size,
      verified: existsSync(shaPath),
    });
  }

  backups.sort((a, b) => new Date(b.date) - new Date(a.date));
  return backups;
};

/**
 * Delete oldest backups beyond the retention count.
 * @param {number} keep - Number of backups to keep (default: 7)
 */
export const pruneBackups = async (keep = 7) => {
  const backups = await listBackups();
  if (backups.length <= keep) {
    return { deleted: 0 };
  }

  const toDelete = backups.slice(keep);
  const backupDir = getBackupDir();
  let deleted = 0;

  for (const backup of toDelete) {
    try {
      const encPath = path.join(backupDir, backup.filename);
      const shaPath = encPath.replace(/\.enc$/, '.sha256');

      await rm(encPath, { force: true });
      if (existsSync(shaPath)) {
        await rm(shaPath, { force: true });
      }
      deleted++;
      logger.info('Slettet gammel sikkerhetskopi', { filename: backup.filename });
    } catch (err) {
      logger.warn('Kunne ikke slette sikkerhetskopi:', {
        filename: backup.filename,
        error: err.message,
      });
    }
  }

  return { deleted, remaining: backups.length - deleted };
};

/**
 * Get current backup status.
 * @returns {Object} Status with last backup date, next scheduled, count
 */
export const getBackupStatus = async () => {
  const backups = await listBackups();
  const lastBackup = backups.length > 0 ? backups[0] : null;

  let nextScheduled = null;
  if (schedulerInterval) {
    const now = new Date();
    const next = new Date(now);
    next.setHours(backupSettings.scheduleHour, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    nextScheduled = next.toISOString();
  }

  return {
    isBackingUp,
    lastBackup: lastBackup
      ? { filename: lastBackup.filename, date: lastBackup.date, size: lastBackup.size }
      : null,
    nextScheduled,
    totalCount: backups.length,
    settings: { ...backupSettings },
  };
};

/**
 * Schedule daily automatic backups.
 * Checks if last backup is >24h old on start and runs a catch-up if needed.
 * @param {number} hour - Hour of day (0-23) to run backup (default: 2)
 */
export const scheduleBackup = async (hour = 2) => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  backupSettings.scheduleHour = hour;

  // Catch-up check
  try {
    const backups = await listBackups();
    if (backups.length > 0) {
      const hoursSince = (Date.now() - new Date(backups[0].date).getTime()) / 3_600_000;
      if (hoursSince > 24) {
        logger.info('Siste sikkerhetskopi er over 24 timer gammel, starter innhentingskopi...');
        createBackup().catch((err) => {
          logger.error('Innhentingskopi feilet:', { error: err.message });
        });
      }
    } else {
      logger.info('Ingen tidligere sikkerhetskopier funnet, starter forste kopi...');
      createBackup().catch((err) => {
        logger.error('Forste sikkerhetskopi feilet:', { error: err.message });
      });
    }
  } catch (err) {
    logger.warn('Kunne ikke sjekke siste sikkerhetskopi:', { error: err.message });
  }

  // Check every 15 minutes if it's time to run
  schedulerInterval = setInterval(
    async () => {
      const now = new Date();
      if (now.getHours() === backupSettings.scheduleHour && now.getMinutes() < 15) {
        if (!isBackingUp) {
          try {
            const backups = await listBackups();
            const shouldRun =
              backups.length === 0 ||
              Date.now() - new Date(backups[0].date).getTime() > 20 * 3_600_000;
            if (shouldRun) {
              logger.info('Planlagt sikkerhetskopi starter...');
              await createBackup();
            }
          } catch (err) {
            logger.error('Planlagt sikkerhetskopi feilet:', { error: err.message });
          }
        }
      }
    },
    15 * 60 * 1000
  );

  logger.info(`Sikkerhetskopi planlagt daglig kl. ${String(hour).padStart(2, '0')}:00`);
  return { scheduled: true, hour };
};

/**
 * Update backup settings.
 * @param {Object} settings - New settings
 */
export const updateSettings = async (settings = {}) => {
  if (settings.scheduleHour != null) {
    const h = parseInt(settings.scheduleHour, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      throw new Error('scheduleHour ma vaere mellom 0 og 23.');
    }
    backupSettings.scheduleHour = h;
    await scheduleBackup(h);
  }

  if (settings.retentionCount != null) {
    const r = parseInt(settings.retentionCount, 10);
    if (isNaN(r) || r < 1 || r > 365) {
      throw new Error('retentionCount ma vaere mellom 1 og 365.');
    }
    backupSettings.retentionCount = r;
  }

  return { ...backupSettings };
};

/**
 * Stop the backup scheduler (for graceful shutdown).
 */
export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Sikkerhetskopi-planlegger stoppet');
  }
};

export default {
  createBackup,
  restoreBackup,
  listBackups,
  pruneBackups,
  getBackupStatus,
  scheduleBackup,
  updateSettings,
  stopScheduler,
  getIsBackingUp,
};
