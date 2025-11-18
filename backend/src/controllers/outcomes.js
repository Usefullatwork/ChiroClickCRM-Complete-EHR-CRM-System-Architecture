/**
 * Outcomes Controller
 */

import * as outcomeService from '../services/outcomes.js';
import logger from '../utils/logger.js';

export const getPatientOutcomeSummary = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const summary = await outcomeService.getPatientOutcomeSummary(organizationId, patientId);
    res.json(summary);
  } catch (error) {
    logger.error('Error in getPatientOutcomeSummary controller:', error);
    res.status(500).json({ error: 'Failed to get patient outcome summary' });
  }
};

export const getDiagnosisOutcomeStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { icpcCode } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const stats = await outcomeService.getDiagnosisOutcomeStats(organizationId, icpcCode, limit);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getDiagnosisOutcomeStats controller:', error);
    res.status(500).json({ error: 'Failed to get diagnosis outcome stats' });
  }
};

export const getTreatmentOutcomeStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const stats = await outcomeService.getTreatmentOutcomeStats(
      organizationId,
      startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json(stats);
  } catch (error) {
    logger.error('Error in getTreatmentOutcomeStats controller:', error);
    res.status(500).json({ error: 'Failed to get treatment outcome stats' });
  }
};

export const getCohortAnalysis = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      groupBy: req.query.groupBy || 'age_group',
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analysis = await outcomeService.getCohortAnalysis(organizationId, options);
    res.json(analysis);
  } catch (error) {
    logger.error('Error in getCohortAnalysis controller:', error);
    res.status(500).json({ error: 'Failed to get cohort analysis' });
  }
};

export const getPatientLongitudinalData = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const data = await outcomeService.getPatientLongitudinalData(organizationId, patientId);
    res.json(data);
  } catch (error) {
    logger.error('Error in getPatientLongitudinalData controller:', error);
    res.status(500).json({ error: 'Failed to get longitudinal data' });
  }
};

export const predictTreatmentOutcome = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const { proposedTreatment } = req.body;

    const prediction = await outcomeService.predictTreatmentOutcome(
      organizationId,
      patientId,
      proposedTreatment
    );

    res.json(prediction);
  } catch (error) {
    logger.error('Error in predictTreatmentOutcome controller:', error);
    res.status(500).json({ error: 'Failed to predict treatment outcome' });
  }
};

export default {
  getPatientOutcomeSummary,
  getDiagnosisOutcomeStats,
  getTreatmentOutcomeStats,
  getCohortAnalysis,
  getPatientLongitudinalData,
  predictTreatmentOutcome
};
