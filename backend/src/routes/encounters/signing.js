/**
 * Encounters Signing Routes
 * Encounter signing and amendment management
 */

import express from 'express';
import * as encounterController from '../../controllers/encounters.js';
import * as amendmentController from '../../controllers/amendments.js';
import { requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { signEncounterSchema } from '../../validators/encounter.validators.js';

const router = express.Router();

/**
 * @swagger
 * /encounters/{id}/sign:
 *   post:
 *     summary: Sign encounter (makes it immutable)
 *     tags: [Encounters]
 */
router.post(
  '/:id/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(signEncounterSchema),
  encounterController.signEncounter
);

// Amendments
router.get(
  '/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.getAmendments
);
router.post(
  '/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.createAmendment
);
router.post(
  '/:encounterId/amendments/:amendmentId/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.signAmendment
);
router.delete(
  '/:encounterId/amendments/:amendmentId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.deleteAmendment
);

export default router;
