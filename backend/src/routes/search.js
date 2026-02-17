/**
 * Search Routes
 * API endpoints for full-text search
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import * as searchService from '../services/search.js';
import logger from '../utils/logger.js';
import validate from '../middleware/validation.js';
import {
  searchPatientsSchema,
  searchDiagnosisSchema,
  searchEncountersSchema,
  globalSearchSchema,
  suggestSchema,
} from '../validators/search.validators.js';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/search/patients
 * @desc    Search patients using full-text search
 * @access  Private
 */
router.get('/patients', validate(searchPatientsSchema), async (req, res) => {
  const { q, limit = 20, offset = 0, status, includeInactive } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query must be at least 2 characters',
    });
  }

  const results = await searchService.searchPatients(req.organizationId, q, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    status,
    includeInactive: includeInactive === 'true',
  });

  res.json(results);
});

/**
 * @route   GET /api/v1/search/diagnosis
 * @desc    Search diagnosis codes (ICPC-2, ICD-10)
 * @access  Private
 */
router.get('/diagnosis', validate(searchDiagnosisSchema), async (req, res) => {
  const { q, limit = 30, system } = req.query;

  if (!q || q.trim().length < 1) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query is required',
    });
  }

  const results = await searchService.searchDiagnosis(q, {
    limit: parseInt(limit),
    system,
  });

  res.json(results);
});

/**
 * @route   GET /api/v1/search/encounters
 * @desc    Search clinical encounters (SOAP notes)
 * @access  Private
 */
router.get('/encounters', validate(searchEncountersSchema), async (req, res) => {
  const { q, limit = 20, offset = 0, patientId, practitionerId } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query must be at least 2 characters',
    });
  }

  const results = await searchService.searchEncounters(req.organizationId, q, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    patientId,
    practitionerId,
  });

  res.json(results);
});

/**
 * @route   GET /api/v1/search/global
 * @desc    Global search across all entities
 * @access  Private
 */
router.get('/global', validate(globalSearchSchema), async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query must be at least 2 characters',
    });
  }

  const results = await searchService.globalSearch(req.organizationId, q, {
    limit: parseInt(limit),
  });

  res.json(results);
});

/**
 * @route   GET /api/v1/search/suggest
 * @desc    Get search suggestions (autocomplete)
 * @access  Private
 */
router.get('/suggest', validate(suggestSchema), async (req, res) => {
  try {
    const { q, limit = 5, entity = 'patient' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const suggestions = await searchService.suggestCompletions(req.organizationId, q, {
      limit: parseInt(limit),
      entity,
    });

    res.json(suggestions);
  } catch (error) {
    // Graceful fallback: return empty suggestions rather than error
    logger.error('Suggest route error:', error);
    res.json([]);
  }
});

export default router;
