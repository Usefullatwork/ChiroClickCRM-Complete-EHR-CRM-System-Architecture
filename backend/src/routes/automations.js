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
  testWorkflowSchema,
} from '../validators/automation.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /automations/health:
 *   get:
 *     summary: Automations module health check
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'automations' });
});

/**
 * @swagger
 * /automations/workflows:
 *   get:
 *     summary: List all automation workflows
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of workflows
 */
router.get(
  '/workflows',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getWorkflows
);
/**
 * @swagger
 * /automations/workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow details
 *       404:
 *         description: Workflow not found
 */
router.get(
  '/workflows/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getWorkflowSchema),
  automationsController.getWorkflowById
);

/**
 * @swagger
 * /automations/workflows:
 *   post:
 *     summary: Create a new workflow
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Automation'
 *     responses:
 *       201:
 *         description: Workflow created
 *       400:
 *         description: Validation error
 */
router.post(
  '/workflows',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createWorkflowSchema),
  automationsController.createWorkflow
);
/**
 * @swagger
 * /automations/workflows/{id}:
 *   put:
 *     summary: Update an existing workflow
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Automation'
 *     responses:
 *       200:
 *         description: Workflow updated
 *       404:
 *         description: Workflow not found
 */
router.put(
  '/workflows/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateWorkflowSchema),
  automationsController.updateWorkflow
);

/**
 * @swagger
 * /automations/workflows/{id}:
 *   delete:
 *     summary: Delete a workflow
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow deleted
 *       404:
 *         description: Workflow not found
 */
router.delete(
  '/workflows/:id',
  requireRole(['ADMIN']),
  validate(deleteWorkflowSchema),
  automationsController.deleteWorkflow
);
/**
 * @swagger
 * /automations/workflows/{id}/toggle:
 *   post:
 *     summary: Toggle workflow active/inactive status
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow toggled
 */
router.post(
  '/workflows/:id/toggle',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(toggleWorkflowSchema),
  automationsController.toggleWorkflow
);

/**
 * @swagger
 * /automations/workflows/{id}/executions:
 *   get:
 *     summary: Get execution history for a workflow
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Execution history
 */
router.get(
  '/workflows/:id/executions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(workflowExecutionsSchema),
  automationsController.getWorkflowExecutions
);
/**
 * @swagger
 * /automations/executions:
 *   get:
 *     summary: Get all workflow executions
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All execution records
 */
router.get(
  '/executions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getAllExecutions
);

/**
 * @swagger
 * /automations/workflows/test:
 *   post:
 *     summary: Test a workflow without executing actions
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trigger_type:
 *                 type: string
 *               conditions:
 *                 type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Test results
 */
router.post(
  '/workflows/test',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(testWorkflowSchema),
  automationsController.testWorkflow
);

/**
 * @swagger
 * /automations/triggers:
 *   get:
 *     summary: Get available trigger types
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of trigger types
 */
router.get(
  '/triggers',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getTriggerTypes
);

/**
 * @swagger
 * /automations/actions:
 *   get:
 *     summary: Get available action types
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of action types
 */
router.get(
  '/actions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  automationsController.getActionTypes
);

/**
 * @swagger
 * /automations/stats:
 *   get:
 *     summary: Get automation statistics
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Automation usage statistics
 */
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), automationsController.getStats);

/**
 * @swagger
 * /automations/process:
 *   post:
 *     summary: Manually process pending automations
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Processing results
 */
router.post('/process', requireRole(['ADMIN']), automationsController.processAutomations);

/**
 * @swagger
 * /automations/process-time-triggers:
 *   post:
 *     summary: Process time-based automation triggers
 *     tags: [Automations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Time trigger processing results
 */
router.post(
  '/process-time-triggers',
  requireRole(['ADMIN']),
  automationsController.processTimeTriggers
);

export default router;
