/**
 * Clinical Encounters Controller
 * Handles HTTP requests for SOAP notes and clinical documentation
 */

import * as encounterService from '../services/encounters.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../utils/errors.js';

/**
 * Get all encounters
 * GET /api/v1/encounters
 */
export const getEncounters = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId || null,
      practitionerId: req.query.practitionerId || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      encounterType: req.query.encounterType || null,
      signed: req.query.signed === 'true' ? true : req.query.signed === 'false' ? false : null
    };

    const result = await encounterService.getAllEncounters(organizationId, options);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'ENCOUNTER',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in getEncounters controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve encounters'
    });
  }
};

/**
 * Get encounter by ID
 * GET /api/v1/encounters/:id
 */
export const getEncounter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const encounter = await encounterService.getEncounterById(organizationId, id);

    if (!encounter) {
      throw new NotFoundError('Encounter', id);
    }

    // Check for red flags
    const { alerts, warnings } = await encounterService.checkRedFlags(
      encounter.patient_id,
      encounter
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'ENCOUNTER',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      ...encounter,
      redFlagAlerts: alerts,
      clinicalWarnings: warnings
    });
  } catch (error) {
    // Re-throw custom errors to be handled by centralized error handler
    if (error.isOperational) {
      throw error;
    }

    logger.error('Error in getEncounter controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve encounter'
    });
  }
};

/**
 * Get patient encounters
 * GET /api/v1/patients/:patientId/encounters
 */
export const getPatientEncounters = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const encounters = await encounterService.getPatientEncounters(
      organizationId,
      patientId,
      limit
    );

    res.json(encounters);
  } catch (error) {
    logger.error('Error in getPatientEncounters controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient encounters'
    });
  }
};

/**
 * Create new encounter
 * POST /api/v1/encounters
 */
export const createEncounter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const encounterData = {
      ...req.body,
      practitioner_id: user.id // Use authenticated user as practitioner
    };

    // Check for red flags before creating
    const { alerts, warnings } = await encounterService.checkRedFlags(
      encounterData.patient_id,
      encounterData
    );

    const encounter = await encounterService.createEncounter(organizationId, encounterData);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'ENCOUNTER',
      resourceId: encounter.id,
      changes: { new: encounterData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      ...encounter,
      redFlagAlerts: alerts,
      clinicalWarnings: warnings
    });
  } catch (error) {
    logger.error('Error in createEncounter controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create encounter'
    });
  }
};

/**
 * Update encounter
 * PATCH /api/v1/encounters/:id
 */
export const updateEncounter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const encounterData = req.body;

    const updatedEncounter = await encounterService.updateEncounter(
      organizationId,
      id,
      encounterData
    );

    if (!updatedEncounter) {
      throw new NotFoundError('Encounter', id);
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'ENCOUNTER',
      resourceId: id,
      changes: { new: encounterData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(updatedEncounter);
  } catch (error) {
    // Re-throw custom errors to be handled by centralized error handler
    if (error.isOperational) {
      throw error;
    }

    logger.error('Error in updateEncounter controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update encounter'
    });
  }
};

/**
 * Sign encounter
 * POST /api/v1/encounters/:id/sign
 */
export const signEncounter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const signedEncounter = await encounterService.signEncounter(
      organizationId,
      id,
      user.id
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'ENCOUNTER',
      resourceId: id,
      reason: 'Encounter signed - now immutable',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(signedEncounter);
  } catch (error) {
    logger.error('Error in signEncounter controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to sign encounter'
    });
  }
};

/**
 * Generate formatted note
 * POST /api/v1/encounters/:id/generate-note
 */
export const generateNote = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const note = await encounterService.generateFormattedNote(organizationId, id);

    res.json({ note });
  } catch (error) {
    logger.error('Error in generateNote controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate note'
    });
  }
};

/**
 * Get patient encounter history
 * GET /api/v1/patients/:patientId/encounter-history
 */
export const getEncounterHistory = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const history = await encounterService.getPatientEncounterHistory(
      organizationId,
      patientId
    );

    res.json(history);
  } catch (error) {
    logger.error('Error in getEncounterHistory controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve encounter history'
    });
  }
};

/**
 * Check red flags for patient
 * GET /api/v1/patients/:patientId/red-flags
 */
export const checkRedFlags = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { alerts, warnings } = await encounterService.checkRedFlags(patientId, {});

    res.json({ alerts, warnings });
  } catch (error) {
    logger.error('Error in checkRedFlags controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check red flags'
    });
  }
};

export default {
  getEncounters,
  getEncounter,
  getPatientEncounters,
  createEncounter,
  updateEncounter,
  signEncounter,
  generateNote,
  getEncounterHistory,
  checkRedFlags
};
