/**
 * PDF Generation Routes
 */

import express from 'express';
import * as pdfController from '../controllers/pdf.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
  generateInvoice as generateInvoicePdf,
} from '../services/pdfGenerator.js';
import logger from '../utils/logger.js';
import validate from '../middleware/validation.js';
import {
  generateLetterSchema,
  generateInvoiceFromMetricSchema,
  treatmentSummarySchema,
  referralLetterSchema,
  sickNoteSchema,
  generateInvoiceSchema,
} from '../validators/pdf.validators.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// ── Legacy routes (existing) ──────────────────────────────────────────

/**
 * @swagger
 * /pdf/letter/{encounterId}:
 *   post:
 *     summary: Generate patient letter (sick leave, referral, treatment summary)
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
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
 *             required: [letterType]
 *             properties:
 *               letterType:
 *                 type: string
 *                 enum: [referral, sick_leave, treatment_summary]
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Encounter not found
 */
router.post(
  '/letter/:encounterId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateLetterSchema),
  pdfController.generatePatientLetter
);

/**
 * @swagger
 * /pdf/invoice/{financialMetricId}:
 *   post:
 *     summary: Generate invoice PDF from financial metric
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: financialMetricId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invoice PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Financial metric not found
 */
router.post(
  '/invoice/:financialMetricId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(generateInvoiceFromMetricSchema),
  pdfController.generateInvoice
);

// ── New enhanced PDF routes ───────────────────────────────────────────

/**
 * @swagger
 * /pdf/treatment-summary/{patientId}:
 *   get:
 *     summary: Generate treatment summary PDF with encounter history and outcome scores
 *     tags: [PDF]
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
 *         name: maxEncounters
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Treatment summary PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Patient not found
 */
router.get(
  '/treatment-summary/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(treatmentSummarySchema),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { organizationId, user } = req;
      const maxEncounters = parseInt(req.query.maxEncounters, 10) || 20;

      const buffer = await generateTreatmentSummary(patientId, organizationId, { maxEncounters });

      await logAudit({
        organizationId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'GENERATE',
        resourceType: 'DOCUMENT',
        resourceId: patientId,
        reason: 'Generated treatment summary PDF',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="behandlingssammendrag.pdf"');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      logger.error('Error generating treatment summary PDF:', error);
      if (error.message === 'Patient not found') {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.status(500).json({ error: 'Failed to generate treatment summary' });
    }
  }
);

/**
 * @swagger
 * /pdf/referral-letter:
 *   post:
 *     summary: Generate referral letter (Henvisning) PDF
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, encounterId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *               recipientName:
 *                 type: string
 *               recipientAddress:
 *                 type: string
 *               reasonForReferral:
 *                 type: string
 *               relevantFindings:
 *                 type: string
 *               relevantTestResults:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral letter PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Encounter not found
 */
router.post(
  '/referral-letter',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(referralLetterSchema),
  async (req, res) => {
    try {
      const { organizationId, user } = req;
      const {
        patientId,
        encounterId,
        recipientName,
        recipientAddress,
        reasonForReferral,
        relevantFindings,
        relevantTestResults,
      } = req.body;

      if (!patientId || !encounterId) {
        return res.status(400).json({ error: 'patientId and encounterId are required' });
      }

      const buffer = await generateReferralLetter({
        patientId,
        orgId: organizationId,
        encounterId,
        recipientName,
        recipientAddress,
        reasonForReferral,
        relevantFindings,
        relevantTestResults,
      });

      await logAudit({
        organizationId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'GENERATE',
        resourceType: 'DOCUMENT',
        resourceId: encounterId,
        reason: 'Generated referral letter PDF',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="henvisning.pdf"');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      logger.error('Error generating referral letter PDF:', error);
      if (error.message === 'Encounter not found') {
        return res.status(404).json({ error: 'Encounter not found' });
      }
      res.status(500).json({ error: 'Failed to generate referral letter' });
    }
  }
);

/**
 * @swagger
 * /pdf/sick-note:
 *   post:
 *     summary: Generate sick note (Sykmelding) PDF
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, encounterId, startDate, endDate]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *               diagnosisCode:
 *                 type: string
 *               diagnosisText:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               functionalAssessment:
 *                 type: string
 *               workRestrictions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sick note PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Patient not found
 */
router.post(
  '/sick-note',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(sickNoteSchema),
  async (req, res) => {
    try {
      const { organizationId, user } = req;
      const {
        patientId,
        encounterId,
        diagnosisCode,
        diagnosisText,
        startDate,
        endDate,
        percentage,
        functionalAssessment,
        workRestrictions,
      } = req.body;

      if (!patientId || !encounterId) {
        return res.status(400).json({ error: 'patientId and encounterId are required' });
      }
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const buffer = await generateSickNote({
        patientId,
        orgId: organizationId,
        encounterId,
        diagnosisCode,
        diagnosisText,
        startDate,
        endDate,
        percentage,
        functionalAssessment,
        workRestrictions,
      });

      await logAudit({
        organizationId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'GENERATE',
        resourceType: 'DOCUMENT',
        resourceId: patientId,
        reason: 'Generated sick note PDF',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sykmelding.pdf"');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      logger.error('Error generating sick note PDF:', error);
      if (error.message === 'Patient not found') {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.status(500).json({ error: 'Failed to generate sick note' });
    }
  }
);

/**
 * @swagger
 * /pdf/invoice:
 *   post:
 *     summary: Generate invoice (Faktura) PDF from line items
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, lineItems]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               invoiceNumber:
 *                 type: string
 *               invoiceDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *               vatRate:
 *                 type: number
 *               accountNumber:
 *                 type: string
 *               kidNumber:
 *                 type: string
 *               insuranceCompany:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Patient not found
 */
router.post(
  '/invoice',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(generateInvoiceSchema),
  async (req, res) => {
    try {
      const { organizationId, user } = req;
      const {
        patientId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        lineItems,
        vatRate,
        accountNumber,
        kidNumber,
        insuranceCompany,
      } = req.body;

      if (!patientId) {
        return res.status(400).json({ error: 'patientId is required' });
      }
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ error: 'lineItems array is required' });
      }

      const buffer = await generateInvoicePdf({
        orgId: organizationId,
        patientId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        lineItems,
        vatRate,
        accountNumber,
        kidNumber,
        insuranceCompany,
      });

      await logAudit({
        organizationId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'GENERATE',
        resourceType: 'INVOICE',
        resourceId: patientId,
        reason: `Generated invoice PDF ${invoiceNumber || ''}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="faktura-${invoiceNumber || 'ny'}.pdf"`
      );
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      if (error.message === 'Patient not found') {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
);

export default router;
