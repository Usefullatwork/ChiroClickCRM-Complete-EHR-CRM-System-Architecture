/**
 * Vestibular Assessments Routes
 */

import express from 'express';
import * as vestibularController from '../controllers/vestibular.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   POST /api/v1/vestibular
 * @desc    Create new vestibular assessment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.createAssessment
);

/**
 * @route   GET /api/v1/vestibular/:id
 * @desc    Get assessment by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getAssessment
);

/**
 * @route   GET /api/v1/vestibular/patient/:patientId
 * @desc    Get all assessments for a patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getPatientAssessments
);

/**
 * @route   GET /api/v1/vestibular/encounter/:encounterId
 * @desc    Get assessment by encounter ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/encounter/:encounterId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getEncounterAssessment
);

/**
 * @route   PATCH /api/v1/vestibular/:id
 * @desc    Update assessment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.updateAssessment
);

/**
 * @route   DELETE /api/v1/vestibular/:id
 * @desc    Delete assessment
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete('/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.deleteAssessment
);

/**
 * @route   GET /api/v1/vestibular/patient/:patientId/bppv-trends
 * @desc    Get BPPV trends for patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/patient/:patientId/bppv-trends',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getBPPVTrends
);

/**
 * @route   GET /api/v1/vestibular/stats/diagnoses
 * @desc    Get common diagnoses statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats/diagnoses',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getCommonDiagnoses
);

/**
 * @route   GET /api/v1/vestibular/stats/efficacy
 * @desc    Get treatment efficacy statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/stats/efficacy',
  requireRole(['ADMIN', 'PRACTITIONER']),
  vestibularController.getTreatmentEfficacy
);

export default router;
