/**
 * Treatment Codes Routes
 */

import express from 'express';
import * as treatmentController from '../controllers/treatments.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  searchTreatmentCodesSchema,
  getTreatmentStatisticsSchema,
  calculatePriceSchema,
  getTreatmentCodeSchema
} from '../validators/treatment.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   GET /api/v1/treatments
 * @desc    Get all treatment codes
 * @access  Private
 */
router.get('/', treatmentController.getAllTreatmentCodes);

/**
 * @route   GET /api/v1/treatments/common
 * @desc    Get commonly used treatment codes
 * @access  Private
 */
router.get('/common', treatmentController.getCommonTreatmentCodes);

/**
 * @route   GET /api/v1/treatments/search
 * @desc    Search treatment codes
 * @access  Private
 */
router.get('/search',
  validate(searchTreatmentCodesSchema),
  treatmentController.searchTreatmentCodes
);

/**
 * @route   GET /api/v1/treatments/statistics
 * @desc    Get treatment statistics
 * @access  Private
 */
router.get('/statistics',
  validate(getTreatmentStatisticsSchema),
  treatmentController.getTreatmentStatistics
);

/**
 * @route   POST /api/v1/treatments/calculate-price
 * @desc    Calculate price for treatment codes
 * @access  Private
 */
router.post('/calculate-price',
  validate(calculatePriceSchema),
  treatmentController.calculatePrice
);

/**
 * @route   GET /api/v1/treatments/:code
 * @desc    Get specific treatment code
 * @access  Private
 */
router.get('/:code',
  validate(getTreatmentCodeSchema),
  treatmentController.getTreatmentCode
);

export default router;
