/**
 * Progress Tracking Service
 * Analytics and aggregation for patient exercise compliance
 *
 * Tjeneste for fremgangssporing
 * Analyse og aggregering av pasientens treningsoverholdelse
 *
 * @module services/progressTracking
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// PATIENT PROGRESS ANALYTICS
// ============================================================================

/**
 * Get comprehensive progress statistics for a patient
 * Henter omfattende fremgangsstatistikk for en pasient
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {object} options - Query options (startDate, endDate)
 */
export const getPatientProgressStats = async (organizationId, patientId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    const dateFilter = startDate && endDate ? `AND ep.completed_at BETWEEN $3 AND $4` : '';
    const params =
      startDate && endDate
        ? [organizationId, patientId, startDate, endDate]
        : [organizationId, patientId];

    // Get overall statistics
    const statsResult = await query(
      `SELECT
        COUNT(DISTINCT ep.id) as total_completions,
        COUNT(DISTINCT DATE(ep.completed_at)) as active_days,
        COUNT(DISTINCT ep.exercise_id) as unique_exercises,
        AVG(ep.difficulty_rating) as avg_difficulty,
        AVG(ep.pain_rating) as avg_pain,
        MIN(ep.completed_at) as first_completion,
        MAX(ep.completed_at) as last_completion
       FROM exercise_progress ep
       JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
       WHERE pr.organization_id = $1
         AND ep.patient_id = $2
         ${dateFilter}`,
      params
    );

    // Get prescription compliance
    const complianceResult = await query(
      `SELECT
        pr.id as prescription_id,
        pr.status,
        pr.start_date,
        pr.end_date,
        COUNT(DISTINCT pe.id) as total_prescribed,
        COUNT(DISTINCT ep.exercise_id) as completed_unique,
        COUNT(ep.id) as total_completions
       FROM exercise_prescriptions pr
       LEFT JOIN prescribed_exercises pe ON pe.prescription_id = pr.id
       LEFT JOIN exercise_progress ep ON ep.prescription_id = pr.id
       WHERE pr.organization_id = $1
         AND pr.patient_id = $2
       GROUP BY pr.id, pr.status, pr.start_date, pr.end_date
       ORDER BY pr.start_date DESC`,
      [organizationId, patientId]
    );

    // Get current streak
    const streakResult = await query(
      `WITH daily_progress AS (
        SELECT DISTINCT DATE(ep.completed_at) as completion_date
        FROM exercise_progress ep
        JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
        WHERE pr.organization_id = $1 AND ep.patient_id = $2
        ORDER BY completion_date DESC
      ),
      streak_calc AS (
        SELECT
          completion_date,
          ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn,
          completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::int as streak_group
        FROM daily_progress
      )
      SELECT COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group FROM streak_calc WHERE completion_date = CURRENT_DATE
        UNION ALL
        SELECT streak_group FROM streak_calc WHERE completion_date = CURRENT_DATE - 1
        LIMIT 1
      )`,
      [organizationId, patientId]
    );

    const stats = statsResult.rows[0];
    const currentStreak = parseInt(streakResult.rows[0]?.current_streak || 0);

    return {
      summary: {
        totalCompletions: parseInt(stats.total_completions) || 0,
        activeDays: parseInt(stats.active_days) || 0,
        uniqueExercises: parseInt(stats.unique_exercises) || 0,
        avgDifficulty: parseFloat(stats.avg_difficulty)?.toFixed(1) || 0,
        avgPain: parseFloat(stats.avg_pain)?.toFixed(1) || 0,
        currentStreak,
        firstCompletion: stats.first_completion,
        lastCompletion: stats.last_completion,
      },
      prescriptions: complianceResult.rows.map((row) => ({
        prescriptionId: row.prescription_id,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        totalPrescribed: parseInt(row.total_prescribed) || 0,
        completedUnique: parseInt(row.completed_unique) || 0,
        totalCompletions: parseInt(row.total_completions) || 0,
        complianceRate:
          row.total_prescribed > 0
            ? Math.round((row.completed_unique / row.total_prescribed) * 100)
            : 0,
      })),
    };
  } catch (error) {
    logger.error('Error getting patient progress stats:', error);
    throw error;
  }
};

