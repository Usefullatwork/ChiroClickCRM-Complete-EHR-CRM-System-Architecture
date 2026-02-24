/**
 * Auto Accept Routes
 * API endpoints for auto-accept settings, rules, and processing
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as autoAcceptController from '../controllers/autoAccept.js';

const router = express.Router();

/**
 * @swagger
 * /auto-accept/health:
 *   get:
 *     summary: Auto-accept module health check
 *     tags: [Auto Accept]
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'auto-accept' });
});

// All routes below require authentication
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /auto-accept/settings:
 *   get:
 *     summary: Get auto-accept settings for organization
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-accept settings
 */
router.get('/settings', autoAcceptController.getSettings);

/**
 * @swagger
 * /auto-accept/settings:
 *   put:
 *     summary: Create or update auto-accept settings
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoAcceptAppointments:
 *                 type: boolean
 *               appointmentAcceptDelayMinutes:
 *                 type: integer
 *               appointmentTypesIncluded:
 *                 type: array
 *                 items:
 *                   type: string
 *               appointmentTypesExcluded:
 *                 type: array
 *                 items:
 *                   type: string
 *               appointmentMaxDailyLimit:
 *                 type: integer
 *               appointmentBusinessHoursOnly:
 *                 type: boolean
 *               autoAcceptReferrals:
 *                 type: boolean
 *               referralAcceptDelayMinutes:
 *                 type: integer
 *               notifyOnAutoAccept:
 *                 type: boolean
 *               notificationEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated settings
 */
router.put(
  '/settings',
  requireRole(['ADMIN', 'PRACTITIONER']),
  autoAcceptController.upsertSettings
);

/**
 * @swagger
 * /auto-accept/log:
 *   get:
 *     summary: Get auto-accept processing log
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [appointment, referral]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [accepted, rejected]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Auto-accept log entries
 */
router.get('/log', autoAcceptController.getLog);

/**
 * @swagger
 * /auto-accept/evaluate:
 *   post:
 *     summary: Evaluate a pending appointment against auto-accept rules
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentId]
 *             properties:
 *               appointmentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Evaluation result
 */
router.post(
  '/evaluate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  autoAcceptController.evaluateAppointment
);

/**
 * @swagger
 * /auto-accept/toggle/appointments:
 *   post:
 *     summary: Toggle auto-accept for appointments on/off
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: New toggle state
 */
router.post(
  '/toggle/appointments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  autoAcceptController.toggleAppointments
);

/**
 * @swagger
 * /auto-accept/toggle/referrals:
 *   post:
 *     summary: Toggle auto-accept for referrals on/off
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: New toggle state
 */
router.post(
  '/toggle/referrals',
  requireRole(['ADMIN', 'PRACTITIONER']),
  autoAcceptController.toggleReferrals
);

/**
 * @swagger
 * /auto-accept/process:
 *   post:
 *     summary: Manually trigger processing of pending appointments and referrals
 *     tags: [Auto Accept]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Processing complete
 */
router.post('/process', requireRole(['ADMIN']), autoAcceptController.processPending);

export default router;
