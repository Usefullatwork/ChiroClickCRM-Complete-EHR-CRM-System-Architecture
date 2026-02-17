/**
 * Macro Routes
 * API endpoints for clinical text macros (hot buttons)
 */

import express from 'express';
import * as macroController from '../controllers/macros.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  searchMacrosSchema,
  createMacroSchema,
  macroIdSchema,
  expandMacroSchema,
} from '../validators/macro.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /macros:
 *   get:
 *     summary: Get all macros organized by category
 *     tags: [Macros]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Macro matrix grouped by category
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.getMacroMatrix
);

/**
 * @swagger
 * /macros/search:
 *   get:
 *     summary: Search macros by text
 *     tags: [Macros]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching macros
 */
router.get(
  '/search',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(searchMacrosSchema),
  macroController.searchMacros
);

/**
 * @swagger
 * /macros/favorites:
 *   get:
 *     summary: Get favorite macros for current user
 *     tags: [Macros]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorite macros
 */
router.get(
  '/favorites',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.getFavorites
);

/**
 * @swagger
 * /macros:
 *   post:
 *     summary: Create a new macro
 *     tags: [Macros]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, text, category]
 *             properties:
 *               name:
 *                 type: string
 *               text:
 *                 type: string
 *               category:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Macro created
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createMacroSchema),
  macroController.createMacro
);

/**
 * @swagger
 * /macros/{id}:
 *   patch:
 *     summary: Update an existing macro
 *     tags: [Macros]
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
 *         description: Macro updated
 */
router.patch('/:id', requireRole(['ADMIN', 'PRACTITIONER']), macroController.updateMacro);

/**
 * @swagger
 * /macros/{id}:
 *   delete:
 *     summary: Soft-delete a macro
 *     tags: [Macros]
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
 *         description: Macro deleted
 */
router.delete('/:id', requireRole(['ADMIN', 'PRACTITIONER']), macroController.deleteMacro);

/**
 * @swagger
 * /macros/{id}/expand:
 *   post:
 *     summary: Expand macro with variable substitution
 *     tags: [Macros]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Expanded macro text
 */
router.post(
  '/:id/expand',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(expandMacroSchema),
  macroController.expandMacro
);

/**
 * @swagger
 * /macros/{id}/favorite:
 *   post:
 *     summary: Toggle favorite status for a macro
 *     tags: [Macros]
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
 *         description: Favorite toggled
 */
router.post(
  '/:id/favorite',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(macroIdSchema),
  macroController.toggleFavorite
);

/**
 * @swagger
 * /macros/{id}/usage:
 *   post:
 *     summary: Record macro usage for analytics
 *     tags: [Macros]
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
 *         description: Usage recorded
 */
router.post(
  '/:id/usage',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(macroIdSchema),
  macroController.recordUsage
);

export default router;
