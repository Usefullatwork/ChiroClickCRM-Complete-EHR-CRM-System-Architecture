/**
 * Data Curation Controller
 * Route handlers for AI feedback curation endpoints
 */

import * as dataCurationService from '../services/dataCuration.js';
import logger from '../utils/logger.js';

const log = logger;

/**
 * GET /training/curation/feedback
 * Paginated list of feedback for curation
 */
export const getFeedback = async (req, res) => {
  try {
    const result = await dataCurationService.getFeedbackForCuration(req.organizationId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    log.error('Failed to get curation feedback', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /training/curation/stats
 * Aggregate curation statistics
 */
export const getStats = async (req, res) => {
  try {
    const stats = await dataCurationService.getCurationStats(req.organizationId);
    res.json({ success: true, data: stats });
  } catch (err) {
    log.error('Failed to get curation stats', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /training/curation/approve/:id
 * Approve a single feedback entry for training
 */
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedText } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing feedback ID' });
    }

    const result = await dataCurationService.approveFeedback(req.organizationId, id, editedText);
    res.json({ success: true, data: result });
  } catch (err) {
    log.error('Failed to approve feedback', { error: err.message });
    const status = err.message === 'Feedback entry not found' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

/**
 * POST /training/curation/reject/:id
 * Reject a single feedback entry from training
 */
export const reject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing feedback ID' });
    }

    const result = await dataCurationService.rejectFeedback(req.organizationId, id);
    res.json({ success: true, data: result });
  } catch (err) {
    log.error('Failed to reject feedback', { error: err.message });
    const status = err.message === 'Feedback entry not found' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

/**
 * POST /training/curation/bulk
 * Bulk approve or reject feedback entries
 */
export const bulk = async (req, res) => {
  try {
    const { ids, action } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing or empty ids array' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res
        .status(400)
        .json({ success: false, error: 'Action must be "approve" or "reject"' });
    }

    const result = await dataCurationService.bulkAction(req.organizationId, ids, action);
    res.json({ success: true, data: result });
  } catch (err) {
    log.error('Bulk curation action failed', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
