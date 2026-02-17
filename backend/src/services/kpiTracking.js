/**
 * KPI Tracking Service
 * Calculate key performance indicators for chiropractic practice
 * Based on real-world metrics tracking
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Calculate rebooking rate
 * Percentage of patients who book another appointment
 */
export const calculateRebookingRate = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `WITH patient_visits AS (
        SELECT
          patient_id,
          COUNT(*) as visit_count,
          MAX(start_time) as last_visit,
          MIN(start_time) as first_visit
        FROM appointments
        WHERE organization_id = $1
          AND status = 'COMPLETED'
          AND start_time BETWEEN $2 AND $3
        GROUP BY patient_id
      )
      SELECT
        COUNT(DISTINCT patient_id) as total_patients,
        COUNT(DISTINCT CASE WHEN visit_count > 1 THEN patient_id END) as rebooked_patients,
        ROUND(
          (COUNT(DISTINCT CASE WHEN visit_count > 1 THEN patient_id END)::numeric /
           NULLIF(COUNT(DISTINCT patient_id), 0)) * 100,
          1
        ) as rebooking_rate
      FROM patient_visits`,
      [organizationId, startDate, endDate]
    );

    return {
      total_patients: parseInt(result.rows[0].total_patients),
      rebooked_patients: parseInt(result.rows[0].rebooked_patients),
      rebooking_rate: parseFloat(result.rows[0].rebooking_rate) || 0,
      period: { startDate, endDate },
    };
  } catch (error) {
    logger.error('Error calculating rebooking rate:', error);
    throw error;
  }
};

/**
 * Get patient category breakdown
 * Oslo, Outside Oslo, Traveling, Referred, etc.
 */
export const getPatientCategoryBreakdown = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        p.category,
        COUNT(DISTINCT p.id) as patient_count,
        COUNT(a.id) as total_treatments,
        COUNT(DISTINCT CASE WHEN a.rebooked = true THEN p.id END) as rebooked_count,
        ROUND(
          (COUNT(DISTINCT CASE WHEN a.rebooked = true THEN p.id END)::numeric /
           NULLIF(COUNT(DISTINCT p.id), 0)) * 100,
          1
        ) as rebooking_rate
      FROM patients p
      LEFT JOIN appointments a ON p.id = a.patient_id
        AND a.status = 'COMPLETED'
        AND a.start_time BETWEEN $2 AND $3
      WHERE p.organization_id = $1
        AND p.status = 'ACTIVE'
      GROUP BY p.category
      ORDER BY patient_count DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      category: row.category || 'Unknown',
      patient_count: parseInt(row.patient_count),
      total_treatments: parseInt(row.total_treatments),
      rebooked_count: parseInt(row.rebooked_count),
      rebooking_rate: parseFloat(row.rebooking_rate) || 0,
    }));
  } catch (error) {
    logger.error('Error getting category breakdown:', error);
    throw error;
  }
};

/**
 * Get geographic distribution
 * Oslo residents vs. Outside Oslo vs. Traveling
 */
export const getGeographicDistribution = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        CASE
          WHEN p.category IN ('OSLO', 'Fra annen klinikk i oslo') THEN 'Oslo beboere'
          WHEN p.category IN ('OUTSIDE_OSLO', 'Utenfra Oslo', 'Henvist fra annen klinikk (utenbys)', 'Fra annen klinikk i norge') THEN 'Utenbys (alle)'
          WHEN p.category IN ('TRAVELING', 'Gjennomreisende (KFA/PMG kunde)') THEN 'Gjennomreisende'
          ELSE 'Annet'
        END as geographic_type,
        COUNT(DISTINCT p.id) as patient_count,
        COUNT(a.id) as total_treatments,
        COUNT(DISTINCT CASE WHEN a.rebooked = true THEN p.id END) as rebooked_count,
        ROUND(
          (COUNT(DISTINCT CASE WHEN a.rebooked = true THEN p.id END)::numeric /
           NULLIF(COUNT(DISTINCT p.id), 0)) * 100,
          1
        ) as rebooking_rate
      FROM patients p
      LEFT JOIN appointments a ON p.id = a.patient_id
        AND a.status = 'COMPLETED'
        AND a.start_time BETWEEN $2 AND $3
      WHERE p.organization_id = $1
        AND p.status = 'ACTIVE'
      GROUP BY geographic_type
      ORDER BY patient_count DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      type: row.geographic_type,
      patient_count: parseInt(row.patient_count),
      total_treatments: parseInt(row.total_treatments),
      rebooked_count: parseInt(row.rebooked_count),
      rebooking_rate: parseFloat(row.rebooking_rate) || 0,
    }));
  } catch (error) {
    logger.error('Error getting geographic distribution:', error);
    throw error;
  }
};

/**
 * Get treatment type breakdown
 * Kiropraktor vs. Svimmelhet/Nevro
 */
