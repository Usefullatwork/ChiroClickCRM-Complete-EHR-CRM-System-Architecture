/**
 * Structured Examination Controller
 * Handles HTTP requests for examination protocols and findings management
 */

import * as examinationService from '../services/examinations.js';
import logger from '../config/logger.js';

// ============================================================================
// EXAMINATION PROTOCOLS
// ============================================================================

/**
 * Get all body regions
 * GET /api/v1/examinations/protocols/body-regions
 */
export const getBodyRegions = async (req, res) => {
  try {
    const language = req.query.language || 'NO';
    const regions = await examinationService.getBodyRegions(language);
    res.json(regions);
  } catch (error) {
    logger.error('Error in getBodyRegions controller:', error);
    res.status(500).json({ error: 'Failed to retrieve body regions' });
  }
};

/**
 * Get all categories
 * GET /api/v1/examinations/protocols/categories
 */
export const getCategories = async (req, res) => {
  try {
    const language = req.query.language || 'NO';
    const categories = await examinationService.getCategories(language);
    res.json(categories);
  } catch (error) {
    logger.error('Error in getCategories controller:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

/**
 * Get all examination protocols
 * GET /api/v1/examinations/protocols
 */
export const getAllProtocols = async (req, res) => {
  try {
    const options = {
      bodyRegion: req.query.bodyRegion,
      category: req.query.category,
      language: req.query.language || 'NO',
      search: req.query.search,
      redFlagsOnly: req.query.redFlagsOnly === 'true',
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await examinationService.getAllProtocols(options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getAllProtocols controller:', error);
    res.status(500).json({ error: 'Failed to retrieve examination protocols' });
  }
};

/**
 * Get examination protocol by ID
 * GET /api/v1/examinations/protocols/:id
 */
export const getProtocolById = async (req, res) => {
  try {
    const { id } = req.params;
    const protocol = await examinationService.getProtocolById(id);
    res.json(protocol);
  } catch (error) {
    logger.error('Error in getProtocolById controller:', error);
    res.status(error.message === 'Protocol not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve protocol'
    });
  }
};

/**
 * Search examination protocols
 * GET /api/v1/examinations/protocols/search
 */
export const searchProtocols = async (req, res) => {
  try {
    const { query, language = 'NO', limit = 50 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = await examinationService.searchProtocols(query, language, parseInt(limit));
    res.json(results);
  } catch (error) {
    logger.error('Error in searchProtocols controller:', error);
    res.status(500).json({ error: 'Failed to search protocols' });
  }
};

/**
 * Get protocols by body region
 * GET /api/v1/examinations/protocols/by-region/:region
 */
export const getProtocolsByRegion = async (req, res) => {
  try {
    const { region } = req.params;
    const language = req.query.language || 'NO';

    const protocols = await examinationService.getProtocolsByRegion(region, language);
    res.json(protocols);
  } catch (error) {
    logger.error('Error in getProtocolsByRegion controller:', error);
    res.status(500).json({ error: 'Failed to retrieve protocols by region' });
  }
};

/**
 * Get protocols by category
 * GET /api/v1/examinations/protocols/by-category/:category
 */
export const getProtocolsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const language = req.query.language || 'NO';

    const protocols = await examinationService.getProtocolsByCategory(category, language);
    res.json(protocols);
  } catch (error) {
    logger.error('Error in getProtocolsByCategory controller:', error);
    res.status(500).json({ error: 'Failed to retrieve protocols by category' });
  }
};

// ============================================================================
// EXAMINATION FINDINGS
// ============================================================================

/**
 * Get findings by encounter
 * GET /api/v1/examinations/findings/encounter/:encounterId
 */
export const getFindingsByEncounter = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { organizationId } = req.user;

    const findings = await examinationService.getFindingsByEncounter(organizationId, encounterId);
    res.json(findings);
  } catch (error) {
    logger.error('Error in getFindingsByEncounter controller:', error);
    res.status(500).json({ error: 'Failed to retrieve findings' });
  }
};

/**
 * Get finding by ID
 * GET /api/v1/examinations/findings/:id
 */
export const getFindingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const finding = await examinationService.getFindingById(organizationId, id);
    res.json(finding);
  } catch (error) {
    logger.error('Error in getFindingById controller:', error);
    res.status(error.message === 'Finding not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve finding'
    });
  }
};

/**
 * Create new examination finding
 * POST /api/v1/examinations/findings
 */
export const createFinding = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;

    const finding = await examinationService.createFinding(organizationId, userId, req.body);
    res.status(201).json(finding);
  } catch (error) {
    logger.error('Error in createFinding controller:', error);
    res.status(500).json({ error: 'Failed to create finding' });
  }
};

