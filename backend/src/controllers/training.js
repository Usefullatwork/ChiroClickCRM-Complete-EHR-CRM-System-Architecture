/**
 * AI Training Controller
 * Manage training pipeline for local AI model
 */

import * as ollamaTraining from '../services/ollamaTraining.js';
import * as sindreJournalParser from '../services/sindreJournalParser.js';
import * as sigrunJournalParser from '../services/sigrunJournalParser.js';
import * as trainingService from '../services/training.js';
import logger from '../utils/logger.js';

// ============================================================================
// MODEL MANAGEMENT (new endpoints)
// ============================================================================

/**
 * Get current model status
 */
export const getModelStatus = async (req, res) => {
  const status = await trainingService.getStatus();
  res.json({ success: true, data: status });
};

/**
 * Get training data file listing
 */
export const getTrainingData = async (req, res) => {
  const data = trainingService.getTrainingData();
  res.json({ success: true, data });
};

/**
 * Add new JSONL examples
 */
export const addExamples = async (req, res) => {
  const { jsonlContent, targetFile } = req.body;
  if (!jsonlContent) {
    return res.status(400).json({ success: false, error: 'Missing jsonlContent' });
  }
  const result = trainingService.addExamples(jsonlContent, targetFile);
  res.json({ success: true, data: result });
};

/**
 * Rebuild Modelfiles and re-create Ollama models
 */
export const rebuildModels = async (req, res) => {
  logger.info('Starting model rebuild...');
  const result = await trainingService.rebuild();
  res.json({ success: true, data: result });
};

/**
 * Backup models to project folder
 */
export const backupModels = async (req, res) => {
  const result = await trainingService.backup();
  res.json({ success: true, data: result });
};

/**
 * Restore models from backup
 */
export const restoreModels = async (req, res) => {
  const result = await trainingService.restore();
  res.json({ success: true, data: result });
};

/**
 * Test a model with a prompt
 */
export const testModel = async (req, res) => {
  const { model } = req.params;
  const { prompt } = req.query;
  const result = await trainingService.testModel(model, prompt);
  res.json({ success: true, data: result });
};

// ============================================================================
// LEGACY PIPELINE
// ============================================================================

/**
 * Run full training pipeline
 */
export const runTrainingPipeline = async (req, res) => {
  const { googleDriveFolderId, modelName, options } = req.body;

  if (!googleDriveFolderId || !modelName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: googleDriveFolderId, modelName',
    });
  }

  logger.info(`Starting training pipeline for model: ${modelName}`);

  // Run pipeline in background (this can take a while)
  const result = await ollamaTraining.runFullPipeline(
    googleDriveFolderId,
    modelName,
    options || {}
  );

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Fetch training documents from Google Drive
 */
export const fetchDocuments = async (req, res) => {
  const { folderId } = req.body;

  if (!folderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing folderId',
    });
  }

  const result = await ollamaTraining.fetchTrainingDocuments(folderId);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Parse training documents
 */
export const parseDocuments = async (req, res) => {
  const result = await ollamaTraining.parseTrainingDocuments();

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Anonymize training data
 */
export const anonymizeData = async (req, res) => {
  const { options } = req.body;
  const result = await ollamaTraining.anonymizeTrainingData(options || {});

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Create training dataset
 */
export const createDataset = async (req, res) => {
  const { clinicalEncounters } = req.body;
  const result = await ollamaTraining.createTrainingDataset(clinicalEncounters || []);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Train model
 */
export const trainModel = async (req, res) => {
  const { modelName } = req.body;

  if (!modelName) {
    return res.status(400).json({
      success: false,
      error: 'Missing modelName',
    });
  }

  const result = await ollamaTraining.trainModel(modelName);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Process Sindre's journal text and create training dataset
 */
export const processSindreJournals = async (req, res) => {
  const { journalsText } = req.body;

  if (!journalsText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalsText',
    });
  }

  logger.info('Processing Sindre journals...');

  const result = sindreJournalParser.createSindreTrainingDataset(journalsText);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Get medical terminology dictionary from Sindre's journals
 */
export const getMedicalTerminology = async (req, res) => {
  const terminology = {
    anatomical: sindreJournalParser.ANATOMICAL_ABBREVIATIONS,
    treatments: sindreJournalParser.TREATMENT_ABBREVIATIONS,
    examinations: sindreJournalParser.EXAMINATION_TESTS,
    commonFindings: sindreJournalParser.COMMON_FINDINGS,
  };

  res.json({
    success: true,
    data: terminology,
  });
};

/**
 * Extract follow-up patterns from journals
 */
export const extractFollowUps = async (req, res) => {
  const { journalsText } = req.body;

  if (!journalsText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalsText',
    });
  }

  logger.info('Extracting follow-up patterns...');

  const result = sindreJournalParser.extractFollowUpPatterns(journalsText);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Parse individual journal entry
 */
export const parseJournalEntry = async (req, res) => {
  const { journalText } = req.body;

  if (!journalText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalText',
    });
  }

  const parsed = sindreJournalParser.parseJournalEntry(journalText);
  const techniques = sindreJournalParser.extractTreatmentTechniques(parsed.behandling);
  const findings = sindreJournalParser.extractExaminationFindings(parsed.undersøkelse);
  const symptoms = sindreJournalParser.extractSymptomsFromAnamnese(parsed.anamnese);

  res.json({
    success: true,
    data: {
      parsed,
      extracted: {
        techniques,
        findings,
        symptoms,
      },
    },
  });
};

