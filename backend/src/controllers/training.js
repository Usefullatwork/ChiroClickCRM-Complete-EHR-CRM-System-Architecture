/**
 * AI Training Controller
 * Manage training pipeline for local AI model
 */

import * as ollamaTraining from '../services/ollamaTraining.js';
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

export default {
  runTrainingPipeline,
  fetchDocuments,
  parseDocuments,
  anonymizeData,
  createDataset,
  trainModel
};
