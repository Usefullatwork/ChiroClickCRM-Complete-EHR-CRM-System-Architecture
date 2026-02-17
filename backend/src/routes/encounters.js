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
 * @swagger
 * /encounters/validate:
 *   post:
 *     summary: Validate SOAP data without saving
 *     tags: [Encounters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encounterType:
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
 *       200:
 *         description: Validation result
 *       500:
 *         description: Validation failed
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
 * @swagger
 * /encounters/{id}:
 *   get:
 *     summary: Get encounter by ID
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
 *         description: Encounter details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClinicalEncounter'
 *       404:
 *         description: Encounter not found
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /encounters/{id}:
 *   patch:
 *     summary: Update encounter
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Encounter updated
 *       404:
 *         description: Encounter not found
 *       409:
 *         description: Encounter is signed and cannot be modified
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
 * @swagger
 * /encounters/{id}/generate-note:
 *   post:
 *     summary: Generate formatted clinical note
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [SOAP, NARRATIVE, STRUCTURED]
 *     responses:
 *       200:
 *         description: Generated note
 *       404:
 *         description: Encounter not found
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
 * @swagger
 * /encounters/{id}/context:
 *   get:
 *     summary: Load encounter with full patient history context
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
 *         description: Encounter with patient context
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encounter:
 *                   $ref: '#/components/schemas/ClinicalEncounter'
 *                 context:
 *                   type: object
 *                   properties:
 *                     previousEncounters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ClinicalEncounter'
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Encounter not found
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
 * @swagger
 * /encounters/{id}/examination:
 *   post:
 *     summary: Record examination findings for an encounter
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               orthopedic:
 *                 type: object
 *               neurological:
 *                 type: object
 *               rom:
 *                 type: object
 *               palpation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Examination recorded
 *       404:
 *         description: Encounter not found
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
 * @swagger
 * /encounters/{id}/treatment:
 *   post:
 *     summary: Record treatment for an encounter
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               treatment_codes:
 *                 type: array
 *                 items:
 *                   type: string
 *               adjustments:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Treatment recorded
 *       404:
 *         description: Encounter not found
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
 * @swagger
 * /encounters/{id}/finalize:
 *   post:
 *     summary: Finalize encounter (generate note, sign, suggest follow-up)
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
 *         description: Encounter finalized
 *       404:
 *         description: Encounter not found
 *       409:
 *         description: Encounter already finalized
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
 * @swagger
 * /encounters/{encounterId}/amendments:
 *   get:
 *     summary: Get all amendments for an encounter
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of amendments
 *       404:
 *         description: Encounter not found
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
 * @swagger
 * /encounters/{encounterId}/amendments/{amendmentId}/sign:
 *   post:
 *     summary: Sign an amendment
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: amendmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Amendment signed
 *       404:
 *         description: Amendment not found
 *       409:
 *         description: Amendment already signed
 */
router.post(
  '/:encounterId/amendments/:amendmentId/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.signAmendment
);

/**
 * @swagger
 * /encounters/{encounterId}/amendments/{amendmentId}:
 *   delete:
 *     summary: Delete unsigned amendment
 *     tags: [Encounters]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: amendmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Amendment deleted
 *       404:
 *         description: Amendment not found
 *       409:
 *         description: Cannot delete signed amendment
 */
router.delete(
  '/:encounterId/amendments/:amendmentId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  amendmentController.deleteAmendment
);

export default router;
