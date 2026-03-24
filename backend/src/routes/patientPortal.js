/**
 * Patient Portal Routes
 * API endpoints for patient self-service portal
 * Uses PIN-based authentication (no main system auth required)
 */

import express from 'express';
import { query } from '../config/database.js';
import validate from '../middleware/validation.js';
import {
  pinAuthSchema,
  logComplianceSchema,
  bookingRequestSchema,
  rescheduleSchema,
  cancelAppointmentSchema,
  messageSchema,
} from '../validators/patientPortal.validators.js';
import logger from '../utils/logger.js';
import * as patientPortalController from '../controllers/patientPortal.js';

const router = express.Router();

/**
 * @swagger
 * /patient-portal/health:
 *   get:
 *     summary: Patient portal health check
 *     tags: [Portal]
 *     security: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'patient-portal' });
});

/**
 * Portal auth middleware
 * Validates portal session token from cookie or header
 */
const requirePortalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.portal_session || req.headers['x-portal-token'];

    if (!token) {
      return res.status(401).json({ error: 'Portal authentication required' });
    }

    const result = await query(
      `
      SELECT ps.*, p.id as patient_id, p.first_name, p.last_name,
             p.email, p.phone, p.date_of_birth, p.organization_id
      FROM portal_sessions ps
      JOIN patients p ON p.id = ps.patient_id
      WHERE ps.token = $1 AND ps.expires_at > NOW()
    `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Portal session expired or invalid' });
    }

    req.portalPatient = result.rows[0];
    req.organizationId = result.rows[0].organization_id;
    next();
  } catch (error) {
    // If portal_sessions table doesn't exist yet, return 503
    if (error.message?.includes('relation "portal_sessions" does not exist')) {
      return res.status(503).json({
        error: 'Portal not yet configured',
        message: 'Patient portal database tables need to be created first',
      });
    }
    logger.error('Portal auth error:', error);
    res.status(500).json({ error: 'Portal authentication failed' });
  }
};

/**
 * @swagger
 * /patient-portal/auth/pin:
 *   post:
 *     summary: Authenticate patient with PIN
 *     tags: [Portal]
 *     security: []
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
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Authentication successful, portal session token returned
 *       401:
 *         description: Invalid credentials
 *       503:
 *         description: Portal not yet configured
 */
router.post('/auth/pin', validate(pinAuthSchema), patientPortalController.authenticateWithPIN);

/**
 * @swagger
 * /patient-portal/profile:
 *   get:
 *     summary: Get patient's own profile
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile data
 *       401:
 *         description: Portal session expired
 */
router.get('/profile', requirePortalAuth, patientPortalController.getProfile);

/**
 * @swagger
 * /patient-portal/appointments:
 *   get:
 *     summary: Get patient's upcoming appointments
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming appointments
 *       401:
 *         description: Portal session expired
 */
router.get('/appointments', requirePortalAuth, patientPortalController.getAppointments);

/**
 * @swagger
 * /patient-portal/exercises:
 *   get:
 *     summary: Get patient's exercise programs
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active exercise prescriptions
 *       401:
 *         description: Portal session expired
 */
router.get('/exercises', requirePortalAuth, patientPortalController.getExercises);

/**
 * @swagger
 * /patient-portal/exercises/{id}/compliance:
 *   post:
 *     summary: Log exercise compliance
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *               pain_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               difficulty_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compliance logged
 *       401:
 *         description: Portal session expired
 */
router.post(
  '/exercises/:id/compliance',
  requirePortalAuth,
  validate(logComplianceSchema),
  patientPortalController.logExerciseCompliance
);

// =============================================================================
// BOOKING ENDPOINTS (patient-facing)
// =============================================================================

/**
 * GET /patient-portal/available-slots
 * Returns available 30-min slots for a given date
 */
router.get('/available-slots', requirePortalAuth, patientPortalController.getAvailableSlots);

/**
 * POST /patient-portal/appointments/request
 * Patient requests a new appointment
 */
router.post(
  '/appointments/request',
  requirePortalAuth,
  validate(bookingRequestSchema),
  patientPortalController.requestBooking
);

/**
 * PATCH /patient-portal/appointments/:id/reschedule
 * Patient requests to reschedule an existing appointment
 */
router.patch(
  '/appointments/:id/reschedule',
  requirePortalAuth,
  validate(rescheduleSchema),
  patientPortalController.rescheduleAppointment
);

/**
 * POST /patient-portal/appointments/:id/cancel
 * Patient cancels an appointment
 */
router.post(
  '/appointments/:id/cancel',
  requirePortalAuth,
  validate(cancelAppointmentSchema),
  patientPortalController.cancelAppointment
);

// =============================================================================
// MESSAGING ENDPOINTS (patient-facing)
// =============================================================================

/**
 * GET /patient-portal/messages
 * Patient retrieves their messages
 */
router.get('/messages', requirePortalAuth, patientPortalController.getMessages);

/**
 * POST /patient-portal/messages
 * Patient sends a new message
 */
router.post(
  '/messages',
  requirePortalAuth,
  validate(messageSchema),
  patientPortalController.sendMessage
);

/**
 * PATCH /patient-portal/messages/:id/read
 * Patient marks a message as read
 */
router.patch('/messages/:id/read', requirePortalAuth, patientPortalController.markMessageRead);

// =============================================================================
// DOCUMENTS
// =============================================================================

router.get('/documents', requirePortalAuth, patientPortalController.getDocuments);

router.get('/documents/:token/download', patientPortalController.downloadDocument);

// =============================================================================
// COMMUNICATION PREFERENCES
// =============================================================================

/**
 * GET /patient-portal/communication-preferences
 * Returns patient's communication preferences or defaults
 */
router.get(
  '/communication-preferences',
  requirePortalAuth,
  patientPortalController.getCommPreferences
);

/**
 * PUT /patient-portal/communication-preferences
 * Creates or updates patient's communication preferences
 */
router.put(
  '/communication-preferences',
  requirePortalAuth,
  patientPortalController.updateCommPreferences
);

/**
 * @swagger
 * /patient-portal/logout:
 *   post:
 *     summary: Invalidate portal session
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', requirePortalAuth, patientPortalController.logout);

export default router;
