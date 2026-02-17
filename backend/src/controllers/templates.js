/**
 * Clinical Templates Controller
 * Handles HTTP requests for clinical template management
 */

import * as templateService from '../services/templates.js';
import _logger from '../config/logger.js';

/**
 * Get all templates
 * GET /api/v1/templates
 */
export const getAllTemplates = async (req, res) => {
  const { organizationId } = req.user;
  const options = {
    category: req.query.category,
    subcategory: req.query.subcategory,
    soapSection: req.query.soapSection,
    language: req.query.language || 'NO',
    favoritesOnly: req.query.favoritesOnly === 'true',
    search: req.query.search,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
  };

  const result = await templateService.getAllTemplates(organizationId, options);
  res.json(result);
};

/**
 * Get templates grouped by category
 * GET /api/v1/templates/by-category
 */
export const getTemplatesByCategory = async (req, res) => {
  const { organizationId } = req.user;
  const language = req.query.language || 'NO';

  const result = await templateService.getTemplatesByCategory(organizationId, language);
  res.json(result);
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
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
};

/**
 * Create new template
 * POST /api/v1/templates
 */
export const createTemplate = async (req, res) => {
  const { organizationId, userId } = req.user;

  const template = await templateService.createTemplate(organizationId, userId, req.body);
  res.status(201).json(template);
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
    if (error.message.includes('Cannot modify')) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
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
    if (error.message.includes('Cannot delete')) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
};

/**
 * Toggle favorite status
 * POST /api/v1/templates/:id/favorite
 */
export const toggleFavorite = async (req, res) => {
  const { organizationId } = req.user;
  const { id } = req.params;

  const template = await templateService.toggleFavorite(organizationId, id);
  res.json(template);
};

/**
 * Increment usage count
 * POST /api/v1/templates/:id/use
 */
export const incrementUsage = async (req, res) => {
  const { id } = req.params;

  await templateService.incrementUsage(id);
  res.json({ message: 'Usage count incremented' });
};

/**
 * Get template categories
 * GET /api/v1/templates/categories
 */
export const getCategories = async (req, res) => {
  const { organizationId } = req.user;
  const language = req.query.language || 'NO';

  const categories = await templateService.getCategories(organizationId, language);
  res.json(categories);
};

/**
 * Search templates
 * GET /api/v1/templates/search
 */
export const searchTemplates = async (req, res) => {
  const { organizationId } = req.user;
  const { q } = req.query;
  const language = req.query.language || 'NO';

  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const templates = await templateService.searchTemplates(organizationId, q, language);
  res.json(templates);
};

/**
 * Get orthopedic tests library
 * GET /api/v1/templates/tests/library
 */
