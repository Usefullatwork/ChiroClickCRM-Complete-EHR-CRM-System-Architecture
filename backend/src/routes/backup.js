/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Database backup and restore (admin only)
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as backupService from '../services/backupService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /backup:
 *   post:
 *     summary: Trigger a manual backup
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Backup created successfully
 *       409:
 *         description: Backup already in progress
 *       500:
 *         description: Backup failed
 */
router.post('/', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await backupService.createBackup();
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('kjorer allerede')) {
      return res.status(409).json({ error: 'Conflict', message: error.message });
    }
    logger.error('Manuell sikkerhetskopi feilet:', { error: error.message });
    res.status(500).json({ error: 'BackupFailed', message: error.message });
  }
});

/**
 * @swagger
 * /backup:
 *   get:
 *     summary: List all backups
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of backups
 */
router.get('/', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ backups });
  } catch (error) {
    logger.error('Listing av sikkerhetskopier feilet:', { error: error.message });
    res.status(500).json({ error: 'ListFailed', message: error.message });
  }
});

/**
 * @swagger
 * /backup/status:
 *   get:
 *     summary: Get backup status
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Backup status
 */
router.get('/status', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const status = await backupService.getBackupStatus();
    res.json(status);
  } catch (error) {
    logger.error('Henting av sikkerhetskopistatus feilet:', { error: error.message });
    res.status(500).json({ error: 'StatusFailed', message: error.message });
  }
});

/**
 * @swagger
 * /backup/restore:
 *   post:
 *     summary: Restore from a backup (non-destructive)
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filename]
 *             properties:
 *               filename:
 *                 type: string
 *                 description: The .enc backup filename
 *     responses:
 *       200:
 *         description: Backup restored
 *       400:
 *         description: Missing filename
 *       404:
 *         description: Backup not found
 *       500:
 *         description: Restore failed
 */
router.post('/restore', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { filename } = req.body || {};

  if (!filename) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Filnavn er pakrevd.',
    });
  }

  if (!filename.endsWith('.enc')) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Kun .enc-filer kan gjenopprettes.',
    });
  }

  try {
    const result = await backupService.restoreBackup(filename);
    res.json(result);
  } catch (error) {
    if (error.message.includes('ikke funnet')) {
      return res.status(404).json({ error: 'NotFound', message: error.message });
    }
    logger.error('Gjenoppretting av sikkerhetskopi feilet:', { error: error.message });
    res.status(500).json({ error: 'RestoreFailed', message: error.message });
  }
});

/**
 * @swagger
 * /backup/settings:
 *   put:
 *     summary: Update backup settings (schedule time, retention)
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduleHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               retentionCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *     responses:
 *       200:
 *         description: Settings updated
 *       400:
 *         description: Invalid settings
 */
router.put('/settings', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const updated = await backupService.updateSettings(req.body);
    res.json({ settings: updated });
  } catch (error) {
    if (error.message.includes('ma vaere')) {
      return res.status(400).json({ error: 'BadRequest', message: error.message });
    }
    logger.error('Oppdatering av sikkerhetskopiinnstillinger feilet:', { error: error.message });
    res.status(500).json({ error: 'SettingsFailed', message: error.message });
  }
});

export default router;
