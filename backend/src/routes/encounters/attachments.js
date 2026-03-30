/**
 * Encounters Attachments Routes
 * Anatomy findings, diagnosis findings, and code lookups
 */

import express from 'express';
import * as encounterService from '../../services/clinical/encounters.js';
import { requireRole } from '../../middleware/auth.js';
import { logAction } from '../../services/practice/auditLog.js';

const router = express.Router();

// Anatomy Findings
router.get(
  '/:encounterId/anatomy-findings',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res, next) => {
    try {
      const findings = await encounterService.getAnatomyFindings(req.params.encounterId);

      await logAction('ENCOUNTER_ANATOMY_READ', req.user.id, {
        resourceType: 'clinical_encounter',
        resourceId: req.params.encounterId,
        metadata: {
          organization_id: req.user.organization_id,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      res.json({ data: findings });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:encounterId/anatomy-findings',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res, next) => {
    try {
      const result = await encounterService.saveAnatomyFindings(
        req.params.encounterId,
        req.body.findings
      );

      await logAction('ENCOUNTER_ANATOMY_CREATE', req.user.id, {
        resourceType: 'clinical_encounter',
        resourceId: req.params.encounterId,
        metadata: {
          organization_id: req.user.organization_id,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/patient/:patientId/latest-anatomy-findings',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res, next) => {
    try {
      const findings = await encounterService.getLatestAnatomyFindings(req.params.patientId);

      await logAction('ENCOUNTER_ANATOMY_READ', req.user.id, {
        resourceType: 'patient',
        resourceId: req.params.patientId,
        metadata: {
          organization_id: req.user.organization_id,
          context: 'latest-anatomy-findings',
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      res.json({ data: findings });
    } catch (error) {
      next(error);
    }
  }
);

// Diagnosis Findings
router.get(
  '/diagnosis-findings/:diagnosisCode',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res, next) => {
    try {
      const findings = await encounterService.getDiagnosisFindings(req.params.diagnosisCode);

      await logAction('ENCOUNTER_ANATOMY_READ', req.user.id, {
        resourceType: 'clinical_encounter',
        metadata: {
          organization_id: req.user.organization_id,
          diagnosisCode: req.params.diagnosisCode,
          context: 'diagnosis-findings',
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      res.json({ data: findings });
    } catch (error) {
      next(error);
    }
  }
);

// Reverse lookup: suggest diagnosis codes from anatomy finding regions
router.post(
  '/codes-from-findings',
  requireRole(['ADMIN', 'PRACTITIONER']),
  async (req, res, next) => {
    try {
      const { bodyRegions } = req.body;
      const codes = await encounterService.getCodesFromFindings(bodyRegions);

      await logAction('ENCOUNTER_ANATOMY_READ', req.user.id, {
        resourceType: 'clinical_encounter',
        metadata: {
          organization_id: req.user.organization_id,
          context: 'codes-from-findings',
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      res.json({ data: codes });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
