/**
 * GDPR Routes
 */

import express from 'express';
import * as gdprController from '../controllers/gdpr.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/gdpr/requests
 * @desc    Get all GDPR requests
 * @access  Private (ADMIN)
 */
router.get('/requests',
  requireRole(['ADMIN']),
  gdprController.getGDPRRequests
);

/**
 * @route   POST /api/v1/gdpr/requests
 * @desc    Create new GDPR request
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/requests',
  requireRole(['ADMIN', 'PRACTITIONER']),
  gdprController.createGDPRRequest
);

/**
 * @route   PATCH /api/v1/gdpr/requests/:requestId/status
 * @desc    Update GDPR request status
 * @access  Private (ADMIN)
 */
router.patch('/requests/:requestId/status',
  requireRole(['ADMIN']),
  gdprController.updateGDPRRequestStatus
);

/**
 * @route   GET /api/v1/gdpr/patient/:patientId/data-access
 * @desc    Process data access request (Article 15)
 * @access  Private (ADMIN)
 */
router.get('/patient/:patientId/data-access',
  requireRole(['ADMIN']),
  gdprController.processDataAccess
);

/**
 * @route   GET /api/v1/gdpr/patient/:patientId/data-portability
 * @desc    Process data portability request (Article 20)
 * @access  Private (ADMIN)
 */
router.get('/patient/:patientId/data-portability',
  requireRole(['ADMIN']),
  gdprController.processDataPortability
);

/**
 * @route   POST /api/v1/gdpr/requests/:requestId/erasure
 * @desc    Process erasure request (Article 17)
 * @access  Private (ADMIN)
 */
router.post('/requests/:requestId/erasure',
  requireRole(['ADMIN']),
  gdprController.processErasure
);

/**
 * @route   PATCH /api/v1/gdpr/patient/:patientId/consent
 * @desc    Update patient consent preferences
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/patient/:patientId/consent',
  requireRole(['ADMIN', 'PRACTITIONER']),
  gdprController.updateConsent
);

/**
 * @route   GET /api/v1/gdpr/patient/:patientId/consent-audit
 * @desc    Get consent audit trail
 * @access  Private (ADMIN)
 */
router.get('/patient/:patientId/consent-audit',
  requireRole(['ADMIN']),
  gdprController.getConsentAuditTrail
);

export default router;
