/**
 * Exercises Routes
 * API endpoints for exercise library, prescriptions, programs, and compliance
 */

import express from 'express';
import * as exerciseController from '../controllers/exercises.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  listExercisesSchema,
  createExerciseSchema,
  updateExerciseSchema,
  getExerciseSchema,
  createPrescriptionSchema,
  getPatientPrescriptionsSchema,
  getPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  createTemplateSchema as createExerciseTemplateSchema,
  updateTemplateSchema as updateExerciseTemplateSchema,
  deleteTemplateSchema,
} from '../validators/exercise.validators.js';

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
 * @swagger
 * /exercises:
 *   get:
 *     summary: List exercises with filters
 *     tags: [Exercises]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (stretching, strengthening, mobility, etc.)
 *       - in: query
 *         name: bodyRegion
 *         schema:
 *           type: string
 *         description: Filter by body region (cervical, lumbar, shoulder, etc.)
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: search
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
 *         description: Paginated list of exercises
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(listExercisesSchema),
  exerciseController.getExercises
);

/**
 * @swagger
 * /exercises/categories:
 *   get:
 *     summary: Get available exercise categories
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: List of exercise categories
 */
router.get(
  '/categories',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getCategories
);

/**
 * @swagger
 * /exercises/templates:
 *   get:
 *     summary: Get exercise program templates
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: List of exercise program templates
 */
router.get(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.getTemplates
);

/**
 * @swagger
 * /exercises/templates:
 *   post:
 *     summary: Create exercise program template
 *     tags: [Exercises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, exercises]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: string
 *                       format: uuid
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Validation error
 */
router.post(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.createTemplate
);

/**
 * @swagger
 * /exercises/templates/{id}:
 *   patch:
 *     summary: Update exercise program template
 *     tags: [Exercises]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Template not found
 */
router.patch(
  '/templates/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.updateTemplate
);

/**
 * @swagger
 * /exercises/templates/{id}:
 *   delete:
 *     summary: Delete exercise program template
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         description: Template not found
 */
router.delete(
  '/templates/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.deleteTemplate
);

/**
 * @swagger
 * /exercises/seed:
 *   post:
 *     summary: Seed default exercises for organization
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Default exercises seeded
 *       403:
 *         description: Admin role required
 */
router.post('/seed', requireRole(['ADMIN']), exerciseController.seedDefaultExercises);

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

/**
 * @swagger
 * /exercises/prescriptions:
 *   post:
 *     summary: Create a new exercise prescription
 *     tags: [Exercises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, exercise_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               exercise_id:
 *                 type: string
 *                 format: uuid
 *               sets:
 *                 type: integer
 *               reps:
 *                 type: integer
 *               frequency:
 *                 type: string
 *               duration_weeks:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Prescription created
 *       400:
 *         description: Validation error
 */
router.post(
  '/prescriptions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createPrescriptionSchema),
  exerciseController.createPrescription
);

/**
 * @swagger
 * /exercises/prescriptions/patient/{patientId}:
 *   get:
 *     summary: Get prescriptions for a patient
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of patient prescriptions
 *       404:
 *         description: Patient not found
 */
router.get(
  '/prescriptions/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getPatientPrescriptionsSchema),
  exerciseController.getPatientPrescriptions
);

/**
 * @swagger
 * /exercises/prescriptions/{id}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Prescription details
 *       404:
 *         description: Prescription not found
 */
router.get(
  '/prescriptions/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getPrescriptionSchema),
  exerciseController.getPrescriptionById
);

/**
 * @swagger
 * /exercises/prescriptions/{id}:
 *   patch:
 *     summary: Update an existing prescription
 *     tags: [Exercises]
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
 *               sets:
 *                 type: integer
 *               reps:
 *                 type: integer
 *               frequency:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated
 *       404:
 *         description: Prescription not found
 */
router.patch(
  '/prescriptions/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updatePrescriptionSchema),
  exerciseController.updatePrescription
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/duplicate:
 *   post:
 *     summary: Duplicate a prescription
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Prescription duplicated
 *       404:
 *         description: Prescription not found
 */
router.post(
  '/prescriptions/:id/duplicate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.duplicatePrescription
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/status:
 *   patch:
 *     summary: Update prescription status
 *     tags: [Exercises]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Prescription not found
 */
router.patch(
  '/prescriptions/:id/status',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updatePrescriptionStatusSchema),
  exerciseController.updatePrescriptionStatus
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/progress:
 *   get:
 *     summary: Get progress history for a prescription
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress history with compliance data
 *       404:
 *         description: Prescription not found
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
 * @swagger
 * /exercises/prescriptions/{id}/pdf:
 *   get:
 *     summary: Generate prescription PDF handout
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Prescription not found
 */
router.get(
  '/prescriptions/:id/pdf',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.generatePDF
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/send-email:
 *   post:
 *     summary: Send prescription via email to patient
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Email sent
 *       404:
 *         description: Prescription not found
 */
router.post(
  '/prescriptions/:id/send-email',
  requireRole(['ADMIN', 'PRACTITIONER']),
  exerciseController.sendEmail
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/send-reminder:
 *   post:
 *     summary: Send exercise reminder to patient
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder sent
 *       404:
 *         description: Prescription not found
 */
router.post(
  '/prescriptions/:id/send-reminder',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  exerciseController.sendReminder
);

/**
 * @swagger
 * /exercises/prescriptions/{id}/send-sms:
 *   post:
 *     summary: Send portal link via SMS to patient
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SMS sent
 *       404:
 *         description: Prescription not found
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
 * @swagger
 * /exercises:
 *   post:
 *     summary: Create a new exercise in the library
 *     tags: [Exercises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, body_region]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               body_region:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               instructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exercise created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin role required
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(createExerciseSchema),
  exerciseController.createExercise
);

/**
 * @swagger
 * /exercises/{id}:
 *   patch:
 *     summary: Update an exercise in the library
 *     tags: [Exercises]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               body_region:
 *                 type: string
 *               difficulty:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exercise updated
 *       404:
 *         description: Exercise not found
 */
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validate(updateExerciseSchema),
  exerciseController.updateExercise
);

/**
 * @swagger
 * /exercises/{id}:
 *   delete:
 *     summary: Delete an exercise (soft delete)
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Exercise deleted
 *       404:
 *         description: Exercise not found
 */
router.delete('/:id', requireRole(['ADMIN']), exerciseController.deleteExercise);

/**
 * @swagger
 * /exercises/{id}:
 *   get:
 *     summary: Get exercise by ID
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Exercise details
 *       404:
 *         description: Exercise not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getExerciseSchema),
  exerciseController.getExerciseById
);

export default router;
