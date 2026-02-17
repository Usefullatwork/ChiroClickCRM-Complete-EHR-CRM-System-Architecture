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

/**
 * @swagger
 * /templates/categories:
 *   get:
 *     summary: Get available template categories
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of template categories
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', templateController.getCategories);

/**
 * @swagger
 * /templates/search:
 *   get:
 *     summary: Search templates by keyword
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching templates
 *       401:
 *         description: Unauthorized
 */
router.get('/search', validate(searchTemplatesSchema), templateController.searchTemplates);

/**
 * @swagger
 * /templates/by-category:
 *   get:
 *     summary: Get templates grouped by category
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates in the specified category
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/by-category',
  validate(templatesByCategorySchema),
  templateController.getTemplatesByCategory
);

// ============================================
// Modular Document Type Template Routes
// ============================================

/**
 * @swagger
 * /templates/document-types:
 *   get:
 *     summary: List all document types
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of available document types (SOAP, referral, etc.)
 *       401:
 *         description: Unauthorized
 */
router.get('/document-types', templateController.getDocumentTypes);

/**
 * @swagger
 * /templates/for-document/{type}:
 *   get:
 *     summary: Get templates for a specific document type
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates applicable to the document type
 *       404:
 *         description: Document type not found
 */
router.get(
  '/for-document/:type',
  validate(templatesForDocumentSchema),
  templateController.getTemplatesForDocument
);

/**
 * @swagger
 * /templates/custom-set:
 *   post:
 *     summary: Create a custom template combination
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, template_ids]
 *             properties:
 *               name:
 *                 type: string
 *               template_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               document_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Custom template set created
 *       400:
 *         description: Validation error
 */
router.post(
  '/custom-set',
  validate(createCustomSetSchema),
  templateController.createCustomTemplateSet
);

/**
 * @swagger
 * /templates/terminology/{term}:
 *   get:
 *     summary: Get terminology definition for a clinical term
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Terminology definition with Norwegian and English translations
 *       404:
 *         description: Term not found
 */
router.get(
  '/terminology/:term',
  validate(terminologyParamSchema),
  templateController.getTerminology
);

/**
 * @swagger
 * /templates/expand:
 *   post:
 *     summary: Expand abbreviations to full clinical form
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text with abbreviations expanded
 *       400:
 *         description: Validation error
 */
router.post('/expand', validate(expandAbbreviationsSchema), templateController.expandAbbreviations);

/**
 * @swagger
 * /templates/abbreviate:
 *   post:
 *     summary: Abbreviate clinical text to short form
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text with clinical abbreviations applied
 *       400:
 *         description: Validation error
 */
router.post('/abbreviate', validate(abbreviateTextSchema), templateController.abbreviateText);

/**
 * @swagger
 * /templates/terms/{category}:
 *   get:
 *     summary: Get clinical terms by category
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clinical terms in the specified category
 *       404:
 *         description: Category not found
 */
router.get(
  '/terms/:category',
  validate(termsByCategorySchema),
  templateController.getTermsByCategory
);

// ============================================
// End Modular Document Type Template Routes
// ============================================

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all templates
 *       401:
 *         description: Unauthorized
 */
router.get('/', templateController.getAllTemplates);

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
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
 *         description: Template details
 *       404:
 *         description: Template not found
 */
router.get('/:id', validate(getTemplateSchema), templateController.getTemplateById);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Create a new clinical template
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, content]
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               content:
 *                 type: string
 *               document_type:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [nb, en]
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createTemplateSchema), templateController.createTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   patch:
 *     summary: Update a template
 *     tags: [Templates]
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
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Template not found
 */
