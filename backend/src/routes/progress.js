/**
 * Progress Tracking Routes
 * API endpoints for exercise progress tracking and compliance analytics
 *
 * Ruter for fremgangssporing
 * API-endepunkter for treningsfremgang og overholdelsesanalyse
 *
 * @module routes/progress
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as progressService from '../services/progressTracking.js';
import validate from '../middleware/validation.js';
import {
  getPatientStatsSchema,
  getWeeklyComplianceSchema,
  getDailyProgressSchema,
  getPainHistorySchema,
  logPainEntrySchema,
  getAllComplianceSchema,
} from '../validators/progress.validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// PATIENT PROGRESS ROUTES
// ============================================================================

/**
 * @swagger
 * /progress/patient/{patientId}/stats:
 *   get:
 *     summary: Get comprehensive progress statistics for a patient
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Patient progress statistics
 */
router.get(
  '/patient/:patientId/stats',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getPatientStatsSchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.organizationId;

      const stats = await progressService.getPatientProgressStats(organizationId, patientId, {
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting patient progress stats:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente fremgangsstatistikk',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /progress/patient/{patientId}/weekly:
 *   get:
 *     summary: Get weekly compliance data for a patient
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Weekly compliance data
 */
router.get(
  '/patient/:patientId/weekly',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getWeeklyComplianceSchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { weeks = 12 } = req.query;
      const organizationId = req.organizationId;

      const data = await progressService.getWeeklyCompliance(
        organizationId,
        patientId,
        parseInt(weeks)
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting weekly compliance:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente ukentlig overholdelse',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /progress/patient/{patientId}/daily:
 *   get:
 *     summary: Get daily progress data for calendar view
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 3
 *     responses:
 *       200:
 *         description: Daily progress calendar data
 */
router.get(
  '/patient/:patientId/daily',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getDailyProgressSchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { months = 3 } = req.query;
      const organizationId = req.organizationId;

      const data = await progressService.getDailyProgress(
        organizationId,
        patientId,
        parseInt(months)
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting daily progress:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente daglig fremgang',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /progress/patient/{patientId}/pain:
 *   get:
 *     summary: Get pain level history over time
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Pain level history
 */
router.get(
  '/patient/:patientId/pain',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getPainHistorySchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { days = 90 } = req.query;
      const organizationId = req.organizationId;

      const data = await progressService.getPainHistory(organizationId, patientId, parseInt(days));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting pain history:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente smertehistorikk',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /progress/patient/{patientId}/pain:
 *   post:
 *     summary: Log a pain entry for a patient
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [painLevel]
 *             properties:
 *               painLevel:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pain entry logged
 *       400:
 *         description: Invalid pain level
 */
router.post(
  '/patient/:patientId/pain',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(logPainEntrySchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { painLevel, notes } = req.body;
      const organizationId = req.organizationId;

      if (painLevel === undefined || painLevel < 0 || painLevel > 10) {
        return res.status(400).json({
          success: false,
          error: 'Ugyldig smerteniva. Ma vaere mellom 0 og 10.',
        });
      }

      const result = await progressService.logPainEntry(
        organizationId,
        patientId,
        painLevel,
        notes,
        'clinician'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error logging pain entry:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke registrere smerteniva',
        message: error.message,
      });
    }
  }
);

// ============================================================================
// THERAPIST DASHBOARD ROUTES
// ============================================================================

/**
 * @swagger
 * /progress/compliance:
 *   get:
 *     summary: Get all patients' compliance summary for therapist dashboard
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: compliance_rate
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Patient compliance summaries
 */
router.get(
  '/compliance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getAllComplianceSchema),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, sortBy = 'compliance_rate', order = 'DESC' } = req.query;
      const organizationId = req.organizationId;

      const data = await progressService.getAllPatientsCompliance(organizationId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        order,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting all patients compliance:', error);
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente pasienter overholdelse',
        message: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /progress/overview:
 *   get:
 *     summary: Get clinic-wide exercise compliance overview
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Clinic-wide compliance overview
 */
router.get('/overview', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const data = await progressService.getClinicComplianceOverview(organizationId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error getting clinic compliance overview:', error);
    res.status(500).json({
      success: false,
      error: 'Kunne ikke hente klinikkens overholdelse',
      message: error.message,
    });
  }
});

export default router;
