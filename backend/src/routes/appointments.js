/**
 * Appointments Routes
 */

import express from 'express';
import * as appointmentController from '../controllers/appointments.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  listAppointmentsSchema,
  createAppointmentSchema,
  getAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
  cancelAppointmentSchema,
  confirmAppointmentSchema,
} from '../validators/appointment.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List all appointments with filters
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, checked_in, completed, cancelled, no_show]
 *       - in: query
 *         name: practitioner_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of appointments
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(listAppointmentsSchema),
  appointmentController.getAppointments
);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, start_time, end_time]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               practitioner_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               appointment_type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 *       400:
 *         description: Validation error or time conflict
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch(
  '/:id/status',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateStatusSchema),
  appointmentController.updateStatus
);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   post:
 *     summary: Cancel an appointment with reason
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled
 *       404:
 *         description: Appointment not found
 */
router.post(
  '/:id/cancel',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(cancelAppointmentSchema),
  appointmentController.cancelAppointment
);

/**
 * @route   GET /api/v1/appointments/stats
 * @desc    Get appointment statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), appointmentController.getStats);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getAppointmentSchema),
  appointmentController.getAppointmentById
);

/**
 * @route   PATCH /api/v1/appointments/:id
 * @desc    Update appointment
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);

/**
 * @route   POST /api/v1/appointments/:id/confirm
 * @desc    Confirm appointment
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/:id/confirm',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(confirmAppointmentSchema),
  appointmentController.confirmAppointment
);

/**
 * @swagger
 * /appointments/{id}/check-in:
 *   post:
 *     summary: Check in patient for appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient checked in
 *       404:
 *         description: Appointment not found
 */
router.post(
  '/:id/check-in',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getAppointmentSchema),
  appointmentController.checkInAppointment
);

export default router;
