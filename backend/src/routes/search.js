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
 * @swagger
 * /search/patients:
 *   get:
 *     summary: Search patients using full-text search
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Patient search results
 *       400:
 *         description: Query too short
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
 * @swagger
 * /search/diagnosis:
 *   get:
 *     summary: Search diagnosis codes (ICPC-2, ICD-10)
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: system
 *         schema:
 *           type: string
 *           enum: [icpc2, icd10]
 *     responses:
 *       200:
 *         description: Diagnosis code search results
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
 * @swagger
 * /search/encounters:
 *   get:
 *     summary: Search clinical encounters (SOAP notes)
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: practitionerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Encounter search results
 *       400:
 *         description: Query too short
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
 * @swagger
 * /search/global:
 *   get:
 *     summary: Global search across all entities
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Results across patients, encounters, and diagnoses
 *       400:
 *         description: Query too short
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
 * @swagger
 * /search/suggest:
 *   get:
 *     summary: Get search suggestions (autocomplete)
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [patient, diagnosis, encounter]
 *           default: patient
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
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
