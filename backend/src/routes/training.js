/**
 * AI Training Routes
 */

import express from 'express';
import * as trainingController from '../controllers/training.js';
import * as aiAnalyticsController from '../controllers/aiAnalytics.js';
import * as dataCurationController from '../controllers/dataCuration.js';
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
import { exportTrainingData, getExportStats } from '../services/trainingExport.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// MODEL MANAGEMENT ENDPOINTS (new)
// ============================================================================

/**
 * @swagger
 * /training/status:
 *   get:
 *     summary: Get current model status
 *     description: Returns which models exist, their sizes, and whether Ollama is running
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model status information
 */
router.get('/status', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getModelStatus);

/**
 * @swagger
 * /training/data:
 *   get:
 *     summary: List training data files and example counts
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Training data inventory
 */
router.get('/data', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getTrainingData);

/**
 * @swagger
 * /training/add-examples:
 *   post:
 *     summary: Add new JSONL examples to training data
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [examples]
 *             properties:
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *               targetFile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Examples added successfully
 *       403:
 *         description: Admin only
 */
router.post(
  '/add-examples',
  requireRole(['ADMIN']),
  validate(addExamplesSchema),
  trainingController.addExamples
);

/**
 * @swagger
 * /training/rebuild:
 *   post:
 *     summary: Rebuild Modelfiles and re-create Ollama models
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model rebuild initiated
 */
router.post('/rebuild', requireRole(['ADMIN']), trainingController.rebuildModels);

/**
 * @swagger
 * /training/backup:
 *   post:
 *     summary: Export models to project folder
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model backup created
 */
router.post('/backup', requireRole(['ADMIN']), trainingController.backupModels);

/**
 * @swagger
 * /training/restore:
 *   post:
 *     summary: Import models from project folder backup
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model restore initiated
 */
router.post('/restore', requireRole(['ADMIN']), trainingController.restoreModels);

/**
 * @swagger
 * /training/test/{model}:
 *   get:
 *     summary: Run test prompt against a model
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *         description: Model name to test
 *     responses:
 *       200:
 *         description: Test result with model output
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
 * @swagger
 * /training/pipeline:
 *   post:
 *     summary: Run full training pipeline
 *     description: Fetch, parse, anonymize, and train in one step
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline execution started
 */
router.post('/pipeline', requireRole(['ADMIN']), trainingController.runTrainingPipeline);

/**
 * @swagger
 * /training/fetch:
 *   post:
 *     summary: Fetch documents from Google Drive
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Documents fetched
 */
router.post('/fetch', requireRole(['ADMIN']), trainingController.fetchDocuments);

/**
 * @swagger
 * /training/parse:
 *   post:
 *     summary: Parse fetched documents
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Documents parsed
 */
router.post('/parse', requireRole(['ADMIN']), trainingController.parseDocuments);

/**
 * @swagger
 * /training/anonymize:
 *   post:
 *     summary: Anonymize parsed documents
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Documents anonymized
 */
router.post('/anonymize', requireRole(['ADMIN']), trainingController.anonymizeData);

/**
 * @swagger
 * /training/dataset:
 *   post:
 *     summary: Create training dataset
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dataset created
 */
router.post('/dataset', requireRole(['ADMIN']), trainingController.createDataset);

/**
 * @swagger
 * /training/train:
 *   post:
 *     summary: Train model with Ollama
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Training started
 */
router.post('/train', requireRole(['ADMIN']), trainingController.trainModel);

/**
 * @swagger
 * /training/sindre-journals:
 *   post:
 *     summary: Process Sindre's journals and create training dataset
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Journals processed
 */
router.post('/sindre-journals', requireRole(['ADMIN']), trainingController.processSindreJournals);

/**
 * @swagger
 * /training/terminology:
 *   get:
 *     summary: Get medical terminology dictionary
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Medical terminology list
 */
router.get('/terminology', requireRole(['ADMIN']), trainingController.getMedicalTerminology);

/**
 * @swagger
 * /training/follow-ups:
 *   post:
 *     summary: Extract follow-up patterns from journals
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Follow-up patterns extracted
 */
router.post('/follow-ups', requireRole(['ADMIN']), trainingController.extractFollowUps);

/**
 * @swagger
 * /training/parse-entry:
 *   post:
 *     summary: Parse individual journal entry
 *     tags: [Training]
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
 *     responses:
 *       200:
 *         description: Parsed journal entry structure
 */
router.post(
  '/parse-entry',
  requireRole(['ADMIN']),
  validate(parseJournalEntrySchema),
  trainingController.parseJournalEntry
);

/**
 * @swagger
 * /training/sigrun-journals:
 *   post:
 *     summary: Process Sigrun's journals and create training dataset
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Journals processed
 */
router.post('/sigrun-journals', requireRole(['ADMIN']), trainingController.processSigrunJournals);

/**
 * @swagger
 * /training/combined-journals:
 *   post:
 *     summary: Process journals with auto-detection or specific practitioner
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               practitioner:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Journals processed
 */
