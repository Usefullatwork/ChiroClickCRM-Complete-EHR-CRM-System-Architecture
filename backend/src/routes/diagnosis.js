/**
 * Diagnosis Codes Routes
 */

import express from 'express';
import * as diagnosisController from '../controllers/diagnosis.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/diagnosis/search
 * @desc    Search diagnosis codes
 * @access  Private
 */
router.get('/search', diagnosisController.searchDiagnosisCodes);

/**
 * @route   GET /api/v1/diagnosis/common
 * @desc    Get commonly used diagnosis codes
 * @access  Private
 */
router.get('/common', diagnosisController.getCommonDiagnosisCodes);

/**
 * @route   GET /api/v1/diagnosis/chiropractic
 * @desc    Get chiropractic-specific codes (L & N chapters)
 * @access  Private
 */
router.get('/chiropractic', diagnosisController.getChiropracticCodes);

/**
 * @route   GET /api/v1/diagnosis/statistics
 * @desc    Get diagnosis statistics for organization
 * @access  Private
 */
router.get('/statistics', diagnosisController.getDiagnosisStatistics);

/**
 * @route   GET /api/v1/diagnosis/:code
 * @desc    Get specific diagnosis code
 * @access  Private
 */
router.get('/:code', diagnosisController.getDiagnosisCode);

export default router;
