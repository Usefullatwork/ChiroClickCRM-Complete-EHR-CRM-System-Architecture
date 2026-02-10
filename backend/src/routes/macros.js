/**
 * Macro Routes
 * API endpoints for clinical text macros (hot buttons)
 */

import express from 'express';
import * as macroController from '../controllers/macros.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/macros
 * @desc    Get all macros organized by category (macro matrix)
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.getMacroMatrix
);

/**
 * @route   GET /api/v1/macros/search
 * @desc    Search macros by text (query param: q)
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/search',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.searchMacros
);

/**
 * @route   GET /api/v1/macros/favorites
 * @desc    Get favorite macros for current user
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get(
  '/favorites',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.getFavorites
);

/**
 * @route   POST /api/v1/macros
 * @desc    Create a new macro
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/', requireRole(['ADMIN', 'PRACTITIONER']), macroController.createMacro);

/**
 * @route   POST /api/v1/macros/:id/expand
 * @desc    Expand macro with variable substitution
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/:id/expand',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.expandMacro
);

/**
 * @route   POST /api/v1/macros/:id/favorite
 * @desc    Toggle favorite status for a macro
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/:id/favorite',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.toggleFavorite
);

/**
 * @route   POST /api/v1/macros/:id/usage
 * @desc    Record macro usage for analytics
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/:id/usage',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  macroController.recordUsage
);

export default router;
