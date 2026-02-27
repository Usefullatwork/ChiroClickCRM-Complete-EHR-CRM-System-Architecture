/**
 * Batch Job Controller
 * CRUD operations for Claude Batch API jobs.
 */

import * as batchProcessor from '../services/batchProcessor.js';
import logger from '../utils/logger.js';

export const createBatch = async (req, res) => {
  try {
    const { requests, model } = req.body;
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ success: false, error: 'requests array required' });
    }
    const batch = await batchProcessor.createBatch(requests, { model });
    res.json({ success: true, batch });
  } catch (error) {
    if (error.message.includes('CLAUDE_API_KEY')) {
      return res.json({
        success: false,
        error: 'Claude API not configured',
        requiresClaudeAPI: true,
      });
    }
    logger.error('Batch creation failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBatchStatus = async (req, res) => {
  try {
    const batch = await batchProcessor.getBatchStatus(req.params.batchId);
    res.json({ success: true, batch });
  } catch (error) {
    logger.error('Batch status check failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBatchResults = async (req, res) => {
  try {
    const results = await batchProcessor.getBatchResults(req.params.batchId);
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Batch results retrieval failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelBatch = async (req, res) => {
  try {
    const batch = await batchProcessor.cancelBatch(req.params.batchId);
    res.json({ success: true, batch });
  } catch (error) {
    logger.error('Batch cancellation failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBatches = async (req, res) => {
  try {
    const batches = await batchProcessor.listBatches({
      limit: parseInt(req.query.limit || '20', 10),
    });
    res.json({ success: true, batches });
  } catch (error) {
    logger.error('Batch listing failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const scoreTrainingData = async (req, res) => {
  try {
    const { examples } = req.body;
    if (!examples || !Array.isArray(examples)) {
      return res.status(400).json({ success: false, error: 'examples array required' });
    }
    const batch = await batchProcessor.scoreTrainingData(examples);
    res.json({ success: true, batch });
  } catch (error) {
    logger.error('Training data scoring failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
