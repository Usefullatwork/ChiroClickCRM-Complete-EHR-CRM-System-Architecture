/**
 * Clinical Settings Routes
 * API routes for managing clinical documentation preferences
 */

import { Router } from 'express';
import * as clinicalSettingsController from '../controllers/clinicalSettings.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// GET ROUTES
// ============================================

/**
 * GET /api/v1/clinical-settings
 * Get all clinical settings for the user's organization
 */
router.get('/', clinicalSettingsController.getClinicalSettings);

/**
 * GET /api/v1/clinical-settings/defaults
 * Get default clinical settings (for reference)
 */
router.get('/defaults', clinicalSettingsController.getDefaultClinicalSettings);

/**
 * GET /api/v1/clinical-settings/adjustment/templates
 * Get adjustment notation templates based on current settings
 */
router.get('/adjustment/templates', clinicalSettingsController.getAdjustmentNotationTemplates);

// ============================================
// UPDATE ROUTES
// ============================================

/**
 * PATCH /api/v1/clinical-settings
 * Update clinical settings (partial update)
 */
router.patch('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  clinicalSettingsController.updateClinicalSettings
);

/**
 * PATCH /api/v1/clinical-settings/:section
 * Update a specific section of clinical settings
 * Valid sections: adjustment, tests, letters, soap, ai, display
 */
router.patch('/:section',
  requireRole(['ADMIN', 'PRACTITIONER']),
  clinicalSettingsController.updateClinicalSettingsSection
);

/**
 * PUT /api/v1/clinical-settings/adjustment/style
 * Set adjustment notation style
 * Body: { style: 'gonstead' | 'diversified' | 'segment_listing' | 'activator' | 'custom' }
 */
router.put('/adjustment/style',
  requireRole(['ADMIN', 'PRACTITIONER']),
  clinicalSettingsController.setAdjustmentStyle
);

/**
 * PATCH /api/v1/clinical-settings/tests/:testType
 * Update test documentation settings
 * Valid testTypes: orthopedic, neurological, rom, palpation
 */
router.patch('/tests/:testType',
  requireRole(['ADMIN', 'PRACTITIONER']),
  clinicalSettingsController.updateTestSettings
);

/**
 * PATCH /api/v1/clinical-settings/letters
 * Update letter/document settings
 */
router.patch('/letters',
  requireRole(['ADMIN', 'PRACTITIONER']),
  clinicalSettingsController.updateLetterSettings
);

// ============================================
// RESET ROUTES
// ============================================

/**
 * POST /api/v1/clinical-settings/reset
 * Reset all clinical settings to defaults
 * Admin only
 */
router.post('/reset',
  requireRole(['ADMIN']),
  clinicalSettingsController.resetClinicalSettings
);

export default router;
