/**
 * Clinical Encounters Routes
 */

import express from 'express';
import * as encounterController from '../controllers/encounters.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate, createEncounterSchema } from '../middleware/validator.js';

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
  encounterController.getEncounters
);

/**
 * @route   GET /api/v1/encounters/:id
 * @desc    Get encounter by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
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
  encounterController.updateEncounter
);

/**
 * @route   POST /api/v1/encounters/:id/sign
 * @desc    Sign encounter (makes immutable)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  encounterController.signEncounter
);

/**
 * @route   POST /api/v1/encounters/:id/generate-note
 * @desc    Generate formatted note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/generate-note',
  requireRole(['ADMIN', 'PRACTITIONER']),
  encounterController.generateNote
);

export default router;
