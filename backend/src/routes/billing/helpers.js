/**
 * Billing Helper Routes
 * CPT codes, modifiers, and CMT suggestion endpoints
 */

import express from 'express';
import * as claimsService from '../../services/practice/claims.js';
import validate from '../../middleware/validation.js';
import { suggestCMTSchema } from '../../validators/billing.validators.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /billing/cpt-codes:
 *   get:
 *     summary: Get available CPT codes
 *     tags: [Billing]
 */
router.get('/cpt-codes', (req, res) => {
  res.json({
    cmt: {
      98940: 'CMT 1-2 spinal regions',
      98941: 'CMT 3-4 spinal regions',
      98942: 'CMT 5 spinal regions',
    },
    evaluation: {
      99203: 'New patient, low complexity',
      99204: 'New patient, moderate complexity',
      99213: 'Established patient, low complexity',
      99214: 'Established patient, moderate complexity',
    },
    therapy: {
      97110: 'Therapeutic exercises',
      97140: 'Manual therapy',
      97112: 'Neuromuscular re-education',
      97010: 'Hot/cold packs',
      97032: 'Electrical stimulation',
      97035: 'Ultrasound',
      97012: 'Mechanical traction',
    },
  });
});

/**
 * @swagger
 * /billing/modifiers:
 *   get:
 *     summary: Get available billing modifiers
 *     tags: [Billing]
 */
router.get('/modifiers', (req, res) => {
  res.json({
    chiropractic: {
      AT: 'Active Treatment',
      GA: 'ABN on file (Waiver)',
      GZ: 'No ABN (Expect denial)',
    },
    therapy: {
      GP: 'Physical Therapy services',
      GO: 'Occupational Therapy services',
      GN: 'Speech Language Pathology services',
    },
    general: {
      25: 'Significant, separately identifiable E/M',
      59: 'Distinct procedural service',
      XE: 'Separate encounter',
      XS: 'Separate structure',
      XP: 'Separate practitioner',
      XU: 'Unusual non-overlapping service',
    },
  });
});

/**
 * @swagger
 * /billing/suggest-cmt:
 *   post:
 *     summary: Get suggested CMT code based on spinal regions count
 *     tags: [Billing]
 */
router.post('/suggest-cmt', validate(suggestCMTSchema), async (req, res) => {
  try {
    const { regions_count } = req.body;
    if (!regions_count || regions_count < 1) {
      return res.status(400).json({ error: 'regions_count required (1-5)' });
    }

    const cptCode = await claimsService.getSuggestedCMTCode(regions_count);
    res.json({
      regions_count,
      suggested_cpt: cptCode,
      description: {
        98940: 'CMT 1-2 spinal regions',
        98941: 'CMT 3-4 spinal regions',
        98942: 'CMT 5 spinal regions',
      }[cptCode],
    });
  } catch (error) {
    logger.error('Suggest CMT error:', error);
    res.status(500).json({ error: 'Failed to suggest CMT code', message: error.message });
  }
});

export default router;
