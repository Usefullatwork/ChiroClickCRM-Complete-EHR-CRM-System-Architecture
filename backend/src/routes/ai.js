/**
 * AI Routes
 * AI-powered clinical intelligence endpoints
 */

import express from 'express';
import * as aiController from '../controllers/ai.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// =================================================================
// AI Feedback & Metrics Endpoints (CQRS)
// =================================================================

/**
 * @route   POST /api/v1/ai/feedback
 * @desc    Record feedback on AI suggestion
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.recordFeedback
);

/**
 * @route   GET /api/v1/ai/metrics
 * @desc    Get AI performance metrics
 * @access  Private (ADMIN)
 */
router.get('/metrics',
  requireRole(['ADMIN']),
  aiController.getAIMetrics
);

/**
 * @route   GET /api/v1/ai/circuit-status
 * @desc    Get circuit breaker health status
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/circuit-status',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.getCircuitStatus
);

/**
 * @route   POST /api/v1/ai/circuit-reset/:service
 * @desc    Reset circuit breaker for a service
 * @access  Private (ADMIN)
 */
router.post('/circuit-reset/:service',
  requireRole(['ADMIN']),
  aiController.resetCircuitBreaker
);

/**
 * @route   GET /api/v1/ai/retraining-status
 * @desc    Check if AI retraining is needed
 * @access  Private (ADMIN)
 */
router.get('/retraining-status',
  requireRole(['ADMIN']),
  aiController.getRetrainingStatus
);

/**
 * @route   POST /api/v1/ai/trigger-retraining
 * @desc    Manually trigger AI retraining
 * @access  Private (ADMIN)
 */
router.post('/trigger-retraining',
  requireRole(['ADMIN']),
  aiController.triggerRetraining
);

// =================================================================
// Original AI Endpoints
// =================================================================

/**
 * @route   POST /api/v1/ai/spell-check
 * @desc    Norwegian spell check for clinical notes
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/spell-check',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  aiController.spellCheck
);

/**
 * @route   POST /api/v1/ai/soap-suggestion
 * @route   POST /api/v1/ai/soap-suggestions (alias)
 * @desc    Generate SOAP note suggestions based on chief complaint
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/soap-suggestion',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateSOAPSuggestion
);
router.post('/soap-suggestions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateSOAPSuggestion
);

/**
 * @route   POST /api/v1/ai/suggest-diagnosis
 * @desc    Suggest ICPC-2 diagnosis codes based on clinical presentation
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/suggest-diagnosis',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.suggestDiagnosis
);

/**
 * @route   POST /api/v1/ai/analyze-red-flags
 * @desc    Analyze patient data for red flags and safety concerns
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/analyze-red-flags',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.analyzeRedFlags
);

/**
 * @route   POST /api/v1/ai/clinical-summary
 * @route   POST /api/v1/ai/generate-summary (alias)
 * @desc    Generate clinical summary from encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/clinical-summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateClinicalSummary
);
router.post('/generate-summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateClinicalSummary
);

/**
 * @route   POST /api/v1/ai/outcome-feedback
 * @desc    Record outcome feedback for AI learning
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/outcome-feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.recordOutcomeFeedback
);

/**
 * @route   GET /api/v1/ai/status
 * @desc    Get AI service status
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/status',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.getAIStatus
);

/**
 * @route   POST /api/v1/ai/generate-field-stream
 * @desc    Generate field text with streaming SSE response
 * @access  Private (ADMIN, PRACTITIONER)
 * @body    { fieldType: string, context?: object, language?: 'en' | 'no' }
 */
router.post('/generate-field-stream',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateFieldStream
);

/**
 * @route   POST /api/v1/ai/generate-field
 * @desc    Generate field text (non-streaming)
 * @access  Private (ADMIN, PRACTITIONER)
 * @body    { fieldType: string, context?: object, language?: 'en' | 'no' }
 */
router.post('/generate-field',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiController.generateField
);

export default router;
