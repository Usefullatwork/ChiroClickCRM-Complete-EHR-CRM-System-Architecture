/**
 * Batch Routes
 * Claude Batch API job management endpoints.
 */

import { Router } from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as batchController from '../controllers/batch.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.createBatch
);
router.get(
  '/',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.listBatches
);
router.get(
  '/:batchId',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.getBatchStatus
);
router.get(
  '/:batchId/results',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.getBatchResults
);
router.post(
  '/:batchId/cancel',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.cancelBatch
);
router.post(
  '/score-training',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  batchController.scoreTrainingData
);

export default router;
