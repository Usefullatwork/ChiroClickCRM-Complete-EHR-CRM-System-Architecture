/**
 * Patient Statistics and Follow-up — Analytics and recall management.
 *
 * @module services/practice/patientStats
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Get patient statistics
 * Combined into 2 queries (down from 4) to avoid N+1 pattern
 */
export const getPatientStatistics = async (organizationId, patientId) => {
  try {
    // Combined query for visits, financial, and appointment stats
    const statsResult = await query(
      `WITH visit_stats AS (
        SELECT
          COUNT(*) as total_visits,
          COUNT(*) FILTER (WHERE encounter_type = 'INITIAL') as initial_visits,
          COUNT(*) FILTER (WHERE encounter_type = 'FOLLOWUP') as followup_visits,
          AVG(duration_minutes) as avg_duration,
          MIN(encounter_date) as first_visit,
          MAX(encounter_date) as last_visit
        FROM clinical_encounters
        WHERE organization_id = $1 AND patient_id = $2
      ),
      financial_stats AS (
        SELECT
          COALESCE(SUM(gross_amount), 0) as total_gross,
          COALESCE(SUM(patient_amount), 0) as total_paid,
          COALESCE(SUM(insurance_amount), 0) as total_insurance,
          COUNT(*) as total_transactions
        FROM financial_metrics
        WHERE organization_id = $1 AND patient_id = $2
      ),
      appointment_stats AS (
        SELECT
          COUNT(*) as total_appointments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
          COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows,
          COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
        FROM appointments
        WHERE organization_id = $1 AND patient_id = $2
      )
      SELECT
        v.total_visits, v.initial_visits, v.followup_visits,
        v.avg_duration, v.first_visit, v.last_visit,
        f.total_gross, f.total_paid, f.total_insurance, f.total_transactions,
        a.total_appointments, a.completed, a.no_shows, a.cancelled
      FROM visit_stats v, financial_stats f, appointment_stats a`,
      [organizationId, patientId]
    );

    // Diagnosis stats needs unnest + GROUP BY, kept as separate query
    const diagnosisResult = await query(
      `SELECT
        unnest(icpc_codes) as code,
        COUNT(*) as frequency
      FROM clinical_encounters
      WHERE organization_id = $1 AND patient_id = $2
        AND icpc_codes IS NOT NULL
      GROUP BY code
      ORDER BY frequency DESC
      LIMIT 5`,
      [organizationId, patientId]
    );

    const s = statsResult.rows[0];
    return {
      visits: {
        total_visits: s.total_visits,
        initial_visits: s.initial_visits,
        followup_visits: s.followup_visits,
        avg_duration: s.avg_duration,
        first_visit: s.first_visit,
        last_visit: s.last_visit,
      },
      topDiagnoses: diagnosisResult.rows,
      financial: {
        total_gross: s.total_gross,
        total_paid: s.total_paid,
        total_insurance: s.total_insurance,
        total_transactions: s.total_transactions,
      },
      appointments: {
        total_appointments: s.total_appointments,
        completed: s.completed,
        no_shows: s.no_shows,
        cancelled: s.cancelled,
      },
    };
  } catch (error) {
    logger.error('Error getting patient statistics:', error);
    throw error;
  }
};

/**
 * Get patients requiring follow-up
 */
export const getPatientsNeedingFollowUp = async (organizationId, daysInactive = 90) => {
  try {
    const result = await query(
      `SELECT
        p.*,
        EXTRACT(DAY FROM NOW() - p.last_visit_date) as days_since_visit
      FROM patients p
      WHERE p.organization_id = $1
        AND p.status = 'ACTIVE'
        AND p.last_visit_date < NOW() - INTERVAL '1 day' * $2
        AND NOT EXISTS (
          SELECT 1 FROM follow_ups f
          WHERE f.patient_id = p.id
            AND f.status = 'PENDING'
            AND f.type IN ('RECALL_3M', 'RECALL_6M')
        )
      ORDER BY p.last_visit_date ASC
      LIMIT 50`,
      [organizationId, daysInactive]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting patients needing follow-up:', error);
    throw error;
  }
};
