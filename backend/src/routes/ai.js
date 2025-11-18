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
 * @desc    Generate SOAP note suggestions based on chief complaint
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/soap-suggestion',
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
 * @desc    Generate clinical summary from encounter
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/clinical-summary',
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

export default router;