/**
 * Update examination finding
 * PATCH /api/v1/examinations/findings/:id
 */
export const updateFinding = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const finding = await examinationService.updateFinding(organizationId, id, req.body);
    res.json(finding);
  } catch (error) {
    logger.error('Error in updateFinding controller:', error);
    res.status(error.message === 'Finding not found' ? 404 : 500).json({
      error: error.message || 'Failed to update finding'
    });
  }
};

/**
 * Delete examination finding
 * DELETE /api/v1/examinations/findings/:id
 */
export const deleteFinding = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    await examinationService.deleteFinding(organizationId, id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error in deleteFinding controller:', error);
    res.status(error.message === 'Finding not found' ? 404 : 500).json({
      error: error.message || 'Failed to delete finding'
    });
  }
};

/**
 * Create multiple examination findings in batch
 * POST /api/v1/examinations/findings/batch
 */
export const createBatchFindings = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { findings } = req.body;

    if (!Array.isArray(findings) || findings.length === 0) {
      return res.status(400).json({ error: 'Findings array is required' });
    }

    const results = await examinationService.createBatchFindings(organizationId, userId, findings);
    res.status(201).json(results);
  } catch (error) {
    logger.error('Error in createBatchFindings controller:', error);
    res.status(500).json({ error: 'Failed to create batch findings' });
  }
};

// ============================================================================
// EXAMINATION SUMMARIES & RED FLAGS
// ============================================================================

/**
 * Get examination summary for encounter
 * GET /api/v1/examinations/summary/:encounterId
 */
export const getExaminationSummary = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { organizationId } = req.user;

    const summary = await examinationService.getExaminationSummary(organizationId, encounterId);
    res.json({ summary });
  } catch (error) {
    logger.error('Error in getExaminationSummary controller:', error);
    res.status(500).json({ error: 'Failed to generate examination summary' });
  }
};

/**
 * Get red flags for encounter
 * GET /api/v1/examinations/red-flags/:encounterId
 */
export const getRedFlags = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { organizationId } = req.user;

    const redFlags = await examinationService.getRedFlags(organizationId, encounterId);
    res.json(redFlags);
  } catch (error) {
    logger.error('Error in getRedFlags controller:', error);
    res.status(500).json({ error: 'Failed to check red flags' });
  }
};

// ============================================================================
// EXAMINATION TEMPLATE SETS
// ============================================================================

/**
 * Get all template sets
 * GET /api/v1/examinations/template-sets
 */
export const getAllTemplateSets = async (req, res) => {
  try {
    const language = req.query.language || 'NO';
    const sets = await examinationService.getAllTemplateSets(language);
    res.json(sets);
  } catch (error) {
    logger.error('Error in getAllTemplateSets controller:', error);
    res.status(500).json({ error: 'Failed to retrieve template sets' });
  }
};

/**
 * Get template sets by chief complaint
 * GET /api/v1/examinations/template-sets/by-complaint/:complaint
 */
export const getTemplateSetsByComplaint = async (req, res) => {
  try {
    const { complaint } = req.params;
    const language = req.query.language || 'NO';

    const sets = await examinationService.getTemplateSetsByComplaint(complaint, language);
    res.json(sets);
  } catch (error) {
    logger.error('Error in getTemplateSetsByComplaint controller:', error);
    res.status(500).json({ error: 'Failed to retrieve template sets by complaint' });
  }
};

/**
 * Get template set by ID
 * GET /api/v1/examinations/template-sets/:id
 */
export const getTemplateSetById = async (req, res) => {
  try {
    const { id } = req.params;
    const set = await examinationService.getTemplateSetById(id);
    res.json(set);
  } catch (error) {
    logger.error('Error in getTemplateSetById controller:', error);
    res.status(error.message === 'Template set not found' ? 404 : 500).json({
      error: error.message || 'Failed to retrieve template set'
    });
  }
};

/**
 * Create new template set
 * POST /api/v1/examinations/template-sets
 */
export const createTemplateSet = async (req, res) => {
  try {
    const set = await examinationService.createTemplateSet(req.body);
    res.status(201).json(set);
  } catch (error) {
    logger.error('Error in createTemplateSet controller:', error);
    res.status(500).json({ error: 'Failed to create template set' });
  }
};

/**
 * Increment template set usage count
 * POST /api/v1/examinations/template-sets/:id/use
 */
export const incrementTemplateSetUsage = async (req, res) => {
  try {
    const { id } = req.params;
    await examinationService.incrementTemplateSetUsage(id);
    res.status(200).json({ message: 'Usage count incremented' });
  } catch (error) {
    logger.error('Error in incrementTemplateSetUsage controller:', error);
    res.status(500).json({ error: 'Failed to increment usage count' });
  }
};
