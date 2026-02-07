/**
 * Kiosk Routes
 * API endpoints for patient self-service kiosk:
 * check-in, intake forms, consent, and practitioner queue.
 */

import express from 'express';
import * as kioskController from '../controllers/kiosk.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/kiosk/health - Kiosk health check
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
 * @route   POST /api/v1/kiosk/check-in
 * @desc    Check in patient for appointment
 * @access  Private (ADMIN, PRACTITIONER, RECEPTIONIST)
 * @body    { patientId, appointmentId }
 */
router.post(
  '/check-in',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  kioskController.checkIn
);

/**
 * @route   GET /api/v1/kiosk/intake/:patientId
 * @desc    Get intake form for a patient
 * @access  Private (ADMIN, PRACTITIONER, RECEPTIONIST)
 * @query   encounterType - optional encounter type to customize form
 */
router.get(
  '/intake/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  kioskController.getIntakeForm
);

/**
 * @route   POST /api/v1/kiosk/intake/:patientId
 * @desc    Submit completed intake form
 * @access  Private (ADMIN, PRACTITIONER, RECEPTIONIST)
 * @body    Form data fields
 */
router.post(
  '/intake/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  kioskController.submitIntakeForm
);

/**
 * @route   POST /api/v1/kiosk/consent/:patientId
 * @desc    Submit signed consent form
 * @access  Private (ADMIN, PRACTITIONER, RECEPTIONIST)
 * @body    { consentType, signature }
 */
router.post(
  '/consent/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'RECEPTIONIST']),
  kioskController.submitConsent
);

/**
 * @route   GET /api/v1/kiosk/queue
 * @desc    Get practitioner's patient queue for today
 * @access  Private (ADMIN, PRACTITIONER)
 * @query   practitionerId - optional, defaults to authenticated user
 */
router.get('/queue', requireRole(['ADMIN', 'PRACTITIONER']), kioskController.getQueue);

export default router;
