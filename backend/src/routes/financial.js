/**
 * Financial Routes
 */

import express from 'express';
import * as financialController from '../controllers/financial.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/financial
 * @desc    Get all financial metrics with filters
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getFinancialMetrics
);

/**
 * @route   GET /api/v1/financial/summary
 * @desc    Get revenue summary
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/summary',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getRevenueSummary
);

/**
 * @route   GET /api/v1/financial/revenue-by-code
 * @desc    Get revenue by treatment code
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/revenue-by-code',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getRevenueByTreatmentCode
);

/**
 * @route   GET /api/v1/financial/payment-methods
 * @desc    Get payment method breakdown
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/payment-methods',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getPaymentMethodBreakdown
);

/**
 * @route   GET /api/v1/financial/outstanding
 * @desc    Get outstanding invoices
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/outstanding',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getOutstandingInvoices
);

/**
 * @route   GET /api/v1/financial/chart/daily-revenue
 * @desc    Get daily revenue chart data
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/chart/daily-revenue',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getDailyRevenueChart
);

/**
 * @route   GET /api/v1/financial/invoice-number
 * @desc    Generate next invoice number
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/invoice-number',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.generateInvoiceNumber
);

/**
 * @route   GET /api/v1/financial/patient/:patientId
 * @desc    Get patient payment history
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.getPatientPaymentHistory
);

/**
 * @route   GET /api/v1/financial/:id
 * @desc    Get financial metric by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  financialController.getFinancialMetric
);

/**
 * @route   POST /api/v1/financial
 * @desc    Create new financial metric
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.createFinancialMetric
);

/**
 * @route   PATCH /api/v1/financial/:id/payment-status
 * @desc    Update payment status
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch('/:id/payment-status',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  financialController.updatePaymentStatus
);

export default router;