export const getTestsLibrary = async (req, res) => {
  const filters = {
    testCategory: req.query.testCategory,
    bodyRegion: req.query.bodyRegion,
    system: req.query.system,
    search: req.query.search,
    language: req.query.language || 'NO',
  };

  const tests = await templateService.getTestsLibrary(filters);
  res.json(tests);
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
    if (error.message === 'Test not found') {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
};

/**
 * Get user template preferences
 * GET /api/v1/templates/preferences/user
 */
export const getUserPreferences = async (req, res) => {
  const { userId, organizationId } = req.user;

  const preferences = await templateService.getUserPreferences(userId, organizationId);
  res.json(preferences);
};

/**
 * Add template to favorites
 * POST /api/v1/templates/preferences/favorites/:templateId
 */
export const addFavorite = async (req, res) => {
  const { userId, organizationId } = req.user;
  const { templateId } = req.params;

  await templateService.addFavoriteTemplate(userId, organizationId, templateId);
  res.json({ message: 'Template added to favorites' });
};

/**
 * Remove template from favorites
 * DELETE /api/v1/templates/preferences/favorites/:templateId
 */
export const removeFavorite = async (req, res) => {
  const { userId, organizationId } = req.user;
  const { templateId } = req.params;

  await templateService.removeFavoriteTemplate(userId, organizationId, templateId);
  res.json({ message: 'Template removed from favorites' });
};

/**
 * Get clinical phrases
 * GET /api/v1/templates/phrases
 */
export const getPhrases = async (req, res) => {
  const { organizationId } = req.user;
  const options = {
    category: req.query.category,
    language: req.query.language || 'NO',
    search: req.query.search,
  };

  const phrases = await templateService.getPhrases(organizationId, options);
  res.json(phrases);
};

/**
 * Get phrases by body region
 * GET /api/v1/templates/phrases/byregion/:region
 */
export const getPhrasesByRegion = async (req, res) => {
  const { organizationId } = req.user;
  const { region } = req.params;
  const language = req.query.language || 'NO';

  const phrases = await templateService.getPhrasesByRegion(organizationId, region, language);
  res.json(phrases);
};

/**
 * Get red flags library
 * GET /api/v1/templates/red-flags
 */
export const getRedFlags = async (req, res) => {
  const filters = {
    pathologyCategory: req.query.pathologyCategory,
    bodyRegion: req.query.bodyRegion,
    significanceLevel: req.query.significanceLevel,
    language: req.query.language || 'NO',
  };

  const redFlags = await templateService.getRedFlags(filters);
  res.json(redFlags);
};

/**
 * Screen patient for red flags
 * POST /api/v1/templates/red-flags/screen
 */
export const screenRedFlags = async (req, res) => {
  const { patientData, symptoms, findings } = req.body;

  const screening = await templateService.screenRedFlags(patientData, symptoms, findings);
  res.json(screening);
};

/**
 * Get test clusters
 * GET /api/v1/templates/test-clusters
 */
export const getTestClusters = async (req, res) => {
  const filters = {
    bodyRegion: req.query.bodyRegion,
    language: req.query.language || 'NO',
  };

  const clusters = await templateService.getTestClusters(filters);
  res.json(clusters);
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
    if (error.message === 'Cluster not found') {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
};

/**
 * Get FMS templates
 * GET /api/v1/templates/fms
 */
export const getFMSTemplates = async (req, res) => {
  const language = req.query.language || 'NO';

  const fmsTemplates = await templateService.getFMSTemplates(language);
  res.json(fmsTemplates);
};

// ============================================
// Document Type Template Endpoints
// ============================================

// Import the modular template service
import {
  templateService as modularTemplateService,
  getAllDocumentTypes,
  getDocumentTypeConfig,
} from '../templates/index.js';

/**
 * Get all document types
 * GET /api/v1/templates/document-types
 */
export const getDocumentTypes = async (req, res) => {
  const documentTypes = getAllDocumentTypes();
  res.json({
    success: true,
    documentTypes,
  });
};

/**
 * Get templates for a specific document type
 * GET /api/v1/templates/for-document/:type
 */
export const getTemplatesForDocument = async (req, res) => {
  const { type } = req.params;
  const { practitioner, specialty, bodyRegion } = req.query;

  const config = getDocumentTypeConfig(type);
  if (!config) {
    return res.status(404).json({ error: `Unknown document type: ${type}` });
  }

  const templates = await modularTemplateService.loadForDocumentType(type, {
    practitioner,
    specialty,
    bodyRegion,
  });

  res.json({
    success: true,
    documentType: config,
    templates,
  });
};

/**
 * Create a custom template set
 * POST /api/v1/templates/custom-set
 */
export const createCustomTemplateSet = async (req, res) => {
  const { templateIds, languageLevel } = req.body;

  if (!templateIds || !Array.isArray(templateIds)) {
    return res.status(400).json({ error: 'templateIds array is required' });
  }

  const customSet = await modularTemplateService.createCustomSet(templateIds, {
    languageLevel: languageLevel || 'basic',
  });

  res.json({
    success: true,
    customSet,
  });
};

/**
 * Get terminology for a specific term
 * GET /api/v1/templates/terminology/:term
 */
export const getTerminology = async (req, res) => {
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
    terminology,
  });
};

/**
 * Expand abbreviations in text
 * POST /api/v1/templates/expand
 */
export const expandAbbreviations = async (req, res) => {
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
    expanded,
  });
};

/**
 * Abbreviate text
 * POST /api/v1/templates/abbreviate
 */
export const abbreviateText = async (req, res) => {
  const { text, documentType } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const abbreviated = await modularTemplateService.abbreviateText(text, documentType || 'journal');

  res.json({
    success: true,
    original: text,
    abbreviated,
  });
};

/**
 * Get terms by category
 * GET /api/v1/templates/terms/:category
 */
export const getTermsByCategory = async (req, res) => {
  const { category } = req.params;
  const { level } = req.query;

  const validCategories = ['anatomy', 'treatments', 'examinations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
    });
  }

  const terms = await modularTemplateService.getTermsByCategory(category, level || 'basic');

  res.json({
    success: true,
    category,
    level: level || 'basic',
    terms,
  });
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
  getTermsByCategory,
};
