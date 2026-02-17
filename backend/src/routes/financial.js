/**
 * Financial Routes
 */

import express from 'express';
import * as financialController from '../controllers/financial.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { _validate } from '../middleware/validation.js';
import {
  _createFinancialMetricSchema,
  _updatePaymentStatusSchema,
  _getFinancialMetricsSchema,
  _getRevenueSummarySchema,
} from '../validators/financial.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /financial:
 *   get:
 *     summary: Get all financial metrics with filters
 *     tags: [Financial]
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
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [paid, unpaid, partial, overdue]
 *     responses:
 *       200:
 *         description: List of financial metrics
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', requireRole(['ADMIN', 'PRACTITIONER']), financialController.getFinancialMetrics);

/**
 * @swagger
 * /financial/summary:
 *   get:
 *     summary: Get revenue summary
 *     tags: [Financial]
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
 *         description: Revenue summary with totals and breakdowns
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getRevenueSummary
);

/**
 * @swagger
 * /financial/revenue-by-code:
 *   get:
 *     summary: Get revenue by treatment code
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue grouped by treatment/CPT code
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/revenue-by-code',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getRevenueByTreatmentCode
);

/**
 * @swagger
 * /financial/payment-methods:
 *   get:
 *     summary: Get payment method breakdown
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment totals grouped by method (card, cash, insurance, etc.)
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/payment-methods',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getPaymentMethodBreakdown
);

/**
 * @swagger
 * /financial/outstanding:
 *   get:
 *     summary: Get outstanding invoices
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of outstanding/unpaid invoices
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/outstanding',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getOutstandingInvoices
);

/**
 * @swagger
 * /financial/chart/daily-revenue:
 *   get:
 *     summary: Get daily revenue chart data
 *     tags: [Financial]
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
 *         description: Daily revenue data points for charting
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/chart/daily-revenue',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getDailyRevenueChart
);

/**
 * @swagger
 * /financial/invoice-number:
 *   get:
 *     summary: Generate next invoice number
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Next available invoice number
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/invoice-number',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.generateInvoiceNumber
);

/**
 * @swagger
 * /financial/patient/{patientId}:
 *   get:
 *     summary: Get patient payment history
 *     tags: [Financial]
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
 *         description: Patient payment history
 *       404:
 *         description: Patient not found
 */
router.get(
  '/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.getPatientPaymentHistory
);

/**
 * @swagger
 * /financial/{id}:
 *   get:
 *     summary: Get financial metric by ID
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Financial metric details
 *       404:
 *         description: Financial metric not found
 */
router.get('/:id', requireRole(['ADMIN', 'PRACTITIONER']), financialController.getFinancialMetric);

/**
 * @swagger
 * /financial:
 *   post:
 *     summary: Create new financial metric
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, encounter_id, amount]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               encounter_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               treatment_code:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [card, cash, insurance, vipps, invoice]
 *     responses:
 *       201:
 *         description: Financial metric created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.createFinancialMetric
);

/**
 * @swagger
 * /financial/{id}/payment-status:
 *   patch:
 *     summary: Update payment status
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [paid, unpaid, partial, overdue, refunded]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       404:
 *         description: Financial metric not found
 */
router.patch(
  '/:id/payment-status',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.updatePaymentStatus
);

/**
 * @swagger
 * /financial/{id}/payment:
 *   post:
 *     summary: Record payment for financial metric
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *             required: [amount, method]
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded
 *       400:
 *         description: Validation error
 *       404:
 *         description: Financial metric not found
 */
router.post(
  '/:id/payment',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.recordPayment
);

/**
 * @swagger
 * /financial/{id}/invoice:
 *   post:
 *     summary: Generate invoice PDF for financial metric
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invoice PDF generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Financial metric not found
 */
router.post(
  '/:id/invoice',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.generateInvoice
);

export default router;
