/**
 * AI Training Controller
 * Manage training pipeline for local AI model
 */

import * as ollamaTraining from '../services/ollamaTraining.js';
import * as sindreJournalParser from '../services/sindreJournalParser.js';
import logger from '../utils/logger.js';

/**
 * Run full training pipeline
 */
export const runTrainingPipeline = async (req, res) => {
  try {
    const { googleDriveFolderId, modelName, options } = req.body;

    if (!googleDriveFolderId || !modelName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: googleDriveFolderId, modelName'
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
      data: result
    });
  } catch (error) {
    logger.error('Error in runTrainingPipeline controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run training pipeline'
    });
  }
};

/**
 * Fetch training documents from Google Drive
 */
export const fetchDocuments = async (req, res) => {
  try {
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing folderId'
      });
    }

    const result = await ollamaTraining.fetchTrainingDocuments(folderId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in fetchDocuments controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
};

/**
 * Parse training documents
 */
export const parseDocuments = async (req, res) => {
  try {
    const result = await ollamaTraining.parseTrainingDocuments();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in parseDocuments controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse documents'
    });
  }
};

/**
 * Anonymize training data
 */
export const anonymizeData = async (req, res) => {
  try {
    const { options } = req.body;
    const result = await ollamaTraining.anonymizeTrainingData(options || {});

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in anonymizeData controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to anonymize data'
    });
  }
};

/**
 * Create training dataset
 */
export const createDataset = async (req, res) => {
  try {
    const { clinicalEncounters } = req.body;
    const result = await ollamaTraining.createTrainingDataset(clinicalEncounters || []);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in createDataset controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dataset'
    });
  }
};

/**
 * Train model
 */
export const trainModel = async (req, res) => {
  try {
    const { modelName } = req.body;

    if (!modelName) {
      return res.status(400).json({
        success: false,
        error: 'Missing modelName'
      });
    }

    const result = await ollamaTraining.trainModel(modelName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in trainModel controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to train model'
    });
  }
};

/**
 * Process Sindre's journal text and create training dataset
 */
export const processSindreJournals = async (req, res) => {
  try {
    const { journalsText } = req.body;

    if (!journalsText) {
      return res.status(400).json({
        success: false,
        error: 'Missing journalsText'
      });
    }

    logger.info('Processing Sindre journals...');

    const result = sindreJournalParser.createSindreTrainingDataset(journalsText);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in processSindreJournals controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Sindre journals'
    });
  }
};

/**
 * Get medical terminology dictionary from Sindre's journals
 */
export const getMedicalTerminology = async (req, res) => {
  try {
    const terminology = {
      anatomical: sindreJournalParser.ANATOMICAL_ABBREVIATIONS,
      treatments: sindreJournalParser.TREATMENT_ABBREVIATIONS,
      examinations: sindreJournalParser.EXAMINATION_TESTS,
      commonFindings: sindreJournalParser.COMMON_FINDINGS
    };

    res.json({
      success: true,
      data: terminology
    });
  } catch (error) {
    logger.error('Error in getMedicalTerminology controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get medical terminology'
    });
  }
};

/**
 * Extract follow-up patterns from journals
 */
export const extractFollowUps = async (req, res) => {
  try {
    const { journalsText } = req.body;

    if (!journalsText) {
      return res.status(400).json({
        success: false,
        error: 'Missing journalsText'
      });
    }

    logger.info('Extracting follow-up patterns...');

    const result = sindreJournalParser.extractFollowUpPatterns(journalsText);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in extractFollowUps controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract follow-up patterns'
    });
  }
};

/**
 * Parse individual journal entry
 */
export const parseJournalEntry = async (req, res) => {
  try {
    const { journalText } = req.body;

    if (!journalText) {
      return res.status(400).json({
        success: false,
        error: 'Missing journalText'
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
          symptoms
        }
      }
    });
  } catch (error) {
    logger.error('Error in parseJournalEntry controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse journal entry'
    });
  }
};

export default {
  runTrainingPipeline,
  fetchDocuments,
  parseDocuments,
  anonymizeData,
  createDataset,
  trainModel,
  processSindreJournals,
  getMedicalTerminology,
  extractFollowUps,
  parseJournalEntry
};
