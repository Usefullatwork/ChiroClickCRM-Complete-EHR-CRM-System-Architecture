/**
 * Clinical Encounters Routes
 */

import express from 'express';
import * as encounterController from '../controllers/encounters.js';
import * as amendmentController from '../controllers/amendments.js';
import * as clinicalWorkflow from '../services/clinicalWorkflow.js';
import * as encounterService from '../services/encounters.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createEncounterSchema,
  updateEncounterSchema,
  getEncountersSchema,
  getEncounterSchema,
  signEncounterSchema,
  generateNoteSchema,
} from '../validators/encounter.validators.js';
import { validate as validateNote } from '../services/noteValidator.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   POST /api/v1/encounters/validate
 * @desc    Validate SOAP data without saving
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/validate', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { encounterType, ...soapData } = req.body;
    const validation = validateNote(soapData, encounterType || 'SOAP');

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
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of encounters
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncountersSchema),
  encounterController.getEncounters
);

/**
 * @route   GET /api/v1/encounters/:id
 * @desc    Get encounter by ID
 * @access  Private (ADMIN, PRACTITIONER)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               encounter_type:
 *                 type: string
 *                 enum: [SOAP, INITIAL, FOLLOW_UP, RE_EVALUATION]
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Encounter created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createEncounterSchema),
  encounterController.createEncounter
);

/**
 * @route   PATCH /api/v1/encounters/:id
 * @desc    Update encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateEncounterSchema),
  encounterController.updateEncounter
);

/**
 * @swagger
 * /encounters/{id}/sign:
 *   post:
 *     summary: Sign encounter (makes it immutable)
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Encounter signed
 *       404:
 *         description: Encounter not found
 *       409:
 *         description: Encounter already signed
 */
router.post(
  '/:id/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(signEncounterSchema),
  encounterController.signEncounter
);

/**
 * @route   POST /api/v1/encounters/:id/generate-note
 * @desc    Generate formatted note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/:id/generate-note',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateNoteSchema),
  encounterController.generateNote
);

// ==========================================
// CLINICAL WORKFLOW ROUTES
// ==========================================

/**
 * @route   GET /api/v1/encounters/:id/context
 * @desc    Load encounter with full patient history context
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id/context', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const encounter = await encounterService.getEncounterById(organizationId, id);

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const [encounterHistory, redFlags] = await Promise.all([
      encounterService.getPatientEncounterHistory(organizationId, encounter.patient_id),
      encounterService.checkRedFlags(encounter.patient_id, {}),
    ]);

    res.json({
      encounter,
      context: {
        previousEncounters: encounterHistory,
        alerts: redFlags.alerts,
        warnings: redFlags.warnings,
      },
    });
  } catch (error) {
    logger.error('Error loading encounter context:', error);
    res.status(500).json({ error: 'Failed to load encounter context' });
  }
});

/**
 * @route   POST /api/v1/encounters/:id/examination
 * @desc    Record examination findings for an encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/examination', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.recordExamination(organizationId, id, req.body, user.id);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error recording examination:', error);
    res.status(500).json({ error: 'Failed to record examination' });
  }
});

/**
 * @route   POST /api/v1/encounters/:id/treatment
 * @desc    Record treatment for an encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/treatment', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.recordTreatment(organizationId, id, req.body);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error recording treatment:', error);
    res.status(500).json({ error: 'Failed to record treatment' });
  }
});

/**
 * @route   POST /api/v1/encounters/:id/finalize
 * @desc    Finalize encounter (generate note, sign, suggest follow-up)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/finalize', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.finalizeEncounter(organizationId, id, user.id);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error finalizing encounter:', error);
    res.status(500).json({ error: 'Failed to finalize encounter' });
  }
});

// ==========================================
// AMENDMENT ROUTES (for signed encounters)
// ==========================================

/**
 * @route   GET /api/v1/encounters/:encounterId/amendments
 * @desc    Get all amendments for an encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.getAmendments
);

/**
 * @swagger
 * /encounters/{encounterId}/amendments:
 *   post:
 *     summary: Create amendment for a signed encounter
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason, changes]
 *             properties:
 *               reason:
 *                 type: string
 *               changes:
 *                 type: object
 *     responses:
 *       201:
 *         description: Amendment created
 *       404:
 *         description: Encounter not found
 */
router.post(
  '/:encounterId/amendments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.createAmendment
);

/**
 * @route   POST /api/v1/encounters/:encounterId/amendments/:amendmentId/sign
 * @desc    Sign an amendment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/:encounterId/amendments/:amendmentId/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.signAmendment
);

/**
 * @route   DELETE /api/v1/encounters/:encounterId/amendments/:amendmentId
 * @desc    Delete unsigned amendment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete(
  '/:encounterId/amendments/:amendmentId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.deleteAmendment
);

export default router;
