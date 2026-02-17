/**
 * Users Routes
 */

import express from 'express';
import * as userController from '../controllers/users.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  getUserSchema,
  listUsersSchema,
  updateCurrentUserSchema,
  createUserSchema,
  updateUserSchema,
  updateUserPreferencesSchema,
  userActionSchema,
  getUserStatsSchema,
} from '../validators/users.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get('/me', userController.getCurrentUser);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private (All authenticated users)
 */
router.patch('/me', validate(updateCurrentUserSchema), userController.updateCurrentUser);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users in organization
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(listUsersSchema),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/practitioners
 * @desc    Get all practitioners (for dropdowns)
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/practitioners',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  userController.getPractitioners
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getUserSchema),
  userController.getUser
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (ADMIN only)
 */
router.post('/', requireRole(['ADMIN']), validate(createUserSchema), userController.createUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  Private (ADMIN)
 */
router.patch('/:id', requireRole(['ADMIN']), validate(updateUserSchema), userController.updateUser);

/**
 * @route   PATCH /api/v1/users/:id/preferences
 * @desc    Update user preferences
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT - own preferences)
 */
router.patch(
  '/:id/preferences',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateUserPreferencesSchema),
  userController.updateUserPreferences
);

/**
 * @route   POST /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (ADMIN only)
 */
router.post(
  '/:id/deactivate',
  requireRole(['ADMIN']),
  validate(userActionSchema),
  userController.deactivateUser
);

/**
 * @route   POST /api/v1/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Private (ADMIN only)
 */
router.post(
  '/:id/reactivate',
  requireRole(['ADMIN']),
  validate(userActionSchema),
  userController.reactivateUser
);

/**
 * @route   GET /api/v1/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/:id/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getUserStatsSchema),
  userController.getUserStats
);

export default router;
