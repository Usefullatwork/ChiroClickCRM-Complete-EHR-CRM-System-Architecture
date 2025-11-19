/**
 * Vestibular Assessments Controller
 * Handles HTTP requests for vestibular/dizziness assessments
 */

import * as vestibularService from '../services/vestibular.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * Create new vestibular assessment
 * POST /api/v1/vestibular
 */
export const createAssessment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const assessmentData = {
      ...req.body,
      organization_id: organizationId,
      assessed_by: user.id
    };

    const assessment = await vestibularService.createAssessment(assessmentData);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: assessment.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error in createAssessment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create vestibular assessment'
    });
  }
};

/**
 * Get assessment by ID
 * GET /api/v1/vestibular/:id
 */
export const getAssessment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const assessment = await vestibularService.getAssessmentById(id, organizationId);

    if (!assessment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vestibular assessment not found'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error in getAssessment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve vestibular assessment'
    });
  }
};

/**
 * Get assessments by patient ID
 * GET /api/v1/vestibular/patient/:patientId
 */
export const getPatientAssessments = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await vestibularService.getAssessmentsByPatient(patientId, organizationId, options);

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in getPatientAssessments controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient assessments'
    });
  }
};

/**
 * Get assessment by encounter ID
 * GET /api/v1/vestibular/encounter/:encounterId
 */
export const getEncounterAssessment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { encounterId } = req.params;

    const assessment = await vestibularService.getAssessmentByEncounter(encounterId, organizationId);

    if (!assessment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No vestibular assessment found for this encounter'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: assessment.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error in getEncounterAssessment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve encounter assessment'
    });
  }
};

/**
 * Update assessment
 * PATCH /api/v1/vestibular/:id
 */
export const updateAssessment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const assessment = await vestibularService.updateAssessment(id, organizationId, req.body);

    if (!assessment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vestibular assessment not found'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: id,
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error in updateAssessment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update vestibular assessment'
    });
  }
};

/**
 * Delete assessment
 * DELETE /api/v1/vestibular/:id
 */
export const deleteAssessment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const result = await vestibularService.deleteAssessment(id, organizationId);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vestibular assessment not found'
      });
    }

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'VESTIBULAR_ASSESSMENT',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Vestibular assessment deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteAssessment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete vestibular assessment'
    });
  }
};

/**
 * Get BPPV trends for patient
 * GET /api/v1/vestibular/patient/:patientId/bppv-trends
 */
export const getBPPVTrends = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const trends = await vestibularService.getBPPVTrends(patientId, organizationId);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Error in getBPPVTrends controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve BPPV trends'
    });
  }
};

/**
 * Get common diagnoses statistics
 * GET /api/v1/vestibular/stats/diagnoses
 */
export const getCommonDiagnoses = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };

    const diagnoses = await vestibularService.getCommonDiagnoses(organizationId, options);

    res.json({
      success: true,
      data: diagnoses
    });
  } catch (error) {
    logger.error('Error in getCommonDiagnoses controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve diagnosis statistics'
    });
  }
};

/**
 * Get treatment efficacy statistics
 * GET /api/v1/vestibular/stats/efficacy
 */
export const getTreatmentEfficacy = async (req, res) => {
  try {
    const { organizationId } = req;
    const maneuverType = req.query.maneuverType || null;

    const efficacy = await vestibularService.getTreatmentEfficacy(organizationId, maneuverType);

    res.json({
      success: true,
      data: efficacy
    });
  } catch (error) {
    logger.error('Error in getTreatmentEfficacy controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve treatment efficacy statistics'
    });
  }
};
