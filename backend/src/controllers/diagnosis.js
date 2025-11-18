/**
 * Diagnosis Codes Controller
 */

import * as diagnosisService from '../services/diagnosis.js';
import logger from '../utils/logger.js';

export const searchDiagnosisCodes = async (req, res) => {
  try {
    const { q, system, chapter, limit } = req.query;

    const codes = await diagnosisService.searchDiagnosisCodes(q, {
      system,
      chapter,
      limit: parseInt(limit) || 20
    });

    res.json(codes);
  } catch (error) {
    logger.error('Error searching diagnosis codes:', error);
    res.status(500).json({ error: 'Failed to search diagnosis codes' });
  }
};

export const getCommonDiagnosisCodes = async (req, res) => {
  try {
    const { system } = req.query;
    const codes = await diagnosisService.getCommonDiagnosisCodes(system);
    res.json(codes);
  } catch (error) {
    logger.error('Error getting common diagnosis codes:', error);
    res.status(500).json({ error: 'Failed to get common diagnosis codes' });
  }
};

export const getDiagnosisCode = async (req, res) => {
  try {
    const { code } = req.params;
    const diagnosisCode = await diagnosisService.getDiagnosisCode(code);

    if (!diagnosisCode) {
      return res.status(404).json({ error: 'Diagnosis code not found' });
    }

    res.json(diagnosisCode);
  } catch (error) {
    logger.error('Error getting diagnosis code:', error);
    res.status(500).json({ error: 'Failed to get diagnosis code' });
  }
};

export const getChiropracticCodes = async (req, res) => {
  try {
    const codes = await diagnosisService.getChiropracticCodes();
    res.json(codes);
  } catch (error) {
    logger.error('Error getting chiropractic codes:', error);
    res.status(500).json({ error: 'Failed to get chiropractic codes' });
  }
};

export const getDiagnosisStatistics = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate, limit } = req.query;

    const stats = await diagnosisService.getDiagnosisStatistics(organizationId, {
      startDate,
      endDate,
      limit: parseInt(limit) || 10
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error getting diagnosis statistics:', error);
    res.status(500).json({ error: 'Failed to get diagnosis statistics' });
  }
};

export default {
  searchDiagnosisCodes,
  getCommonDiagnosisCodes,
  getDiagnosisCode,
  getChiropracticCodes,
  getDiagnosisStatistics
};
