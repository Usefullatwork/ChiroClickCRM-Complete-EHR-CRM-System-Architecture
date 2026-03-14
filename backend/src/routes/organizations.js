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
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * /organizations/current:
 *   get:
 *     summary: Get current user's organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current organization details
 *       401:
 *         description: Unauthorized
 */
router.get('/current', organizationController.getCurrentOrganization);

/**
 * @swagger
 * /organizations/current:
 *   patch:
 *     summary: Update current organization
 *     tags: [Organizations]
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Organization updated
 *       403:
 *         description: Admin access required
 */
router.patch(
  '/current',
  requireRole(['ADMIN']),
  validate(updateCurrentOrganizationSchema),
  organizationController.updateCurrentOrganization
);

/**
 * @swagger
 * /organizations/current/users:
 *   get:
 *     summary: Get users in current organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users in the organization
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/current/users',
  requireRole(['ADMIN', 'PRACTITIONER']),
  organizationController.getCurrentOrganizationUsers
);

/**
 * @swagger
 * /organizations/current/invite:
 *   post:
 *     summary: Invite a user to the current organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PRACTITIONER, ASSISTANT]
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation sent
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post(
  '/current/invite',
  requireRole(['ADMIN']),
  validate(inviteUserSchema),
  organizationController.inviteUser
);

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations (super admin)
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all organizations
 *       403:
 *         description: Admin access required
 */
router.get('/', requireRole(['ADMIN']), organizationController.getOrganizations);

/**
 * @swagger
 * /organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
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
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganization
);

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization (super admin)
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               plan:
 *                 type: string
 *                 enum: [free, basic, pro, enterprise]
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * @swagger
 * /organizations/{id}:
 *   patch:
 *     summary: Update an organization
 *     tags: [Organizations]
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated
 *       404:
 *         description: Organization not found
 */
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * @swagger
 * /organizations/{id}/settings:
 *   get:
 *     summary: Get organization settings
 *     tags: [Organizations]
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
 *         description: Organization settings
 *       404:
 *         description: Organization not found
 */
router.get(
  '/:id/settings',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganizationSettings
);

/**
 * @swagger
 * /organizations/{id}/settings:
 *   patch:
 *     summary: Update organization settings
 *     tags: [Organizations]
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
 *               timezone:
 *                 type: string
 *               locale:
 *                 type: string
 *               business_hours:
 *                 type: object
 *               features:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated
 *       404:
 *         description: Organization not found
 */
router.patch(
  '/:id/settings',
  requireRole(['ADMIN']),
  validate(updateOrganizationSettingsSchema),
  organizationController.updateOrganizationSettings
);

/**
 * @swagger
 * /organizations/{id}/stats:
 *   get:
 *     summary: Get organization statistics
 *     tags: [Organizations]
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
 *         description: Organization statistics (users, patients, encounters)
 *       404:
 *         description: Organization not found
 */
router.get(
  '/:id/stats',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.getOrganizationStats
);

/**
 * @swagger
 * /organizations/{id}/limits:
 *   get:
 *     summary: Check organization plan limits
 *     tags: [Organizations]
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
 *         description: Organization limits and current usage
 *       404:
 *         description: Organization not found
 */
router.get(
  '/:id/limits',
  requireRole(['ADMIN']),
  validate(getOrganizationSchema),
  organizationController.checkOrganizationLimits
);

/**
 * @swagger
 * /organizations/{id}/modules:
 *   patch:
 *     summary: Update enabled modules for organization
 *     tags: [Organizations]
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
 *               modules:
 *                 type: object
 *     responses:
 *       200:
 *         description: Modules updated
 *       403:
 *         description: Admin access required
 */
router.patch('/:id/modules', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { modules } = req.body;

    const VALID_MODULES = [
      'core_ehr',
      'clinical_ai',
      'exercise_rx',
      'patient_portal',
      'crm_marketing',
      'advanced_clinical',
      'analytics_reporting',
      'multi_location',
    ];

    const invalidModules = Object.keys(modules || {}).filter((m) => !VALID_MODULES.includes(m));
    if (invalidModules.length > 0) {
      return res.status(400).json({ error: 'INVALID_MODULES', invalid: invalidModules });
    }

    if (modules && modules.core_ehr === false) {
      return res.status(400).json({ error: 'CANNOT_DISABLE_CORE' });
    }

    const result = await query(
      `UPDATE organizations
       SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{enabled_modules}', $1::jsonb),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, settings`,
      [JSON.stringify(modules), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { clearModuleCache } = await import('../middleware/featureGate.js');
    clearModuleCache(id);

    res.json({ success: true, modules: result.rows[0].settings?.enabled_modules });
  } catch (err) {
    logger.error('Failed to update modules:', { error: err.message });
    res.status(500).json({ error: 'Failed to update modules' });
  }
});

export default router;
