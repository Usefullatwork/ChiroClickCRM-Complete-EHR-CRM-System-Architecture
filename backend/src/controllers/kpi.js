/**
 * KPI Controller
 */

import * as kpiService from '../services/kpi.js';
import * as kpiTrackingService from '../services/kpiTracking.js';
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

/**
 * Get comprehensive KPI tracking dashboard
 * Based on real-world practice metrics
 */
export const getDetailedKPIs = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const kpis = await kpiTrackingService.getKPIDashboard(organizationId, start, end);

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    logger.error('Error in getDetailedKPIs controller:', error);
    res.status(500).json({ error: 'Failed to get detailed KPIs' });
  }
};

/**
 * Get category breakdown
 */
export const getCategoryBreakdown = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const breakdown = await kpiTrackingService.getPatientCategoryBreakdown(organizationId, start, end);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    logger.error('Error in getCategoryBreakdown controller:', error);
    res.status(500).json({ error: 'Failed to get category breakdown' });
  }
};

/**
 * Get geographic distribution
 */
export const getGeographicDistribution = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const distribution = await kpiTrackingService.getGeographicDistribution(organizationId, start, end);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    logger.error('Error in getGeographicDistribution controller:', error);
    res.status(500).json({ error: 'Failed to get geographic distribution' });
  }
};

/**
 * Import KPI data from Excel
 */
export const importKPIData = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
    }

    const results = await kpiTrackingService.importKPIData(organizationId, data, userId);

    res.json({
      success: true,
      data: results,
      message: `Imported ${results.imported} records with ${results.errors.length} errors`
    });
  } catch (error) {
    logger.error('Error in importKPIData controller:', error);
    res.status(500).json({ error: 'Failed to import KPI data' });
  }
};

export default {
  getDashboard,
  getRetention,
  getRebookingRate,
  getTopDiagnoses,
  getDetailedKPIs,
  getCategoryBreakdown,
  getGeographicDistribution,
  importKPIData
};
