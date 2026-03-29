/**
 * Training Evaluation Routes
 * AI analytics, performance metrics, feedback, and cost analysis
 */

import express from 'express';
import * as aiAnalyticsController from '../../controllers/aiAnalytics.js';
import { requireRole } from '../../middleware/auth.js';
import validate from '../../middleware/validation.js';
import { analyticsQuerySchema } from '../../validators/training.validators.js';
import { generateWeeklyAIDigest } from '../../services/clinical/reportService.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Performance & Usage
router.get(
  '/analytics/performance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getModelPerformance
);
router.get(
  '/analytics/usage',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getUsageStats
);
router.get(
  '/analytics/suggestions',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRecentSuggestions
);
router.get(
  '/analytics/red-flags',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getRedFlagAccuracy
);
router.get(
  '/analytics/comparison',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.getModelComparison
);

// Feedback
router.post(
  '/analytics/feedback',
  requireRole(['ADMIN', 'PRACTITIONER']),
  aiAnalyticsController.submitFeedback
);

// Cost & Provider Analysis
router.get(
  '/analytics/cost-per-suggestion',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getCostPerSuggestion
);
router.get(
  '/analytics/provider-value',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getProviderValue
);
router.get(
  '/analytics/cache-trends',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(analyticsQuerySchema),
  aiAnalyticsController.getCacheTrends
);

// Weekly Report
router.post('/analytics/send-report', requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await generateWeeklyAIDigest();
    res.json({
      success: true,
      message: 'Ukentlig AI-rapport generert',
      data: {
        stats: result.stats,
        html: result.html,
      },
    });
  } catch (error) {
    logger.error('Error generating AI digest report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
