/**
 * Organizations Routes
 */

import express from 'express';
import * as organizationController from '../controllers/organizations.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  getOrganizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  updateCurrentOrganizationSchema,
  inviteUserSchema,
  updateOrganizationSettingsSchema,
} from '../validators/organization.validators.js';

const router = express.Router();

router.use(requireAuth);

/**
 * @route   GET /api/v1/organizations/current
 * @desc    Get current user's organization
 * @access  Private (All authenticated users)
 */
router.get('/current', organizationController.getCurrentOrganization);

/**
 * @route   PATCH /api/v1/organizations/current
 * @desc    Update current organization
 * @access  Private (ADMIN)
 */
router.patch(
  '/current',
  requireRole(['ADMIN']),
  validate(updateCurrentOrganizationSchema),
  organizationController.updateCurrentOrganization
);

/**
 * @route   GET /api/v1/organizations/current/users
 * @desc    Get users in current organization
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/current/users',
  requireRole(['ADMIN', 'PRACTITIONER']),
  organizationController.getCurrentOrganizationUsers
);

/**
 * @route   POST /api/v1/organizations/current/invite
 * @desc    Invite user to current organization
 * @access  Private (ADMIN)
 */
router.post(
  '/current/invite',
  requireRole(['ADMIN']),
  validate(inviteUserSchema),
  organizationController.inviteUser
);

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations
 * @access  Private (ADMIN only - super admin)
 */
router.get('/', requireRole(['ADMIN']), organizationController.getOrganizations);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (ADMIN)
 */
router.get(
  '/:id',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganization
);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create new organization
 * @access  Private (ADMIN only - super admin)
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * @route   PATCH /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (ADMIN)
 */
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * @route   GET /api/v1/organizations/:id/settings
 * @desc    Get organization settings
 * @access  Private (ADMIN)
 */
router.get(
  '/:id/settings',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganizationSettings
);

/**
 * @route   PATCH /api/v1/organizations/:id/settings
 * @desc    Update organization settings
 * @access  Private (ADMIN)
 */
router.patch(
  '/:id/settings',
  requireRole(['ADMIN']),
  validate(updateOrganizationSettingsSchema),
  organizationController.updateOrganizationSettings
);

/**
 * @route   GET /api/v1/organizations/:id/stats
 * @desc    Get organization statistics
 * @access  Private (ADMIN)
 */
router.get(
  '/:id/stats',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganizationStats
);

/**
 * @route   GET /api/v1/organizations/:id/limits
 * @desc    Check organization limits
 * @access  Private (ADMIN)
 */
router.get(
  '/:id/limits',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.checkOrganizationLimits
);

export default router;
