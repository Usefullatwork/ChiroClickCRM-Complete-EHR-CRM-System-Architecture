/**
 * Appointments Routes
 */

import express from 'express';
import * as appointmentController from '../controllers/appointments.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/appointments
 * @desc    Get all appointments with filters
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  appointmentController.getAppointments
);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create new appointment
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  appointmentController.createAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch('/:id/status',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  appointmentController.updateStatus
);

/**
 * @route   POST /api/v1/appointments/:id/cancel
 * @desc    Cancel appointment with reason
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/:id/cancel',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  appointmentController.cancelAppointment
);

/**
 * @route   GET /api/v1/appointments/stats
 * @desc    Get appointment statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  appointmentController.getStats
);

export default router;
