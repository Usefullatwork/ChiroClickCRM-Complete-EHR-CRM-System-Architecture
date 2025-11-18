/**
 * KPI Dashboard Routes
 */

import express from 'express';
import * as kpiController from '../controllers/kpi.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/kpi/dashboard
 * @desc    Get dashboard KPIs
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/dashboard',
  requireRole(['ADMIN', 'PRACTITIONER']),
  kpiController.getDashboard
);

/**
 * @route   GET /api/v1/kpi/retention
 * @desc    Get patient retention metrics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/retention',
  requireRole(['ADMIN', 'PRACTITIONER']),
  kpiController.getRetention
);

/**
 * @route   GET /api/v1/kpi/rebooking-rate
 * @desc    Get rebooking rate
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/rebooking-rate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  kpiController.getRebookingRate
);

/**
 * @route   GET /api/v1/kpi/top-diagnoses
 * @desc    Get top diagnoses
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/top-diagnoses',
  requireRole(['ADMIN', 'PRACTITIONER']),
  kpiController.getTopDiagnoses
);

export default router;
