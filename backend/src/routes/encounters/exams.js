/**
 * Encounters Examination Routes
 * Context loading, examination recording, treatment, and finalization
 */

import express from 'express';
import * as clinicalWorkflow from '../../services/clinical/clinicalWorkflow.js';
import * as encounterService from '../../services/clinical/encounters.js';
import { requireRole } from '../../middleware/auth.js';
import { logAction } from '../../services/practice/auditLog.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /encounters/{id}/context:
 *   get:
 *     summary: Load encounter with full patient history context
 *     tags: [Encounters]
 */
router.get('/:id/context', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const encounter = await encounterService.getEncounterById(organizationId, id);

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const [encounterHistory, redFlags] = await Promise.all([
      encounterService.getPatientEncounterHistory(organizationId, encounter.patient_id),
      encounterService.checkRedFlags(encounter.patient_id, {}),
    ]);

    await logAction('ENCOUNTER_CONTEXT_READ', req.user.id, {
      resourceType: 'clinical_encounter',
      resourceId: id,
      metadata: {
        organization_id: req.user.organization_id,
        patientId: encounter.patient_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({
      encounter,
      context: {
        previousEncounters: encounterHistory,
        alerts: redFlags.alerts,
        warnings: redFlags.warnings,
      },
    });
  } catch (error) {
    logger.error('Error loading encounter context:', error);
    res.status(500).json({ error: 'Failed to load encounter context' });
  }
});

/**
 * @swagger
 * /encounters/{id}/examination:
 *   post:
 *     summary: Record examination findings for an encounter
 *     tags: [Encounters]
 */
router.post('/:id/examination', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.recordExamination(organizationId, id, req.body, user.id);

    await logAction('ENCOUNTER_EXAMINATION_CREATE', req.user.id, {
      resourceType: 'clinical_encounter',
      resourceId: id,
      metadata: {
        organization_id: req.user.organization_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error recording examination:', error);
    res.status(500).json({ error: 'Failed to record examination' });
  }
});

/**
 * @swagger
 * /encounters/{id}/treatment:
 *   post:
 *     summary: Record treatment for an encounter
 *     tags: [Encounters]
 */
router.post('/:id/treatment', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.recordTreatment(organizationId, id, req.body);

    await logAction('ENCOUNTER_TREATMENT_CREATE', req.user.id, {
      resourceType: 'clinical_encounter',
      resourceId: id,
      metadata: {
        organization_id: req.user.organization_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error recording treatment:', error);
    res.status(500).json({ error: 'Failed to record treatment' });
  }
});

/**
 * @swagger
 * /encounters/{id}/finalize:
 *   post:
 *     summary: Finalize encounter (generate note, sign, suggest follow-up)
 *     tags: [Encounters]
 */
router.post('/:id/finalize', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await clinicalWorkflow.finalizeEncounter(organizationId, id, user.id);

    await logAction('ENCOUNTER_FINALIZE', req.user.id, {
      resourceType: 'clinical_encounter',
      resourceId: id,
      metadata: {
        organization_id: req.user.organization_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error finalizing encounter:', error);
    res.status(500).json({ error: 'Failed to finalize encounter' });
  }
});

export default router;
