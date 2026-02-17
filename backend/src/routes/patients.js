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
  listPatientsSchema,
  quickSearchPatientsSchema,
  getPatientStatisticsSchema,
  getLastSimilarEncounterSchema,
  getPatientExercisesSchema,
  patientIdParamSchema,
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
router.get('/', validate(listPatientsSchema), patientController.getPatients);

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
router.get('/search', validate(quickSearchPatientsSchema), patientController.searchPatients);

/**
 * @swagger
 * /patients/search/advanced:
 *   get:
 *     summary: Advanced patient search with multiple filters
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: date_of_birth
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Advanced search results
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search/advanced',
  validate(searchPatientsSchema),
  patientController.advancedSearchPatients
);

/**
 * @swagger
 * /patients/follow-up/needed:
 *   get:
 *     summary: Get patients needing follow-up
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: List of patients needing follow-up
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /patients/{id}/statistics:
 *   get:
 *     summary: Get patient statistics
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
 *         description: Patient statistics (visits, outcomes, compliance)
 *       404:
 *         description: Patient not found
 */
router.get(
  '/:id/statistics',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientStatisticsSchema),
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
 * @swagger
 * /patients/{patientId}/encounters/last-similar:
 *   get:
 *     summary: Get last similar encounter for SALT (Same As Last Time) functionality
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: chiefComplaint
 *         schema:
 *           type: string
 *         description: Complaint to match against
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Encounter ID to exclude
 *       - in: query
 *         name: maxAgeDays
 *         schema:
 *           type: integer
 *           default: 365
 *         description: Max age of encounters to consider
 *     responses:
 *       200:
 *         description: Last similar encounter
 *       404:
 *         description: No similar encounter found
 */
router.get(
  '/:patientId/encounters/last-similar',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getLastSimilarEncounterSchema),
  encounterController.getLastSimilarEncounter
);

// ============================================================================
// PATIENT EXERCISE ROUTES
// ============================================================================

/**
 * @swagger
 * /patients/{patientId}/exercises:
 *   get:
 *     summary: Get patient's exercise prescriptions
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient exercise prescriptions
 *       404:
 *         description: Patient not found
 */
router.get(
  '/:patientId/exercises',
  validate(getPatientExercisesSchema),
  exercisesController.getPatientPrescriptions
);

/**
 * @swagger
 * /patients/{patientId}/exercises:
 *   post:
 *     summary: Prescribe an exercise to a patient
 *     tags: [Patients]
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
 *             required: [exercise_id]
 *             properties:
 *               exercise_id:
 *                 type: string
 *                 format: uuid
 *               sets:
 *                 type: integer
 *               reps:
 *                 type: integer
 *               frequency:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exercise prescribed
 *       400:
 *         description: Validation error
 */
router.post(
  '/:patientId/exercises',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(patientIdParamSchema),
  exercisesController.createPrescription
);

/**
 * @swagger
 * /patients/{patientId}/programs:
 *   post:
 *     summary: Assign an exercise program to a patient
 *     tags: [Patients]
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
 *             required: [program_id]
 *             properties:
 *               program_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Program assigned
 *       400:
 *         description: Validation error
 */
router.post(
  '/:patientId/programs',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(patientIdParamSchema),
  exercisesController.createPrescription
);

/**
 * @swagger
 * /patients/{patientId}/exercises/pdf:
 *   get:
 *     summary: Generate PDF handout of patient's exercise program
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Patient or prescriptions not found
 */
router.get(
  '/:patientId/exercises/pdf',
  validate(patientIdParamSchema),
  pdfController.generateExerciseHandout
);

export default router;
