/**
 * Vestibular Assessments Routes
 */

import express from 'express';
import * as vestibularController from '../controllers/vestibular.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  createAssessmentSchema,
  getAssessmentSchema,
  getPatientAssessmentsSchema,
  getEncounterAssessmentSchema,
  updateAssessmentSchema,
  deleteAssessmentSchema,
  getBPPVTrendsSchema,
} from '../validators/vestibular.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /vestibular:
 *   post:
 *     summary: Create new vestibular assessment
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VestibularAssessment'
 *     responses:
 *       201:
 *         description: Assessment created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createAssessmentSchema),
  vestibularController.createAssessment
);

/**
 * @swagger
 * /vestibular/{id}:
 *   get:
 *     summary: Get vestibular assessment by ID
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assessment details
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getAssessmentSchema),
  vestibularController.getAssessment
);

/**
 * @swagger
 * /vestibular/patient/{patientId}:
 *   get:
 *     summary: Get all vestibular assessments for a patient
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of patient assessments
 */
router.get(
  '/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientAssessmentsSchema),
  vestibularController.getPatientAssessments
);

/**
 * @swagger
 * /vestibular/encounter/{encounterId}:
 *   get:
 *     summary: Get vestibular assessment by encounter ID
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assessment for encounter
 */
router.get(
  '/encounter/:encounterId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEncounterAssessmentSchema),
  vestibularController.getEncounterAssessment
);

/**
 * @swagger
 * /vestibular/{id}:
 *   patch:
 *     summary: Update vestibular assessment
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: Assessment updated
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateAssessmentSchema),
  vestibularController.updateAssessment
);

/**
 * @swagger
 * /vestibular/{id}:
 *   delete:
 *     summary: Delete vestibular assessment
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assessment deleted
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(deleteAssessmentSchema),
  vestibularController.deleteAssessment
);

/**
 * @swagger
 * /vestibular/patient/{patientId}/bppv-trends:
 *   get:
 *     summary: Get BPPV trends for patient
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: BPPV trend data over time
 */
router.get(
  '/patient/:patientId/bppv-trends',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getBPPVTrendsSchema),
  vestibularController.getBPPVTrends
);

/**
 * @swagger
 * /vestibular/stats/diagnoses:
 *   get:
 *     summary: Get common vestibular diagnoses statistics
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Diagnosis frequency statistics
 */
router.get(
  '/stats/diagnoses',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getCommonDiagnoses
);

/**
 * @swagger
 * /vestibular/stats/efficacy:
 *   get:
 *     summary: Get treatment efficacy statistics
 *     tags: [Vestibular]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Treatment efficacy data
 */
router.get(
  '/stats/efficacy',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getTreatmentEfficacy
);

export default router;
