/**
 * KPI Controller
 */

import * as kpiService from '../services/kpi.js';
import logger from '../utils/logger.js';

export const getDashboard = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const kpis = await kpiService.getDashboardKPIs(
      organizationId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json(kpis);
  } catch (error) {
    logger.error('Error in getDashboard controller:', error);
    res.status(500).json({ error: 'Failed to get dashboard KPIs' });
  }
};

export const getRetention = async (req, res) => {
  try {
    const { organizationId } = req;
    const metrics = await kpiService.getRetentionMetrics(organizationId);
    res.json(metrics);
  } catch (error) {
    logger.error('Error in getRetention controller:', error);
    res.status(500).json({ error: 'Failed to get retention metrics' });
  }
};

export const getRebookingRate = async (req, res) => {
  try {
    const { organizationId } = req;
    const days = parseInt(req.query.days) || 30;
    const rate = await kpiService.getRebookingRate(organizationId, days);
    res.json(rate);
  } catch (error) {
    logger.error('Error in getRebookingRate controller:', error);
    res.status(500).json({ error: 'Failed to get rebooking rate' });
  }
};

export const getTopDiagnoses = async (req, res) => {
  try {
    const { organizationId } = req;
    const limit = parseInt(req.query.limit) || 10;
    const diagnoses = await kpiService.getTopDiagnoses(organizationId, limit);
    res.json(diagnoses);
  } catch (error) {
    logger.error('Error in getTopDiagnoses controller:', error);
    res.status(500).json({ error: 'Failed to get top diagnoses' });
  }
};

export default {
  getDashboard,
  getRetention,
  getRebookingRate,
  getTopDiagnoses
};
