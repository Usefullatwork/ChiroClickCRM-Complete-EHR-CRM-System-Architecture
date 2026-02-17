/**
 * Outcomes Routes
 */

import express from 'express';
import * as outcomeController from '../controllers/outcomes.js';
import * as questionnaireController from '../controllers/outcomeQuestionnaires.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  getPatientOutcomeSummarySchema,
  getPatientLongitudinalSchema,
  predictOutcomeSchema,
  getDiagnosisOutcomeSchema,
  submitQuestionnaireSchema,
  getPatientQuestionnairesSchema,
  getQuestionnaireByIdSchema,
  deleteQuestionnaireSchema,
} from '../validators/outcomes.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /outcomes/patient/{patientId}/summary:
 *   get:
 *     summary: Get patient outcome summary
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient outcome summary with scores and trends
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId/summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientOutcomeSummarySchema),
  outcomeController.getPatientOutcomeSummary
);

/**
 * @swagger
 * /outcomes/patient/{patientId}/longitudinal:
 *   get:
 *     summary: Get patient longitudinal outcome data for charts
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: measure
 *         schema:
 *           type: string
 *           enum: [VAS, ODI, NDI, DASH, NPRS]
 *         description: Filter by outcome measure
 *     responses:
 *       200:
 *         description: Time-series outcome data for charting
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId/longitudinal',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientLongitudinalSchema),
  outcomeController.getPatientLongitudinalData
);

/**
 * @swagger
 * /outcomes/patient/{patientId}/predict:
 *   post:
 *     summary: Predict treatment outcome based on patient data
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: patientId
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
 *               diagnosis_code:
 *                 type: string
 *               treatment_plan:
 *                 type: object
 *     responses:
 *       200:
 *         description: Predicted outcome with confidence score
 *       404:
 *         description: Patient not found
 */
router.post(
  '/patient/:patientId/predict',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(predictOutcomeSchema),
  outcomeController.predictTreatmentOutcome
);

/**
 * @swagger
 * /outcomes/diagnosis/{icpcCode}:
 *   get:
 *     summary: Get outcome statistics for a specific diagnosis
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: icpcCode
 *         required: true
 *         schema:
 *           type: string
 *         description: ICPC-2 code (e.g. L03)
 *     responses:
 *       200:
 *         description: Outcome statistics for the diagnosis
 *       404:
 *         description: Diagnosis not found
 */
router.get(
  '/diagnosis/:icpcCode',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getDiagnosisOutcomeSchema),
  outcomeController.getDiagnosisOutcomeStats
);

/**
 * @swagger
 * /outcomes/treatments:
 *   get:
 *     summary: Get treatment outcome statistics
 *     tags: [Outcomes]
 *     responses:
 *       200:
 *         description: Treatment outcome statistics across all patients
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/treatments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  outcomeController.getTreatmentOutcomeStats
);

/**
 * @swagger
 * /outcomes/cohort-analysis:
 *   get:
 *     summary: Get cohort analysis of treatment outcomes
 *     tags: [Outcomes]
 *     responses:
 *       200:
 *         description: Cohort analysis data
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/cohort-analysis',
  requireRole(['ADMIN', 'PRACTITIONER']),
  outcomeController.getCohortAnalysis
);

// ============================================================================
// QUESTIONNAIRE ENDPOINTS (ODI, NDI, VAS, DASH, NPRS)
// ============================================================================

/**
 * @swagger
 * /outcomes/questionnaires:
 *   post:
 *     summary: Submit a scored questionnaire (ODI, NDI, VAS, DASH, NPRS)
 *     tags: [Outcomes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, type, answers]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [ODI, NDI, VAS, DASH, NPRS]
 *               answers:
 *                 type: object
 *               encounter_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Questionnaire submitted with calculated score
 *       400:
 *         description: Validation error
 */
router.post(
  '/questionnaires',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(submitQuestionnaireSchema),
  questionnaireController.submitQuestionnaire
);

/**
 * @swagger
 * /outcomes/questionnaires/patient/{patientId}/trend:
 *   get:
 *     summary: Get questionnaire trend data for charts
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ODI, NDI, VAS, DASH, NPRS]
 *         description: Filter by questionnaire type
 *     responses:
 *       200:
 *         description: Trend data with scores over time
 *       404:
 *         description: Patient not found
 */
router.get(
  '/questionnaires/patient/:patientId/trend',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientQuestionnairesSchema),
  questionnaireController.getPatientTrend
);

/**
 * @swagger
 * /outcomes/questionnaires/patient/{patientId}:
 *   get:
 *     summary: Get patient's questionnaire responses
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ODI, NDI, VAS, DASH, NPRS]
 *         description: Filter by questionnaire type
 *     responses:
 *       200:
 *         description: List of questionnaire responses
 *       404:
 *         description: Patient not found
 */
router.get(
  '/questionnaires/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientQuestionnairesSchema),
  questionnaireController.getPatientQuestionnaires
);

/**
 * @swagger
 * /outcomes/questionnaires/{id}:
 *   get:
 *     summary: Get single questionnaire response by ID
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Questionnaire response with score
 *       404:
 *         description: Questionnaire not found
 */
router.get(
  '/questionnaires/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getQuestionnaireByIdSchema),
  questionnaireController.getQuestionnaireById
);

/**
 * @swagger
 * /outcomes/questionnaires/{id}:
 *   delete:
 *     summary: Delete a questionnaire response
 *     tags: [Outcomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Questionnaire deleted
 *       404:
 *         description: Questionnaire not found
 */
router.delete(
  '/questionnaires/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(deleteQuestionnaireSchema),
  questionnaireController.deleteQuestionnaire
);

export default router;
