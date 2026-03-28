/**
 * Neurological Examination Controller
 * Handles HTTP requests for neurological exams, BPPV treatment, and referrals
 */

import * as neuroexamService from '../services/clinical/neuroexam.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * List neurological examinations
 * GET /api/v1/neuroexam
 */
export const listExams = async (req, res) => {
  try {
    const { patientId, status, hasRedFlags, limit = 50, offset = 0 } = req.query;

    const result = await neuroexamService.listExams(req.organizationId, {
      patientId,
      status,
      hasRedFlags,
      limit,
      offset,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching neurological examinations:', error);
    res.status(500).json({ error: 'Failed to fetch examinations' });
  }
};

/**
 * Get single neurological examination
 * GET /api/v1/neuroexam/:examId
 */
export const getExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await neuroexamService.getExamById(req.organizationId, examId);

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    res.json({ data: exam });
  } catch (error) {
    logger.error('Error fetching examination:', error);
    res.status(500).json({ error: 'Failed to fetch examination' });
  }
};

/**
 * Create new neurological examination
 * POST /api/v1/neuroexam
 */
export const createExam = async (req, res) => {
  try {
    const examData = req.body;

    const exam = await neuroexamService.createExam(req.organizationId, req.userId, examData);

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CREATE',
      resourceType: 'NEUROLOGICAL_EXAM',
      resourceId: exam.id,
      details: {
        patientId: examData.patientId,
        examType: examData.examType,
        hasRedFlags: (examData.redFlags || []).length > 0,
      },
    });

    res.status(201).json({
      data: exam,
      message: 'Examination created successfully',
    });
  } catch (error) {
    logger.error('Error creating examination:', error);
    res.status(500).json({ error: 'Failed to create examination' });
  }
};

/**
 * Update neurological examination
 * PUT /api/v1/neuroexam/:examId
 */
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updateData = req.body;

    const exam = await neuroexamService.updateExam(req.organizationId, examId, updateData);

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'UPDATE',
      resourceType: 'NEUROLOGICAL_EXAM',
      resourceId: examId,
      details: {
        status: updateData.status,
        hasRedFlags: updateData.redFlags?.length > 0,
      },
    });

    res.json({
      data: exam,
      message: 'Examination updated successfully',
    });
  } catch (error) {
    logger.error('Error updating examination:', error);
    res.status(500).json({ error: 'Failed to update examination' });
  }
};

/**
 * Mark examination as complete
 * POST /api/v1/neuroexam/:examId/complete
 */
export const completeExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { narrativeText } = req.body;

    const exam = await neuroexamService.completeExam(req.organizationId, examId, narrativeText);

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    res.json({
      data: exam,
      message: 'Examination marked as complete',
    });
  } catch (error) {
    logger.error('Error completing examination:', error);
    res.status(500).json({ error: 'Failed to complete examination' });
  }
};

/**
 * Record referral for examination
 * POST /api/v1/neuroexam/:examId/referral
 */
export const recordReferral = async (req, res) => {
  try {
    const { examId } = req.params;
    const { specialty, urgency, _notes } = req.body;

    const exam = await neuroexamService.recordReferral(req.organizationId, examId, {
      specialty,
      urgency,
    });

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'REFERRAL_SENT',
      resourceType: 'NEUROLOGICAL_EXAM',
      resourceId: examId,
      details: { specialty, urgency },
    });

    res.json({
      data: exam,
      message: 'Referral recorded',
    });
  } catch (error) {
    logger.error('Error recording referral:', error);
    res.status(500).json({ error: 'Failed to record referral' });
  }
};

/**
 * Log BPPV treatment
 * POST /api/v1/neuroexam/bppv-treatment
 */
export const logBPPVTreatment = async (req, res) => {
  try {
    const treatmentData = req.body;

    const treatment = await neuroexamService.logBPPVTreatment(req.userId, treatmentData);

    res.status(201).json({
      data: treatment,
      message: 'BPPV treatment logged successfully',
    });
  } catch (error) {
    logger.error('Error logging BPPV treatment:', error);
    res.status(500).json({ error: 'Failed to log treatment' });
  }
};

/**
 * Get pending red flag alerts
 * GET /api/v1/neuroexam/alerts/red-flags
 */
export const getRedFlagAlerts = async (req, res) => {
  try {
    const alerts = await neuroexamService.getRedFlagAlerts(req.organizationId);

    res.json({ data: alerts });
  } catch (error) {
    logger.error('Error fetching red flag alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * Get patient neurological exam history
 * GET /api/v1/neuroexam/patient/:patientId/history
 */
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await neuroexamService.getPatientHistory(req.organizationId, patientId);

    res.json({ data: history });
  } catch (error) {
    logger.error('Error fetching patient history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
