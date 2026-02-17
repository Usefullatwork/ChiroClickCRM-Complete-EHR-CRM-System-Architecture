/**
 * GDPR Routes
 */

import express from 'express';
import * as gdprController from '../controllers/gdpr.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  createGDPRRequestSchema,
  updateGDPRRequestStatusSchema,
  patientIdParamSchema,
  processErasureSchema,
  updateConsentSchema,
} from '../validators/gdpr.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /gdpr/requests:
 *   get:
 *     summary: Get all GDPR requests
 *     tags: [GDPR]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of GDPR data requests
 *       403:
 *         description: Admin access required
 */
router.get('/requests', requireRole(['ADMIN']), gdprController.getGDPRRequests);

/**
 * @swagger
 * /gdpr/requests:
 *   post:
 *     summary: Create a new GDPR request
 *     tags: [GDPR]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, type]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [access, portability, erasure, rectification, restriction]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: GDPR request created
 *       400:
 *         description: Validation error
 */
router.post(
  '/requests',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createGDPRRequestSchema),
  gdprController.createGDPRRequest
);

/**
 * @swagger
 * /gdpr/requests/{requestId}/status:
 *   patch:
 *     summary: Update GDPR request status
 *     tags: [GDPR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, rejected]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request status updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Request not found
 */
router.patch(
  '/requests/:requestId/status',
  requireRole(['ADMIN']),
  validate(updateGDPRRequestStatusSchema),
  gdprController.updateGDPRRequestStatus
);

/**
 * @swagger
 * /gdpr/patient/{patientId}/data-access:
 *   get:
 *     summary: Process data access request (GDPR Article 15)
 *     tags: [GDPR]
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
 *         description: Complete patient data export (JSON)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId/data-access',
  requireRole(['ADMIN']),
  validate(patientIdParamSchema),
  gdprController.processDataAccess
);

/**
 * @swagger
 * /gdpr/patient/{patientId}/data-portability:
 *   get:
 *     summary: Process data portability request (GDPR Article 20)
 *     tags: [GDPR]
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
 *         description: Patient data in portable format (structured JSON/CSV)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId/data-portability',
  requireRole(['ADMIN']),
  validate(patientIdParamSchema),
  gdprController.processDataPortability
);

/**
 * @swagger
 * /gdpr/requests/{requestId}/erasure:
 *   post:
 *     summary: Process erasure request (GDPR Article 17 - Right to be forgotten)
 *     tags: [GDPR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *             properties:
 *               confirm:
 *                 type: boolean
 *               retain_legal_basis:
 *                 type: boolean
 *                 description: Retain data required by law (e.g., Norwegian health records)
 *     responses:
 *       200:
 *         description: Erasure processed (data anonymized/deleted)
 *       400:
 *         description: Erasure cannot be completed
 *       403:
 *         description: Admin access required
 */
router.post(
  '/requests/:requestId/erasure',
  requireRole(['ADMIN']),
  validate(processErasureSchema),
  gdprController.processErasure
);

/**
 * @swagger
 * /gdpr/patient/{patientId}/consent:
 *   patch:
 *     summary: Update patient consent preferences
 *     tags: [GDPR]
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
 *             properties:
 *               marketing:
 *                 type: boolean
 *               research:
 *                 type: boolean
 *               data_sharing:
 *                 type: boolean
 *               sms_reminders:
 *                 type: boolean
 *               email_communications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Consent preferences updated
 *       404:
 *         description: Patient not found
 */
router.patch(
  '/patient/:patientId/consent',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateConsentSchema),
  gdprController.updateConsent
);

/**
 * @swagger
 * /gdpr/patient/{patientId}/consent-audit:
 *   get:
 *     summary: Get consent audit trail
 *     tags: [GDPR]
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
 *         description: Chronological audit trail of consent changes
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId/consent-audit',
  requireRole(['ADMIN']),
  validate(patientIdParamSchema),
  gdprController.getConsentAuditTrail
);

export default router;
