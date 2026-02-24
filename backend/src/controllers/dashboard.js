/**
 * Dashboard Controller
 * Provides aggregated stats and quick access data for the main dashboard
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get dashboard statistics
 * Returns today's appointments count, active patients, pending follow-ups, and month revenue
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { organizationId, _userId } = req;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // Get today's appointments count
    const todayAppointmentsResult = await query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE organization_id = $1
         AND DATE(start_time) = $2
         AND status NOT IN ('CANCELLED', 'NO_SHOW')`,
      [organizationId, today]
    );

    // Get active patients count
    const activePatientsResult = await query(
      `SELECT COUNT(*) as count
       FROM patients
       WHERE organization_id = $1
         AND status = 'ACTIVE'`,
      [organizationId]
    );

    // Get pending follow-ups count
    let pendingFollowUpsResult;
    try {
      pendingFollowUpsResult = await query(
        `SELECT COUNT(*) as count
         FROM follow_ups
         WHERE organization_id = $1
           AND status = 'PENDING'
           AND due_date <= CURRENT_DATE + INTERVAL '7 days'`,
        [organizationId]
      );
    } catch (e) {
      pendingFollowUpsResult = { rows: [{ count: 0 }] };
    }

    // Get month revenue
    let monthRevenueResult;
    try {
      monthRevenueResult = await query(
        `SELECT COALESCE(SUM(patient_amount), 0) as revenue
         FROM financial_metrics
         WHERE organization_id = $1
           AND payment_status = 'PAID'
           AND created_at >= $2`,
        [organizationId, firstDayOfMonth]
      );
    } catch (e) {
      monthRevenueResult = { rows: [{ revenue: 0 }] };
    }

    const stats = {
      todayAppointments: parseInt(todayAppointmentsResult.rows[0].count),
      activePatients: parseInt(activePatientsResult.rows[0].count),
      pendingFollowUps: parseInt(pendingFollowUpsResult.rows[0].count),
      monthRevenue: parseFloat(monthRevenueResult.rows[0].revenue),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get today's appointments
 * Returns list of appointments for today with patient details
 */
