/**
 * Follow-ups Routes
 */

import express from 'express';
import * as followUpController from '../controllers/followups.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  completeFollowUpSchema,
  getFollowUpsSchema
} from '../validators/followup.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/followups
 * @desc    Get all follow-ups with filters
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getFollowUpsSchema),
  followUpController.getFollowUps
);

/**
 * @route   GET /api/v1/followups/overdue
 * @desc    Get overdue follow-ups
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/overdue',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getOverdue
);

/**
 * @route   GET /api/v1/followups/upcoming
 * @desc    Get upcoming follow-ups
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/upcoming',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getUpcoming
);

/**
 * @route   GET /api/v1/followups/stats
 * @desc    Get follow-up statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats',
  requireRole(['ADMIN', 'PRACTITIONER']),
  followUpController.getStats
);

/**
 * @route   GET /api/v1/followups/patients/needingFollowUp
 * @desc    Get patients needing follow-up based on should_be_followed_up field
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patients/needingFollowUp',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getPatientsNeedingFollowUp
);

/**
 * @route   POST /api/v1/followups/patients/:patientId/contacted
 * @desc    Mark patient as contacted for follow-up
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/patients/:patientId/contacted',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.markPatientAsContacted
);

/**
 * @route   GET /api/v1/followups/:id
 * @desc    Get follow-up by ID
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getFollowUp
);

/**
 * @route   POST /api/v1/followups
 * @desc    Create new follow-up
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(createFollowUpSchema),
  followUpController.createFollowUp
);

/**
 * @route   PATCH /api/v1/followups/:id
 * @desc    Update follow-up
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.patch('/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateFollowUpSchema),
  followUpController.updateFollowUp
);

/**
 * @route   POST /api/v1/followups/:id/complete
 * @desc    Complete follow-up
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/:id/complete',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(completeFollowUpSchema),
  followUpController.completeFollowUp
);

export default router;
