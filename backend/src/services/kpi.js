/**
 * KPI Service
 * Business intelligence and analytics
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get dashboard KPIs
 */
export const getDashboardKPIs = async (organizationId, startDate, endDate) => {
  try {
    // Revenue
    const revenueResult = await query(
      `SELECT
        SUM(gross_amount) as total_revenue,
        SUM(patient_amount) as patient_revenue,
        SUM(insurance_amount) as insurance_revenue,
        COUNT(*) as total_transactions
      FROM financial_metrics
      WHERE organization_id = $1
        AND created_at BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    // Visits
    const visitsResult = await query(
      `SELECT
        COUNT(*) as total_visits,
        COUNT(DISTINCT patient_id) as unique_patients,
        AVG(duration_minutes) as avg_duration
      FROM clinical_encounters
      WHERE organization_id = $1
        AND encounter_date BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    // Appointments
    const appointmentsResult = await query(
      `SELECT
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM appointments
      WHERE organization_id = $1
        AND start_time BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    // New patients
    const newPatientsResult = await query(
      `SELECT COUNT(*) as new_patients
      FROM patients
      WHERE organization_id = $1
        AND created_at BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    // Patient retention (active patients who had visit in period)
    const activeResult = await query(
      `SELECT COUNT(DISTINCT patient_id) as active_patients
      FROM clinical_encounters
      WHERE organization_id = $1
        AND encounter_date BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    return {
      revenue: revenueResult.rows[0],
      visits: visitsResult.rows[0],
      appointments: appointmentsResult.rows[0],
      newPatients: parseInt(newPatientsResult.rows[0].new_patients),
      activePatients: parseInt(activeResult.rows[0].active_patients)
    };
  } catch (error) {
    logger.error('Error getting dashboard KPIs:', error);
    throw error;
  }
};

/**
 * Get patient retention metrics
 */
export const getRetentionMetrics = async (organizationId) => {
  try {
    const result = await query(
      `WITH patient_visits AS (
        SELECT
          patient_id,
          COUNT(*) as visit_count,
          MAX(encounter_date) as last_visit,
          MIN(encounter_date) as first_visit
        FROM clinical_encounters
        WHERE organization_id = $1
        GROUP BY patient_id
      )
      SELECT
        AVG(visit_count) as avg_visits_per_patient,
        COUNT(*) FILTER (WHERE visit_count >= 5) as patients_5plus_visits,
        COUNT(*) FILTER (WHERE visit_count >= 10) as patients_10plus_visits,
        COUNT(*) FILTER (WHERE last_visit > NOW() - INTERVAL '90 days') as active_90_days,
        COUNT(*) FILTER (WHERE last_visit > NOW() - INTERVAL '180 days') as active_180_days
      FROM patient_visits`,
      [organizationId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting retention metrics:', error);
    throw error;
  }
};

/**
 * Get rebooking rate
 */
export const getRebookingRate = async (organizationId, days = 30) => {
  try {
    const result = await query(
      `WITH completed_appointments AS (
        SELECT
          patient_id,
          start_time,
          LAG(start_time) OVER (PARTITION BY patient_id ORDER BY start_time) as previous_appointment
        FROM appointments
        WHERE organization_id = $1
          AND status = 'COMPLETED'
          AND start_time > NOW() - INTERVAL '1 day' * $2
      )
      SELECT
        COUNT(*) as total_completed,
        COUNT(*) FILTER (WHERE previous_appointment IS NOT NULL) as rebooked,
        ROUND(COUNT(*) FILTER (WHERE previous_appointment IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as rebooking_rate
      FROM completed_appointments`,
      [organizationId, days]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting rebooking rate:', error);
    throw error;
  }
};

/**
 * Get top diagnoses
 */
export const getTopDiagnoses = async (organizationId, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        unnest(icpc_codes) as code,
        COUNT(*) as count,
        dc.description_no
      FROM clinical_encounters ce
      LEFT JOIN diagnosis_codes dc ON dc.code = unnest(ce.icpc_codes)
      WHERE ce.organization_id = $1
        AND ce.icpc_codes IS NOT NULL
      GROUP BY code, dc.description_no
      ORDER BY count DESC
      LIMIT $2`,
      [organizationId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting top diagnoses:', error);
    throw error;
  }
};

export default {
  getDashboardKPIs,
  getRetentionMetrics,
  getRebookingRate,
  getTopDiagnoses
};
