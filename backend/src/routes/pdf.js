/**
 * PDF Generation Routes
 */

import express from 'express';
import * as pdfController from '../controllers/pdf.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  generateLetterSchema,
  generateInvoiceFromMetricSchema,
  treatmentSummarySchema,
  referralLetterSchema,
  sickNoteSchema,
  generateInvoiceSchema,
} from '../validators/pdf.validators.js';

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
  pdfController.generateTreatmentSummary
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
  pdfController.generateReferralLetter
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
  pdfController.generateSickNote
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
  pdfController.generateInvoiceFromItems
);

// ── Document delivery route ──────────────────────────────────────────

/**
 * @swagger
 * /pdf/{type}/{id}/deliver:
 *   post:
 *     summary: Deliver document to patient via email/SMS
 *     tags: [PDF]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [treatment_summary, referral_letter, sick_note, invoice, exercise_prescription]
 *       - in: path
 *         name: id
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
 *             required: [patientId, method]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               method:
 *                 type: string
 *                 enum: [email, sms, both]
 *     responses:
 *       200:
 *         description: Document delivered
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Patient not found
 */
router.post(
  '/:type/:id/deliver',
  requireRole(['ADMIN', 'PRACTITIONER']),
  pdfController.deliverDocument
);

export default router;
