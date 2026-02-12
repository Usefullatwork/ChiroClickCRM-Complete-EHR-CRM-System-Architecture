/**
 * KPI Dashboard Routes
 */

import express from 'express';
import * as kpiController from '../controllers/kpi.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { dateRangeQuerySchema, importKPIDataSchema } from '../validators/kpi.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/kpi/dashboard
 * @desc    Get dashboard KPIs
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/dashboard',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDashboard
);

/**
 * @route   GET /api/v1/kpi/retention
 * @desc    Get patient retention metrics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/retention',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getRetention
);

/**
 * @route   GET /api/v1/kpi/rebooking-rate
 * @desc    Get rebooking rate
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/rebooking-rate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getRebookingRate
);

/**
 * @route   GET /api/v1/kpi/top-diagnoses
 * @desc    Get top diagnoses
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/top-diagnoses',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getTopDiagnoses
);

/**
 * @route   GET /api/v1/kpi/detailed
 * @desc    Get detailed KPI tracking dashboard (rebooking, categories, geography)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/detailed',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDetailedKPIs
);

/**
 * @route   GET /api/v1/kpi/category-breakdown
 * @desc    Get patient category breakdown with rebooking rates
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/category-breakdown',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getCategoryBreakdown
);

/**
 * @route   GET /api/v1/kpi/geographic
 * @desc    Get geographic distribution (Oslo vs Outside vs Traveling)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/geographic',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getGeographicDistribution
);

/**
 * @route   POST /api/v1/kpi/import
 * @desc    Import KPI data from Excel spreadsheet
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/import',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(importKPIDataSchema),
  kpiController.importKPIData
);

/**
 * @route   GET /api/v1/kpi/daily
 * @desc    Get daily KPIs for a specific date
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/daily',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDailyKPIs
);

/**
 * @route   GET /api/v1/kpi/weekly
 * @desc    Get weekly KPIs for a date range
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/weekly',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getWeeklyKPIs
);

/**
 * @route   GET /api/v1/kpi/monthly
 * @desc    Get monthly KPIs for a specific month
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get(
  '/monthly',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getMonthlyKPIs
);

export default router;
