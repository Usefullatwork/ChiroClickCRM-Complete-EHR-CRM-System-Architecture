/**
 * Billing Episodes Routes
 * Care episode management, progress tracking, and re-evaluation
 */

import express from 'express';
import * as episodesService from '../../services/clinical/episodes.js';
import { requireRole } from '../../middleware/auth.js';
import validate from '../../middleware/validation.js';
import { logAction } from '../../services/practice/auditLog.js';
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
} from '../../validators/billing.validators.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Helper function for modifier descriptions
const getModifierDescription = (modifier) => {
  const descriptions = {
    AT: 'Active Treatment - Patient showing measurable improvement',
    GA: 'ABN on file - Maintenance care with waiver signed',
    GZ: 'No ABN - Expect denial, cannot bill patient',
  };
  return descriptions[modifier] || 'Unknown modifier';
};

/**
 * @swagger
 * /billing/episodes:
 *   post:
 *     summary: Create a new care episode
 *     tags: [Billing]
 */
router.post(
  '/episodes',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createEpisodeSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.createEpisode(req.organizationId, req.body);
      res.status(201).json(episode);
      await logAction('BILLING_EPISODE_CREATE', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: episode?.id,
        changes: { patient_id: req.body.patient_id, diagnosis_codes: req.body.diagnosis_codes },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Create episode error:', error);
      res.status(400).json({ error: 'Failed to create episode', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/episodes/patient/{patientId}:
 *   get:
 *     summary: Get all care episodes for a patient
 *     tags: [Billing]
 */
router.get(
  '/episodes/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientEpisodesSchema),
  async (req, res) => {
    try {
      const episodes = await episodesService.getPatientEpisodes(
        req.organizationId,
        req.params.patientId
      );
      res.json(episodes);
      await logAction('BILLING_EPISODE_LIST', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.patientId,
        metadata: { organization_id: req.user.organization_id, patient_id: req.params.patientId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Get patient episodes error:', error);
      res.status(500).json({ error: 'Failed to retrieve episodes', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/episodes/patient/{patientId}/active:
 *   get:
 *     summary: Get active care episode for a patient
 *     tags: [Billing]
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
      await logAction('BILLING_EPISODE_READ', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: episode?.id,
        metadata: {
          organization_id: req.user.organization_id,
          patient_id: req.params.patientId,
          active: true,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
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
 */
router.get(
  '/episodes/:episodeId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getEpisodeSchema),
  async (req, res) => {
    try {
      const summary = await episodesService.getEpisodeSummary(
        req.organizationId,
        req.params.episodeId
      );
      if (!summary) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      res.json(summary);
      await logAction('BILLING_EPISODE_READ', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Get episode error:', error);
      res.status(500).json({ error: 'Failed to retrieve episode', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/episodes/{episodeId}/progress:
 *   patch:
 *     summary: Update episode progress after a visit
 *     tags: [Billing]
 */
router.patch(
  '/episodes/:episodeId/progress',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateEpisodeProgressSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.updateEpisodeProgress(
        req.organizationId,
        req.params.episodeId,
        req.body
      );
      res.json(episode);
      await logAction('BILLING_EPISODE_PROGRESS_UPDATE', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        changes: req.body,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
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
 */
router.post(
  '/episodes/:episodeId/reeval',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(episodeReevalSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.performReEvaluation(
        req.organizationId,
        req.params.episodeId,
        req.body
      );
      res.json(episode);
      await logAction('BILLING_EPISODE_REEVAL', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        changes: req.body,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Re-evaluation error:', error);
      res.status(400).json({ error: 'Failed to perform re-evaluation', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/episodes/{episodeId}/maintenance:
 *   post:
 *     summary: Transition episode to maintenance status
 *     tags: [Billing]
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
      await logAction('BILLING_EPISODE_MAINTENANCE', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        changes: req.body,
        metadata: { organization_id: req.user.organization_id, mmi_determined_by: req.user.id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
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
 */
router.post(
  '/episodes/:episodeId/abn',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(episodeABNSchema),
  async (req, res) => {
    try {
      const episode = await episodesService.recordABN(
        req.organizationId,
        req.params.episodeId,
        req.body
      );
      res.json(episode);
      await logAction('BILLING_EPISODE_ABN', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        changes: req.body,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Record ABN error:', error);
      res.status(400).json({ error: 'Failed to record ABN', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/episodes/{episodeId}/discharge:
 *   post:
 *     summary: Discharge a care episode
 *     tags: [Billing]
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
      await logAction('BILLING_EPISODE_DISCHARGE', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        changes: req.body,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
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
 */
router.get('/episodes-needing-reeval', async (req, res) => {
  try {
    const episodes = await episodesService.getEpisodesNeedingReeval(req.organizationId);
    res.json(episodes);
    await logAction('BILLING_EPISODE_REEVAL_LIST', req.user.id, {
      resourceType: 'billing_episode',
      metadata: { organization_id: req.user.organization_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
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
      await logAction('BILLING_MODIFIER_READ', req.user.id, {
        resourceType: 'billing_episode',
        resourceId: req.params.episodeId,
        metadata: {
          organization_id: req.user.organization_id,
          patient_id: req.params.patientId,
          modifier,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Get billing modifier error:', error);
      res.status(500).json({ error: 'Failed to get modifier', message: error.message });
    }
  }
);

export default router;
