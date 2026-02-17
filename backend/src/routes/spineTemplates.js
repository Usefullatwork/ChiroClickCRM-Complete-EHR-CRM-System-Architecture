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

/**
 * @swagger
 * /spine-templates:
 *   get:
 *     summary: Get all spine palpation templates
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all templates
 */
router.get('/', validate(getAllTemplatesSchema), spineTemplatesController.getAll);

/**
 * @swagger
 * /spine-templates/grouped:
 *   get:
 *     summary: Get templates grouped by segment
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Templates organized by spinal segment
 */
router.get('/grouped', spineTemplatesController.getGroupedBySegment);

/**
 * @swagger
 * /spine-templates/segments:
 *   get:
 *     summary: Get list of available spinal segments
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available segment names
 */
router.get('/segments', spineTemplatesController.getSegments);

/**
 * @swagger
 * /spine-templates/directions:
 *   get:
 *     summary: Get list of available palpation directions
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available direction names
 */
router.get('/directions', spineTemplatesController.getDirections);

/**
 * @swagger
 * /spine-templates/{segment}/{direction}:
 *   get:
 *     summary: Get template for a specific segment and direction
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segment
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: direction
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template text for segment+direction
 *       404:
 *         description: Template not found
 */
router.get(
  '/:segment/:direction',
  validate(getBySegmentDirectionSchema),
  spineTemplatesController.getBySegmentDirection
);

/**
 * @swagger
 * /spine-templates:
 *   post:
 *     summary: Create a custom palpation template
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [segment, direction, text]
 *             properties:
 *               segment:
 *                 type: string
 *               direction:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/', validate(createTemplateSchema), spineTemplatesController.create);

/**
 * @swagger
 * /spine-templates/bulk:
 *   post:
 *     summary: Bulk update palpation templates
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templates]
 *             properties:
 *               templates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Templates updated
 */
router.post('/bulk', validate(bulkUpdateTemplatesSchema), spineTemplatesController.bulkUpdate);

/**
 * @swagger
 * /spine-templates/reset:
 *   post:
 *     summary: Reset all templates to defaults
 *     tags: [Spine Templates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Templates reset to defaults
 */
router.post('/reset', spineTemplatesController.resetToDefaults);

/**
 * @swagger
 * /spine-templates/{id}:
 *   patch:
 *     summary: Update a palpation template
 *     tags: [Spine Templates]
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
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template updated
 */
router.patch('/:id', validate(updateTemplateSchema), spineTemplatesController.update);

/**
 * @swagger
 * /spine-templates/{id}:
 *   delete:
 *     summary: Delete custom template (reverts to default)
 *     tags: [Spine Templates]
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
 */
router.delete('/:id', validate(deleteTemplateSchema), spineTemplatesController.remove);

export default router;
