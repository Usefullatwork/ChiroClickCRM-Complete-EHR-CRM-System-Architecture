/**
 * Clinical Templates Controller
 * Handles HTTP requests for clinical template management
 */

import * as templateService from '../services/templates.js';
import logger from '../config/logger.js';

/**
 * Get all templates
 * GET /api/v1/templates
 */
export const getAllTemplates = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const options = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      soapSection: req.query.soapSection,
      language: req.query.language || 'NO',
      favoritesOnly: req.query.favoritesOnly === 'true',
      search: req.query.search,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await templateService.getAllTemplates(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getAllTemplates controller:', error);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
};

/**
 * Get templates grouped by category
 * GET /api/v1/templates/by-category
 */
export const getTemplatesByCategory = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const language = req.query.language || 'NO';

    const result = await templateService.getTemplatesByCategory(organizationId, language);
    res.json(result);
  } catch (error) {
    logger.error('Error in getTemplatesByCategory controller:', error);
    res.status(500).json({ error: 'Failed to retrieve templates by category' });
  }
};

/**
 * Get template by ID
 * GET /api/v1/templates/:id
 */
export const getTemplateById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const template = await templateService.getTemplateById(organizationId, id);
    res.json(template);
  } catch (error) {
    logger.error('Error in getTemplateById controller:', error);
    res.status(error.message === 'Template not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve template'
    });
  }
};

/**
 * Create new template
 * POST /api/v1/templates
 */
export const createTemplate = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;

    const template = await templateService.createTemplate(organizationId, userId, req.body);
    res.status(201).json(template);
  } catch (error) {
    logger.error('Error in createTemplate controller:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

/**
 * Update template
 * PATCH /api/v1/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const template = await templateService.updateTemplate(organizationId, id, req.body);
    res.json(template);
  } catch (error) {
    logger.error('Error in updateTemplate controller:', error);
    res.status(error.message.includes('Cannot modify') ? 403 : 500).json({
      error: error.message || 'Failed to update template'
    });
  }
};

/**
 * Delete template
 * DELETE /api/v1/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const result = await templateService.deleteTemplate(organizationId, id);
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteTemplate controller:', error);
    res.status(error.message.includes('Cannot delete') ? 403 : 500).json({
      error: error.message || 'Failed to delete template'
    });
  }
};

/**
 * Toggle favorite status
 * POST /api/v1/templates/:id/favorite
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const template = await templateService.toggleFavorite(organizationId, id);
    res.json(template);
  } catch (error) {
    logger.error('Error in toggleFavorite controller:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

/**
 * Increment usage count
 * POST /api/v1/templates/:id/use
 */
export const incrementUsage = async (req, res) => {
  try {
    const { id } = req.params;

    await templateService.incrementUsage(id);
    res.json({ message: 'Usage count incremented' });
  } catch (error) {
    logger.error('Error in incrementUsage controller:', error);
    res.status(500).json({ error: 'Failed to increment usage' });
  }
};

/**
 * Get template categories
 * GET /api/v1/templates/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const language = req.query.language || 'NO';

    const categories = await templateService.getCategories(organizationId, language);
    res.json(categories);
  } catch (error) {
    logger.error('Error in getCategories controller:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

/**
 * Search templates
 * GET /api/v1/templates/search
 */
export const searchTemplates = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { q } = req.query;
    const language = req.query.language || 'NO';

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const templates = await templateService.searchTemplates(organizationId, q, language);
    res.json(templates);
  } catch (error) {
    logger.error('Error in searchTemplates controller:', error);
    res.status(500).json({ error: 'Failed to search templates' });
  }
};

/**
 * Get orthopedic tests library
 * GET /api/v1/templates/tests/library
 */
export const getTestsLibrary = async (req, res) => {
  try {
    const filters = {
      testCategory: req.query.testCategory,
      bodyRegion: req.query.bodyRegion,
      system: req.query.system,
      search: req.query.search,
      language: req.query.language || 'NO'
    };

    const tests = await templateService.getTestsLibrary(filters);
    res.json(tests);
  } catch (error) {
    logger.error('Error in getTestsLibrary controller:', error);
    res.status(500).json({ error: 'Failed to retrieve tests library' });
  }
};

/**
 * Get specific orthopedic test by code
 * GET /api/v1/templates/tests/:code
 */
export const getTestByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const language = req.query.language || 'NO';

    const test = await templateService.getTestByCode(code, language);
    res.json(test);
  } catch (error) {
    logger.error('Error in getTestByCode controller:', error);
    res.status(error.message === 'Test not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve test'
    });
  }
};

/**
 * Get user template preferences
 * GET /api/v1/templates/preferences/user
 */