router.post(
  '/combined-journals',
  requireRole(['ADMIN']),
  validate(combinedJournalsSchema),
  trainingController.processCombinedJournals
);

/**
 * @swagger
 * /training/detect-style:
 *   post:
 *     summary: Detect practitioner style from journal text
 *     tags: [Training]
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
 *     responses:
 *       200:
 *         description: Detected practitioner style
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
 * @swagger
 * /training/analytics/performance:
 *   get:
 *     summary: Model performance metrics
 *     description: Approval rate, accuracy, and latency per model
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get(
  '/analytics/performance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getModelPerformance
);

/**
 * @swagger
 * /training/analytics/usage:
 *   get:
 *     summary: AI usage statistics
 *     description: Request volume and task type distribution
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 */
router.get(
  '/analytics/usage',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getUsageStats
);

/**
 * @swagger
 * /training/analytics/suggestions:
 *   get:
 *     summary: Recent AI suggestions with feedback status
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recent suggestions list
 */
router.get(
  '/analytics/suggestions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRecentSuggestions
);

/**
 * @swagger
 * /training/analytics/red-flags:
 *   get:
 *     summary: Red flag detection precision and recall
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Red flag detection accuracy metrics
 */
router.get(
  '/analytics/red-flags',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRedFlagAccuracy
);

/**
 * @swagger
 * /training/analytics/comparison:
 *   get:
 *     summary: Side-by-side model comparison metrics
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Model comparison data
 */
router.get(
  '/analytics/comparison',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getModelComparison
);

/**
 * @swagger
 * /training/analytics/feedback:
 *   post:
 *     summary: Submit feedback for an AI suggestion
 *     description: Records whether a suggestion was accepted/rejected with optional rating
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - suggestionId
 *             properties:
 *               suggestionId:
 *                 type: string
 *                 format: uuid
 *               accepted:
 *                 type: boolean
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               correctionText:
 *                 type: string
 *               feedbackStatus:
 *                 type: string
 *                 enum: [APPROVED, MODIFIED, REJECTED]
 *     responses:
 *       200:
 *         description: Feedback recorded
 *       404:
 *         description: Suggestion not found
 */
router.post(
  '/analytics/feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.submitFeedback
);

// ============================================================================
// DATA CURATION ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /training/curation/feedback:
 *   get:
 *     summary: Get feedback entries for curation
 *     description: Paginated list with filters for type, rating, status, date range
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, exported, all]
 *     responses:
 *       200:
 *         description: Paginated feedback list
 */
router.get('/curation/feedback', requireRole(['ADMIN']), dataCurationController.getFeedback);

/**
 * @swagger
 * /training/curation/stats:
 *   get:
 *     summary: Curation statistics
 *     description: Aggregate counts by type, status, avg rating
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Curation distribution summary
 */
router.get('/curation/stats', requireRole(['ADMIN']), dataCurationController.getStats);

/**
 * @swagger
 * /training/curation/approve/{id}:
 *   post:
 *     summary: Approve feedback for training
 *     tags: [Training]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               editedText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback approved
 */
router.post('/curation/approve/:id', requireRole(['ADMIN']), dataCurationController.approve);

/**
 * @swagger
 * /training/curation/reject/{id}:
 *   post:
 *     summary: Reject feedback from training
 *     tags: [Training]
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
 *         description: Feedback rejected
 */
router.post('/curation/reject/:id', requireRole(['ADMIN']), dataCurationController.reject);

/**
 * @swagger
 * /training/curation/bulk:
 *   post:
 *     summary: Bulk approve or reject feedback
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, action]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: Bulk action completed
 */
router.post('/curation/bulk', requireRole(['ADMIN']), dataCurationController.bulk);

// ============================================================================
// TRAINING DATA EXPORT ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /training/export/stats:
 *   get:
 *     summary: Get training export statistics
 *     description: Returns counts of available SFT and DPO training examples
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Export statistics
 */
router.get('/export/stats', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const stats = await getExportStats(req.organizationId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /training/export:
 *   get:
 *     summary: Export anonymized training data as JSONL
 *     description: Downloads all feedback-bearing AI suggestions as anonymized JSONL for model retraining
 *     tags: [Training]
 *     security:
 *       - BearerAuth: []
 *     produces:
 *       - application/jsonlines
 *     responses:
 *       200:
 *         description: JSONL file download
 */
router.get('/export', requireRole(['ADMIN']), async (req, res) => {
  try {
    const data = await exportTrainingData(req.organizationId);

    // Build JSONL content
    const lines = [];
    data.sft.forEach((ex) => lines.push(JSON.stringify(ex)));
    data.dpo.forEach((pair) => lines.push(JSON.stringify({ ...pair, type: 'dpo' })));

    const jsonl = lines.join('\n');
    const filename = `training-export-${new Date().toISOString().slice(0, 10)}.jsonl`;

    res.setHeader('Content-Type', 'application/jsonlines');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonl);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
