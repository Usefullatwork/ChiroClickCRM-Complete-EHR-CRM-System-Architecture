/**
 * Clinical Templates Routes
 * Template CRUD, categories, search, document types, terminology, and abbreviations
 */

import express from 'express';
import * as templateController from '../../controllers/templates.js';
import validate from '../../middleware/validation.js';
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
  terminologyParamSchema,
  termsByCategorySchema,
  favoriteTemplateSchema,
} from '../../validators/template.validators.js';

const router = express.Router();

// Categories & Search
router.get('/categories', templateController.getCategories);
router.get('/search', validate(searchTemplatesSchema), templateController.searchTemplates);
router.get(
  '/by-category',
  validate(templatesByCategorySchema),
  templateController.getTemplatesByCategory
);

// Document Types
router.get('/document-types', templateController.getDocumentTypes);
router.get(
  '/for-document/:type',
  validate(templatesForDocumentSchema),
  templateController.getTemplatesForDocument
);
router.post(
  '/custom-set',
  validate(createCustomSetSchema),
  templateController.createCustomTemplateSet
);

// Terminology & Abbreviations
router.get(
  '/terminology/:term',
  validate(terminologyParamSchema),
  templateController.getTerminology
);
router.post('/expand', validate(expandAbbreviationsSchema), templateController.expandAbbreviations);
router.post('/abbreviate', validate(abbreviateTextSchema), templateController.abbreviateText);
router.get(
  '/terms/:category',
  validate(termsByCategorySchema),
  templateController.getTermsByCategory
);

// Template CRUD
router.get('/', templateController.getAllTemplates);
router.get('/:id', validate(getTemplateSchema), templateController.getTemplateById);
router.post('/', validate(createTemplateSchema), templateController.createTemplate);
router.patch('/:id', validate(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', validate(getTemplateSchema), templateController.deleteTemplate);
router.post('/:id/favorite', validate(favoriteTemplateSchema), templateController.toggleFavorite);
router.post('/:id/use', templateController.incrementUsage);

export default router;
