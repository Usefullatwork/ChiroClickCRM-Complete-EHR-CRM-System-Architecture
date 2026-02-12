/**
 * Automations Routes
 * API endpoints for workflow automations
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as automationsController from '../controllers/automations.js';
import validate from '../middleware/validation.js';
import {
  getWorkflowSchema,
  createWorkflowSchema,
  updateWorkflowSchema,
  deleteWorkflowSchema,
  toggleWorkflowSchema,
  workflowExecutionsSchema,
  allExecutionsSchema,
  testWorkflowSchema,
} from '../validators/automation.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'automations' });
});

// Workflow CRUD
router.get(
  '/workflows',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getWorkflows
);
router.get(
  '/workflows/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getWorkflowSchema),
  automationsController.getWorkflowById
);
router.post(
  '/workflows',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createWorkflowSchema),
  automationsController.createWorkflow
);
router.put(
  '/workflows/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateWorkflowSchema),
  automationsController.updateWorkflow
);
router.delete(
  '/workflows/:id',
  requireRole(['ADMIN']),
  validate(deleteWorkflowSchema),
  automationsController.deleteWorkflow
);
router.post(
  '/workflows/:id/toggle',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(toggleWorkflowSchema),
  automationsController.toggleWorkflow
);

// Execution history
router.get(
  '/workflows/:id/executions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(workflowExecutionsSchema),
  automationsController.getWorkflowExecutions
);
router.get(
  '/executions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getAllExecutions
);

// Testing
router.post(
  '/workflows/test',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(testWorkflowSchema),
  automationsController.testWorkflow
);

// Triggers & actions metadata
router.get(
  '/triggers',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getTriggerTypes
);
router.get(
  '/actions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getActionTypes
);

// Statistics
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), automationsController.getStats);

// Manual processing (admin only)
router.post('/process', requireRole(['ADMIN']), automationsController.processAutomations);
router.post(
  '/process-time-triggers',
  requireRole(['ADMIN']),
  automationsController.processTimeTriggers
);

export default router;
