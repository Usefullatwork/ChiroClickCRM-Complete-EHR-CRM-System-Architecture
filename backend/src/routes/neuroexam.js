/**
 * Neurological Examination API Routes
 *
 * Endpoints for managing neurological examinations:
 * - Create/update examination sessions
 * - Save test results
 * - Generate clinical narratives
 * - Track red flags and referrals
 * - BPPV treatment logging
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  listNeuroexamsSchema,
  getNeuroexamSchema,
  createNeuroexamSchema,
  updateNeuroexamSchema,
  completeNeuroexamSchema,
  recordReferralSchema,
  logBPPVTreatmentSchema,
  getPatientHistorySchema,
} from '../validators/neuroexam.validators.js';
import * as neuroexamController from '../controllers/neuroexam.js';

const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @swagger
 * /neuroexam:
 *   get:
 *     summary: List neurological examinations
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasRedFlags
 *         schema:
 *           type: boolean
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
 *     responses:
 *       200:
 *         description: Paginated list of examinations
 */
router.get(
  '/',
  requireAuth,
  requireOrganization,
  validate(listNeuroexamsSchema),
  neuroexamController.listExams
);

/**
 * @swagger
 * /neuroexam/{examId}:
 *   get:
 *     summary: Get single neurological examination
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Examination with test results and vestibular findings
 *       404:
 *         description: Examination not found
 */
router.get(
  '/:examId',
  requireAuth,
  requireOrganization,
  validate(getNeuroexamSchema),
  neuroexamController.getExam
);

/**
 * @swagger
 * /neuroexam:
 *   post:
 *     summary: Create new neurological examination
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *               examType:
 *                 type: string
 *                 enum: [COMPREHENSIVE, FOCUSED, SCREENING]
 *               testResults:
 *                 type: object
 *               clusterScores:
 *                 type: object
 *               redFlags:
 *                 type: array
 *                 items:
 *                   type: object
 *               narrativeText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Examination created
 */
router.post(
  '/',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createNeuroexamSchema),
  neuroexamController.createExam
);

/**
 * @swagger
 * /neuroexam/{examId}:
 *   put:
 *     summary: Update neurological examination
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
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
 *     responses:
 *       200:
 *         description: Examination updated
 *       404:
 *         description: Examination not found
 */
router.put(
  '/:examId',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateNeuroexamSchema),
  neuroexamController.updateExam
);

/**
 * @swagger
 * /neuroexam/{examId}/complete:
 *   post:
 *     summary: Mark examination as complete
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Examination marked complete
 */
router.post(
  '/:examId/complete',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(completeNeuroexamSchema),
  neuroexamController.completeExam
);

/**
 * @swagger
 * /neuroexam/{examId}/referral:
 *   post:
 *     summary: Record referral sent for examination
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
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
 *             required: [specialty, urgency]
 *             properties:
 *               specialty:
 *                 type: string
 *               urgency:
 *                 type: string
 *                 enum: [EMERGENT, URGENT, ROUTINE]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral recorded
 */
router.post(
  '/:examId/referral',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(recordReferralSchema),
  neuroexamController.recordReferral
);

/**
 * @swagger
 * /neuroexam/bppv-treatment:
 *   post:
 *     summary: Log BPPV treatment
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, canalAffected, sideAffected, treatmentManeuver]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               examId:
 *                 type: string
 *                 format: uuid
 *               canalAffected:
 *                 type: string
 *               sideAffected:
 *                 type: string
 *               treatmentManeuver:
 *                 type: string
 *               preVAS:
 *                 type: number
 *               postVAS:
 *                 type: number
 *     responses:
 *       201:
 *         description: BPPV treatment logged
 */
router.post(
  '/bppv-treatment',
  requireAuth,
  requireOrganization,
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(logBPPVTreatmentSchema),
  neuroexamController.logBPPVTreatment
);

/**
 * @swagger
 * /neuroexam/alerts/red-flags:
 *   get:
 *     summary: Get all pending red flag alerts
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Red flag alerts sorted by urgency
 */
router.get(
  '/alerts/red-flags',
  requireAuth,
  requireOrganization,
  neuroexamController.getRedFlagAlerts
);

/**
 * @swagger
 * /neuroexam/patient/{patientId}/history:
 *   get:
 *     summary: Get patient's neurological exam history
 *     tags: [Neuroexam]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Exam history with BPPV treatments
 */
router.get(
  '/patient/:patientId/history',
  requireAuth,
  requireOrganization,
  validate(getPatientHistorySchema),
  neuroexamController.getPatientHistory
);

export default router;