/**
 * Get weekly compliance data for a patient
 * Henter ukentlig overholdelsesdata for en pasient
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {number} weeks - Number of weeks to include (default 12)
 */
export const getWeeklyCompliance = async (organizationId, patientId, weeks = 12) => {
  try {
    const result = await query(
      `WITH weeks AS (
        SELECT generate_series(
          DATE_TRUNC('week', CURRENT_DATE - make_interval(weeks => $3 - 1)),
          DATE_TRUNC('week', CURRENT_DATE),
          '1 week'::interval
        ) as week_start
      ),
      weekly_progress AS (
        SELECT
          DATE_TRUNC('week', ep.completed_at) as week_start,
          COUNT(DISTINCT ep.id) as completions,
          COUNT(DISTINCT ep.exercise_id) as exercises_done,
          COUNT(DISTINCT DATE(ep.completed_at)) as active_days,
          AVG(ep.pain_rating) as avg_pain
        FROM exercise_progress ep
        JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
        WHERE pr.organization_id = $1
          AND ep.patient_id = $2
          AND ep.completed_at >= CURRENT_DATE - make_interval(weeks => $3)
        GROUP BY DATE_TRUNC('week', ep.completed_at)
      ),
      prescribed_weekly AS (
        SELECT
          COUNT(DISTINCT pe.id) * 7 as target_per_week
        FROM exercise_prescriptions pr
        JOIN prescribed_exercises pe ON pe.prescription_id = pr.id
        WHERE pr.organization_id = $1
          AND pr.patient_id = $2
          AND pr.status = 'active'
      )
      SELECT
        w.week_start,
        COALESCE(wp.completions, 0) as completions,
        COALESCE(wp.exercises_done, 0) as exercises_done,
        COALESCE(wp.active_days, 0) as active_days,
        COALESCE(wp.avg_pain, 0) as avg_pain,
        COALESCE(pw.target_per_week, 0) as target
      FROM weeks w
      CROSS JOIN prescribed_weekly pw
      LEFT JOIN weekly_progress wp ON wp.week_start = w.week_start
      ORDER BY w.week_start`,
      [organizationId, patientId, weeks]
    );

    return result.rows.map((row) => ({
      weekStart: row.week_start,
      weekLabel: new Date(row.week_start).toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'short',
      }),
      completions: parseInt(row.completions),
      exercisesDone: parseInt(row.exercises_done),
      activeDays: parseInt(row.active_days),
      avgPain: parseFloat(row.avg_pain)?.toFixed(1) || 0,
      target: parseInt(row.target),
      complianceRate:
        row.target > 0 ? Math.min(100, Math.round((row.completions / row.target) * 100)) : 0,
    }));
  } catch (error) {
    logger.error('Error getting weekly compliance:', error);
    throw error;
  }
};

/**
 * Get daily progress data for calendar view
 * Henter daglig fremgangsdata for kalendervisning
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {number} months - Number of months to include (default 3)
 */
