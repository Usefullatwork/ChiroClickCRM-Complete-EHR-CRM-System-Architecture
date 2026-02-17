/**
 * Spine Templates Routes
 * API endpoints for spine palpation text templates
 */

import express from 'express';
import * as spineTemplatesController from '../controllers/spineTemplates.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  getAllTemplatesSchema,
  getBySegmentDirectionSchema,
  createTemplateSchema,
  bulkUpdateTemplatesSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
} from '../validators/spineTemplates.validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/spine-templates - Get all templates
router.get('/', validate(getAllTemplatesSchema), spineTemplatesController.getAll);

// GET /api/v1/spine-templates/grouped - Get templates grouped by segment
router.get('/grouped', spineTemplatesController.getGroupedBySegment);

// GET /api/v1/spine-templates/segments - Get list of available segments
router.get('/segments', spineTemplatesController.getSegments);

// GET /api/v1/spine-templates/directions - Get list of available directions
router.get('/directions', spineTemplatesController.getDirections);

// GET /api/v1/spine-templates/:segment/:direction - Get template for segment+direction
router.get(
  '/:segment/:direction',
  validate(getBySegmentDirectionSchema),
  spineTemplatesController.getBySegmentDirection
);

// POST /api/v1/spine-templates - Create custom template
router.post('/', validate(createTemplateSchema), spineTemplatesController.create);

// POST /api/v1/spine-templates/bulk - Bulk update templates
router.post('/bulk', validate(bulkUpdateTemplatesSchema), spineTemplatesController.bulkUpdate);

// POST /api/v1/spine-templates/reset - Reset to defaults
router.post('/reset', spineTemplatesController.resetToDefaults);

// PATCH /api/v1/spine-templates/:id - Update template
router.patch('/:id', validate(updateTemplateSchema), spineTemplatesController.update);

// DELETE /api/v1/spine-templates/:id - Delete custom template
router.delete('/:id', validate(deleteTemplateSchema), spineTemplatesController.remove);

export default router;
