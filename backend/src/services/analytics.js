/**
 * Analytics Service
 * Comprehensive analytics and reporting queries
 *
 * @module services/analytics
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get patient statistics (total, new this month, comparison with last month)
 */
export const getPatientStats = async (organizationId) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total patients
    const totalResult = await query(
      `SELECT COUNT(*) as total_patients
       FROM patients
       WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );

    // New patients this month
    const newThisMonthResult = await query(
      `SELECT COUNT(*) as new_patients
       FROM patients
       WHERE organization_id = $1
         AND created_at >= $2`,
      [organizationId, thisMonthStart.toISOString()]
    );

    // New patients last month
    const newLastMonthResult = await query(
      `SELECT COUNT(*) as new_patients
       FROM patients
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3`,
      [organizationId, lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // Active patients (had visit in last 90 days)
    const activeResult = await query(
      `SELECT COUNT(DISTINCT patient_id) as active_patients
       FROM clinical_encounters
       WHERE organization_id = $1
         AND encounter_date >= NOW() - INTERVAL '90 days'`,
      [organizationId]
    );

    return {
      totalPatients: parseInt(totalResult.rows[0]?.total_patients || 0),
      newPatientsThisMonth: parseInt(newThisMonthResult.rows[0]?.new_patients || 0),
      newPatientsLastMonth: parseInt(newLastMonthResult.rows[0]?.new_patients || 0),
      activePatients: parseInt(activeResult.rows[0]?.active_patients || 0),
      changePercent:
        newLastMonthResult.rows[0]?.new_patients > 0
          ? Math.round(
              ((newThisMonthResult.rows[0]?.new_patients -
                newLastMonthResult.rows[0]?.new_patients) /
                newLastMonthResult.rows[0]?.new_patients) *
                100
            )
          : 0,
    };
  } catch (error) {
    logger.error('Error getting patient stats:', error);
    throw error;
  }
};

/**
 * Get appointments completed this month and today/this week
 */
export const getAppointmentStats = async (organizationId) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Sunday

    // Completed this month
    const completedMonthResult = await query(
      `SELECT COUNT(*) as completed
       FROM appointments
       WHERE organization_id = $1
         AND status = 'COMPLETED'
         AND start_time >= $2`,
      [organizationId, thisMonthStart.toISOString()]
    );

    // Today's appointments
    const todayResult = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
         COUNT(*) FILTER (WHERE status = 'PENDING') as pending
       FROM appointments
       WHERE organization_id = $1
         AND DATE(start_time) = CURRENT_DATE`,
      [organizationId]
    );

    // This week's appointments
    const weekResult = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
         COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show
       FROM appointments
       WHERE organization_id = $1
         AND start_time >= $2
         AND start_time <= $3`,
      [organizationId, thisWeekStart.toISOString(), thisWeekEnd.toISOString()]
    );

    // Upcoming appointments today
    const upcomingTodayResult = await query(
      `SELECT
         a.id,
         a.start_time,
         a.duration_minutes,
         a.appointment_type,
         a.status,
         p.first_name,
         p.last_name,
         p.phone
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.organization_id = $1
         AND DATE(a.start_time) = CURRENT_DATE
         AND a.status IN ('CONFIRMED', 'PENDING')
         AND a.start_time >= NOW()
       ORDER BY a.start_time ASC
       LIMIT 10`,
      [organizationId]
    );

    return {
      completedThisMonth: parseInt(completedMonthResult.rows[0]?.completed || 0),
      today: {
        total: parseInt(todayResult.rows[0]?.total || 0),
        confirmed: parseInt(todayResult.rows[0]?.confirmed || 0),
        completed: parseInt(todayResult.rows[0]?.completed || 0),
        pending: parseInt(todayResult.rows[0]?.pending || 0),
      },
      thisWeek: {
        total: parseInt(weekResult.rows[0]?.total || 0),
        completed: parseInt(weekResult.rows[0]?.completed || 0),
        cancelled: parseInt(weekResult.rows[0]?.cancelled || 0),
        noShow: parseInt(weekResult.rows[0]?.no_show || 0),
      },
      upcomingToday: upcomingTodayResult.rows.map((apt) => ({
        id: apt.id,
        startTime: apt.start_time,
        durationMinutes: apt.duration_minutes,
        appointmentType: apt.appointment_type,
        status: apt.status,
        patientName: `${apt.first_name} ${apt.last_name}`,
        patientPhone: apt.phone,
      })),
    };
  } catch (error) {
    logger.error('Error getting appointment stats:', error);
    throw error;
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (organizationId, startDate, endDate) => {
  try {
    const now = new Date();
    const thisMonthStart =
      startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonthEnd = endDate || now.toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // This month revenue
    const thisMonthResult = await query(
      `SELECT
         COALESCE(SUM(gross_amount), 0) as total_revenue,
         COALESCE(SUM(patient_amount), 0) as patient_revenue,
         COALESCE(SUM(insurance_amount), 0) as insurance_revenue,
         COUNT(*) as transaction_count
       FROM financial_metrics
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3`,
      [organizationId, thisMonthStart, thisMonthEnd]
    );

    // Last month revenue
    const lastMonthResult = await query(
      `SELECT
         COALESCE(SUM(gross_amount), 0) as total_revenue
       FROM financial_metrics
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3`,
      [organizationId, lastMonthStart, lastMonthEnd]
    );

    // Revenue by day for chart (last 30 days)
    const dailyRevenueResult = await query(
      `SELECT
         DATE(created_at) as date,
         COALESCE(SUM(gross_amount), 0) as revenue
       FROM financial_metrics
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [organizationId]
    );

    const thisMonthRevenue = parseFloat(thisMonthResult.rows[0]?.total_revenue || 0);
    const lastMonthRevenue = parseFloat(lastMonthResult.rows[0]?.total_revenue || 0);

    return {
      thisMonth: {
        totalRevenue: thisMonthRevenue,
        patientRevenue: parseFloat(thisMonthResult.rows[0]?.patient_revenue || 0),
        insuranceRevenue: parseFloat(thisMonthResult.rows[0]?.insurance_revenue || 0),
        transactionCount: parseInt(thisMonthResult.rows[0]?.transaction_count || 0),
      },
      lastMonth: {
        totalRevenue: lastMonthRevenue,
      },
      changePercent:
        lastMonthRevenue > 0
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0,
      dailyRevenue: dailyRevenueResult.rows.map((row) => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
      })),
    };
  } catch (error) {
    logger.error('Error getting revenue stats:', error);
    throw error;
  }
};

