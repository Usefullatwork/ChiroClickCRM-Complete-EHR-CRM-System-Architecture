/**
 * Clinical Settings Routes
 * API routes for managing clinical documentation preferences
 */

import { Router } from 'express';
import * as clinicalSettingsController from '../controllers/clinicalSettings.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  updateClinicalSettingsSchema,
  updateClinicalSettingsSectionSchema,
  setAdjustmentStyleSchema,
  updateTestSettingsSchema,
  updateLetterSettingsSchema,
} from '../validators/clinicalSettings.validators.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// GET ROUTES
// ============================================

/**
 * @swagger
 * /clinical-settings:
 *   get:
 *     summary: Get all clinical settings for the organization
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Clinical settings object
 */
router.get('/', clinicalSettingsController.getClinicalSettings);

/**
 * @swagger
 * /clinical-settings/defaults:
 *   get:
 *     summary: Get default clinical settings
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Default settings values
 */
router.get('/defaults', clinicalSettingsController.getDefaultClinicalSettings);

/**
 * @swagger
 * /clinical-settings/adjustment/templates:
 *   get:
 *     summary: Get adjustment notation templates
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notation templates for the configured adjustment style
 */
router.get('/adjustment/templates', clinicalSettingsController.getAdjustmentNotationTemplates);

// ============================================
// UPDATE ROUTES
// ============================================

/**
 * @swagger
 * /clinical-settings:
 *   patch:
 *     summary: Update clinical settings (partial update)
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated settings
 */
router.patch(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateClinicalSettingsSchema),
  clinicalSettingsController.updateClinicalSettings
);

/**
 * @swagger
 * /clinical-settings/{section}:
 *   patch:
 *     summary: Update a specific section of clinical settings
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [adjustment, tests, letters, soap, ai, display]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated section settings
 */
router.patch(
  '/:section',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateClinicalSettingsSectionSchema),
  clinicalSettingsController.updateClinicalSettingsSection
);

/**
 * @swagger
 * /clinical-settings/adjustment/style:
 *   put:
 *     summary: Set adjustment notation style
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [style]
 *             properties:
 *               style:
 *                 type: string
 *                 enum: [gonstead, diversified, segment_listing, activator, custom]
 *     responses:
 *       200:
 *         description: Style updated
 */
router.put(
  '/adjustment/style',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(setAdjustmentStyleSchema),
  clinicalSettingsController.setAdjustmentStyle
);

/**
 * @swagger
 * /clinical-settings/tests/{testType}:
 *   patch:
 *     summary: Update test documentation settings
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [orthopedic, neurological, rom, palpation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Test settings updated
 */
router.patch(
  '/tests/:testType',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateTestSettingsSchema),
  clinicalSettingsController.updateTestSettings
);

/**
 * @swagger
 * /clinical-settings/letters:
 *   patch:
 *     summary: Update letter and document settings
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Letter settings updated
 */
router.patch(
  '/letters',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateLetterSettingsSchema),
  clinicalSettingsController.updateLetterSettings
);

// ============================================
// RESET ROUTES
// ============================================

/**
 * @swagger
 * /clinical-settings/reset:
 *   post:
 *     summary: Reset all clinical settings to defaults
 *     tags: [Clinical Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset to defaults
 *       403:
 *         description: Admin only
 */
router.post('/reset', requireRole(['ADMIN']), clinicalSettingsController.resetClinicalSettings);

export default router;
