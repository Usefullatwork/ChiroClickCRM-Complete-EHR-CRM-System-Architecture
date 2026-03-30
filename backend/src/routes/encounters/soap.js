/**
 * Encounters SOAP Routes
 * Validation, CRUD, and note generation for clinical encounters
 */

import express from 'express';
import * as encounterController from '../../controllers/encounters.js';
import { requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { readLimiter } from '../../middleware/rateLimiting.js';
import {
  createEncounterSchema,
  updateEncounterSchema,
  getEncountersSchema,
  getEncounterSchema,
  generateNoteSchema,
} from '../../validators/encounter.validators.js';
import { validate as validateNote } from '../../services/clinical/noteValidator.js';
import { logAction } from '../../services/practice/auditLog.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /encounters/validate:
 *   post:
 *     summary: Validate SOAP data without saving
 *     tags: [Encounters]
 */
router.post('/validate', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { encounterType, ...soapData } = req.body;
    const validation = validateNote(soapData, encounterType || 'SOAP');

    await logAction('ENCOUNTER_VALIDATE', req.user.id, {
      resourceType: 'clinical_encounter',
      metadata: {
        encounterType: encounterType || 'SOAP',
        organization_id: req.user.organization_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error('Error validating encounter data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate encounter data',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /encounters:
 *   get:
 *     summary: List all encounters with filters
 *     tags: [Encounters]
 */
router.get(
  '/',
  readLimiter,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncountersSchema),
  encounterController.getEncounters
);

/**
 * @swagger
 * /encounters/{id}:
 *   get:
 *     summary: Get encounter by ID
 *     tags: [Encounters]
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncounterSchema),
  encounterController.getEncounter
);

/**
 * @swagger
 * /encounters:
 *   post:
 *     summary: Create a new clinical encounter
 *     tags: [Encounters]
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createEncounterSchema),
  encounterController.createEncounter
);

/**
 * @swagger
 * /encounters/{id}:
 *   patch:
 *     summary: Update encounter
 *     tags: [Encounters]
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateEncounterSchema),
  encounterController.updateEncounter
);

/**
 * @swagger
 * /encounters/{id}/generate-note:
 *   post:
 *     summary: Generate formatted clinical note
 *     tags: [Encounters]
 */
router.post(
  '/:id/generate-note',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateNoteSchema),
  encounterController.generateNote
);

export default router;
