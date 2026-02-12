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
 * @route   POST /api/v1/pdf/letter/:encounterId
 * @desc    Generate patient letter (sick leave, referral, treatment summary)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post(
  '/letter/:encounterId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateLetterSchema),
  pdfController.generatePatientLetter
);

/**
 * @route   POST /api/v1/pdf/invoice/:financialMetricId
 * @desc    Generate invoice PDF from financial metric
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post(
  '/invoice/:financialMetricId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(generateInvoiceFromMetricSchema),
  pdfController.generateInvoice
);

// ── New enhanced PDF routes ───────────────────────────────────────────

/**
 * @route   GET /api/v1/pdf/treatment-summary/:patientId
 * @desc    Generate treatment summary PDF with encounter history + outcome scores
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   POST /api/v1/pdf/referral-letter
 * @desc    Generate referral letter (Henvisning) PDF
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   POST /api/v1/pdf/sick-note
 * @desc    Generate sick note (Sykmelding) PDF
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   POST /api/v1/pdf/invoice
 * @desc    Generate invoice (Faktura) PDF from line items
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
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
