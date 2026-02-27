/**
 * AI Cost Analytics Routes
 * Admin-only routes for monitoring Claude API costs and usage
 */

import { Router } from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import * as aiCostController from '../controllers/aiCost.js';

const router = Router();

// Budget status (current spend vs limits)
router.get(
  '/budget',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  aiCostController.getBudgetStatus
);

// Cost breakdown by task type
router.get(
  '/by-task',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  aiCostController.getCostByTask
);

// Cache efficiency metrics
router.get(
  '/cache',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  aiCostController.getCacheEfficiency
);

// Daily cost trend
router.get(
  '/trend',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  aiCostController.getDailyCostTrend
);

// Provider comparison (Ollama vs Claude)
router.get(
  '/providers',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN']),
  aiCostController.getProviderComparison
);

export default router;
