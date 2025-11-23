/**
 * Communications Routes
 */

import express from 'express';
import * as communicationController from '../controllers/communications.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { smsLimiter, emailLimiter, perPatientLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/communications
 * @desc    Get all communications with filters
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  communicationController.getCommunications
);

/**
 * @route   POST /api/v1/communications/sms
 * @desc    Send SMS to patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/sms',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  smsLimiter, // 10 SMS per hour per user
  perPatientLimiter, // 3 messages per patient per day
  communicationController.sendSMS
);

/**
 * @route   POST /api/v1/communications/email
 * @desc    Send email to patient
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/email',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  emailLimiter, // 20 emails per hour per user
  perPatientLimiter, // 3 messages per patient per day
  communicationController.sendEmail
);

/**
 * @route   GET /api/v1/communications/templates
 * @desc    Get message templates
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/templates',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  communicationController.getTemplates
);

/**
 * @route   POST /api/v1/communications/templates
 * @desc    Create message template
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/templates',
  requireRole(['ADMIN', 'PRACTITIONER']),
  communicationController.createTemplate
);

/**
 * @route   GET /api/v1/communications/stats
 * @desc    Get communication statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  communicationController.getStats
);

export default router;
