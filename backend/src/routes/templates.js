/**
 * Clinical Templates Routes
 * API endpoints for clinical template management
 */

import express from 'express';
import * as templateController from '../controllers/templates.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  searchTemplatesSchema,
  templatesByCategorySchema,
  templatesForDocumentSchema,
  createCustomSetSchema,
  expandAbbreviationsSchema,
  abbreviateTextSchema,
  favoriteTemplateSchema,
  screenRedFlagsSchema,
  terminologyParamSchema,
  termsByCategorySchema,
  testClusterSchema,
  phrasesByRegionSchema,
  testByCodeSchema,
  preferenceFavoriteSchema,
} from '../validators/template.validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/templates/categories
router.get('/categories', templateController.getCategories);

// GET /api/v1/templates/search
router.get('/search', validate(searchTemplatesSchema), templateController.searchTemplates);

// GET /api/v1/templates/by-category
router.get(
  '/by-category',
  validate(templatesByCategorySchema),
  templateController.getTemplatesByCategory
);

// ============================================
// Modular Document Type Template Routes
// ============================================

// GET /api/v1/templates/document-types - List all document types
router.get('/document-types', templateController.getDocumentTypes);

// GET /api/v1/templates/for-document/:type - Get templates for document type
router.get(
  '/for-document/:type',
  validate(templatesForDocumentSchema),
  templateController.getTemplatesForDocument
);

// POST /api/v1/templates/custom-set - Create custom template combination
router.post(
  '/custom-set',
  validate(createCustomSetSchema),
  templateController.createCustomTemplateSet
);

// GET /api/v1/templates/terminology/:term - Get terminology for a term
router.get(
  '/terminology/:term',
  validate(terminologyParamSchema),
  templateController.getTerminology
);

// POST /api/v1/templates/expand - Expand abbreviations to full form
router.post('/expand', validate(expandAbbreviationsSchema), templateController.expandAbbreviations);

// POST /api/v1/templates/abbreviate - Abbreviate text to short form
router.post('/abbreviate', validate(abbreviateTextSchema), templateController.abbreviateText);

// GET /api/v1/templates/terms/:category - Get terms by category
router.get(
  '/terms/:category',
  validate(termsByCategorySchema),
  templateController.getTermsByCategory
);

// ============================================
// End Modular Document Type Template Routes
// ============================================

// GET /api/v1/templates
router.get('/', templateController.getAllTemplates);

// GET /api/v1/templates/:id
router.get('/:id', validate(getTemplateSchema), templateController.getTemplateById);

// POST /api/v1/templates
router.post('/', validate(createTemplateSchema), templateController.createTemplate);

// PATCH /api/v1/templates/:id
router.patch('/:id', validate(updateTemplateSchema), templateController.updateTemplate);

// DELETE /api/v1/templates/:id
router.delete('/:id', validate(getTemplateSchema), templateController.deleteTemplate);

// POST /api/v1/templates/:id/favorite
router.post('/:id/favorite', validate(favoriteTemplateSchema), templateController.toggleFavorite);

// POST /api/v1/templates/:id/use
router.post('/:id/use', templateController.incrementUsage);

// Orthopedic Test Library
// GET /api/v1/templates/tests/library
router.get('/tests/library', templateController.getTestsLibrary);

// GET /api/v1/templates/tests/:code
router.get('/tests/:code', validate(testByCodeSchema), templateController.getTestByCode);

// User Preferences
// GET /api/v1/templates/preferences
router.get('/preferences/user', templateController.getUserPreferences);

// POST /api/v1/templates/preferences/favorites/:templateId
router.post(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.addFavorite
);

// DELETE /api/v1/templates/preferences/favorites/:templateId
router.delete(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.removeFavorite
);

// Template Phrases
// GET /api/v1/templates/phrases
router.get('/phrases', templateController.getPhrases);

// GET /api/v1/templates/phrases/byregion/:region
router.get(
  '/phrases/byregion/:region',
  validate(phrasesByRegionSchema),
  templateController.getPhrasesByRegion
);

// Red Flags Screening
// GET /api/v1/templates/red-flags
router.get('/red-flags', templateController.getRedFlags);

// GET /api/v1/templates/red-flags/screen
router.post('/red-flags/screen', validate(screenRedFlagsSchema), templateController.screenRedFlags);

// Test Clusters
// GET /api/v1/templates/test-clusters
router.get('/test-clusters', templateController.getTestClusters);

// GET /api/v1/templates/test-clusters/:condition
router.get(
  '/test-clusters/:condition',
  validate(testClusterSchema),
  templateController.getTestClusterByCondition
);

// Functional Movement Screen
// GET /api/v1/templates/fms
router.get('/fms', templateController.getFMSTemplates);

export default router;
