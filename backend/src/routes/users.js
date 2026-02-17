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
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', userController.getCurrentUser);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 */
router.patch('/me', validate(updateCurrentUserSchema), userController.updateCurrentUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users in organization
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, PRACTITIONER, ASSISTANT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
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
 *         description: Paginated list of users
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(listUsersSchema),
  userController.getUsers
);

/**
 * @swagger
 * /users/practitioners:
 *   get:
 *     summary: Get all practitioners (for dropdowns)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of practitioners
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/practitioners',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  userController.getPractitioners
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getUserSchema),
  userController.getUser
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, role, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PRACTITIONER, ASSISTANT]
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post('/', requireRole(['ADMIN']), validate(createUserSchema), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch('/:id', requireRole(['ADMIN']), validate(updateUserSchema), userController.updateUser);

/**
 * @swagger
 * /users/{id}/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               language:
 *                 type: string
 *                 enum: [nb, en]
 *               notifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/preferences',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateUserPreferencesSchema),
  userController.updateUserPreferences
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   post:
 *     summary: Deactivate a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/deactivate',
  requireRole(['ADMIN']),
  validate(userActionSchema),
  userController.deactivateUser
);

/**
 * @swagger
 * /users/{id}/reactivate:
 *   post:
 *     summary: Reactivate a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User reactivated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/reactivate',
  requireRole(['ADMIN']),
  validate(userActionSchema),
  userController.reactivateUser
);

/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User statistics (appointments, encounters, patients)
 *       404:
 *         description: User not found
 */
router.get(
  '/:id/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getUserStatsSchema),
  userController.getUserStats
);

export default router;
