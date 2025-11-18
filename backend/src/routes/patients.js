/**
 * Patient Routes
 * API endpoints for patient management
 */

import express from 'express';
import * as patientController from '../controllers/patients.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate, createPatientSchema, updatePatientSchema } from '../middleware/validator.js';

const router = express.Router();

// Apply authentication and organization middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients with pagination and filters
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/', patientController.getPatients);

/**
 * @route   GET /api/v1/patients/search
 * @desc    Search patients by name, email, phone, or SolvIt ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/search', patientController.searchPatients);

/**
 * @route   GET /api/v1/patients/follow-up/needed
 * @desc    Get patients needing follow-up
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/follow-up/needed',
  requireRole(['ADMIN', 'PRACTITIONER']),
  patientController.getPatientsNeedingFollowUp
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/:id', patientController.getPatient);

/**
 * @route   GET /api/v1/patients/:id/statistics
 * @desc    Get patient statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/:id/statistics',
  requireRole(['ADMIN', 'PRACTITIONER']),
  patientController.getPatientStatistics
);

/**
 * @route   POST /api/v1/patients
 * @desc    Create new patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/',
  validate(createPatientSchema),
  patientController.createPatient
);

/**
 * @route   PATCH /api/v1/patients/:id
 * @desc    Update patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch(
  '/:id',
  validate(updatePatientSchema),
  patientController.updatePatient
);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Delete patient (soft delete)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  patientController.deletePatient
);

export default router;
