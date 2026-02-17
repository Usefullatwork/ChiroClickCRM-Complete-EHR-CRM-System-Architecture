/**
 * Bulk Communication Routes
 * API endpoints for mass SMS/email communications
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  queueBulkSendSchema,
  getBatchStatusSchema,
  cancelBatchSchema,
  getBatchesSchema,
  previewMessageSchema,
  getPatientsSchema,
} from '../validators/bulkCommunication.validators.js';
import * as bulkCommController from '../controllers/bulkCommunication.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /bulk-communications/health:
 *   get:
 *     summary: Bulk communications module health check
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'bulk-communication' });
});

/**
 * @swagger
 * /bulk-communications/send:
 *   post:
 *     summary: Queue a bulk SMS/email send
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channel, patientIds, message]
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [sms, email]
 *               patientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               message:
 *                 type: string
 *               subject:
 *                 type: string
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Bulk send queued
 */
router.post(
  '/send',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(queueBulkSendSchema),
  bulkCommController.queueBulkSend
);

/**
 * @swagger
 * /bulk-communications/batches:
 *   get:
 *     summary: List all batches
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bulk send batches
 */
router.get(
  '/batches',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getBatchesSchema),
  bulkCommController.getBatches
);
/**
 * @swagger
 * /bulk-communications/queue/status/{batchId}:
 *   get:
 *     summary: Get batch send status
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Batch status details
 *       404:
 *         description: Batch not found
 */
router.get(
  '/queue/status/:batchId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getBatchStatusSchema),
  bulkCommController.getBatchStatus
);
/**
 * @swagger
 * /bulk-communications/queue/cancel/{batchId}:
 *   post:
 *     summary: Cancel a batch send
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Batch cancelled
 *       404:
 *         description: Batch not found
 */
router.post(
  '/queue/cancel/:batchId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(cancelBatchSchema),
  bulkCommController.cancelBatch
);
/**
 * @swagger
 * /bulk-communications/queue/pending:
 *   get:
 *     summary: Get pending queue items
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending queue items
 */
router.get(
  '/queue/pending',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.getPendingQueue
);

/**
 * @swagger
 * /bulk-communications/preview:
 *   post:
 *     summary: Preview a message with template variables resolved
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               patientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Preview of resolved message
 */
router.post(
  '/preview',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(previewMessageSchema),
  bulkCommController.previewMessage
);
/**
 * @swagger
 * /bulk-communications/variables:
 *   get:
 *     summary: Get available template variables
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of template variable names
 */
router.get(
  '/variables',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.getTemplateVariables
);

/**
 * @swagger
 * /bulk-communications/templates:
 *   get:
 *     summary: Get bulk communication templates
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.getTemplates);

/**
 * @swagger
 * /bulk-communications/patients:
 *   get:
 *     summary: Get patients for bulk communication targeting
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: lastVisitBefore
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: diagnosisCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered patient list for targeting
 */
router.get(
  '/patients',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientsSchema),
  bulkCommController.getPatients
);

/**
 * @swagger
 * /bulk-communications/process:
 *   post:
 *     summary: Process pending bulk communication queue
 *     tags: [Bulk Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Queue processing results
 */
router.post('/process', requireRole(['ADMIN']), bulkCommController.processQueue);

export default router;
