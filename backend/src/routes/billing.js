/**
 * Billing Routes
 * Claims management, care episodes, and RCM endpoints
 */

import express from 'express';
import * as claimsService from '../services/claims.js';
import * as episodesService from '../services/episodes.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  createEpisodeSchema,
  getPatientEpisodesSchema,
  getEpisodeSchema,
  updateEpisodeProgressSchema,
  episodeReevalSchema,
  episodeMaintenanceSchema,
  episodeABNSchema,
  episodeDischargeSchema,
  getBillingModifierSchema,
  listClaimsSchema,
  createClaimSchema,
  getClaimSchema,
  updateClaimLineItemsSchema,
  submitClaimSchema,
  processRemittanceSchema,
  appealClaimSchema,
  writeOffClaimSchema,
  suggestCMTSchema,
} from '../validators/billing.validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All billing routes require authentication and organization context
router.use(requireAuth);
router.use(requireOrganization);

// ============================================================================
// CARE EPISODES
// ============================================================================

/**
 * @swagger
 * /billing/episodes:
 *   post:
 *     summary: Create a new care episode
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               diagnosis_codes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Care episode created
 *       400:
 *         description: Validation error
 */
router.post('/episodes', validate(createEpisodeSchema), async (req, res) => {
  try {
    const episode = await episodesService.createEpisode(req.organizationId, req.body);
    res.status(201).json(episode);
  } catch (error) {
    logger.error('Create episode error:', error);
    res.status(400).json({ error: 'Failed to create episode', message: error.message });
  }
});

/**
 * GET /billing/episodes/patient/:patientId
 * Get all episodes for a patient
 */
router.get('/episodes/patient/:patientId', validate(getPatientEpisodesSchema), async (req, res) => {
  try {
    const episodes = await episodesService.getPatientEpisodes(
      req.organizationId,
      req.params.patientId
    );
    res.json(episodes);
  } catch (error) {
    logger.error('Get patient episodes error:', error);
    res.status(500).json({ error: 'Failed to retrieve episodes', message: error.message });
  }
});

/**
 * GET /billing/episodes/patient/:patientId/active
 * Get active episode for a patient
 */
router.get(
  '/episodes/patient/:patientId/active',
  validate(getPatientEpisodesSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.getActiveEpisode(
        req.organizationId,
        req.params.patientId
      );
      if (!episode) {
        return res.status(404).json({ error: 'No active episode found' });
      }
      res.json(episode);
    } catch (error) {
      logger.error('Get active episode error:', error);
      res.status(500).json({ error: 'Failed to retrieve episode', message: error.message });
    }
  }
);

/**
 * GET /billing/episodes/:episodeId
 * Get episode details with billing info
 */
router.get('/episodes/:episodeId', validate(getEpisodeSchema), async (req, res) => {
  try {
    const summary = await episodesService.getEpisodeSummary(
      req.organizationId,
      req.params.episodeId
    );
    if (!summary) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    res.json(summary);
  } catch (error) {
    logger.error('Get episode error:', error);
    res.status(500).json({ error: 'Failed to retrieve episode', message: error.message });
  }
});

/**
 * PATCH /billing/episodes/:episodeId/progress
 * Update episode progress after a visit
 */
router.patch(
  '/episodes/:episodeId/progress',
  validate(updateEpisodeProgressSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.updateEpisodeProgress(
        req.organizationId,
        req.params.episodeId,
        req.body
      );
      res.json(episode);
    } catch (error) {
      logger.error('Update episode progress error:', error);
      res.status(400).json({ error: 'Failed to update episode', message: error.message });
    }
  }
);

/**
 * POST /billing/episodes/:episodeId/reeval
 * Perform re-evaluation
 */
router.post('/episodes/:episodeId/reeval', validate(episodeReevalSchema), async (req, res) => {
  try {
    const episode = await episodesService.performReEvaluation(
      req.organizationId,
      req.params.episodeId,
      req.body
    );
    res.json(episode);
  } catch (error) {
    logger.error('Re-evaluation error:', error);
    res.status(400).json({ error: 'Failed to perform re-evaluation', message: error.message });
  }
});

