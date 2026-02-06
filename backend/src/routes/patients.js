/**
 * Patient Routes
 * API endpoints for patient management
 */

import express from 'express';
import * as patientController from '../controllers/patients.js';
import * as encounterController from '../controllers/encounters.js';
import * as exercisesController from '../controllers/exercises.js';
import * as pdfController from '../controllers/pdf.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientSchema,
  deletePatientSchema,
  searchPatientsSchema
} from '../validators/patient.validators.js';

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
 * @desc    Quick search patients by name, email, phone, or SolvIt ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/search', patientController.searchPatients);

/**
 * @route   GET /api/v1/patients/search/advanced
 * @desc    Advanced patient search with multiple filters
 *          Supports: name, phone, email, date of birth (exact/range),
 *          last visit date range, first visit date range, status, category,
 *          therapist, follow-up filters, sorting, and pagination
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/search/advanced', validate(searchPatientsSchema), patientController.advancedSearchPatients);

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
router.get('/:id', validate(getPatientSchema), patientController.getPatient);

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
  validate(deletePatientSchema),
  patientController.deletePatient
);

// ============================================================================
// SALT (Same As Last Time) ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/patients/:patientId/encounters/last-similar
 * @desc    Get last similar encounter for SALT functionality
 * @access  Private (ADMIN, PRACTITIONER)
 * @query   chiefComplaint - optional complaint to match against
 * @query   excludeId - encounter ID to exclude from results
 * @query   maxAgeDays - max age of encounters to consider (default 365)
 */
router.get(
  '/:patientId/encounters/last-similar',
  requireRole(['ADMIN', 'PRACTITIONER']),
  encounterController.getLastSimilarEncounter
);

// ============================================================================
// PATIENT EXERCISE ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/patients/:patientId/exercises
 * @desc    Get patient's exercise prescriptions
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 * @query   status, includeCompleted, page, limit
 */
router.get('/:patientId/exercises', exercisesController.getPatientPrescriptions);

/**
 * @route   POST /api/v1/patients/:patientId/exercises
 * @desc    Prescribe an exercise to a patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/:patientId/exercises',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exercisesController.createPrescription
);

/**
 * @route   POST /api/v1/patients/:patientId/programs
 * @desc    Assign an exercise program to a patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/:patientId/programs',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exercisesController.createPrescription
);

/**
 * @route   GET /api/v1/patients/:patientId/exercises/pdf
 * @desc    Generate PDF handout of patient's exercise program
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/:patientId/exercises/pdf',
  pdfController.generateExerciseHandout
);

export default router;