router.patch('/:id', validate(updateTemplateSchema), templateController.updateTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
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
 *         description: Template deleted
 *       404:
 *         description: Template not found
 */
router.delete('/:id', validate(getTemplateSchema), templateController.deleteTemplate);

/**
 * @swagger
 * /templates/{id}/favorite:
 *   post:
 *     summary: Toggle template as favorite
 *     tags: [Templates]
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
 *         description: Favorite status toggled
 *       404:
 *         description: Template not found
 */
router.post('/:id/favorite', validate(favoriteTemplateSchema), templateController.toggleFavorite);

/**
 * @swagger
 * /templates/{id}/use:
 *   post:
 *     summary: Increment template usage counter
 *     tags: [Templates]
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
 *         description: Usage count incremented
 *       404:
 *         description: Template not found
 */
router.post('/:id/use', templateController.incrementUsage);

// Orthopedic Test Library

/**
 * @swagger
 * /templates/tests/library:
 *   get:
 *     summary: Get orthopedic test library
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Complete orthopedic test library
 *       401:
 *         description: Unauthorized
 */
router.get('/tests/library', templateController.getTestsLibrary);

/**
 * @swagger
 * /templates/tests/{code}:
 *   get:
 *     summary: Get orthopedic test by code
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orthopedic test details
 *       404:
 *         description: Test not found
 */
router.get('/tests/:code', validate(testByCodeSchema), templateController.getTestByCode);

// User Preferences

/**
 * @swagger
 * /templates/preferences/user:
 *   get:
 *     summary: Get user template preferences
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User template preferences including favorites
 *       401:
 *         description: Unauthorized
 */
router.get('/preferences/user', templateController.getUserPreferences);

/**
 * @swagger
 * /templates/preferences/favorites/{templateId}:
 *   post:
 *     summary: Add a template to favorites
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template added to favorites
 *       404:
 *         description: Template not found
 */
router.post(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.addFavorite
);

/**
 * @swagger
 * /templates/preferences/favorites/{templateId}:
 *   delete:
 *     summary: Remove a template from favorites
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template removed from favorites
 *       404:
 *         description: Template not found
 */
router.delete(
  '/preferences/favorites/:templateId',
  validate(preferenceFavoriteSchema),
  templateController.removeFavorite
);

// Template Phrases

/**
 * @swagger
 * /templates/phrases:
 *   get:
 *     summary: Get all clinical template phrases
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of clinical phrases
 *       401:
 *         description: Unauthorized
 */
router.get('/phrases', templateController.getPhrases);

/**
 * @swagger
 * /templates/phrases/byregion/{region}:
 *   get:
 *     summary: Get clinical phrases by body region
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phrases filtered by body region
 *       404:
 *         description: Region not found
 */
router.get(
  '/phrases/byregion/:region',
  validate(phrasesByRegionSchema),
  templateController.getPhrasesByRegion
);

// Red Flags Screening

/**
 * @swagger
 * /templates/red-flags:
 *   get:
 *     summary: Get red flag screening criteria
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Red flag criteria for clinical screening
 *       401:
 *         description: Unauthorized
 */
router.get('/red-flags', templateController.getRedFlags);

/**
 * @swagger
 * /templates/red-flags/screen:
 *   post:
 *     summary: Screen patient data for red flags
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptoms]
 *             properties:
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               history:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Red flag screening results with matched flags
 *       400:
 *         description: Validation error
 */
router.post('/red-flags/screen', validate(screenRedFlagsSchema), templateController.screenRedFlags);

// Test Clusters

/**
 * @swagger
 * /templates/test-clusters:
 *   get:
 *     summary: Get all test clusters
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orthopedic test clusters grouped by condition
 *       401:
 *         description: Unauthorized
 */
router.get('/test-clusters', templateController.getTestClusters);

/**
 * @swagger
 * /templates/test-clusters/{condition}:
 *   get:
 *     summary: Get test cluster for a specific condition
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: condition
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test cluster with recommended tests for the condition
 *       404:
 *         description: Condition not found
 */
router.get(
  '/test-clusters/:condition',
  validate(testClusterSchema),
  templateController.getTestClusterByCondition
);

// Functional Movement Screen

/**
 * @swagger
 * /templates/fms:
 *   get:
 *     summary: Get Functional Movement Screen templates
 *     tags: [Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: FMS templates with scoring criteria
 *       401:
 *         description: Unauthorized
 */
router.get('/fms', templateController.getFMSTemplates);

export default router;
