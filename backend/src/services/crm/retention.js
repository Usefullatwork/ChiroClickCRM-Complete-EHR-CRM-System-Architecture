/**
 * CRM Retention Service
 * Churn analysis, cohort analysis, and retention dashboard
 */

import { query } from '../../config/database.js';

/**
 * Get retention dashboard
 * Combined into 2 queries (down from 3) to reduce round-trips
 */
export const getRetentionDashboard = async (clinicId, period = '30d') => {
  const days = parseInt(period) || 30;

  // Combined retention metrics in a single query
  const metricsResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE last_visit_date >= CURRENT_DATE - make_interval(days => $2)) as retained,
      COUNT(*) FILTER (WHERE lifecycle_stage IN ('ACTIVE', 'AT_RISK')) as total_trackable,
      AVG(visit_frequency_days) FILTER (WHERE visit_frequency_days > 0) as avg_frequency
     FROM patients
     WHERE organization_id = $1`,
    [clinicId, days]
  );

  const metrics = metricsResult.rows[0];
  const retentionRate =
    metrics.total_trackable > 0
      ? ((metrics.retained / metrics.total_trackable) * 100).toFixed(1)
      : 0;

  // Lifecycle distribution needs GROUP BY, kept separate
  const lifecycleResult = await query(
    `SELECT lifecycle_stage, COUNT(*) as count
     FROM patients
     WHERE organization_id = $1
     GROUP BY lifecycle_stage`,
    [clinicId]
  );

  return {
    lifecycleDistribution: lifecycleResult.rows,
    retentionRate: parseFloat(retentionRate),
    retainedPatients: parseInt(metrics.retained),
    avgVisitFrequency: parseFloat(metrics.avg_frequency) || 0,
  };
};

/**
 * Get churn analysis
 */
export const getChurnAnalysis = async (clinicId) => {
  // Patients who became inactive/lost in last 90 days
  const churnResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE lifecycle_stage = 'INACTIVE') as inactive,
      COUNT(*) FILTER (WHERE lifecycle_stage = 'LOST') as lost,
      COUNT(*) FILTER (WHERE lifecycle_stage = 'AT_RISK') as at_risk
     FROM patients
     WHERE organization_id = $1`,
    [clinicId]
  );

  // Churn by month (last 6 months)
  const monthlyChurn = await query(
    `SELECT
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as count
     FROM patient_value_history
     WHERE patient_id IN (
       SELECT id FROM patients WHERE organization_id = $1 AND lifecycle_stage IN ('INACTIVE', 'LOST')
     )
     AND created_at >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY month`,
    [clinicId]
  );

  return {
    current: churnResult.rows[0],
    trend: monthlyChurn.rows,
  };
};

/**
 * Get cohort retention
 */
export const getCohortRetention = async (clinicId, months = 6) => {
  const result = await query(
    `WITH cohorts AS (
      SELECT
        DATE_TRUNC('month', first_visit_date) as cohort_month,
        id as patient_id
      FROM patients
      WHERE organization_id = $1
        AND first_visit_date >= CURRENT_DATE - make_interval(months => $2)
    )
    SELECT
      cohort_month,
      COUNT(*) as cohort_size,
      COUNT(*) FILTER (WHERE p.lifecycle_stage IN ('ACTIVE', 'ONBOARDING')) as still_active
    FROM cohorts c
    JOIN patients p ON c.patient_id = p.id
    GROUP BY cohort_month
    ORDER BY cohort_month`,
    [clinicId, months]
  );

  return result.rows.map((row) => ({
    ...row,
    retention_rate:
      row.cohort_size > 0 ? ((row.still_active / row.cohort_size) * 100).toFixed(1) : 0,
  }));
};
