/**
 * Treatment Codes Controller
 */

import * as treatmentService from '../services/treatments.js';
import logger from '../utils/logger.js';

export const getAllTreatmentCodes = async (req, res) => {
  try {
    const codes = await treatmentService.getAllTreatmentCodes();
    res.json(codes);
  } catch (error) {
    logger.error('Error getting all treatment codes:', error);
    res.status(500).json({ error: 'Failed to get treatment codes' });
  }
};

export const getCommonTreatmentCodes = async (req, res) => {
  try {
    const codes = await treatmentService.getCommonTreatmentCodes();
    res.json(codes);
  } catch (error) {
    logger.error('Error getting common treatment codes:', error);
    res.status(500).json({ error: 'Failed to get common treatment codes' });
  }
};

export const getTreatmentCode = async (req, res) => {
  try {
    const { code } = req.params;
    const treatmentCode = await treatmentService.getTreatmentCode(code);

    if (!treatmentCode) {
      return res.status(404).json({ error: 'Treatment code not found' });
    }

    res.json(treatmentCode);
  } catch (error) {
    logger.error('Error getting treatment code:', error);
    res.status(500).json({ error: 'Failed to get treatment code' });
  }
};

export const searchTreatmentCodes = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const codes = await treatmentService.searchTreatmentCodes(q, parseInt(limit) || 10);
    res.json(codes);
  } catch (error) {
    logger.error('Error searching treatment codes:', error);
    res.status(500).json({ error: 'Failed to search treatment codes' });
  }
};

export const calculatePrice = async (req, res) => {
  try {
    const { codes } = req.body;
    const pricing = await treatmentService.calculateTreatmentPrice(codes);
    res.json(pricing);
  } catch (error) {
    logger.error('Error calculating treatment price:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
};

export const getTreatmentStatistics = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate, limit } = req.query;

    const stats = await treatmentService.getTreatmentStatistics(organizationId, {
      startDate,
      endDate,
      limit: parseInt(limit) || 10
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error getting treatment statistics:', error);
    res.status(500).json({ error: 'Failed to get treatment statistics' });
  }
};

export default {
  getAllTreatmentCodes,
  getCommonTreatmentCodes,
  getTreatmentCode,
  searchTreatmentCodes,
  calculatePrice,
  getTreatmentStatistics
};
