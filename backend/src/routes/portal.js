/**
 * Portal Routes
 * Practitioner-facing API endpoints for patient portal data access.
 * These routes require standard auth and let staff view/manage portal data for patients.
 * Patient self-service routes are in patientPortal.js (/patient-portal/*).
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireModule } from '../middleware/featureGate.js';
import validate from '../middleware/validation.js';
import { handleBookingSchema } from '../validators/patientPortal.validators.js';
import * as portalController from '../controllers/portal.js';

const router = express.Router();

/**
 * @swagger
 * /portal/health:
 *   get:
 *     summary: Portal module health check
 *     tags: [Portal]
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'portal' });
});

// All routes below require practitioner/admin auth
router.use(requireAuth);
router.use(requireOrganization);
router.use(requireModule('patient_portal'));

/**
 * @swagger
 * /portal/patient/{patientId}:
 *   get:
 *     summary: Get patient portal dashboard data
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient portal dashboard data
 *       404:
 *         description: Patient not found
 */
router.get('/patient/:patientId', portalController.getPatientDashboard);

/**
 * @swagger
 * /portal/patient/{patientId}/appointments:
 *   get:
 *     summary: Get patient appointment history
 *     tags: [Portal]
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
 *         name: upcoming
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Patient appointments
 */
router.get('/patient/:patientId/appointments', portalController.getPatientAppointments);

/**
 * @swagger
 * /portal/patient/{patientId}/appointments:
 *   post:
 *     summary: Request an appointment on behalf of patient
 *     tags: [Portal]
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
 *             required: [appointment_date, appointment_time]
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date
 *               appointment_time:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 default: 30
 *               visit_type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment request created
 */
router.post('/patient/:patientId/appointments', portalController.createPatientAppointment);

/**
 * @swagger
 * /portal/patient/{patientId}/exercises:
 *   get:
 *     summary: Get patient's active exercise prescriptions
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active exercise prescriptions
 */
router.get('/patient/:patientId/exercises', portalController.getPatientExercises);

/**
 * @swagger
 * /portal/patient/{patientId}/outcomes:
 *   get:
 *     summary: Get patient outcome questionnaire results
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Outcome submissions
 */
router.get('/patient/:patientId/outcomes', portalController.getPatientOutcomes);

/**
 * @swagger
 * /portal/auth/magic-link:
 *   post:
 *     summary: Generate a magic link for patient portal access
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Magic link generated (returns token, not emailed in dev)
 */
router.post('/auth/magic-link', portalController.generateMagicLink);

/**
 * @swagger
 * /portal/patient/{patientId}/portal-access:
 *   post:
 *     summary: Enable or reset portal access for a patient (set PIN)
 *     tags: [Portal]
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
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       200:
 *         description: Portal access enabled
 */
router.post('/patient/:patientId/portal-access', portalController.setPortalAccess);

// =============================================================================
// BOOKING REQUESTS (staff-facing)
// =============================================================================

/**
 * GET /portal/booking-requests
 * List booking requests for the organization
 */
router.get('/booking-requests', portalController.listBookingRequests);

/**
 * PATCH /portal/booking-requests/:id
 * Approve or reject a booking request
 */
router.patch(
  '/booking-requests/:id',
  validate(handleBookingSchema),
  portalController.handleBookingRequest
);

/**
 * GET /portal/booking-requests/count
 * Get count of pending booking requests
 */
router.get('/booking-requests/count', portalController.getBookingRequestCount);

// =============================================================================
// MESSAGING (staff-facing)
// =============================================================================

/**
 * GET /portal/patient/:patientId/messages
 * Staff retrieves messages for a patient
 */
router.get('/patient/:patientId/messages', portalController.getPatientMessages);

/**
 * POST /portal/patient/:patientId/messages
 * Staff sends a message to a patient
 */
router.post('/patient/:patientId/messages', portalController.sendPatientMessage);

export default router;
