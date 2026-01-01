/**
 * Clinical Encounters Routes
 */

import express from 'express';
import * as encounterController from '../controllers/encounters.js';
import * as amendmentController from '../controllers/amendments.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createEncounterSchema,
  updateEncounterSchema,
  getEncountersSchema,
  getEncounterSchema,
  signEncounterSchema,
  generateNoteSchema
} from '../validators/encounter.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/encounters
 * @desc    Get all encounters with filters
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncountersSchema),
  encounterController.getEncounters
);

/**
 * @route   GET /api/v1/encounters/:id
 * @desc    Get encounter by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncounterSchema),
  encounterController.getEncounter
);

/**
 * @route   POST /api/v1/encounters
 * @desc    Create new encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createEncounterSchema),
  encounterController.createEncounter
);

/**
 * @route   PATCH /api/v1/encounters/:id
 * @desc    Update encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateEncounterSchema),
  encounterController.updateEncounter
);

/**
 * @route   POST /api/v1/encounters/:id/sign
 * @desc    Sign encounter (makes immutable)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(signEncounterSchema),
  encounterController.signEncounter
);

/**
 * @route   POST /api/v1/encounters/:id/generate-note
 * @desc    Generate formatted note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/generate-note',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateNoteSchema),
  encounterController.generateNote
);

// ==========================================
// AMENDMENT ROUTES (for signed encounters)
// ==========================================

/**
 * @route   GET /api/v1/encounters/:encounterId/amendments
 * @desc    Get all amendments for an encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.getAmendments
);

/**
 * @route   POST /api/v1/encounters/:encounterId/amendments
 * @desc    Create amendment for signed encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.createAmendment
);

/**
 * @route   POST /api/v1/encounters/:encounterId/amendments/:amendmentId/sign
 * @desc    Sign an amendment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:encounterId/amendments/:amendmentId/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.signAmendment
);

/**
 * @route   DELETE /api/v1/encounters/:encounterId/amendments/:amendmentId
 * @desc    Delete unsigned amendment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete('/:encounterId/amendments/:amendmentId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.deleteAmendment
);

export default router;
