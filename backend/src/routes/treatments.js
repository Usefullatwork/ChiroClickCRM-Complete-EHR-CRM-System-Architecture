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
  getTreatmentCodeSchema,
} from '../validators/treatment.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /treatments:
 *   get:
 *     summary: Get all treatment codes
 *     tags: [Treatments]
 *     responses:
 *       200:
 *         description: List of all treatment codes
 *       401:
 *         description: Unauthorized
 */
router.get('/', treatmentController.getAllTreatmentCodes);

/**
 * @swagger
 * /treatments/common:
 *   get:
 *     summary: Get commonly used treatment codes for this organization
 *     tags: [Treatments]
 *     responses:
 *       200:
 *         description: Most frequently used treatment codes
 *       401:
 *         description: Unauthorized
 */
router.get('/common', treatmentController.getCommonTreatmentCodes);

/**
 * @swagger
 * /treatments/search:
 *   get:
 *     summary: Search treatment codes
 *     tags: [Treatments]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (code or description)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching treatment codes
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  validate(searchTreatmentCodesSchema),
  treatmentController.searchTreatmentCodes
);

/**
 * @swagger
 * /treatments/statistics:
 *   get:
 *     summary: Get treatment usage statistics for organization
 *     tags: [Treatments]
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
 *         description: Treatment usage statistics
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/statistics',
  validate(getTreatmentStatisticsSchema),
  treatmentController.getTreatmentStatistics
);

/**
 * @swagger
 * /treatments/calculate-price:
 *   post:
 *     summary: Calculate price for treatment codes
 *     tags: [Treatments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codes]
 *             properties:
 *               codes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Treatment code identifiers
 *     responses:
 *       200:
 *         description: Calculated price breakdown
 *       400:
 *         description: Validation error
 */
router.post('/calculate-price', validate(calculatePriceSchema), treatmentController.calculatePrice);

/**
 * @swagger
 * /treatments/{code}:
 *   get:
 *     summary: Get specific treatment code details
 *     tags: [Treatments]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Treatment code identifier
 *     responses:
 *       200:
 *         description: Treatment code details with pricing
 *       404:
 *         description: Code not found
 */
router.get('/:code', validate(getTreatmentCodeSchema), treatmentController.getTreatmentCode);

export default router;