export const getDailyProgress = async (organizationId, patientId, months = 3) => {
  try {
    const result = await query(
      `WITH daily_data AS (
        SELECT
          DATE(ep.completed_at) as date,
          COUNT(DISTINCT ep.id) as completions,
          COUNT(DISTINCT ep.exercise_id) as exercises_done,
          AVG(ep.pain_rating) as avg_pain,
          AVG(ep.difficulty_rating) as avg_difficulty,
          ARRAY_AGG(DISTINCT el.name_norwegian ORDER BY el.name_norwegian) as exercise_names
        FROM exercise_progress ep
        JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
        JOIN exercise_library el ON el.id = ep.exercise_id
        WHERE pr.organization_id = $1
          AND ep.patient_id = $2
          AND ep.completed_at >= CURRENT_DATE - make_interval(months => $3)
        GROUP BY DATE(ep.completed_at)
      ),
      prescribed_count AS (
        SELECT COUNT(DISTINCT pe.id) as total_exercises
        FROM exercise_prescriptions pr
        JOIN prescribed_exercises pe ON pe.prescription_id = pr.id
        WHERE pr.organization_id = $1
          AND pr.patient_id = $2
          AND pr.status = 'active'
      )
      SELECT
        d.date,
        d.completions,
        d.exercises_done,
        COALESCE(pc.total_exercises, 0) as total_prescribed,
        d.avg_pain,
        d.avg_difficulty,
        d.exercise_names
      FROM daily_data d
      CROSS JOIN prescribed_count pc
      ORDER BY d.date`,
      [organizationId, patientId, months]
    );

    return result.rows.map((row) => ({
      date: row.date,
      completions: parseInt(row.completions),
      exercisesDone: parseInt(row.exercises_done),
      totalPrescribed: parseInt(row.total_prescribed),
      avgPain: parseFloat(row.avg_pain)?.toFixed(1) || null,
      avgDifficulty: parseFloat(row.avg_difficulty)?.toFixed(1) || null,
      exerciseNames: row.exercise_names || [],
      completionRate:
        row.total_prescribed > 0
          ? Math.round((row.exercises_done / row.total_prescribed) * 100)
          : 0,
    }));
  } catch (error) {
    logger.error('Error getting daily progress:', error);
    throw error;
  }
};

/**
 * Get pain level history over time
 * Henter smerteniva-historikk over tid
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {number} days - Number of days to include (default 90)
 */
export const getPainHistory = async (organizationId, patientId, days = 90) => {
  try {
    const result = await query(
      `SELECT
        DATE(ep.completed_at) as date,
        AVG(ep.pain_rating) as avg_pain,
        MIN(ep.pain_rating) as min_pain,
        MAX(ep.pain_rating) as max_pain,
        COUNT(*) as entry_count
       FROM exercise_progress ep
       JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
       WHERE pr.organization_id = $1
         AND ep.patient_id = $2
         AND ep.pain_rating IS NOT NULL
         AND ep.completed_at >= CURRENT_DATE - make_interval(days => $3)
       GROUP BY DATE(ep.completed_at)
       ORDER BY DATE(ep.completed_at)`,
      [organizationId, patientId, days]
    );

    // Calculate trend
    const dataPoints = result.rows;
    let trend = 'stable';
    if (dataPoints.length >= 7) {
      const firstWeek =
        dataPoints.slice(0, 7).reduce((sum, d) => sum + parseFloat(d.avg_pain), 0) / 7;
      const lastWeek = dataPoints.slice(-7).reduce((sum, d) => sum + parseFloat(d.avg_pain), 0) / 7;
      const diff = lastWeek - firstWeek;
      if (diff < -1) trend = 'improving';
      else if (diff > 1) trend = 'worsening';
    }

    return {
      data: dataPoints.map((row) => ({
        date: row.date,
        avgPain: parseFloat(row.avg_pain)?.toFixed(1),
        minPain: parseInt(row.min_pain),
        maxPain: parseInt(row.max_pain),
        entryCount: parseInt(row.entry_count),
      })),
      trend,
      currentAvg:
        dataPoints.length > 0
          ? parseFloat(dataPoints[dataPoints.length - 1].avg_pain)?.toFixed(1)
          : null,
    };
  } catch (error) {
    logger.error('Error getting pain history:', error);
    throw error;
  }
};

// ============================================================================
// THERAPIST DASHBOARD / CLINIC ANALYTICS
// ============================================================================

/**
 * Get all patients' compliance summary for therapist dashboard
 * Henter alle pasienters overholdelsessammendrag for terapeutens dashboard
 *
 * @param {string} organizationId - Organization ID
 * @param {object} options - Query options (limit, offset, sortBy, order)
 */
