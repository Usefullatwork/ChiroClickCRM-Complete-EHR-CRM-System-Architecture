/**
 * Clinical Templates Routes
 * API endpoints for clinical template management
 */

import express from 'express';
import * as templateController from '../controllers/templates.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/templates/categories
router.get('/categories', templateController.getCategories);

// GET /api/v1/templates/search
router.get('/search', templateController.searchTemplates);

// GET /api/v1/templates/by-category
router.get('/by-category', templateController.getTemplatesByCategory);

// GET /api/v1/templates
router.get('/', templateController.getAllTemplates);

// GET /api/v1/templates/:id
router.get('/:id', templateController.getTemplateById);

// POST /api/v1/templates
router.post('/', templateController.createTemplate);

// PATCH /api/v1/templates/:id
router.patch('/:id', templateController.updateTemplate);

// DELETE /api/v1/templates/:id
router.delete('/:id', templateController.deleteTemplate);

// POST /api/v1/templates/:id/favorite
router.post('/:id/favorite', templateController.toggleFavorite);

// POST /api/v1/templates/:id/use
router.post('/:id/use', templateController.incrementUsage);

// Orthopedic Test Library
// GET /api/v1/templates/tests/library
router.get('/tests/library', templateController.getTestsLibrary);

// GET /api/v1/templates/tests/:code
router.get('/tests/:code', templateController.getTestByCode);

// User Preferences
// GET /api/v1/templates/preferences
router.get('/preferences/user', templateController.getUserPreferences);

// POST /api/v1/templates/preferences/favorites/:templateId
router.post('/preferences/favorites/:templateId', templateController.addFavorite);

// DELETE /api/v1/templates/preferences/favorites/:templateId
router.delete('/preferences/favorites/:templateId', templateController.removeFavorite);

// Template Phrases
// GET /api/v1/templates/phrases
router.get('/phrases', templateController.getPhrases);

// GET /api/v1/templates/phrases/byregion/:region
router.get('/phrases/byregion/:region', templateController.getPhrasesByRegion);

// Red Flags Screening
// GET /api/v1/templates/red-flags
router.get('/red-flags', templateController.getRedFlags);

// GET /api/v1/templates/red-flags/screen
router.post('/red-flags/screen', templateController.screenRedFlags);

// Test Clusters
// GET /api/v1/templates/test-clusters
router.get('/test-clusters', templateController.getTestClusters);

// GET /api/v1/templates/test-clusters/:condition
router.get('/test-clusters/:condition', templateController.getTestClusterByCondition);

// Functional Movement Screen
// GET /api/v1/templates/fms
router.get('/fms', templateController.getFMSTemplates);

export default router;
