/**
 * PDF Generation Routes
 */

import express from 'express';
import * as pdfController from '../controllers/pdf.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   POST /api/v1/pdf/letter/:encounterId
 * @desc    Generate patient letter (sick leave, referral, treatment summary)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/letter/:encounterId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  pdfController.generatePatientLetter
);

/**
 * @route   POST /api/v1/pdf/invoice/:financialMetricId
 * @desc    Generate invoice PDF
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/invoice/:financialMetricId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  pdfController.generateInvoice
);

export default router;
