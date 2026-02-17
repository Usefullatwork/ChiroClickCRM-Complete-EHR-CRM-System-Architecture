/**
 * Macro Controller
 * HTTP request handlers for clinical text macros (hot buttons)
 *
 * @module controllers/macros
 */

import { macroService } from '../services/macros.js';
import logger from '../utils/logger.js';

/**
 * Get macro matrix organized by category
 * @route GET /api/v1/macros
 */
export const getMacroMatrix = async (req, res) => {
  try {
    const { organizationId } = req;
    const matrix = await macroService.getMacroMatrix(organizationId);
    res.json({ success: true, data: matrix });
  } catch (error) {
    logger.error('Error getting macro matrix:', error);
    res.status(500).json({ error: 'Failed to retrieve macros' });
  }
};

/**
 * Search macros by text
 * @route GET /api/v1/macros/search
 */
export const searchMacros = async (req, res) => {
  try {
    const { organizationId } = req;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await macroService.searchMacros(organizationId, q.trim());
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching macros:', error);
    res.status(500).json({ error: 'Failed to search macros' });
  }
};

/**
 * Get favorite macros for current user
 * @route GET /api/v1/macros/favorites
 */
export const getFavorites = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const favorites = await macroService.getFavorites(organizationId, user.id);
    res.json({ success: true, data: favorites });
  } catch (error) {
    logger.error('Error getting favorite macros:', error);
    res.status(500).json({ error: 'Failed to retrieve favorites' });
  }
};

/**
 * Create a new macro
 * @route POST /api/v1/macros
 */
export const createMacro = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const macroData = { ...req.body, createdBy: user.id };
    const macro = await macroService.createMacro(organizationId, macroData);
    res.status(201).json({ success: true, data: macro });
  } catch (error) {
    logger.error('Error creating macro:', error);
    res.status(500).json({ error: 'Failed to create macro' });
  }
};

/**
 * Expand a macro with variable substitution
 * @route POST /api/v1/macros/:id/expand
 */
export const expandMacro = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { patientContext } = req.body;

    // Fetch the macro text first
    const matrix = await macroService.getMacroMatrix(organizationId);
    let macroText = null;

    for (const category of Object.values(matrix)) {
      for (const macro of category.macros || []) {
        if (macro.id === id) {
          macroText = macro.text;
          break;
        }
      }
      if (macroText) {
        break;
      }
      for (const subcatMacros of Object.values(category.subcategories || {})) {
        for (const macro of subcatMacros) {
          if (macro.id === id) {
            macroText = macro.text;
            break;
          }
        }
        if (macroText) {
          break;
        }
      }
      if (macroText) {
        break;
      }
    }

    if (!macroText) {
      return res.status(404).json({ error: 'Macro not found' });
    }

    const expanded = macroService.expandMacro(macroText, patientContext || {});
    res.json({ success: true, data: { expanded } });
  } catch (error) {
    logger.error('Error expanding macro:', error);
    res.status(500).json({ error: 'Failed to expand macro' });
  }
};

/**
 * Toggle favorite status for a macro
 * @route POST /api/v1/macros/:id/favorite
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const result = await macroService.toggleFavorite(id, user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error toggling macro favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

/**
 * Update a macro
 * @route PATCH /api/v1/macros/:id
 */
export const updateMacro = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const macro = await macroService.updateMacro(organizationId, id, req.body);
    if (!macro) {
      return res.status(404).json({ error: 'Macro not found' });
    }
    res.json({ success: true, data: macro });
  } catch (error) {
    logger.error('Error updating macro:', error);
    res.status(500).json({ error: 'Failed to update macro' });
  }
};

/**
 * Delete a macro (soft delete)
 * @route DELETE /api/v1/macros/:id
 */
export const deleteMacro = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const result = await macroService.deleteMacro(organizationId, id);
    if (!result) {
      return res.status(404).json({ error: 'Macro not found' });
    }
    res.json({ success: true, message: 'Macro deleted' });
  } catch (error) {
    logger.error('Error deleting macro:', error);
    res.status(500).json({ error: 'Failed to delete macro' });
  }
};

/**
 * Record macro usage for analytics
 * @route POST /api/v1/macros/:id/usage
 */
export const recordUsage = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    await macroService.recordUsage(id, user.id);
    res.json({ success: true, message: 'Usage recorded' });
  } catch (error) {
    logger.error('Error recording macro usage:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};

export default {
  getMacroMatrix,
  searchMacros,
  getFavorites,
  createMacro,
  updateMacro,
  deleteMacro,
  expandMacro,
  toggleFavorite,
  recordUsage,
};