/**
 * POST /billing/episodes/:episodeId/maintenance
 * Transition episode to maintenance status
 */
router.post(
  '/episodes/:episodeId/maintenance',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(episodeMaintenanceSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.transitionToMaintenance(
        req.organizationId,
        req.params.episodeId,
        { ...req.body, mmi_determined_by: req.user.id }
      );
      res.json(episode);
    } catch (error) {
      logger.error('Transition to maintenance error:', error);
      res.status(400).json({ error: 'Failed to transition episode', message: error.message });
    }
  }
);

/**
 * POST /billing/episodes/:episodeId/abn
 * Record ABN signature
 */
router.post('/episodes/:episodeId/abn', validate(episodeABNSchema), async (req, res) => {
  try {
    const episode = await episodesService.recordABN(
      req.organizationId,
      req.params.episodeId,
      req.body
    );
    res.json(episode);
  } catch (error) {
    logger.error('Record ABN error:', error);
    res.status(400).json({ error: 'Failed to record ABN', message: error.message });
  }
});

/**
 * POST /billing/episodes/:episodeId/discharge
 * Discharge episode
 */
router.post(
  '/episodes/:episodeId/discharge',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(episodeDischargeSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.dischargeEpisode(
        req.organizationId,
        req.params.episodeId,
        req.body
      );
      res.json(episode);
    } catch (error) {
      logger.error('Discharge episode error:', error);
      res.status(400).json({ error: 'Failed to discharge episode', message: error.message });
    }
  }
);

/**
 * GET /billing/episodes/needing-reeval
 * Get episodes needing re-evaluation
 */
router.get('/episodes-needing-reeval', async (req, res) => {
  try {
    const episodes = await episodesService.getEpisodesNeedingReeval(req.organizationId);
    res.json(episodes);
  } catch (error) {
    logger.error('Get episodes needing reeval error:', error);
    res.status(500).json({ error: 'Failed to retrieve episodes', message: error.message });
  }
});

/**
 * GET /billing/modifier/:episodeId/:patientId
 * Get billing modifier for episode/patient
 */
router.get(
  '/modifier/:episodeId/:patientId',
  validate(getBillingModifierSchema),
  async (req, res) => {
    try {
      const modifier = await episodesService.getBillingModifier(
        req.params.episodeId,
        req.params.patientId
      );
      res.json({
        modifier,
        description: getModifierDescription(modifier),
      });
    } catch (error) {
      logger.error('Get billing modifier error:', error);
      res.status(500).json({ error: 'Failed to get modifier', message: error.message });
    }
  }
);

// Helper function for modifier descriptions
const getModifierDescription = (modifier) => {
  const descriptions = {
    AT: 'Active Treatment - Patient showing measurable improvement',
    GA: 'ABN on file - Maintenance care with waiver signed',
    GZ: 'No ABN - Expect denial, cannot bill patient',
  };
  return descriptions[modifier] || 'Unknown modifier';
};

// ============================================================================
// CLAIMS
// ============================================================================

/**
 * @swagger
 * /billing/claims:
 *   get:
 *     summary: List claims with filters and pagination
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of claims
 *       401:
 *         description: Unauthorized
 */
router.get('/claims', validate(listClaimsSchema), async (req, res) => {
  try {
    const result = await claimsService.getClaims(req.organizationId, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      status: req.query.status,
      patient_id: req.query.patient_id,
      payer_id: req.query.payer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    });
    res.json(result);
  } catch (error) {
    logger.error('Get claims error:', error);
    res.status(500).json({ error: 'Failed to retrieve claims', message: error.message });
  }
});

/**
 * POST /billing/claims
 * Create a new claim
 */
router.post('/claims', validate(createClaimSchema), async (req, res) => {
  try {
    const claim = await claimsService.createClaim(req.organizationId, req.body);
    res.status(201).json(claim);
  } catch (error) {
    logger.error('Create claim error:', error);
    res.status(400).json({ error: 'Failed to create claim', message: error.message });
  }
});

