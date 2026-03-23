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
      limit: Math.min(parseInt(req.query.limit) || 20, 1000),
      search: req.query.search || '',
      status: req.query.status || '',
      category: req.query.category || '',
      sortBy: req.query.sortBy || 'last_name',
      sortOrder: req.query.sortOrder || 'asc',
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
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in getPatients controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patients',
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
        message: 'Patient not found',
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
      userAgent: req.get('user-agent'),
    });

    res.json(patient);
  } catch (error) {
    logger.error('Error in getPatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient',
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
    const existing = await patientService.searchPatients(organizationId, patientData.solvit_id, 1);

    if (existing.length > 0 && existing[0].solvit_id === patientData.solvit_id) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Patient with this SolvIt ID already exists',
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
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(patient);
  } catch (error) {
    logger.error('Error in createPatient controller:', error);

    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Patient with this information already exists',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create patient',
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
        message: 'Patient not found',
      });
    }

    const updatedPatient = await patientService.updatePatient(organizationId, id, patientData);

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
        new: patientData,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedPatient);
  } catch (error) {
    logger.error('Error in updatePatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update patient',
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
        message: 'Patient not found',
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
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Patient successfully deactivated',
      patient,
    });
  } catch (error) {
    logger.error('Error in deletePatient controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete patient',
    });
  }
};

/**
 * Search patients (quick search)
 * GET /api/v1/patients/search
 */
export const searchPatients = async (req, res) => {
  try {
    const { organizationId } = req;
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters',
      });
    }

    const patients = await patientService.searchPatients(organizationId, q, parseInt(limit) || 10);

    res.json(patients);
  } catch (error) {
    logger.error('Error in searchPatients controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search patients',
    });
  }
};

/**
 * Advanced patient search with filters
 * GET /api/v1/patients/search/advanced
 * Supports: name, phone, email, DOB (exact/range), visit dates, status, category
 */
export const advancedSearchPatients = async (req, res) => {
  try {
    const { organizationId, user } = req;

    // All query params are passed as filters (already validated by Joi schema)
    const filters = req.query;

    const result = await patientService.advancedSearchPatients(organizationId, filters);

    // Log audit for advanced search
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'SEARCH',
      resourceType: 'PATIENT',
      resourceId: null,
      details: {
        search_type: 'advanced',
        filters_used: Object.keys(filters).filter((k) => filters[k] !== undefined),
        results_count: result.patients.length,
        total_matches: result.pagination.total,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in advancedSearchPatients controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to perform advanced search',
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
      message: 'Failed to retrieve patient statistics',
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

    const patients = await patientService.getPatientsNeedingFollowUp(organizationId, daysInactive);

    res.json(patients);
  } catch (error) {
    logger.error('Error in getPatientsNeedingFollowUp controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patients needing follow-up',
    });
  }
};

/**
 * Export active patient contacts as VCF (vCard) file
 * GET /api/v1/patients/export/vcf
 * Only exports name + phone. No health data. GDPR-compliant.
 */
export const exportVcf = async (req, res) => {
  try {
    const { organizationId, user } = req;

    const result = await patientService.getActiveContactsForExport(organizationId);
    const contacts = result || [];

    const vcfLines = [];
    for (const contact of contacts) {
      const firstName = (contact.first_name || '').trim();
      const lastName = (contact.last_name || '').trim();
      const phone = (contact.phone || '').trim();
      if (!firstName && !lastName) {
        continue;
      }
      if (!phone) {
        continue;
      }

      vcfLines.push('BEGIN:VCARD');
      vcfLines.push('VERSION:3.0');
      vcfLines.push(`N:${lastName};${firstName};;;`);
      vcfLines.push(`FN:${firstName} ${lastName}`.trim());
      vcfLines.push(`TEL;TYPE=CELL:${phone}`);
      vcfLines.push('END:VCARD');
    }

    const vcfContent = vcfLines.join('\r\n');

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXPORT',
      resourceType: 'PATIENT',
      resourceId: null,
      details: `Contact export (VCF) — ${contacts.length} contacts`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kontakter.vcf"');
    res.send(vcfContent);
  } catch (error) {
    logger.error('Error in exportVcf controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export contacts',
    });
  }
};

/**
 * Export a single patient contact as VCF
 * GET /api/v1/patients/:id/vcf
 */
export const exportSingleVcf = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const patient = await patientService.getPatientById(organizationId, id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const firstName = (patient.first_name || '').trim();
    const lastName = (patient.last_name || '').trim();
    const phone = (patient.phone || '').trim();

    const vcfLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${firstName} ${lastName}`.trim(),
    ];
    if (phone) {
      vcfLines.push(`TEL;TYPE=CELL:${phone}`);
    }
    vcfLines.push('END:VCARD');

    const vcfContent = vcfLines.join('\r\n');
    const filename = `${firstName}_${lastName}`.replace(/\s+/g, '_') || 'kontakt';

    // Audit log for single VCF export (Normen compliance)
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXPORT',
      resourceType: 'PATIENT',
      resourceId: id,
      details: `Single contact export (VCF) — ${firstName} ${lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.vcf"`);
    res.send(vcfContent);
  } catch (error) {
    logger.error('Error in exportSingleVcf controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export contact',
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
  advancedSearchPatients,
  getPatientStatistics,
  getPatientsNeedingFollowUp,
  exportVcf,
  exportSingleVcf,
};
