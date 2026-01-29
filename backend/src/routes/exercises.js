/**
 * Exercise Routes
 * API endpoints for exercise library, prescriptions, and programs
 */

import { Router } from 'express';
import * as exercisesController from '../controllers/exercises.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication and organization middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// EXERCISE LIBRARY ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/exercises/categories
 * @desc    Get available exercise categories
 * @access  Private
 */
router.get('/categories', exercisesController.getCategories);

/**
 * @route   GET /api/v1/exercises/body-regions
 * @desc    Get available body regions
 * @access  Private
 */
router.get('/body-regions', exercisesController.getBodyRegions);

/**
 * @route   GET /api/v1/exercises/favorites
 * @desc    Get user's favorite exercises
 * @access  Private
 */
router.get('/favorites', exercisesController.getFavorites);

/**
 * @route   GET /api/v1/exercises/recent
 * @desc    Get recently used exercises
 * @access  Private
 */
router.get('/recent', exercisesController.getRecentlyUsed);

/**
 * @route   GET /api/v1/exercises/stats
 * @desc    Get exercise statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.getStats);

/**
 * @route   GET /api/v1/exercises/top-prescribed
 * @desc    Get top prescribed exercises
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/top-prescribed', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.getTopPrescribed);

/**
 * @route   GET /api/v1/exercises/compliance
 * @desc    Get compliance statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/compliance', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.getComplianceStats);

// ============================================================================
// EXERCISE PROGRAM ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/exercises/programs
 * @desc    Get all exercise programs
 * @access  Private
 */
router.get('/programs', exercisesController.getPrograms);

/**
 * @route   POST /api/v1/exercises/programs
 * @desc    Create a new exercise program
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/programs', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.createProgram);

/**
 * @route   GET /api/v1/exercises/programs/:id
 * @desc    Get exercise program by ID
 * @access  Private
 */
router.get('/programs/:id', exercisesController.getProgram);

/**
 * @route   PATCH /api/v1/exercises/programs/:id
 * @desc    Update an exercise program
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/programs/:id', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.updateProgram);

/**
 * @route   DELETE /api/v1/exercises/programs/:id
 * @desc    Delete an exercise program
 * @access  Private (ADMIN)
 */
router.delete('/programs/:id', requireRole(['ADMIN']), exercisesController.deleteProgram);

// ============================================================================
// PRESCRIPTION ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/exercises/prescriptions/:id
 * @desc    Get prescription by ID
 * @access  Private
 */
router.get('/prescriptions/:id', exercisesController.getPrescription);

/**
 * @route   PATCH /api/v1/exercises/prescriptions/:id
 * @desc    Update a prescription
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/prescriptions/:id', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.updatePrescription);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/compliance
 * @desc    Log compliance for a prescription
 * @access  Private (patient can log their own compliance)
 */
router.post('/prescriptions/:id/compliance', exercisesController.logCompliance);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/discontinue
 * @desc    Discontinue a prescription
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/prescriptions/:id/discontinue', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.discontinue);

/**
 * @route   POST /api/v1/exercises/prescriptions/:id/complete
 * @desc    Mark prescription as completed
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/prescriptions/:id/complete', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.complete);

// ============================================================================
// MAIN EXERCISE LIBRARY CRUD
// ============================================================================

/**
 * @route   GET /api/v1/exercises
 * @desc    Get all exercises with filtering and pagination
 * @access  Private
 * @query   page, limit, category, bodyRegion, difficulty, search, tags, includeGlobal, activeOnly
 */
router.get('/', exercisesController.getAll);

/**
 * @route   POST /api/v1/exercises
 * @desc    Create a new exercise
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.create);

/**
 * @route   GET /api/v1/exercises/:id
 * @desc    Get exercise by ID
 * @access  Private
 */
router.get('/:id', exercisesController.getById);

/**
 * @route   PATCH /api/v1/exercises/:id
 * @desc    Update an exercise
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/:id', requireRole(['ADMIN', 'PRACTITIONER']), exercisesController.update);

/**
 * @route   DELETE /api/v1/exercises/:id
 * @desc    Delete an exercise (soft delete)
 * @access  Private (ADMIN)
 */
router.delete('/:id', requireRole(['ADMIN']), exercisesController.deleteExercise);

export default router;
