/**
 * Organizations Routes
 */

import express from 'express';
import * as organizationController from '../controllers/organizations.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations
 * @access  Private (ADMIN only - super admin)
 */
router.get('/',
  requireRole(['ADMIN']),
  organizationController.getOrganizations
);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (ADMIN)
 */
router.get('/:id',
  requireRole(['ADMIN']),
  organizationController.getOrganization
);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create new organization
 * @access  Private (ADMIN only - super admin)
 */
router.post('/',
  requireRole(['ADMIN']),
  organizationController.createOrganization
);

/**
 * @route   PATCH /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (ADMIN)
 */
router.patch('/:id',
  requireRole(['ADMIN']),
  organizationController.updateOrganization
);

/**
 * @route   GET /api/v1/organizations/:id/settings
 * @desc    Get organization settings
 * @access  Private (ADMIN)
 */
router.get('/:id/settings',
  requireRole(['ADMIN']),
  organizationController.getOrganizationSettings
);

/**
 * @route   PATCH /api/v1/organizations/:id/settings
 * @desc    Update organization settings
 * @access  Private (ADMIN)
 */
router.patch('/:id/settings',
  requireRole(['ADMIN']),
  organizationController.updateOrganizationSettings
);

/**
 * @route   GET /api/v1/organizations/:id/stats
 * @desc    Get organization statistics
 * @access  Private (ADMIN)
 */
router.get('/:id/stats',
  requireRole(['ADMIN']),
  organizationController.getOrganizationStats
);

/**
 * @route   GET /api/v1/organizations/:id/limits
 * @desc    Check organization limits
 * @access  Private (ADMIN)
 */
router.get('/:id/limits',
  requireRole(['ADMIN']),
  organizationController.checkOrganizationLimits
);

export default router;
