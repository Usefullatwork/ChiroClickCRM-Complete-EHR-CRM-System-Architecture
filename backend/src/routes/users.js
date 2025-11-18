/**
 * Users Routes
 */

import express from 'express';
import * as userController from '../controllers/users.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users in organization
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/practitioners
 * @desc    Get all practitioners (for dropdowns)
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/practitioners',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  userController.getPractitioners
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  userController.getUser
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (ADMIN only)
 */
router.post('/',
  requireRole(['ADMIN']),
  userController.createUser
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  Private (ADMIN)
 */
router.patch('/:id',
  requireRole(['ADMIN']),
  userController.updateUser
);

/**
 * @route   PATCH /api/v1/users/:id/preferences
 * @desc    Update user preferences
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT - own preferences)
 */
router.patch('/:id/preferences',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  userController.updateUserPreferences
);

/**
 * @route   POST /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (ADMIN only)
 */
router.post('/:id/deactivate',
  requireRole(['ADMIN']),
  userController.deactivateUser
);

/**
 * @route   POST /api/v1/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Private (ADMIN only)
 */
router.post('/:id/reactivate',
  requireRole(['ADMIN']),
  userController.reactivateUser
);

/**
 * @route   GET /api/v1/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  userController.getUserStats
);

export default router;
