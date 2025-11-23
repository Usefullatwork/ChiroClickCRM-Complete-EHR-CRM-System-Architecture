/**
 * Financial Service
 * Handles billing, invoicing, and financial tracking
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all financial metrics with filters
 */
export const getAllFinancialMetrics = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    startDate = null,
    endDate = null,
    patientId = null,
    encounterId = null,
    paymentStatus = null
  } = options;

  const offset = (page - 1) * limit;
  let whereConditions = ['f.organization_id = $1'];
  let params = [organizationId];
  let paramIndex = 2;

  if (startDate) {
    whereConditions.push(`f.created_at >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereConditions.push(`f.created_at <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (patientId) {
    whereConditions.push(`f.patient_id = $${paramIndex}`);
    params.push(patientId);
    paramIndex++;
  }

  if (encounterId) {
    whereConditions.push(`f.encounter_id = $${paramIndex}`);
    params.push(encounterId);
    paramIndex++;
  }

  if (paymentStatus) {
    whereConditions.push(`f.payment_status = $${paramIndex}`);
    params.push(paymentStatus);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM financial_metrics f WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id
    FROM financial_metrics f
    JOIN patients p ON p.id = f.patient_id
    WHERE ${whereClause}
    ORDER BY f.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    metrics: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get financial metric by ID
 */
export const getFinancialMetricById = async (organizationId, metricId) => {
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      p.phone,
      p.email
    FROM financial_metrics f
    JOIN patients p ON p.id = f.patient_id
    WHERE f.id = $1 AND f.organization_id = $2`,
    [metricId, organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Create financial metric from encounter
 */
export const createFinancialMetric = async (organizationId, metricData) => {
  const {
    patient_id,
    encounter_id,
    treatment_codes,
    gross_amount,
    insurance_amount,
    patient_amount,
    payment_method = null,
    payment_status = 'PENDING',
    invoice_number = null,
    notes = ''
  } = metricData;

  const result = await query(
    `INSERT INTO financial_metrics (
      organization_id,
      patient_id,
      encounter_id,
      treatment_codes,
      gross_amount,
      insurance_amount,
      patient_amount,
      payment_method,
      payment_status,
      invoice_number,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      organizationId,
      patient_id,
      encounter_id,
      JSON.stringify(treatment_codes),
      gross_amount,
      insurance_amount,
      patient_amount,
      payment_method,
      payment_status,
      invoice_number,
      notes
    ]
  );

  logger.info(`Financial metric created: ${result.rows[0].id} for patient: ${patient_id}`);
  return result.rows[0];
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (organizationId, metricId, updateData) => {
  const {
    payment_status,
    payment_method = null,
    paid_at = null,
    notes = null
  } = updateData;

  const updates = ['payment_status = $3'];
  const params = [metricId, organizationId, payment_status];
  let paramIndex = 4;

  if (payment_method !== null) {
    updates.push(`payment_method = $${paramIndex}`);
    params.push(payment_method);
    paramIndex++;
  }

  if (paid_at !== null) {
    updates.push(`paid_at = $${paramIndex}`);
    params.push(paid_at);
    paramIndex++;
  }

  if (notes !== null) {
    updates.push(`notes = $${paramIndex}`);
    params.push(notes);
    paramIndex++;
  }

  const result = await query(
    `UPDATE financial_metrics
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND organization_id = $2
    RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Financial metric not found');
  }

  logger.info(`Payment status updated: ${metricId} to ${payment_status}`);
  return result.rows[0];
};

/**
 * Get revenue summary
 */
export const getRevenueSummary = async (organizationId, startDate, endDate) => {
  const result = await query(
    `SELECT
      COUNT(*) as total_transactions,
      SUM(gross_amount) as total_gross,
      SUM(insurance_amount) as total_insurance,
      SUM(patient_amount) as total_patient,
      COUNT(*) FILTER (WHERE payment_status = 'PAID') as paid_count,
      COUNT(*) FILTER (WHERE payment_status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE payment_status = 'CANCELLED') as cancelled_count,
      SUM(patient_amount) FILTER (WHERE payment_status = 'PAID') as collected_amount,
      SUM(patient_amount) FILTER (WHERE payment_status = 'PENDING') as outstanding_amount
    FROM financial_metrics
    WHERE organization_id = $1
      AND created_at >= $2
      AND created_at <= $3`,
    [organizationId, startDate, endDate]
  );

  return result.rows[0];
};

/**
 * Get revenue by treatment code
 */
export const getRevenueByTreatmentCode = async (organizationId, startDate, endDate, limit = 10) => {
  const result = await query(
    `SELECT
      jsonb_array_elements(treatment_codes)->>'code' as treatment_code,
      jsonb_array_elements(treatment_codes)->>'description' as description,
      COUNT(*) as usage_count,
      SUM((jsonb_array_elements(treatment_codes)->>'price')::numeric) as total_revenue
    FROM financial_metrics
    WHERE organization_id = $1
      AND created_at >= $2
      AND created_at <= $3
    GROUP BY treatment_code, description
    ORDER BY total_revenue DESC
    LIMIT $4`,
    [organizationId, startDate, endDate, limit]
  );

  return result.rows;
};

/**
 * Get payment method breakdown
 */
export const getPaymentMethodBreakdown = async (organizationId, startDate, endDate) => {
  const result = await query(
    `SELECT
      payment_method,
      COUNT(*) as transaction_count,
      SUM(patient_amount) as total_amount
    FROM financial_metrics
    WHERE organization_id = $1
      AND created_at >= $2
      AND created_at <= $3
      AND payment_status = 'PAID'
      AND payment_method IS NOT NULL
    GROUP BY payment_method
    ORDER BY total_amount DESC`,
    [organizationId, startDate, endDate]
  );

  return result.rows;
};

/**
 * Get outstanding invoices
 */
export const getOutstandingInvoices = async (organizationId) => {
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      p.phone,
      p.email,
      EXTRACT(DAYS FROM NOW() - f.created_at)::integer as days_outstanding
    FROM financial_metrics f
    JOIN patients p ON p.id = f.patient_id
    WHERE f.organization_id = $1
      AND f.payment_status = 'PENDING'
    ORDER BY f.created_at ASC`,
    [organizationId]
  );

  return result.rows;
};

/**
 * Get patient payment history
 */
export const getPatientPaymentHistory = async (organizationId, patientId) => {
  const result = await query(
    `SELECT
      f.*,
      e.encounter_date
    FROM financial_metrics f
    LEFT JOIN clinical_encounters e ON e.id = f.encounter_id
    WHERE f.organization_id = $1
      AND f.patient_id = $2
    ORDER BY f.created_at DESC`,
    [organizationId, patientId]
  );

  return result.rows;
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = async (organizationId) => {
  const year = new Date().getFullYear();

  const result = await query(
    `SELECT COUNT(*) as count
    FROM financial_metrics
    WHERE organization_id = $1
      AND EXTRACT(YEAR FROM created_at) = $2`,
    [organizationId, year]
  );

  const count = parseInt(result.rows[0].count) + 1;
  const invoiceNumber = `INV-${year}-${String(count).padStart(5, '0')}`;

  return invoiceNumber;
};

/**
 * Get daily revenue chart data
 */
export const getDailyRevenueChart = async (organizationId, startDate, endDate) => {
  const result = await query(
    `SELECT
      DATE(created_at) as date,
      COUNT(*) as transaction_count,
      SUM(gross_amount) as gross_revenue,
      SUM(patient_amount) as patient_revenue,
      SUM(insurance_amount) as insurance_revenue
    FROM financial_metrics
    WHERE organization_id = $1
      AND created_at >= $2
      AND created_at <= $3
      AND payment_status != 'CANCELLED'
    GROUP BY DATE(created_at)
    ORDER BY date ASC`,
    [organizationId, startDate, endDate]
  );

  return result.rows;
};

export default {
  getAllFinancialMetrics,
  getFinancialMetricById,
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
