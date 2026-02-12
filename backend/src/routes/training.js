/**
 * AI Training Routes
 */

import express from 'express';
import * as trainingController from '../controllers/training.js';
import * as aiAnalyticsController from '../controllers/aiAnalytics.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  addExamplesSchema,
  testModelSchema,
  parseJournalEntrySchema,
  detectStyleSchema,
  combinedJournalsSchema,
  analyticsQuerySchema,
} from '../validators/training.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// MODEL MANAGEMENT ENDPOINTS (new)
// ============================================================================

/**
 * @route   GET /api/v1/training/status
 * @desc    Current model status (which exist, sizes, Ollama running)
 * @access  Private (ADMIN or PRACTITIONER)
 */
router.get('/status', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getModelStatus);

/**
 * @route   GET /api/v1/training/data
 * @desc    List training data files and example counts
 * @access  Private (ADMIN or PRACTITIONER)
 */
router.get('/data', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getTrainingData);

/**
 * @route   POST /api/v1/training/add-examples
 * @desc    Add new JSONL examples to training data
 * @access  Private (ADMIN only)
 */
router.post(
  '/add-examples',
  requireRole(['ADMIN']),
  validate(addExamplesSchema),
  trainingController.addExamples
);

/**
 * @route   POST /api/v1/training/rebuild
 * @desc    Rebuild Modelfiles from training data + re-create Ollama models
 * @access  Private (ADMIN only)
 */
router.post('/rebuild', requireRole(['ADMIN']), trainingController.rebuildModels);

/**
 * @route   POST /api/v1/training/backup
 * @desc    Export models to project folder
 * @access  Private (ADMIN only)
 */
router.post('/backup', requireRole(['ADMIN']), trainingController.backupModels);

/**
 * @route   POST /api/v1/training/restore
 * @desc    Import models from project folder backup
 * @access  Private (ADMIN only)
 */
router.post('/restore', requireRole(['ADMIN']), trainingController.restoreModels);

/**
 * @route   GET /api/v1/training/test/:model
 * @desc    Run test prompt against a model
 * @access  Private (ADMIN only)
 */
router.get(
  '/test/:model',
  requireRole(['ADMIN']),
  validate(testModelSchema),
  trainingController.testModel
);

// ============================================================================
// LEGACY PIPELINE ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/v1/training/pipeline
 * @desc    Run full training pipeline (fetch, parse, anonymize, train)
 * @access  Private (ADMIN only)
 */
router.post('/pipeline', requireRole(['ADMIN']), trainingController.runTrainingPipeline);

/**
 * @route   POST /api/v1/training/fetch
 * @desc    Fetch documents from Google Drive
 * @access  Private (ADMIN only)
 */
router.post('/fetch', requireRole(['ADMIN']), trainingController.fetchDocuments);

/**
 * @route   POST /api/v1/training/parse
 * @desc    Parse fetched documents
 * @access  Private (ADMIN only)
 */
router.post('/parse', requireRole(['ADMIN']), trainingController.parseDocuments);

/**
 * @route   POST /api/v1/training/anonymize
 * @desc    Anonymize parsed documents
 * @access  Private (ADMIN only)
 */
router.post('/anonymize', requireRole(['ADMIN']), trainingController.anonymizeData);

/**
 * @route   POST /api/v1/training/dataset
 * @desc    Create training dataset
 * @access  Private (ADMIN only)
 */
router.post('/dataset', requireRole(['ADMIN']), trainingController.createDataset);

/**
 * @route   POST /api/v1/training/train
 * @desc    Train model with Ollama
 * @access  Private (ADMIN only)
 */
router.post('/train', requireRole(['ADMIN']), trainingController.trainModel);

/**
 * @route   POST /api/v1/training/sindre-journals
 * @desc    Process Sindre's journals and create training dataset
 * @access  Private (ADMIN only)
 */
router.post('/sindre-journals', requireRole(['ADMIN']), trainingController.processSindreJournals);

/**
 * @route   GET /api/v1/training/terminology
 * @desc    Get medical terminology dictionary
 * @access  Private (ADMIN only)
 */
router.get('/terminology', requireRole(['ADMIN']), trainingController.getMedicalTerminology);

/**
 * @route   POST /api/v1/training/follow-ups
 * @desc    Extract follow-up patterns from journals
 * @access  Private (ADMIN only)
 */
router.post('/follow-ups', requireRole(['ADMIN']), trainingController.extractFollowUps);

/**
 * @route   POST /api/v1/training/parse-entry
 * @desc    Parse individual journal entry
 * @access  Private (ADMIN only)
 */
router.post(
  '/parse-entry',
  requireRole(['ADMIN']),
  validate(parseJournalEntrySchema),
  trainingController.parseJournalEntry
);

/**
 * @route   POST /api/v1/training/sigrun-journals
 * @desc    Process Sigrun's journals and create training dataset
 * @access  Private (ADMIN only)
 */
router.post('/sigrun-journals', requireRole(['ADMIN']), trainingController.processSigrunJournals);

/**
 * @route   POST /api/v1/training/combined-journals
 * @desc    Process journals with auto-detection or specific practitioner
 * @access  Private (ADMIN only)
 */
router.post(
  '/combined-journals',
  requireRole(['ADMIN']),
  validate(combinedJournalsSchema),
  trainingController.processCombinedJournals
);

/**
 * @route   POST /api/v1/training/detect-style
 * @desc    Detect practitioner style from journal text
 * @access  Private (ADMIN only)
 */
router.post(
  '/detect-style',
  requireRole(['ADMIN']),
  validate(detectStyleSchema),
  trainingController.detectPractitionerStyle
);

// ============================================================================
// AI ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/v1/training/analytics/performance
 * @desc    Model performance metrics (approval rate, accuracy, latency)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/analytics/performance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getModelPerformance
);

/**
 * @route   GET /api/v1/training/analytics/usage
 * @desc    Usage statistics (request volume, task type distribution)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/analytics/usage',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getUsageStats
);

/**
 * @route   GET /api/v1/training/analytics/suggestions
 * @desc    Recent AI suggestions with feedback status
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/analytics/suggestions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRecentSuggestions
);

/**
 * @route   GET /api/v1/training/analytics/red-flags
 * @desc    Red flag detection precision/recall
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/analytics/red-flags',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRedFlagAccuracy
);

/**
 * @route   GET /api/v1/training/analytics/comparison
 * @desc    Side-by-side model comparison metrics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/analytics/comparison',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getModelComparison
);

export default router;