/**
 * Get most prescribed exercises (top 10)
 */
export const getTopExercises = async (organizationId, limit = 10) => {
  try {
    const result = await query(
      `SELECT
         e.id,
         e.name_no,
         e.name_en,
         e.category,
         e.subcategory,
         e.body_region,
         COUNT(pe.id) as prescription_count,
         COUNT(DISTINCT ep.patient_id) as patient_count
       FROM exercises e
       JOIN prescription_exercises pe ON pe.exercise_id = e.id
       JOIN exercise_prescriptions ep ON ep.id = pe.prescription_id
       WHERE ep.organization_id = $1
         AND ep.created_at >= NOW() - INTERVAL '90 days'
       GROUP BY e.id, e.name_no, e.name_en, e.category, e.subcategory, e.body_region
       ORDER BY prescription_count DESC
       LIMIT $2`,
      [organizationId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      nameNo: row.name_no,
      nameEn: row.name_en,
      category: row.category,
      subcategory: row.subcategory,
      bodyRegion: row.body_region,
      prescriptionCount: parseInt(row.prescription_count),
      patientCount: parseInt(row.patient_count),
    }));
  } catch (error) {
    logger.error('Error getting top exercises:', error);
    // Return empty array if exercises table doesn't exist
    return [];
  }
};

/**
 * Get patient exercise compliance rate
 */
export const getExerciseCompliance = async (organizationId) => {
  try {
    // Overall compliance rate
    const overallResult = await query(
      `SELECT
         COUNT(*) as total_prescriptions,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'active') as active,
         COUNT(*) FILTER (WHERE status = 'paused') as paused,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM exercise_prescriptions
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '90 days'`,
      [organizationId]
    );

    // Progress tracking (average completion rate)
    const progressResult = await query(
      `SELECT
         AVG(
           CASE
             WHEN sessions_prescribed > 0
             THEN (sessions_completed::float / sessions_prescribed::float) * 100
             ELSE 0
           END
         ) as avg_completion_rate
       FROM exercise_prescriptions
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '90 days'
         AND status IN ('completed', 'active')`,
      [organizationId]
    );

    // Compliance by week (last 12 weeks)
    const weeklyResult = await query(
      `SELECT
         DATE_TRUNC('week', created_at) as week,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         AVG(
           CASE
             WHEN sessions_prescribed > 0
             THEN (sessions_completed::float / sessions_prescribed::float) * 100
             ELSE 0
           END
         ) as avg_rate
       FROM exercise_prescriptions
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', created_at)
       ORDER BY week ASC`,
      [organizationId]
    );

    const total = parseInt(overallResult.rows[0]?.total_prescriptions || 0);
    const completed = parseInt(overallResult.rows[0]?.completed || 0);

    return {
      totalPrescriptions: total,
      completed: completed,
      active: parseInt(overallResult.rows[0]?.active || 0),
      paused: parseInt(overallResult.rows[0]?.paused || 0),
      cancelled: parseInt(overallResult.rows[0]?.cancelled || 0),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProgressRate: Math.round(parseFloat(progressResult.rows[0]?.avg_completion_rate || 0)),
      weeklyTrend: weeklyResult.rows.map((row) => ({
        week: row.week,
        total: parseInt(row.total),
        completed: parseInt(row.completed),
        avgRate: Math.round(parseFloat(row.avg_rate || 0)),
      })),
    };
  } catch (error) {
    logger.error('Error getting exercise compliance:', error);
    // Return default values if tables don't exist
    return {
      totalPrescriptions: 0,
      completed: 0,
      active: 0,
      paused: 0,
      cancelled: 0,
      completionRate: 0,
      avgProgressRate: 0,
      weeklyTrend: [],
    };
  }
};

