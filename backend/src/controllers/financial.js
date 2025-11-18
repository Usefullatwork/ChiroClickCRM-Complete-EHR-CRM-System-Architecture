/**
 * Financial Controller
 */

import * as financialService from '../services/financial.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getFinancialMetrics = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      patientId: req.query.patientId,
      encounterId: req.query.encounterId,
      paymentStatus: req.query.paymentStatus
    };

    const result = await financialService.getAllFinancialMetrics(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getFinancialMetrics controller:', error);
    res.status(500).json({ error: 'Failed to retrieve financial metrics' });
  }
};

export const getFinancialMetric = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const metric = await financialService.getFinancialMetricById(organizationId, id);

    if (!metric) {
      return res.status(404).json({ error: 'Financial metric not found' });
    }

    res.json(metric);
  } catch (error) {
    logger.error('Error in getFinancialMetric controller:', error);
    res.status(500).json({ error: 'Failed to retrieve financial metric' });
  }
};

export const createFinancialMetric = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const metric = await financialService.createFinancialMetric(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'FINANCIAL_METRIC',
      resourceId: metric.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(metric);
  } catch (error) {
    logger.error('Error in createFinancialMetric controller:', error);
    res.status(500).json({ error: 'Failed to create financial metric' });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const metric = await financialService.updatePaymentStatus(organizationId, id, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'FINANCIAL_METRIC',
      resourceId: id,
      changes: { payment_status: req.body.payment_status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(metric);
  } catch (error) {
    logger.error('Error in updatePaymentStatus controller:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

export const getRevenueSummary = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const summary = await financialService.getRevenueSummary(
      organizationId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json(summary);
  } catch (error) {
    logger.error('Error in getRevenueSummary controller:', error);
    res.status(500).json({ error: 'Failed to get revenue summary' });
  }
};

export const getRevenueByTreatmentCode = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate, limit } = req.query;

    const revenue = await financialService.getRevenueByTreatmentCode(
      organizationId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
      parseInt(limit) || 10
    );

    res.json(revenue);
  } catch (error) {
    logger.error('Error in getRevenueByTreatmentCode controller:', error);
    res.status(500).json({ error: 'Failed to get revenue by treatment code' });
  }
};

export const getPaymentMethodBreakdown = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const breakdown = await financialService.getPaymentMethodBreakdown(
      organizationId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json(breakdown);
  } catch (error) {
    logger.error('Error in getPaymentMethodBreakdown controller:', error);
    res.status(500).json({ error: 'Failed to get payment method breakdown' });
  }
};

export const getOutstandingInvoices = async (req, res) => {
  try {
    const { organizationId } = req;
    const invoices = await financialService.getOutstandingInvoices(organizationId);
    res.json(invoices);
  } catch (error) {
    logger.error('Error in getOutstandingInvoices controller:', error);
    res.status(500).json({ error: 'Failed to get outstanding invoices' });
  }
};

export const getPatientPaymentHistory = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const history = await financialService.getPatientPaymentHistory(organizationId, patientId);
    res.json(history);
  } catch (error) {
    logger.error('Error in getPatientPaymentHistory controller:', error);
    res.status(500).json({ error: 'Failed to get patient payment history' });
  }
};

export const generateInvoiceNumber = async (req, res) => {
  try {
    const { organizationId } = req;
    const invoiceNumber = await financialService.generateInvoiceNumber(organizationId);
    res.json({ invoiceNumber });
  } catch (error) {
    logger.error('Error in generateInvoiceNumber controller:', error);
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
};

export const getDailyRevenueChart = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;

    const chartData = await financialService.getDailyRevenueChart(
      organizationId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json(chartData);
  } catch (error) {
    logger.error('Error in getDailyRevenueChart controller:', error);
    res.status(500).json({ error: 'Failed to get daily revenue chart' });
  }
};

export default {
  getFinancialMetrics,
  getFinancialMetric,
  createFinancialMetric,
  updatePaymentStatus,
  getRevenueSummary,
  getRevenueByTreatmentCode,
  getPaymentMethodBreakdown,
  getOutstandingInvoices,
  getPatientPaymentHistory,
  generateInvoiceNumber,
  getDailyRevenueChart
};