export const getUserPreferences = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;

    const preferences = await templateService.getUserPreferences(userId, organizationId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error in getUserPreferences controller:', error);
    res.status(500).json({ error: 'Failed to retrieve user preferences' });
  }
};

/**
 * Add template to favorites
 * POST /api/v1/templates/preferences/favorites/:templateId
 */
export const addFavorite = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { templateId } = req.params;

    await templateService.addFavoriteTemplate(userId, organizationId, templateId);
    res.json({ message: 'Template added to favorites' });
  } catch (error) {
    logger.error('Error in addFavorite controller:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

/**
 * Remove template from favorites
 * DELETE /api/v1/templates/preferences/favorites/:templateId
 */
export const removeFavorite = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { templateId } = req.params;

    await templateService.removeFavoriteTemplate(userId, organizationId, templateId);
    res.json({ message: 'Template removed from favorites' });
  } catch (error) {
    logger.error('Error in removeFavorite controller:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

/**
 * Get clinical phrases
 * GET /api/v1/templates/phrases
 */
export const getPhrases = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const options = {
      category: req.query.category,
      language: req.query.language || 'NO',
      search: req.query.search
    };

    const phrases = await templateService.getPhrases(organizationId, options);
    res.json(phrases);
  } catch (error) {
    logger.error('Error in getPhrases controller:', error);
    res.status(500).json({ error: 'Failed to retrieve phrases' });
  }
};

/**
 * Get phrases by body region
 * GET /api/v1/templates/phrases/byregion/:region
 */
export const getPhrasesByRegion = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { region } = req.params;
    const language = req.query.language || 'NO';

    const phrases = await templateService.getPhrasesByRegion(organizationId, region, language);
    res.json(phrases);
  } catch (error) {
    logger.error('Error in getPhrasesByRegion controller:', error);
    res.status(500).json({ error: 'Failed to retrieve phrases' });
  }
};

/**
 * Get red flags library
 * GET /api/v1/templates/red-flags
 */
export const getRedFlags = async (req, res) => {
  try {
    const filters = {
      pathologyCategory: req.query.pathologyCategory,
      bodyRegion: req.query.bodyRegion,
      significanceLevel: req.query.significanceLevel,
      language: req.query.language || 'NO'
    };

    const redFlags = await templateService.getRedFlags(filters);
    res.json(redFlags);
  } catch (error) {
    logger.error('Error in getRedFlags controller:', error);
    res.status(500).json({ error: 'Failed to retrieve red flags' });
  }
};

/**
 * Screen patient for red flags
 * POST /api/v1/templates/red-flags/screen
 */
export const screenRedFlags = async (req, res) => {
  try {
    const { patientData, symptoms, findings } = req.body;

    const screening = await templateService.screenRedFlags(patientData, symptoms, findings);
    res.json(screening);
  } catch (error) {
    logger.error('Error in screenRedFlags controller:', error);
    res.status(500).json({ error: 'Failed to screen red flags' });
  }
};

/**
 * Get test clusters
 * GET /api/v1/templates/test-clusters
 */
export const getTestClusters = async (req, res) => {
  try {
    const filters = {
      bodyRegion: req.query.bodyRegion,
      language: req.query.language || 'NO'
    };

    const clusters = await templateService.getTestClusters(filters);
    res.json(clusters);
  } catch (error) {
    logger.error('Error in getTestClusters controller:', error);
    res.status(500).json({ error: 'Failed to retrieve test clusters' });
  }
};

/**
 * Get test cluster by condition
 * GET /api/v1/templates/test-clusters/:condition
 */
export const getTestClusterByCondition = async (req, res) => {
  try {
    const { condition } = req.params;
    const language = req.query.language || 'NO';

    const cluster = await templateService.getTestClusterByCondition(condition, language);
    res.json(cluster);
  } catch (error) {
    logger.error('Error in getTestClusterByCondition controller:', error);
    res.status(error.message === 'Cluster not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve test cluster'
    });
  }
};

/**
 * Get FMS templates
 * GET /api/v1/templates/fms
 */
export const getFMSTemplates = async (req, res) => {
  try {
    const language = req.query.language || 'NO';

    const fmsTemplates = await templateService.getFMSTemplates(language);
    res.json(fmsTemplates);
  } catch (error) {
    logger.error('Error in getFMSTemplates controller:', error);
    res.status(500).json({ error: 'Failed to retrieve FMS templates' });
  }
};

// ============================================
// Document Type Template Endpoints
// ============================================

// Import the modular template service
import { templateService as modularTemplateService, getAllDocumentTypes, getDocumentTypeConfig } from '../templates/index.js';

