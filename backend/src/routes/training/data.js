/**
 * Training Data Routes
 * Data curation, feedback management, and training data export
 */

import express from 'express';
import * as trainingController from '../../controllers/training.js';
import * as dataCurationController from '../../controllers/dataCuration.js';
import { requireRole } from '../../middleware/auth.js';
import { exportTrainingData, getExportStats } from '../../services/training/trainingExport.js';

const router = express.Router();

// Data Curation
router.get('/curation/feedback', requireRole(['ADMIN']), dataCurationController.getFeedback);
router.get('/curation/stats', requireRole(['ADMIN']), dataCurationController.getStats);
router.post('/curation/approve/:id', requireRole(['ADMIN']), dataCurationController.approve);
router.post('/curation/reject/:id', requireRole(['ADMIN']), dataCurationController.reject);
router.post('/curation/bulk', requireRole(['ADMIN']), dataCurationController.bulk);

// Training Data Pipeline
router.get('/export-feedback-data', requireRole(['ADMIN']), trainingController.exportFeedbackData);
router.get('/gap-report', requireRole(['ADMIN']), trainingController.getGapReport);
router.post('/generate-targeted', requireRole(['ADMIN']), trainingController.generateTargeted);

// Training Data Export
router.get('/export/stats', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const stats = await getExportStats(req.organizationId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
