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
 * @route   GET /api/v1/outcomes/patient/:patientId/summary
 * @desc    Get patient outcome summary
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/patient/:patientId/summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientOutcomeSummarySchema),
  outcomeController.getPatientOutcomeSummary
);

/**
 * @route   GET /api/v1/outcomes/patient/:patientId/longitudinal
 * @desc    Get patient longitudinal data for charts
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/patient/:patientId/longitudinal',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientLongitudinalSchema),
  outcomeController.getPatientLongitudinalData
);

/**
 * @route   POST /api/v1/outcomes/patient/:patientId/predict
 * @desc    Predict treatment outcome
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/patient/:patientId/predict',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(predictOutcomeSchema),
  outcomeController.predictTreatmentOutcome
);

/**
 * @route   GET /api/v1/outcomes/diagnosis/:icpcCode
 * @desc    Get diagnosis outcome statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/diagnosis/:icpcCode',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getDiagnosisOutcomeSchema),
  outcomeController.getDiagnosisOutcomeStats
);

/**
 * @route   GET /api/v1/outcomes/treatments
 * @desc    Get treatment outcome statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/treatments',
  requireRole(['ADMIN', 'PRACTITIONER']),
  outcomeController.getTreatmentOutcomeStats
);

/**
 * @route   GET /api/v1/outcomes/cohort-analysis
 * @desc    Get cohort analysis
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   POST /api/v1/outcomes/questionnaires
 * @desc    Submit a scored questionnaire
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/questionnaires',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(submitQuestionnaireSchema),
  questionnaireController.submitQuestionnaire
);

/**
 * @route   GET /api/v1/outcomes/questionnaires/patient/:patientId/trend
 * @desc    Get trend data for charts (optional ?type=ODI)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/questionnaires/patient/:patientId/trend',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientQuestionnairesSchema),
  questionnaireController.getPatientTrend
);

/**
 * @route   GET /api/v1/outcomes/questionnaires/patient/:patientId
 * @desc    Get patient's questionnaires (optional ?type=ODI)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/questionnaires/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientQuestionnairesSchema),
  questionnaireController.getPatientQuestionnaires
);

/**
 * @route   GET /api/v1/outcomes/questionnaires/:id
 * @desc    Get single questionnaire response
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/questionnaires/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getQuestionnaireByIdSchema),
  questionnaireController.getQuestionnaireById
);

/**
 * @route   DELETE /api/v1/outcomes/questionnaires/:id
 * @desc    Delete a questionnaire response
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete(
  '/questionnaires/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(deleteQuestionnaireSchema),
  questionnaireController.deleteQuestionnaire
);

export default router;
