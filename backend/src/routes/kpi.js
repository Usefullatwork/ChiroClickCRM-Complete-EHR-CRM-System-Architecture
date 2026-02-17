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
 * @swagger
 * /kpi/dashboard:
 *   get:
 *     summary: Get dashboard KPIs
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard KPI metrics
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/dashboard',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDashboard
);

/**
 * @swagger
 * /kpi/retention:
 *   get:
 *     summary: Get patient retention metrics
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Patient retention metrics
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/retention',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getRetention
);

/**
 * @swagger
 * /kpi/rebooking-rate:
 *   get:
 *     summary: Get rebooking rate
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Rebooking rate percentage and trends
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/rebooking-rate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getRebookingRate
);

/**
 * @swagger
 * /kpi/top-diagnoses:
 *   get:
 *     summary: Get top diagnoses
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Top diagnoses with counts
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/top-diagnoses',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getTopDiagnoses
);

/**
 * @swagger
 * /kpi/detailed:
 *   get:
 *     summary: Get detailed KPI tracking dashboard
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Detailed KPIs including rebooking, categories, geography
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/detailed',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDetailedKPIs
);

/**
 * @swagger
 * /kpi/category-breakdown:
 *   get:
 *     summary: Get patient category breakdown with rebooking rates
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Patient category breakdown
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/category-breakdown',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getCategoryBreakdown
);

/**
 * @swagger
 * /kpi/geographic:
 *   get:
 *     summary: Get geographic distribution of patients
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Geographic distribution (Oslo vs Outside vs Traveling)
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/geographic',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getGeographicDistribution
);

/**
 * @swagger
 * /kpi/import:
 *   post:
 *     summary: Import KPI data from Excel spreadsheet
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     metric:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       200:
 *         description: KPI data imported successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/import',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(importKPIDataSchema),
  kpiController.importKPIData
);

/**
 * @swagger
 * /kpi/daily:
 *   get:
 *     summary: Get daily KPIs for a specific date
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily KPI data
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/daily',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getDailyKPIs
);

/**
 * @swagger
 * /kpi/weekly:
 *   get:
 *     summary: Get weekly KPIs for a date range
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Weekly KPI data
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/weekly',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getWeeklyKPIs
);

/**
 * @swagger
 * /kpi/monthly:
 *   get:
 *     summary: Get monthly KPIs for a specific month
 *     tags: [KPI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Monthly KPI data
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/monthly',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dateRangeQuerySchema),
  kpiController.getMonthlyKPIs
);

export default router;
