/**
 * AI Training Routes
 */

import express from 'express';
import * as trainingController from '../controllers/training.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   POST /api/v1/training/pipeline
 * @desc    Run full training pipeline (fetch, parse, anonymize, train)
 * @access  Private (ADMIN only)
 */
router.post('/pipeline',
  requireRole(['ADMIN']),
  trainingController.runTrainingPipeline
);

/**
 * @route   POST /api/v1/training/fetch
 * @desc    Fetch documents from Google Drive
 * @access  Private (ADMIN only)
 */
router.post('/fetch',
  requireRole(['ADMIN']),
  trainingController.fetchDocuments
);

/**
 * @route   POST /api/v1/training/parse
 * @desc    Parse fetched documents
 * @access  Private (ADMIN only)
 */
router.post('/parse',
  requireRole(['ADMIN']),
  trainingController.parseDocuments
);

/**
 * @route   POST /api/v1/training/anonymize
 * @desc    Anonymize parsed documents
 * @access  Private (ADMIN only)
 */
router.post('/anonymize',
  requireRole(['ADMIN']),
  trainingController.anonymizeData
);

/**
 * @route   POST /api/v1/training/dataset
 * @desc    Create training dataset
 * @access  Private (ADMIN only)
 */
router.post('/dataset',
  requireRole(['ADMIN']),
  trainingController.createDataset
);

/**
 * @route   POST /api/v1/training/train
 * @desc    Train model with Ollama
 * @access  Private (ADMIN only)
 */
router.post('/train',
  requireRole(['ADMIN']),
  trainingController.trainModel
);

/**
 * @route   POST /api/v1/training/sindre-journals
 * @desc    Process Sindre's journals and create training dataset
 * @access  Private (ADMIN only)
 */
router.post('/sindre-journals',
  requireRole(['ADMIN']),
  trainingController.processSindreJournals
);

/**
 * @route   GET /api/v1/training/terminology
 * @desc    Get medical terminology dictionary
 * @access  Private (ADMIN only)
 */
router.get('/terminology',
  requireRole(['ADMIN']),
  trainingController.getMedicalTerminology
);

/**
 * @route   POST /api/v1/training/follow-ups
 * @desc    Extract follow-up patterns from journals
 * @access  Private (ADMIN only)
 */
router.post('/follow-ups',
  requireRole(['ADMIN']),
  trainingController.extractFollowUps
);

/**
 * @route   POST /api/v1/training/parse-entry
 * @desc    Parse individual journal entry
 * @access  Private (ADMIN only)
 */
router.post('/parse-entry',
  requireRole(['ADMIN']),
  trainingController.parseJournalEntry
);

export default router;
