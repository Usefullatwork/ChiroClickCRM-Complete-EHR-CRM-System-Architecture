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
  searchPatientsSchema,
} from '../validators/patient.validators.js';

const router = express.Router();

// Apply authentication and organization middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: List all patients with pagination and filters
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of patients
 *       401:
 *         description: Unauthorized
 */
router.get('/', patientController.getPatients);

/**
 * @swagger
 * /patients/search:
 *   get:
 *     summary: Quick search patients by name, email, phone, or SolvIt ID
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Matching patients
 *       401:
 *         description: Unauthorized
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
router.get(
  '/search/advanced',
  validate(searchPatientsSchema),
  patientController.advancedSearchPatients
);

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
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient details
 *       404:
 *         description: Patient not found
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
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, date_of_birth]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient created
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createPatientSchema), patientController.createPatient);

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Update patient details
 *     tags: [Patients]
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
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated
 *       404:
 *         description: Patient not found
 */
router.patch('/:id', validate(updatePatientSchema), patientController.updatePatient);

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete patient (soft delete)
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient deleted
 *       404:
 *         description: Patient not found
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
router.get('/:patientId/exercises/pdf', pdfController.generateExerciseHandout);

export default router;
