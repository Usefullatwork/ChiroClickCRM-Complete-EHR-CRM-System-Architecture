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
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get comprehensive analytics dashboard data
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/patients
 * @desc    Get patient statistics
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/appointments
 * @desc    Get appointment statistics
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
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
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue statistics
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/exercises/top
 * @desc    Get most prescribed exercises
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/exercises/compliance
 * @desc    Get exercise compliance statistics
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/trends/patients
 * @desc    Get patient volume trends
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/analytics/export/:type
 * @desc    Export analytics data to CSV
 * @access  Private (ADMIN, PRACTITIONER)
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
      res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 support
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