export const getTodayAppointments = async (req, res) => {
  try {
    const { organizationId } = req;
    const today = new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
         a.id,
         a.patient_id,
         a.start_time,
         a.end_time,
         EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60 as duration_minutes,
         a.appointment_type,
         a.status,
         a.internal_notes as notes,
         a.cancellation_reason,
         p.first_name || ' ' || p.last_name as patient_name,
         p.phone,
         p.email
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.organization_id = $1
         AND DATE(a.start_time) = $2
       ORDER BY a.start_time ASC`,
      [organizationId, today]
    );

    res.json({
      success: true,
      data: {
        date: today,
        count: result.rows.length,
        appointments: result.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching today appointments:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's appointments",
    });
  }
};

/**
 * Get pending tasks
 * Returns upcoming follow-ups and other pending items
 */
export const getPendingTasks = async (req, res) => {
  try {
    const { organizationId } = req;

    const result = await query(
      `SELECT
         f.id,
         f.patient_id,
         f.follow_up_type as type,
         f.due_date,
         f.priority,
         f.notes,
         p.first_name || ' ' || p.last_name as patient_name,
         p.phone
       FROM follow_ups f
       JOIN patients p ON f.patient_id = p.id
       WHERE f.organization_id = $1
         AND f.status = 'PENDING'
         AND f.due_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY f.due_date ASC, f.priority DESC
       LIMIT 10`,
      [organizationId]
    );

    res.json({
      success: true,
      data: {
        count: result.rows.length,
        tasks: result.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching pending tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending tasks',
    });
  }
};

/**
 * Get revenue trend over time
 * Returns revenue by day/week/month for a given period
 */
export const getRevenueTrend = async (req, res) => {
  try {
    const { organizationId } = req;
    const { period = '30', groupBy = 'day' } = req.query;
    const days = Math.min(parseInt(period) || 30, 365);

    let dateFormat;
    let dateTrunc;
    if (groupBy === 'month') {
      dateFormat = 'YYYY-MM';
      dateTrunc = 'month';
    } else if (groupBy === 'week') {
      dateFormat = 'IYYY-IW';
      dateTrunc = 'week';
    } else {
      dateFormat = 'YYYY-MM-DD';
      dateTrunc = 'day';
    }

    let result;
    try {
      result = await query(
        `SELECT
           TO_CHAR(DATE_TRUNC($3, created_at), $4) as date,
           COALESCE(SUM(patient_amount), 0)::numeric as amount,
           COUNT(*)::int as count
         FROM financial_metrics
         WHERE organization_id = $1
           AND payment_status = 'PAID'
           AND created_at >= CURRENT_DATE - ($2 || ' days')::interval
         GROUP BY DATE_TRUNC($3, created_at)
         ORDER BY DATE_TRUNC($3, created_at) ASC`,
        [organizationId, String(days), dateTrunc, dateFormat]
      );
    } catch (e) {
      // Fallback: try appointments table if financial_metrics doesn't exist
      result = await query(
        `SELECT
           TO_CHAR(DATE_TRUNC($3, start_time), $4) as date,
           COUNT(*)::int as amount,
           COUNT(*)::int as count
         FROM appointments
         WHERE organization_id = $1
           AND status = 'COMPLETED'
           AND start_time >= CURRENT_DATE - ($2 || ' days')::interval
         GROUP BY DATE_TRUNC($3, start_time)
         ORDER BY DATE_TRUNC($3, start_time) ASC`,
        [organizationId, String(days), dateTrunc, dateFormat]
      );
    }

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        date: r.date,
        amount: parseFloat(r.amount),
        count: parseInt(r.count),
      })),
    });
  } catch (error) {
    logger.error('Error fetching revenue trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trend',
    });
  }
};

/**
 * Get practitioner utilization heatmap data
 * Returns appointment counts by hour-of-day and day-of-week
 */
export const getUtilization = async (req, res) => {
  try {
    const { organizationId } = req;
    const { period = '30' } = req.query;
    const days = Math.min(parseInt(period) || 30, 365);

    const result = await query(
      `SELECT
         EXTRACT(HOUR FROM start_time)::int as hour,
         EXTRACT(DOW FROM start_time)::int as day_of_week,
         COUNT(*)::int as count
       FROM appointments
       WHERE organization_id = $1
         AND start_time >= CURRENT_DATE - ($2 || ' days')::interval
         AND status NOT IN ('CANCELLED')
       GROUP BY EXTRACT(HOUR FROM start_time), EXTRACT(DOW FROM start_time)
       ORDER BY day_of_week, hour`,
      [organizationId, String(days)]
    );

    // Calculate capacity (assume 8 slots per hour, 5 days a week)
    const weeksInPeriod = Math.max(1, Math.ceil(days / 7));
    const slotsPerHourPerWeek = 1; // 1 practitioner per slot

    const heatmap = result.rows.map((r) => ({
      hour: r.hour,
      dayOfWeek: r.day_of_week,
      count: r.count,
      capacity: slotsPerHourPerWeek * weeksInPeriod,
      utilization: Math.min(
        100,
        Math.round((r.count / (slotsPerHourPerWeek * weeksInPeriod)) * 100)
      ),
    }));

    res.json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    logger.error('Error fetching utilization data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilization data',
    });
  }
};

/**
 * Get no-show trend over time
 * Returns no-show rate grouped by week/month
 */
export const getNoShowTrend = async (req, res) => {
  try {
    const { organizationId } = req;
    const { period = '90', groupBy = 'week' } = req.query;
    const days = Math.min(parseInt(period) || 90, 365);

    const dateTrunc = groupBy === 'month' ? 'month' : 'week';
    const dateFormat = groupBy === 'month' ? 'YYYY-MM' : 'IYYY-IW';

    const result = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC($3, start_time), $4) as period,
         COUNT(*)::int as total_appointments,
         COUNT(*) FILTER (WHERE status = 'NO_SHOW')::int as no_shows,
         CASE
           WHEN COUNT(*) > 0 THEN
             ROUND(COUNT(*) FILTER (WHERE status = 'NO_SHOW')::numeric / COUNT(*)::numeric * 100, 1)
           ELSE 0
         END as rate
       FROM appointments
       WHERE organization_id = $1
         AND start_time >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY DATE_TRUNC($3, start_time)
       ORDER BY DATE_TRUNC($3, start_time) ASC`,
      [organizationId, String(days), dateTrunc, dateFormat]
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        period: r.period,
        totalAppointments: r.total_appointments,
        noShows: r.no_shows,
        rate: parseFloat(r.rate),
      })),
    });
  } catch (error) {
    logger.error('Error fetching no-show trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch no-show trend',
    });
  }
};

/**
 * Get patient flow over time (new vs returning)
 * Returns new and returning patient counts per period
 */
export const getPatientFlow = async (req, res) => {
  try {
    const { organizationId } = req;
    const { period = '90', groupBy = 'week' } = req.query;
    const days = Math.min(parseInt(period) || 90, 365);

    const dateTrunc = groupBy === 'month' ? 'month' : 'week';
    const dateFormat = groupBy === 'month' ? 'YYYY-MM' : 'IYYY-IW';

    // Get new patients by their created_at date
    const newPatientsResult = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC($3, created_at), $4) as period,
         COUNT(*)::int as new_patients
       FROM patients
       WHERE organization_id = $1
         AND created_at >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY DATE_TRUNC($3, created_at)
       ORDER BY DATE_TRUNC($3, created_at) ASC`,
      [organizationId, String(days), dateTrunc, dateFormat]
    );

    // Get total visits per period
    const visitsResult = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC($3, a.start_time), $4) as period,
         COUNT(*)::int as total_visits,
         COUNT(DISTINCT a.patient_id)::int as unique_patients
       FROM appointments a
       WHERE a.organization_id = $1
         AND a.start_time >= CURRENT_DATE - ($2 || ' days')::interval
         AND a.status IN ('COMPLETED', 'CONFIRMED', 'CHECKED_IN')
       GROUP BY DATE_TRUNC($3, a.start_time)
       ORDER BY DATE_TRUNC($3, a.start_time) ASC`,
      [organizationId, String(days), dateTrunc, dateFormat]
    );

    // Merge the two datasets
    const newPatientsMap = {};
    for (const row of newPatientsResult.rows) {
      newPatientsMap[row.period] = row.new_patients;
    }

    const data = visitsResult.rows.map((row) => ({
      period: row.period,
      newPatients: newPatientsMap[row.period] || 0,
      returningPatients: row.unique_patients - (newPatientsMap[row.period] || 0),
      totalVisits: row.total_visits,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching patient flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient flow',
    });
  }
};
