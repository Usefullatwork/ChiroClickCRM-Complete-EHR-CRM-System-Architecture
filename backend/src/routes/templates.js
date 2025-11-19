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

export default router;