export const getAllPatientsCompliance = async (organizationId, options = {}) => {
  try {
    const { limit = 50, offset = 0, sortBy = 'compliance_rate', order = 'DESC' } = options;

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['compliance_rate', 'last_activity', 'patient_name', 'active_days'];
    const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'compliance_rate';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await query(
      `WITH patient_stats AS (
        SELECT
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.email,
          p.phone,
          COUNT(DISTINCT ep.id) as total_completions,
          COUNT(DISTINCT DATE(ep.completed_at)) as active_days,
          COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN DATE(ep.completed_at) END) as active_days_week,
          MAX(ep.completed_at) as last_activity,
          AVG(ep.pain_rating) FILTER (WHERE ep.completed_at >= CURRENT_DATE - INTERVAL '7 days') as recent_avg_pain,
          COUNT(DISTINCT pe.id) as total_prescribed
        FROM patients p
        JOIN exercise_prescriptions pr ON pr.patient_id = p.id
        LEFT JOIN prescribed_exercises pe ON pe.prescription_id = pr.id
        LEFT JOIN exercise_progress ep ON ep.prescription_id = pr.id AND ep.patient_id = p.id
        WHERE pr.organization_id = $1
          AND pr.status = 'active'
        GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone
      )
      SELECT
        patient_id,
        patient_name,
        email,
        phone,
        total_completions,
        active_days,
        active_days_week,
        last_activity,
        recent_avg_pain,
        total_prescribed,
        CASE
          WHEN total_prescribed > 0
          THEN ROUND((active_days_week::decimal / 7) * 100)
          ELSE 0
        END as compliance_rate
      FROM patient_stats
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM patients p
       JOIN exercise_prescriptions pr ON pr.patient_id = p.id
       WHERE pr.organization_id = $1 AND pr.status = 'active'`,
      [organizationId]
    );

    return {
      patients: result.rows.map((row) => ({
        patientId: row.patient_id,
        patientName: row.patient_name,
        email: row.email,
        phone: row.phone,
        totalCompletions: parseInt(row.total_completions),
        activeDays: parseInt(row.active_days),
        activeDaysThisWeek: parseInt(row.active_days_week),
        lastActivity: row.last_activity,
        recentAvgPain: row.recent_avg_pain ? parseFloat(row.recent_avg_pain).toFixed(1) : null,
        totalPrescribed: parseInt(row.total_prescribed),
        complianceRate: parseInt(row.compliance_rate),
        status: getComplianceStatus(parseInt(row.compliance_rate)),
      })),
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Error getting all patients compliance:', error);
    throw error;
  }
};

/**
 * Get compliance status based on rate
 * Henter overholdelsesstatus basert pa rate
 */
const getComplianceStatus = (rate) => {
  if (rate >= 80) return { label: 'Utmerket', labelEn: 'Excellent', color: 'green' };
  if (rate >= 60) return { label: 'Bra', labelEn: 'Good', color: 'blue' };
  if (rate >= 40) return { label: 'Middels', labelEn: 'Fair', color: 'yellow' };
  if (rate >= 20) return { label: 'Lav', labelEn: 'Low', color: 'orange' };
  return { label: 'Trenger oppfolging', labelEn: 'Needs follow-up', color: 'red' };
};

/**
 * Get clinic-wide exercise compliance overview
 * Henter klinikkovergripende oversikt over treningsoverholdelse
 *
 * @param {string} organizationId - Organization ID
 */
export const getClinicComplianceOverview = async (organizationId) => {
  try {
    // Overall stats
    const overallResult = await query(
      `SELECT
        COUNT(DISTINCT ep.patient_id) as active_patients,
        COUNT(DISTINCT ep.id) as total_completions,
        COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN ep.patient_id END) as active_this_week,
        AVG(ep.pain_rating) FILTER (WHERE ep.completed_at >= CURRENT_DATE - INTERVAL '30 days') as avg_pain_30d
       FROM exercise_progress ep
       JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
       WHERE pr.organization_id = $1`,
      [organizationId]
    );

    // Compliance distribution
    const distributionResult = await query(
      `WITH patient_compliance AS (
        SELECT
          p.id,
          CASE
            WHEN COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN DATE(ep.completed_at) END) >= 6 THEN 'excellent'
            WHEN COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN DATE(ep.completed_at) END) >= 4 THEN 'good'
            WHEN COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN DATE(ep.completed_at) END) >= 2 THEN 'fair'
            WHEN COUNT(DISTINCT CASE WHEN ep.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN DATE(ep.completed_at) END) >= 1 THEN 'low'
            ELSE 'inactive'
          END as compliance_level
        FROM patients p
        JOIN exercise_prescriptions pr ON pr.patient_id = p.id
        LEFT JOIN exercise_progress ep ON ep.prescription_id = pr.id
        WHERE pr.organization_id = $1 AND pr.status = 'active'
        GROUP BY p.id
      )
      SELECT
        compliance_level,
        COUNT(*) as patient_count
      FROM patient_compliance
      GROUP BY compliance_level`,
      [organizationId]
    );

    // Weekly trend
    const trendResult = await query(
      `SELECT
        DATE_TRUNC('week', ep.completed_at) as week,
        COUNT(DISTINCT ep.patient_id) as active_patients,
        COUNT(ep.id) as completions
       FROM exercise_progress ep
       JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
       WHERE pr.organization_id = $1
         AND ep.completed_at >= CURRENT_DATE - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', ep.completed_at)
       ORDER BY week`,
      [organizationId]
    );

    const overall = overallResult.rows[0];
    const distribution = {};
    distributionResult.rows.forEach((row) => {
      distribution[row.compliance_level] = parseInt(row.patient_count);
    });

    return {
      overview: {
        activePatients: parseInt(overall.active_patients) || 0,
        totalCompletions: parseInt(overall.total_completions) || 0,
        activeThisWeek: parseInt(overall.active_this_week) || 0,
        avgPain30d: overall.avg_pain_30d ? parseFloat(overall.avg_pain_30d).toFixed(1) : null,
      },
      distribution: {
        excellent: distribution.excellent || 0,
        good: distribution.good || 0,
        fair: distribution.fair || 0,
        low: distribution.low || 0,
        inactive: distribution.inactive || 0,
      },
      weeklyTrend: trendResult.rows.map((row) => ({
        week: row.week,
        weekLabel: new Date(row.week).toLocaleDateString('no-NO', {
          day: 'numeric',
          month: 'short',
        }),
        activePatients: parseInt(row.active_patients),
        completions: parseInt(row.completions),
      })),
    };
  } catch (error) {
    logger.error('Error getting clinic compliance overview:', error);
    throw error;
  }
};

/**
 * Log a pain entry for a patient
 * Registrerer en smertevurdering for en pasient
 *
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {number} painLevel - Pain level (0-10)
 * @param {string} notes - Optional notes
 * @param {string} source - Source of entry (portal, clinician, app)
 */
export const logPainEntry = async (
  organizationId,
  patientId,
  painLevel,
  notes = null,
  source = 'portal'
) => {
  try {
    // Get active prescription and first exercise for patient
    const prescriptionResult = await query(
      `SELECT ep.id as prescription_id, pe.exercise_id
       FROM exercise_prescriptions ep
       LEFT JOIN prescribed_exercises pe ON pe.prescription_id = ep.id
       WHERE ep.organization_id = $1 AND ep.patient_id = $2 AND ep.status = 'active'
       ORDER BY ep.prescribed_at DESC, pe.display_order ASC
       LIMIT 1`,
      [organizationId, patientId]
    );

    if (prescriptionResult.rows.length === 0) {
      throw new Error('Ingen aktiv treningsforskrivning funnet');
    }

    const { prescription_id: prescriptionId, exercise_id: exerciseId } = prescriptionResult.rows[0];

    if (!exerciseId) {
      throw new Error('Ingen ovelser funnet i treningsforskrivningen');
    }

    // Insert pain-only progress entry
    const result = await query(
      `INSERT INTO exercise_progress (
        prescription_id, patient_id, exercise_id, pain_rating, notes, source
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [prescriptionId, patientId, exerciseId, painLevel, notes, source]
    );

    logger.info('Pain entry logged:', { patientId, painLevel, source });

    return {
      success: true,
      entry: result.rows[0],
      message: 'Smerteniva registrert!',
    };
  } catch (error) {
    logger.error('Error logging pain entry:', error);
    throw error;
  }
};

// Export default for service
export default {
  // Patient analytics
  getPatientProgressStats,
  getWeeklyCompliance,
  getDailyProgress,
  getPainHistory,
  logPainEntry,

  // Therapist/Clinic analytics
  getAllPatientsCompliance,
  getClinicComplianceOverview,
};
