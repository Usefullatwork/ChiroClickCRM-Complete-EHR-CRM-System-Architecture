/**
 * Progress Tracking Routes
 * API endpoints for exercise progress tracking and compliance analytics
 *
 * Ruter for fremgangssporing
 * API-endepunkter for treningsfremgang og overholdelsesanalyse
 *
 * @module routes/progress
 */

import express from 'express'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import * as progressService from '../services/progressTracking.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(requireAuth)
router.use(requireOrganization)

// ============================================================================
// PATIENT PROGRESS ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/progress/patient/:patientId/stats
 * @desc    Get comprehensive progress statistics for a patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patient/:patientId/stats',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const { patientId } = req.params
      const { startDate, endDate } = req.query
      const organizationId = req.organizationId

      const stats = await progressService.getPatientProgressStats(
        organizationId,
        patientId,
        { startDate, endDate }
      )

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Error getting patient progress stats:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente fremgangsstatistikk',
        message: error.message
      })
    }
  }
)

/**
 * @route   GET /api/v1/progress/patient/:patientId/weekly
 * @desc    Get weekly compliance data for a patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patient/:patientId/weekly',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const { patientId } = req.params
      const { weeks = 12 } = req.query
      const organizationId = req.organizationId

      const data = await progressService.getWeeklyCompliance(
        organizationId,
        patientId,
        parseInt(weeks)
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Error getting weekly compliance:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente ukentlig overholdelse',
        message: error.message
      })
    }
  }
)

/**
 * @route   GET /api/v1/progress/patient/:patientId/daily
 * @desc    Get daily progress data for calendar view
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patient/:patientId/daily',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const { patientId } = req.params
      const { months = 3 } = req.query
      const organizationId = req.organizationId

      const data = await progressService.getDailyProgress(
        organizationId,
        patientId,
        parseInt(months)
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Error getting daily progress:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente daglig fremgang',
        message: error.message
      })
    }
  }
)

/**
 * @route   GET /api/v1/progress/patient/:patientId/pain
 * @desc    Get pain level history over time
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patient/:patientId/pain',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const { patientId } = req.params
      const { days = 90 } = req.query
      const organizationId = req.organizationId

      const data = await progressService.getPainHistory(
        organizationId,
        patientId,
        parseInt(days)
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Error getting pain history:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente smertehistorikk',
        message: error.message
      })
    }
  }
)

/**
 * @route   POST /api/v1/progress/patient/:patientId/pain
 * @desc    Log a pain entry for a patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/patient/:patientId/pain',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  async (req, res) => {
    try {
      const { patientId } = req.params
      const { painLevel, notes } = req.body
      const organizationId = req.organizationId

      if (painLevel === undefined || painLevel < 0 || painLevel > 10) {
        return res.status(400).json({
          success: false,
          error: 'Ugyldig smerteniva. Ma vaere mellom 0 og 10.'
        })
      }

      const result = await progressService.logPainEntry(
        organizationId,
        patientId,
        painLevel,
        notes,
        'clinician'
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error logging pain entry:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke registrere smerteniva',
        message: error.message
      })
    }
  }
)

// ============================================================================
// THERAPIST DASHBOARD ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/progress/compliance
 * @desc    Get all patients' compliance summary for therapist dashboard
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/compliance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, sortBy = 'compliance_rate', order = 'DESC' } = req.query
      const organizationId = req.organizationId

      const data = await progressService.getAllPatientsCompliance(
        organizationId,
        {
          limit: parseInt(limit),
          offset: parseInt(offset),
          sortBy,
          order
        }
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Error getting all patients compliance:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente pasienter overholdelse',
        message: error.message
      })
    }
  }
)

/**
 * @route   GET /api/v1/progress/overview
 * @desc    Get clinic-wide exercise compliance overview
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/overview',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res) => {
    try {
      const organizationId = req.organizationId

      const data = await progressService.getClinicComplianceOverview(organizationId)

      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Error getting clinic compliance overview:', error)
      res.status(500).json({
        success: false,
        error: 'Kunne ikke hente klinikkens overholdelse',
        message: error.message
      })
    }
  }
)

export default router