/**
 * @swagger
 * /billing/claims/summary:
 *   get:
 *     summary: Get claims summary grouped by status
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Claims summary with counts and totals per status
 *       401:
 *         description: Unauthorized
 */
router.get('/claims/summary', async (req, res) => {
  try {
    const summary = await claimsService.getClaimsSummary(req.organizationId);
    res.json(summary);
  } catch (error) {
    logger.error('Get claims summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve summary', message: error.message });
  }
});

/**
 * GET /billing/claims/outstanding
 * Get outstanding claims
 */
router.get('/claims/outstanding', async (req, res) => {
  try {
    const claims = await claimsService.getOutstandingClaims(req.organizationId);
    res.json(claims);
  } catch (error) {
    logger.error('Get outstanding claims error:', error);
    res.status(500).json({ error: 'Failed to retrieve claims', message: error.message });
  }
});

/**
 * GET /billing/claims/:claimId
 * Get claim details
 */
router.get('/claims/:claimId', validate(getClaimSchema), async (req, res) => {
  try {
    const claim = await claimsService.getClaimById(req.organizationId, req.params.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    logger.error('Get claim error:', error);
    res.status(500).json({ error: 'Failed to retrieve claim', message: error.message });
  }
});

/**
 * PUT /billing/claims/:claimId/line-items
 * Update claim line items
 */
router.put(
  '/claims/:claimId/line-items',
  validate(updateClaimLineItemsSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.updateClaimLineItems(
        req.organizationId,
        req.params.claimId,
        req.body.line_items
      );
      res.json(claim);
    } catch (error) {
      logger.error('Update line items error:', error);
      res.status(400).json({ error: 'Failed to update line items', message: error.message });
    }
  }
);

/**
 * POST /billing/claims/:claimId/submit
 * Submit claim for processing
 */
router.post(
  '/claims/:claimId/submit',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(submitClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.submitClaim(
        req.organizationId,
        req.params.claimId,
        req.user.id
      );
      res.json(claim);
    } catch (error) {
      logger.error('Submit claim error:', error);
      res.status(400).json({ error: 'Failed to submit claim', message: error.message });
    }
  }
);

/**
 * POST /billing/claims/:claimId/remittance
 * Process payment/remittance
 */
router.post(
  '/claims/:claimId/remittance',
  requireRole(['ADMIN']),
  validate(processRemittanceSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.processRemittance(
        req.organizationId,
        req.params.claimId,
        req.body
      );
      res.json(claim);
    } catch (error) {
      logger.error('Process remittance error:', error);
      res.status(400).json({ error: 'Failed to process remittance', message: error.message });
    }
  }
);

/**
 * POST /billing/claims/:claimId/appeal
 * Appeal a denied claim
 */
router.post(
  '/claims/:claimId/appeal',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(appealClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.appealClaim(
        req.organizationId,
        req.params.claimId,
        req.body
      );
      res.json(claim);
    } catch (error) {
      logger.error('Appeal claim error:', error);
      res.status(400).json({ error: 'Failed to appeal claim', message: error.message });
    }
  }
);

/**
 * POST /billing/claims/:claimId/write-off
 * Write off a claim
 */
router.post(
  '/claims/:claimId/write-off',
  requireRole(['ADMIN']),
  validate(writeOffClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.writeOffClaim(
        req.organizationId,
        req.params.claimId,
        req.body.reason
      );
      res.json(claim);
    } catch (error) {
      logger.error('Write off claim error:', error);
      res.status(400).json({ error: 'Failed to write off claim', message: error.message });
    }
  }
);

// ============================================================================
// HELPER ENDPOINTS
// ============================================================================

/**
 * GET /billing/cpt-codes
 * Get available CPT codes
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
 * GET /billing/modifiers
 * Get available modifiers
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
 * POST /billing/suggest-cmt
 * Get suggested CMT code based on regions
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
