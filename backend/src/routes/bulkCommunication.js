/**
 * Bulk Communication Routes
 * API endpoints for mass SMS/email communications
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as bulkCommController from '../controllers/bulkCommunication.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'bulk-communication' });
});

// Send bulk communications
router.post('/send', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.queueBulkSend);

// Batch management
router.get('/batches', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.getBatches);
router.get(
  '/queue/status/:batchId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.getBatchStatus
);
router.post(
  '/queue/cancel/:batchId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.cancelBatch
);
router.get(
  '/queue/pending',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.getPendingQueue
);

// Preview & templates
router.post('/preview', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.previewMessage);
router.get(
  '/variables',
  requireRole(['ADMIN', 'PRACTITIONER']),
  bulkCommController.getTemplateVariables
);
router.get('/templates', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.getTemplates);

// Patient selection
router.get('/patients', requireRole(['ADMIN', 'PRACTITIONER']), bulkCommController.getPatients);

// Queue processing (admin/cron)
router.post('/process', requireRole(['ADMIN']), bulkCommController.processQueue);

export default router;