/**
 * Process Sigrun's journal text and create training dataset
 */
export const processSigrunJournals = async (req, res) => {
  const { journalsText } = req.body;

  if (!journalsText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalsText',
    });
  }

  logger.info('Processing Sigrun journals...');

  const result = sigrunJournalParser.createSigrunTrainingDataset(journalsText);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Process combined journals from both practitioners
 */
export const processCombinedJournals = async (req, res) => {
  const { journalsText, practitioner } = req.body;

  if (!journalsText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalsText',
    });
  }

  logger.info('Processing combined journals...');

  let result;
  if (practitioner === 'auto' || !practitioner) {
    // Auto-detect practitioner style
    const detection = sigrunJournalParser.detectPractitionerStyle(journalsText);
    logger.info(
      `Auto-detected practitioner: ${detection.practitioner} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`
    );

    if (detection.practitioner === 'Sindre') {
      result = sindreJournalParser.createSindreTrainingDataset(journalsText);
    } else if (detection.practitioner === 'Sigrun') {
      result = sigrunJournalParser.createSigrunTrainingDataset(journalsText);
    } else {
      // Unknown - try both and use the one with more examples
      const sindreResult = sindreJournalParser.createSindreTrainingDataset(journalsText);
      const sigrunResult = sigrunJournalParser.createSigrunTrainingDataset(journalsText);

      result =
        sindreResult.examples.length > sigrunResult.examples.length ? sindreResult : sigrunResult;

      result.detectionNote = 'Could not confidently detect practitioner style, using best match';
    }
  } else if (practitioner.toLowerCase() === 'sindre') {
    result = sindreJournalParser.createSindreTrainingDataset(journalsText);
  } else if (practitioner.toLowerCase() === 'sigrun') {
    result = sigrunJournalParser.createSigrunTrainingDataset(journalsText);
  } else if (practitioner.toLowerCase() === 'both') {
    // Process with both parsers and combine
    const sindreResult = sindreJournalParser.createSindreTrainingDataset(journalsText);
    const sigrunResult = sigrunJournalParser.createSigrunTrainingDataset(journalsText);

    result = {
      examples: [...sindreResult.examples, ...sigrunResult.examples],
      practitioners: ['Sindre', 'Sigrun'],
      statistics: {
        total_entries:
          sindreResult.statistics.total_entries + sigrunResult.statistics.total_entries,
        total_examples:
          sindreResult.statistics.total_examples + sigrunResult.statistics.total_examples,
        by_practitioner: {
          sindre: sindreResult.statistics,
          sigrun: sigrunResult.statistics,
        },
      },
    };
  } else {
    return res.status(400).json({
      success: false,
      error: 'Invalid practitioner. Use: auto, sindre, sigrun, or both',
    });
  }

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Detect practitioner style from journal text
 */
export const detectPractitionerStyle = async (req, res) => {
  const { journalsText } = req.body;

  if (!journalsText) {
    return res.status(400).json({
      success: false,
      error: 'Missing journalsText',
    });
  }

  const detection = sigrunJournalParser.detectPractitionerStyle(journalsText);

  res.json({
    success: true,
    data: detection,
  });
};

export default {
  getModelStatus,
  getTrainingData,
  addExamples,
  rebuildModels,
  backupModels,
  restoreModels,
  testModel,
  runTrainingPipeline,
  fetchDocuments,
  parseDocuments,
  anonymizeData,
  createDataset,
  trainModel,
  processSindreJournals,
  processSigrunJournals,
  processCombinedJournals,
  detectPractitionerStyle,
  getMedicalTerminology,
  extractFollowUps,
  parseJournalEntry,
};
