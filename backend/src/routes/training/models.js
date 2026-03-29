/**
 * Training Models Routes
 * Model management, legacy pipeline, and journal processing
 */

import express from 'express';
import * as trainingController from '../../controllers/training.js';
import { requireRole } from '../../middleware/auth.js';
import validate from '../../middleware/validation.js';
import {
  addExamplesSchema,
  testModelSchema,
  parseJournalEntrySchema,
  detectStyleSchema,
  combinedJournalsSchema,
} from '../../validators/training.validators.js';

const router = express.Router();

// Model Management
router.get('/status', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getModelStatus);
router.get('/data', requireRole(['ADMIN', 'PRACTITIONER']), trainingController.getTrainingData);
router.post(
  '/add-examples',
  requireRole(['ADMIN']),
  validate(addExamplesSchema),
  trainingController.addExamples
);
router.post('/rebuild', requireRole(['ADMIN']), trainingController.rebuildModels);
router.post('/backup', requireRole(['ADMIN']), trainingController.backupModels);
router.post('/restore', requireRole(['ADMIN']), trainingController.restoreModels);
router.get(
  '/test/:model',
  requireRole(['ADMIN']),
  validate(testModelSchema),
  trainingController.testModel
);

// Legacy Pipeline
router.post('/pipeline', requireRole(['ADMIN']), trainingController.runTrainingPipeline);
router.post('/fetch', requireRole(['ADMIN']), trainingController.fetchDocuments);
router.post('/parse', requireRole(['ADMIN']), trainingController.parseDocuments);
router.post('/anonymize', requireRole(['ADMIN']), trainingController.anonymizeData);
router.post('/dataset', requireRole(['ADMIN']), trainingController.createDataset);
router.post('/train', requireRole(['ADMIN']), trainingController.trainModel);

// Journal Processing
router.post('/sindre-journals', requireRole(['ADMIN']), trainingController.processSindreJournals);
router.get('/terminology', requireRole(['ADMIN']), trainingController.getMedicalTerminology);
router.post('/follow-ups', requireRole(['ADMIN']), trainingController.extractFollowUps);
router.post(
  '/parse-entry',
  requireRole(['ADMIN']),
  validate(parseJournalEntrySchema),
  trainingController.parseJournalEntry
);
router.post('/sigrun-journals', requireRole(['ADMIN']), trainingController.processSigrunJournals);
router.post(
  '/combined-journals',
  requireRole(['ADMIN']),
  validate(combinedJournalsSchema),
  trainingController.processCombinedJournals
);
router.post(
  '/detect-style',
  requireRole(['ADMIN']),
  validate(detectStyleSchema),
  trainingController.detectPractitionerStyle
);

export default router;