/**
 * Get patient volume trends (monthly for last 12 months)
 */
export const getPatientVolumeTrends = async (organizationId) => {
  try {
    const result = await query(
      `SELECT
         DATE_TRUNC('month', encounter_date) as month,
         COUNT(*) as total_visits,
         COUNT(DISTINCT patient_id) as unique_patients
       FROM clinical_encounters
       WHERE organization_id = $1
         AND encounter_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', encounter_date)
       ORDER BY month ASC`,
      [organizationId]
    );

    return result.rows.map((row) => ({
      month: row.month,
      totalVisits: parseInt(row.total_visits),
      uniquePatients: parseInt(row.unique_patients),
    }));
  } catch (error) {
    logger.error('Error getting patient volume trends:', error);
    throw error;
  }
};

/**
 * Get comprehensive analytics dashboard data
 */
export const getDashboardAnalytics = async (organizationId, dateRange = {}) => {
  try {
    const [
      patientStats,
      appointmentStats,
      revenueStats,
      topExercises,
      exerciseCompliance,
      patientVolumeTrends,
    ] = await Promise.all([
      getPatientStats(organizationId),
      getAppointmentStats(organizationId),
      getRevenueStats(organizationId, dateRange.startDate, dateRange.endDate),
      getTopExercises(organizationId),
      getExerciseCompliance(organizationId),
      getPatientVolumeTrends(organizationId),
    ]);

    return {
      patients: patientStats,
      appointments: appointmentStats,
      revenue: revenueStats,
      exercises: {
        topPrescribed: topExercises,
        compliance: exerciseCompliance,
      },
      trends: {
        patientVolume: patientVolumeTrends,
      },
    };
  } catch (error) {
    logger.error('Error getting dashboard analytics:', error);
    throw error;
  }
};

/**
 * Export analytics data to CSV format
 */
export const exportAnalyticsCSV = async (organizationId, type, dateRange = {}) => {
  try {
    let data = [];
    let headers = [];

    switch (type) {
      case 'patients': {
        const patientStats = await getPatientStats(organizationId);
        headers = ['Metrikk', 'Verdi'];
        data = [
          ['Totalt antall pasienter', patientStats.totalPatients],
          ['Nye pasienter denne maneden', patientStats.newPatientsThisMonth],
          ['Nye pasienter forrige maned', patientStats.newPatientsLastMonth],
          ['Aktive pasienter', patientStats.activePatients],
          ['Endring (%)', patientStats.changePercent],
        ];
        break;
      }

      case 'revenue': {
        const revenueStats = await getRevenueStats(
          organizationId,
          dateRange.startDate,
          dateRange.endDate
        );
        headers = ['Dato', 'Inntekt (NOK)'];
        data = revenueStats.dailyRevenue.map((d) => [d.date, d.revenue]);
        break;
      }

      case 'exercises': {
        const topExercises = await getTopExercises(organizationId, 50);
        headers = ['Ovelse', 'Kategori', 'Antall foreskrivninger', 'Antall pasienter'];
        data = topExercises.map((e) => [
          e.nameNo || e.nameEn,
          e.category,
          e.prescriptionCount,
          e.patientCount,
        ]);
        break;
      }

      case 'appointments': {
        const appointmentStats = await getAppointmentStats(organizationId);
        headers = ['Metrikk', 'Verdi'];
        data = [
          ['Fullforte denne maneden', appointmentStats.completedThisMonth],
          ['I dag - totalt', appointmentStats.today.total],
          ['I dag - bekreftet', appointmentStats.today.confirmed],
          ['Denne uken - totalt', appointmentStats.thisWeek.total],
          ['Denne uken - fullfort', appointmentStats.thisWeek.completed],
          ['Denne uken - avlyst', appointmentStats.thisWeek.cancelled],
          ['Denne uken - ikke mott', appointmentStats.thisWeek.noShow],
        ];
        break;
      }

      case 'compliance': {
        const complianceStats = await getExerciseCompliance(organizationId);
        headers = ['Metrikk', 'Verdi'];
        data = [
          ['Totalt foreskrivninger', complianceStats.totalPrescriptions],
          ['Fullforte', complianceStats.completed],
          ['Aktive', complianceStats.active],
          ['Pa pause', complianceStats.paused],
          ['Avbrutt', complianceStats.cancelled],
          ['Fullforingsrate (%)', complianceStats.completionRate],
          ['Gjennomsnittlig fremgang (%)', complianceStats.avgProgressRate],
        ];
        break;
      }

      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...data.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  } catch (error) {
    logger.error('Error exporting analytics CSV:', error);
    throw error;
  }
};

export default {
  getPatientStats,
  getAppointmentStats,
  getRevenueStats,
  getTopExercises,
  getExerciseCompliance,
  getPatientVolumeTrends,
  getDashboardAnalytics,
  exportAnalyticsCSV,
};
