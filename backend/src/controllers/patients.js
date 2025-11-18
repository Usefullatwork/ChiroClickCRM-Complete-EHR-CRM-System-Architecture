/**
 * Patient Controller
 * Handles HTTP requests for patient management
 */

import * as patientService from '../services/patients.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * Get all patients
 * GET /api/v1/patients
 */
export const getPatients = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      status: req.query.status || '',
      category: req.query.category || '',
      sortBy: req.query.sortBy || 'last_name',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const result = await patientService.getAllPatients(organizationId, options);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'PATIENT',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in getPatients controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patients'
    });
  }
};

/**
 * Get patient by ID
 * GET /api/v1/patients/:id
 */
export const getPatient = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const patient = await patientService.getPatientById(organizationId, id);

    if (!patient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'PATIENT',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(patient);
  } catch (error) {
    logger.error('Error in getPatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient'
    });
  }
};

/**
 * Create new patient
 * POST /api/v1/patients
 */
export const createPatient = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const patientData = req.body;

    // Check if solvit_id already exists
    const existing = await patientService.searchPatients(
      organizationId,
      patientData.solvit_id,
      1
    );

    if (existing.length > 0 && existing[0].solvit_id === patientData.solvit_id) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Patient with this SolvIt ID already exists'
      });
    }

    const patient = await patientService.createPatient(organizationId, patientData);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'PATIENT',
      resourceId: patient.id,
      changes: { new: patientData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(patient);
  } catch (error) {
    logger.error('Error in createPatient controller:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Patient with this information already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create patient'
    });
  }
};

/**
 * Update patient
 * PATCH /api/v1/patients/:id
 */
export const updatePatient = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const patientData = req.body;

    // Get old data for audit
    const oldPatient = await patientService.getPatientById(organizationId, id);

    if (!oldPatient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    const updatedPatient = await patientService.updatePatient(
      organizationId,
      id,
      patientData
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'PATIENT',
      resourceId: id,
      changes: {
        old: oldPatient,
        new: patientData
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(updatedPatient);
  } catch (error) {
    logger.error('Error in updatePatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update patient'
    });
  }
};

/**
 * Delete patient (soft delete)
 * DELETE /api/v1/patients/:id
 */
export const deletePatient = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const patient = await patientService.deletePatient(organizationId, id);

    if (!patient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'PATIENT',
      resourceId: id,
      reason: 'Soft delete - status changed to INACTIVE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Patient successfully deactivated',
      patient
    });
  } catch (error) {
    logger.error('Error in deletePatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete patient'
    });
  }
};

/**
 * Search patients
 * GET /api/v1/patients/search
 */
export const searchPatients = async (req, res) => {
  try {
    const { organizationId } = req;
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters'
      });
    }

    const patients = await patientService.searchPatients(
      organizationId,
      q,
      parseInt(limit) || 10
    );

    res.json(patients);
  } catch (error) {
    logger.error('Error in searchPatients controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search patients'
    });
  }
};

/**
 * Get patient statistics
 * GET /api/v1/patients/:id/statistics
 */
export const getPatientStatistics = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const statistics = await patientService.getPatientStatistics(organizationId, id);

    res.json(statistics);
  } catch (error) {
    logger.error('Error in getPatientStatistics controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient statistics'
    });
  }
};

/**
 * Get patients needing follow-up
 * GET /api/v1/patients/follow-up/needed
 */
export const getPatientsNeedingFollowUp = async (req, res) => {
  try {
    const { organizationId } = req;
    const daysInactive = parseInt(req.query.days) || 90;

    const patients = await patientService.getPatientsNeedingFollowUp(
      organizationId,
      daysInactive
    );

    res.json(patients);
  } catch (error) {
    logger.error('Error in getPatientsNeedingFollowUp controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patients needing follow-up'
    });
  }
};

export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientStatistics,
  getPatientsNeedingFollowUp
};
