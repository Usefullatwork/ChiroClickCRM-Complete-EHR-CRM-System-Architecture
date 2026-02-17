/**
 * Diagnosis Codes Routes
 */

import express from 'express';
import * as diagnosisController from '../controllers/diagnosis.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  searchDiagnosisCodesSchema,
  getCommonDiagnosisCodesSchema,
  getDiagnosisStatisticsSchema,
  getDiagnosisCodeSchema,
} from '../validators/diagnosis.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /diagnosis/search:
 *   get:
 *     summary: Search diagnosis codes (ICPC-2 and ICD-10)
 *     tags: [Diagnosis]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (code or description)
 *       - in: query
 *         name: system
 *         schema:
 *           type: string
 *           enum: [icpc2, icd10]
 *         description: Filter by coding system
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching diagnosis codes
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  validate(searchDiagnosisCodesSchema),
  diagnosisController.searchDiagnosisCodes
);

/**
 * @swagger
 * /diagnosis/common:
 *   get:
 *     summary: Get commonly used diagnosis codes for this organization
 *     tags: [Diagnosis]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Most frequently used diagnosis codes
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/common',
  validate(getCommonDiagnosisCodesSchema),
  diagnosisController.getCommonDiagnosisCodes
);

/**
 * @swagger
 * /diagnosis/chiropractic:
 *   get:
 *     summary: Get chiropractic-specific diagnosis codes (L and N chapters)
 *     tags: [Diagnosis]
 *     responses:
 *       200:
 *         description: Chiropractic-relevant ICPC-2 codes (musculoskeletal and neurological)
 *       401:
 *         description: Unauthorized
 */
router.get('/chiropractic', diagnosisController.getChiropracticCodes);

/**
 * @swagger
 * /diagnosis/statistics:
 *   get:
 *     summary: Get diagnosis statistics for organization
 *     tags: [Diagnosis]
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
 *         description: Diagnosis usage statistics
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/statistics',
  validate(getDiagnosisStatisticsSchema),
  diagnosisController.getDiagnosisStatistics
);

/**
 * @swagger
 * /diagnosis/{code}:
 *   get:
 *     summary: Get specific diagnosis code details
 *     tags: [Diagnosis]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: ICPC-2 or ICD-10 code (e.g. L03, M54.5)
 *     responses:
 *       200:
 *         description: Diagnosis code details
 *       404:
 *         description: Code not found
 */
router.get('/:code', validate(getDiagnosisCodeSchema), diagnosisController.getDiagnosisCode);

export default router;
