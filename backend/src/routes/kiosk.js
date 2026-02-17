/**
 * Kiosk Routes
 * API endpoints for patient self-service kiosk:
 * check-in, intake forms, consent, and practitioner queue.
 */

import express from 'express';
import * as kioskController from '../controllers/kiosk.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  checkInSchema,
  getIntakeFormSchema,
  submitIntakeFormSchema,
  submitConsentSchema,
  getQueueSchema,
} from '../validators/kiosk.validators.js';

const router = express.Router();

/**
 * @swagger
 * /kiosk/health:
 *   get:
 *     summary: Kiosk module health check
 *     tags: [Kiosk]
 *     security: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'kiosk',
    timestamp: new Date().toISOString(),
  });
});

// All kiosk routes require authentication
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /kiosk/check-in:
 *   post:
 *     summary: Check in patient for appointment
 *     tags: [Kiosk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, appointmentId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               appointmentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Patient checked in
 *       404:
 *         description: Appointment not found
 */
router.post(
  '/check-in',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  validate(checkInSchema),
  kioskController.checkIn
);

/**
 * @swagger
 * /kiosk/intake/{patientId}:
 *   get:
 *     summary: Get intake form for a patient
 *     tags: [Kiosk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: encounterType
 *         schema:
 *           type: string
 *           enum: [INITIAL, FOLLOW_UP, REASSESSMENT, EMERGENCY]
 *     responses:
 *       200:
 *         description: Intake form fields
 */
router.get(
  '/intake/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  validate(getIntakeFormSchema),
  kioskController.getIntakeForm
);

/**
 * @swagger
 * /kiosk/intake/{patientId}:
 *   post:
 *     summary: Submit completed intake form
 *     tags: [Kiosk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Intake form submitted
 */
router.post(
  '/intake/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  validate(submitIntakeFormSchema),
  kioskController.submitIntakeForm
);

/**
 * @swagger
 * /kiosk/consent/{patientId}:
 *   post:
 *     summary: Submit signed consent form
 *     tags: [Kiosk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consentType, signature]
 *             properties:
 *               consentType:
 *                 type: string
 *               signature:
 *                 type: string
 *                 description: Base64-encoded signature image
 *     responses:
 *       200:
 *         description: Consent recorded
 */
router.post(
  '/consent/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  validate(submitConsentSchema),
  kioskController.submitConsent
);

/**
 * @swagger
 * /kiosk/queue:
 *   get:
 *     summary: Get practitioner's patient queue for today
 *     tags: [Kiosk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: practitionerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Defaults to authenticated user
 *     responses:
 *       200:
 *         description: Today's patient queue
 */
router.get(
  '/queue',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getQueueSchema),
  kioskController.getQueue
);

export default router;
