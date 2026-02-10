/**
 * Exercises Routes
 * API endpoints for exercise library, prescriptions, programs, and compliance
 */

import express from 'express';
import * as exerciseController from '../controllers/exercises.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'exercises' });
});

router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// EXERCISE LIBRARY
// ============================================================================

/**
 * @route   GET /api/v1/exercises
 * @desc    List exercises with filters (category, bodyRegion, difficulty, search)
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getExercises
);

/**
 * @route   GET /api/v1/exercises/categories
 * @desc    Get available exercise categories
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/categories',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getCategories
);

/**
 * @route   GET /api/v1/exercises/templates
 * @desc    Get exercise program templates
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getTemplates
);

/**
 * @route   POST /api/v1/exercises/templates
 * @desc    Create exercise program template
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.createTemplate
);

/**
 * @route   PATCH /api/v1/exercises/templates/:id
 * @desc    Update exercise program template
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch(
  '/templates/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.updateTemplate
);

/**
 * @route   DELETE /api/v1/exercises/templates/:id
 * @desc    Delete exercise program template
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete(
  '/templates/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.deleteTemplate
);

/**
 * @route   POST /api/v1/exercises/seed
 * @desc    Seed default exercises for organization
 * @access  Private (ADMIN)
 */
router.post('/seed', requireRole(['ADMIN']), exerciseController.seedDefaultExercises);

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

/**
 * @route   POST /api/v1/exercises/prescriptions
 * @desc    Create a new exercise prescription
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/prescriptions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.createPrescription
);

/**
 * @route   GET /api/v1/exercises/prescriptions/patient/:patientId
 * @desc    Get prescriptions for a patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/prescriptions/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getPatientPrescriptions
);

/**
 * @route   GET /api/v1/exercises/prescriptions/:id
 * @desc    Get prescription by ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/prescriptions/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getPrescriptionById
);

/**
 * @route   PATCH /api/v1/exercises/prescriptions/:id
 * @desc    Update an existing prescription
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch(
  '/prescriptions/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.updatePrescription
);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/duplicate
 * @desc    Duplicate a prescription
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/prescriptions/:id/duplicate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.duplicatePrescription
);

/**
 * @route   PATCH /api/v1/exercises/prescriptions/:id/status
 * @desc    Update prescription status
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch(
  '/prescriptions/:id/status',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.updatePrescriptionStatus
);

/**
 * @route   GET /api/v1/exercises/prescriptions/:id/progress
 * @desc    Get progress history for a prescription
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/prescriptions/:id/progress',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getProgressHistory
);

// ============================================================================
// DELIVERY
// ============================================================================

/**
 * @route   GET /api/v1/exercises/prescriptions/:id/pdf
 * @desc    Generate prescription PDF handout
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/prescriptions/:id/pdf',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.generatePDF
);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/send-email
 * @desc    Send prescription via email
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/prescriptions/:id/send-email',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.sendEmail
);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/send-reminder
 * @desc    Send exercise reminder
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/prescriptions/:id/send-reminder',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.sendReminder
);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/send-sms
 * @desc    Send portal link via SMS
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/prescriptions/:id/send-sms',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.sendSMS
);

// ============================================================================
// EXERCISE CRUD (Admin-only for create/update/delete)
// ============================================================================

/**
 * @route   POST /api/v1/exercises
 * @desc    Create a new exercise
 * @access  Private (ADMIN)
 */
router.post('/', requireRole(['ADMIN']), exerciseController.createExercise);

/**
 * @route   PATCH /api/v1/exercises/:id
 * @desc    Update an exercise
 * @access  Private (ADMIN)
 */
router.patch('/:id', requireRole(['ADMIN']), exerciseController.updateExercise);

/**
 * @route   DELETE /api/v1/exercises/:id
 * @desc    Delete an exercise (soft delete)
 * @access  Private (ADMIN)
 */
router.delete('/:id', requireRole(['ADMIN']), exerciseController.deleteExercise);

/**
 * @route   GET /api/v1/exercises/:id
 * @desc    Get exercise by ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getExerciseById
);

export default router;
