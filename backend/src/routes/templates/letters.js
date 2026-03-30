/**
 * Templates Letters Routes
 * Orthopedic tests, user preferences, phrases, red flags, test clusters, and FMS
 */

import express from 'express';
import * as templateController from '../../controllers/templates.js';
import validate from '../../middleware/validation.js';
import {
  screenRedFlagsSchema,
  testClusterSchema,
  phrasesByRegionSchema,
  testByCodeSchema,
  preferenceFavoriteSchema,
} from '../../validators/template.validators.js';

const router = express.Router();

// Orthopedic Test Library
router.get('/tests/library', templateController.getTestsLibrary);
router.get('/tests/:code', validate(testByCodeSchema), templateController.getTestByCode);

// User Preferences
router.get('/preferences/user', templateController.getUserPreferences);
router.post(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.addFavorite
);
router.delete(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.removeFavorite
);

// Template Phrases
router.get('/phrases', templateController.getPhrases);
router.get(
  '/phrases/byregion/:region',
  validate(phrasesByRegionSchema),
  templateController.getPhrasesByRegion
);

// Red Flags Screening
router.get('/red-flags', templateController.getRedFlags);
router.post('/red-flags/screen', validate(screenRedFlagsSchema), templateController.screenRedFlags);

// Test Clusters
router.get('/test-clusters', templateController.getTestClusters);
router.get(
  '/test-clusters/:condition',
  validate(testClusterSchema),
  templateController.getTestClusterByCondition
);

// Functional Movement Screen
router.get('/fms', templateController.getFMSTemplates);

export default router;
