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
 * @swagger
 * /billing/episodes/patient/{patientId}:
 *   get:
 *     summary: Get all care episodes for a patient
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of patient episodes
 *       500:
 *         description: Server error
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
 * @swagger
 * /billing/episodes/patient/{patientId}/active:
 *   get:
 *     summary: Get active care episode for a patient
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active episode details
 *       404:
 *         description: No active episode found
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
 * @swagger
 * /billing/episodes/{episodeId}:
 *   get:
 *     summary: Get episode details with billing info
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Episode summary with billing details
 *       404:
 *         description: Episode not found
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
 * @swagger
 * /billing/episodes/{episodeId}/progress:
 *   patch:
 *     summary: Update episode progress after a visit
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visit_number:
 *                 type: integer
 *               improvement_percentage:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Episode progress updated
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/episodes/{episodeId}/reeval:
 *   post:
 *     summary: Perform re-evaluation of care episode
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               findings:
 *                 type: string
 *               updated_goals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Re-evaluation recorded
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/episodes/{episodeId}/maintenance:
 *   post:
 *     summary: Transition episode to maintenance status
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               mmi_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Episode transitioned to maintenance
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/episodes/{episodeId}/abn:
 *   post:
 *     summary: Record ABN (Advance Beneficiary Notice) signature
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signed_by:
 *                 type: string
 *               signed_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: ABN recorded
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/episodes/{episodeId}/discharge:
 *   post:
 *     summary: Discharge a care episode
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               discharge_summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: Episode discharged
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/episodes-needing-reeval:
 *   get:
 *     summary: Get episodes needing re-evaluation
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: List of episodes due for re-evaluation
 *       500:
 *         description: Server error
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
 * @swagger
 * /billing/modifier/{episodeId}/{patientId}:
 *   get:
 *     summary: Get billing modifier for episode/patient
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Billing modifier (AT, GA, GZ) with description
 *       500:
 *         description: Server error
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
 * @swagger
 * /billing/claims:
 *   post:
 *     summary: Create a new billing claim
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, encounter_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               encounter_id:
 *                 type: string
 *                 format: uuid
 *               line_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cpt_code:
 *                       type: string
 *                     units:
 *                       type: integer
 *                     amount:
 *                       type: number
 *     responses:
 *       201:
 *         description: Claim created
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/claims/outstanding:
 *   get:
 *     summary: Get outstanding (unpaid) claims
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: List of outstanding claims
 *       500:
 *         description: Server error
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
 * @swagger
 * /billing/claims/{claimId}:
 *   get:
 *     summary: Get claim details by ID
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Claim details
 *       404:
 *         description: Claim not found
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
 * @swagger
 * /billing/claims/{claimId}/line-items:
 *   put:
 *     summary: Update claim line items
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [line_items]
 *             properties:
 *               line_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cpt_code:
 *                       type: string
 *                     units:
 *                       type: integer
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Line items updated
 *       400:
 *         description: Validation error
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
 * @swagger
 * /billing/claims/{claimId}/submit:
 *   post:
 *     summary: Submit claim for processing
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Claim submitted
 *       400:
 *         description: Claim cannot be submitted
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
 * @swagger
 * /billing/claims/{claimId}/remittance:
 *   post:
 *     summary: Process payment/remittance for a claim
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount_paid:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               reference_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Remittance processed
 *       400:
 *         description: Processing error
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
 * @swagger
 * /billing/claims/{claimId}/appeal:
 *   post:
 *     summary: Appeal a denied claim
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *               supporting_documents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Appeal submitted
 *       400:
 *         description: Appeal error
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
 * @swagger
 * /billing/claims/{claimId}/write-off:
 *   post:
 *     summary: Write off an uncollectable claim
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim written off
 *       400:
 *         description: Write-off error
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
 * @swagger
 * /billing/cpt-codes:
 *   get:
 *     summary: Get available CPT codes
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: CPT codes grouped by category (CMT, evaluation, therapy)
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
 *     responses:
 *       200:
 *         description: Modifiers grouped by category (chiropractic, therapy, general)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [regions_count]
 *             properties:
 *               regions_count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Suggested CPT code with description
 *       400:
 *         description: Invalid regions count
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