/**
 * Get all document types
 * GET /api/v1/templates/document-types
 */
export const getDocumentTypes = async (req, res) => {
  try {
    const documentTypes = getAllDocumentTypes();
    res.json({
      success: true,
      documentTypes
    });
  } catch (error) {
    logger.error('Error in getDocumentTypes controller:', error);
    res.status(500).json({ error: 'Failed to retrieve document types' });
  }
};

/**
 * Get templates for a specific document type
 * GET /api/v1/templates/for-document/:type
 */
export const getTemplatesForDocument = async (req, res) => {
  try {
    const { type } = req.params;
    const { practitioner, specialty, bodyRegion } = req.query;

    const config = getDocumentTypeConfig(type);
    if (!config) {
      return res.status(404).json({ error: `Unknown document type: ${type}` });
    }

    const templates = await modularTemplateService.loadForDocumentType(type, {
      practitioner,
      specialty,
      bodyRegion
    });

    res.json({
      success: true,
      documentType: config,
      templates
    });
  } catch (error) {
    logger.error('Error in getTemplatesForDocument controller:', error);
    res.status(500).json({ error: 'Failed to retrieve templates for document type' });
  }
};

/**
 * Create a custom template set
 * POST /api/v1/templates/custom-set
 */
export const createCustomTemplateSet = async (req, res) => {
  try {
    const { templateIds, languageLevel } = req.body;

    if (!templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({ error: 'templateIds array is required' });
    }

    const customSet = await modularTemplateService.createCustomSet(templateIds, {
      languageLevel: languageLevel || 'basic'
    });

    res.json({
      success: true,
      customSet
    });
  } catch (error) {
    logger.error('Error in createCustomTemplateSet controller:', error);
    res.status(500).json({ error: 'Failed to create custom template set' });
  }
};

/**
 * Get terminology for a specific term
 * GET /api/v1/templates/terminology/:term
 */
export const getTerminology = async (req, res) => {
  try {
    const { term } = req.params;
    const { level, documentType } = req.query;

    const terminology = await modularTemplateService.getTerminology(
      term,
      level || 'basic',
      documentType
    );

    if (!terminology) {
      return res.status(404).json({ error: `Term not found: ${term}` });
    }

    res.json({
      success: true,
      term,
      level: level || 'basic',
      terminology
    });
  } catch (error) {
    logger.error('Error in getTerminology controller:', error);
    res.status(500).json({ error: 'Failed to retrieve terminology' });
  }
};

/**
 * Expand abbreviations in text
 * POST /api/v1/templates/expand
 */
export const expandAbbreviations = async (req, res) => {
  try {
    const { text, documentType } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const expanded = await modularTemplateService.expandAbbreviations(
      text,
      documentType || 'epikrise'
    );

    res.json({
      success: true,
      original: text,
      expanded
    });
  } catch (error) {
    logger.error('Error in expandAbbreviations controller:', error);
    res.status(500).json({ error: 'Failed to expand abbreviations' });
  }
};

/**
 * Abbreviate text
 * POST /api/v1/templates/abbreviate
 */
export const abbreviateText = async (req, res) => {
  try {
    const { text, documentType } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const abbreviated = await modularTemplateService.abbreviateText(
      text,
      documentType || 'journal'
    );

    res.json({
      success: true,
      original: text,
      abbreviated
    });
  } catch (error) {
    logger.error('Error in abbreviateText controller:', error);
    res.status(500).json({ error: 'Failed to abbreviate text' });
  }
};

/**
 * Get terms by category
 * GET /api/v1/templates/terms/:category
 */
export const getTermsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { level } = req.query;

    const validCategories = ['anatomy', 'treatments', 'examinations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const terms = await modularTemplateService.getTermsByCategory(
      category,
      level || 'basic'
    );

    res.json({
      success: true,
      category,
      level: level || 'basic',
      terms
    });
  } catch (error) {
    logger.error('Error in getTermsByCategory controller:', error);
    res.status(500).json({ error: 'Failed to retrieve terms' });
  }
};

export default {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  incrementUsage,
  getCategories,
  searchTemplates,
  getTestsLibrary,
  getTestByCode,
  getUserPreferences,
  addFavorite,
  removeFavorite,
  getPhrases,
  getPhrasesByRegion,
  getRedFlags,
  screenRedFlags,
  getTestClusters,
  getTestClusterByCondition,
  getFMSTemplates,
  // Document Type Template endpoints
  getDocumentTypes,
  getTemplatesForDocument,
  createCustomTemplateSet,
  getTerminology,
  expandAbbreviations,
  abbreviateText,
  getTermsByCategory
};
