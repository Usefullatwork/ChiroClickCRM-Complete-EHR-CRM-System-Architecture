/**
 * Analytics Routes
 * API endpoints for analytics and reporting dashboard
 *
 * @module routes/analytics
 */

import express from 'express';
import * as analyticsService from '../services/analytics.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  dashboardSchema,
  revenueSchema,
  topExercisesSchema,
  exportSchema,
} from '../validators/analytics.validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get comprehensive analytics dashboard data
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/dashboard',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(dashboardSchema),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const organizationId = req.organization.id;

      const data = await analyticsService.getDashboardAnalytics(organizationId, {
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Kunne ikke hente analysedata',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /analytics/patients:
 *   get:
 *     summary: Get patient statistics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patient statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/patients', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const organizationId = req.organization.id;
    const data = await analyticsService.getPatientStats(organizationId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      message: 'Kunne ikke hente pasientstatistikk',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /analytics/appointments:
 *   get:
 *     summary: Get appointment statistics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/appointments',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const organizationId = req.organization.id;
      const data = await analyticsService.getAppointmentStats(organizationId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error fetching appointment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Kunne ikke hente avtalestatistikk',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /analytics/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for revenue range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for revenue range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/revenue',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(revenueSchema),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const organizationId = req.organization.id;

      const data = await analyticsService.getRevenueStats(organizationId, startDate, endDate);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error fetching revenue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Kunne ikke hente inntektsstatistikk',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /analytics/exercises/top:
 *   get:
 *     summary: Get most prescribed exercises
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top exercises to return
 *     responses:
 *       200:
 *         description: List of top prescribed exercises
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/exercises/top',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(topExercisesSchema),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const organizationId = req.organization.id;

      const data = await analyticsService.getTopExercises(organizationId, parseInt(limit));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error fetching top exercises:', error);
      res.status(500).json({
        success: false,
        message: 'Kunne ikke hente populaere ovelser',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /analytics/exercises/compliance:
 *   get:
 *     summary: Get exercise compliance statistics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Exercise compliance statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/exercises/compliance', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const organizationId = req.organization.id;
    const data = await analyticsService.getExerciseCompliance(organizationId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching exercise compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Kunne ikke hente etterlevelsesdata',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /analytics/trends/patients:
 *   get:
 *     summary: Get patient volume trends
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patient volume trend data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/trends/patients', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const organizationId = req.organization.id;
    const data = await analyticsService.getPatientVolumeTrends(organizationId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching patient trends:', error);
    res.status(500).json({
      success: false,
      message: 'Kunne ikke hente pasienttrender',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /analytics/export/{type}:
 *   get:
 *     summary: Export analytics data to CSV
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Export type (e.g. patients, appointments, revenue)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/export/:type',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(exportSchema),
  async (req, res) => {
    try {
      const { type } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.organization.id;

      const csvContent = await analyticsService.exportAnalyticsCSV(organizationId, type, {
        startDate,
        endDate,
      });

      const filename = `analyse-${type}-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(`\uFEFF${csvContent}`); // BOM for Excel UTF-8 support
    } catch (error) {
      logger.error('Error exporting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Kunne ikke eksportere data',
        error: error.message,
      });
    }
  }
);

export default router;
