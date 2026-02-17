/**
 * AI Routes
 * AI-powered clinical intelligence endpoints
 */

import express from 'express';
import * as aiController from '../controllers/ai.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  recordFeedbackSchema,
  spellCheckSchema,
  soapSuggestionSchema,
  suggestDiagnosisSchema,
  analyzeRedFlagsSchema,
  clinicalSummarySchema,
  outcomeFeedbackSchema,
  circuitResetSchema,
} from '../validators/ai.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// =================================================================
// AI Feedback & Metrics Endpoints (CQRS)
// =================================================================

/**
 * @swagger
 * /ai/feedback:
 *   post:
 *     summary: Record feedback on AI suggestion
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suggestionId, rating]
 *             properties:
 *               suggestionId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               correctedText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback recorded
 *       400:
 *         description: Validation error
 */
router.post(
  '/feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(recordFeedbackSchema),
  aiController.recordFeedback
);

/**
 * @swagger
 * /ai/metrics:
 *   get:
 *     summary: Get AI performance metrics
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: AI performance metrics (accuracy, latency, usage)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get('/metrics', requireRole(['ADMIN']), aiController.getAIMetrics);

/**
 * @swagger
 * /ai/circuit-status:
 *   get:
 *     summary: Get circuit breaker health status
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Circuit breaker status for each AI service
 */
router.get(
  '/circuit-status',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.getCircuitStatus
);

/**
 * @swagger
 * /ai/circuit-reset/{service}:
 *   post:
 *     summary: Reset circuit breaker for a service
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: Service name to reset
 *     responses:
 *       200:
 *         description: Circuit breaker reset
 *       403:
 *         description: Admin only
 */
router.post(
  '/circuit-reset/:service',
  requireRole(['ADMIN']),
  validate(circuitResetSchema),
  aiController.resetCircuitBreaker
);

/**
 * @swagger
 * /ai/retraining-status:
 *   get:
 *     summary: Check if AI retraining is needed
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retraining status with thresholds and metrics
 */
router.get('/retraining-status', requireRole(['ADMIN']), aiController.getRetrainingStatus);

/**
 * @swagger
 * /ai/trigger-retraining:
 *   post:
 *     summary: Manually trigger AI retraining
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Retraining triggered
 *       403:
 *         description: Admin only
 */
router.post('/trigger-retraining', requireRole(['ADMIN']), aiController.triggerRetraining);

// =================================================================
// Original AI Endpoints
// =================================================================

/**
 * @swagger
 * /ai/spell-check:
 *   post:
 *     summary: Norwegian spell check for clinical notes
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 description: Clinical note text to spell-check
 *     responses:
 *       200:
 *         description: Spell check results with suggestions
 *       400:
 *         description: Validation error
 */
router.post(
  '/spell-check',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(spellCheckSchema),
  aiController.spellCheck
);

/**
 * @swagger
 * /ai/soap-suggestion:
 *   post:
 *     summary: Generate SOAP note suggestions based on chief complaint
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chiefComplaint]
 *             properties:
 *               chiefComplaint:
 *                 type: string
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               encounterType:
 *                 type: string
 *                 enum: [INITIAL, FOLLOW_UP, REASSESSMENT, EMERGENCY]
 *     responses:
 *       200:
 *         description: Generated SOAP note suggestions
 *       400:
 *         description: Validation error
 */
router.post(
  '/soap-suggestion',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(soapSuggestionSchema),
  aiController.generateSOAPSuggestion
);
router.post(
  '/soap-suggestions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(soapSuggestionSchema),
  aiController.generateSOAPSuggestion
);

/**
 * @swagger
 * /ai/suggest-diagnosis:
 *   post:
 *     summary: Suggest ICPC-2 diagnosis codes based on clinical presentation
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chiefComplaint]
 *             properties:
 *               chiefComplaint:
 *                 type: string
 *               soapNotes:
 *                 type: object
 *                 properties:
 *                   subjective:
 *                     type: string
 *                   objective:
 *                     type: string
 *                   assessment:
 *                     type: string
 *     responses:
 *       200:
 *         description: Suggested diagnosis codes (ICPC-2 and ICD-10)
 */
router.post(
  '/suggest-diagnosis',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(suggestDiagnosisSchema),
  aiController.suggestDiagnosis
);

/**
 * @swagger
 * /ai/analyze-red-flags:
 *   post:
 *     summary: Analyze patient data for red flags and safety concerns
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientData]
 *             properties:
 *               patientData:
 *                 type: object
 *                 description: Patient clinical data to analyze
 *               encounterNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Red flag analysis with severity and recommendations
 */
router.post(
  '/analyze-red-flags',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyzeRedFlagsSchema),
  aiController.analyzeRedFlags
);

/**
 * @swagger
 * /ai/clinical-summary:
 *   post:
 *     summary: Generate clinical summary from encounter data
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [encounterId]
 *             properties:
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *               patientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Generated clinical summary
 */
router.post(
  '/clinical-summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(clinicalSummarySchema),
  aiController.generateClinicalSummary
);
router.post(
  '/generate-summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(clinicalSummarySchema),
  aiController.generateClinicalSummary
);

/**
 * @swagger
 * /ai/outcome-feedback:
 *   post:
 *     summary: Record outcome feedback for AI learning
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suggestionId, outcome]
 *             properties:
 *               suggestionId:
 *                 type: string
 *                 format: uuid
 *               outcome:
 *                 type: string
 *                 enum: [improved, same, worse]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Outcome feedback recorded
 */
router.post(
  '/outcome-feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(outcomeFeedbackSchema),
  aiController.recordOutcomeFeedback
);

/**
 * @swagger
 * /ai/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: AI service availability and model status
 */
router.get('/status', requireRole(['ADMIN', 'PRACTITIONER']), aiController.getAIStatus);

/**
 * @swagger
 * /ai/metrics/dashboard:
 *   get:
 *     summary: Get simplified AI metrics for dashboard display
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard-friendly AI metrics summary
 */
router.get(
  '/metrics/dashboard',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.getAIDashboardMetrics
);

/**
 * @swagger
 * /ai/training/history:
 *   get:
 *     summary: Get AI model training history
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of past training runs with results
 */
router.get('/training/history', requireRole(['ADMIN']), aiController.getTrainingHistory);

/**
 * @swagger
 * /ai/training/trigger:
 *   post:
 *     summary: Manually trigger model retraining
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Training job triggered
 */
router.post('/training/trigger', requireRole(['ADMIN']), aiController.triggerRetraining);

export default router;