export const getTreatmentTypeBreakdown = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        a.appointment_type,
        COUNT(DISTINCT a.patient_id) as patient_count,
        COUNT(a.id) as total_treatments
      FROM appointments a
      WHERE a.organization_id = $1
        AND a.status = 'COMPLETED'
        AND a.start_time BETWEEN $2 AND $3
      GROUP BY a.appointment_type
      ORDER BY total_treatments DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      type: row.appointment_type || 'Kiropraktor',
      patient_count: parseInt(row.patient_count),
      total_treatments: parseInt(row.total_treatments),
    }));
  } catch (error) {
    logger.error('Error getting treatment type breakdown:', error);
    throw error;
  }
};

/**
 * Get follow-up status
 * Who needs to be contacted
 */
export const getFollowUpStatus = async (organizationId) => {
  try {
    const result = await query(
      `SELECT
        f.contact_method,
        COUNT(*) as count
      FROM follow_ups f
      WHERE f.organization_id = $1
        AND f.status = 'PENDING'
        AND f.type IN ('REBOOKING_SELF', 'ACUTE_TRAUMA')
      GROUP BY f.contact_method
      ORDER BY count DESC`,
      [organizationId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    return {
      breakdown: result.rows.map((row) => ({
        method: row.contact_method || 'Ikke kontaktet',
        count: parseInt(row.count),
      })),
      total_to_follow_up: total,
    };
  } catch (error) {
    logger.error('Error getting follow-up status:', error);
    throw error;
  }
};

/**
 * Get referral source breakdown
 */
export const getReferralSourceBreakdown = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        p.referral_source,
        COUNT(DISTINCT p.id) as patient_count,
        COUNT(a.id) as total_treatments
      FROM patients p
      LEFT JOIN appointments a ON p.id = a.patient_id
        AND a.status = 'COMPLETED'
        AND a.start_time BETWEEN $2 AND $3
      WHERE p.organization_id = $1
        AND p.created_at BETWEEN $2 AND $3
      GROUP BY p.referral_source
      ORDER BY patient_count DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      source: row.referral_source || 'Unknown',
      patient_count: parseInt(row.patient_count),
      total_treatments: parseInt(row.total_treatments),
    }));
  } catch (error) {
    logger.error('Error getting referral source breakdown:', error);
    throw error;
  }
};

/**
 * Get comprehensive KPI dashboard
 * All metrics in one call
 */
export const getKPIDashboard = async (organizationId, startDate, endDate) => {
  try {
    const [
      rebookingRate,
      categoryBreakdown,
      geographicDistribution,
      treatmentTypes,
      followUpStatus,
      referralSources,
    ] = await Promise.all([
      calculateRebookingRate(organizationId, startDate, endDate),
      getPatientCategoryBreakdown(organizationId, startDate, endDate),
      getGeographicDistribution(organizationId, startDate, endDate),
      getTreatmentTypeBreakdown(organizationId, startDate, endDate),
      getFollowUpStatus(organizationId),
      getReferralSourceBreakdown(organizationId, startDate, endDate),
    ]);

    return {
      period: { startDate, endDate },
      overview: {
        rebooking_rate: rebookingRate.rebooking_rate,
        total_patients: rebookingRate.total_patients,
        rebooked_patients: rebookingRate.rebooked_patients,
      },
      by_category: categoryBreakdown,
      by_geography: geographicDistribution,
      by_treatment_type: treatmentTypes,
      follow_up_status: followUpStatus,
      by_referral_source: referralSources,
    };
  } catch (error) {
    logger.error('Error getting KPI dashboard:', error);
    throw error;
  }
};

/**
 * Import KPI data from Excel spreadsheet
 * Maps spreadsheet format to database
 */
export const importKPIData = async (organizationId, excelData, _userId) => {
  try {
    const results = {
      imported: 0,
      errors: [],
    };

    for (const row of excelData) {
      try {
        // Extract data from spreadsheet format
        const _appointmentDate = row['Dato'];
        const patientId = row['Pasient ID'];
        const treatmentCount = parseInt(row['Antall behandlinger']) || 1;
        const category = row['Pasientkategori'];
        const _treatmentType = row['Behandlingstype'];
        const referralSource = row['Henvist fra/Hvordan funnet'];
        const _referralDestination = row['Henvist videre til'];
        const _rebooking = row['Rebooking'];
        const _contacted = row['Kontaktet'];

        // Update patient record with KPI data
        if (patientId) {
          await query(
            `UPDATE patients SET
              category = $2,
              referral_source = $3,
              total_visits = $4,
              updated_at = NOW()
             WHERE organization_id = $1 AND solvit_id = $5`,
            [organizationId, category, referralSource, treatmentCount, patientId]
          );
        }

        results.imported++;
      } catch (error) {
        logger.error('Error importing KPI row:', error);
        results.errors.push(error.message);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error importing KPI data:', error);
    throw error;
  }
};

export default {
  calculateRebookingRate,
  getPatientCategoryBreakdown,
  getGeographicDistribution,
  getTreatmentTypeBreakdown,
  getFollowUpStatus,
  getReferralSourceBreakdown,
  getKPIDashboard,
  importKPIData,
};
