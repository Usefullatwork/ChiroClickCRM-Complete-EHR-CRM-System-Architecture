/**
 * Dashboard Controller
 * Provides aggregated stats and quick access data for the main dashboard
 */

import { query } from '../db/index.js';
import logger from '../utils/logger.js';

/**
 * Get dashboard statistics
 * Returns today's appointments count, active patients, pending follow-ups, and month revenue
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

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
    const pendingFollowUpsResult = await query(
      `SELECT COUNT(*) as count
       FROM followups
       WHERE organization_id = $1
         AND status = 'PENDING'
         AND due_date <= CURRENT_DATE + INTERVAL '7 days'`,
      [organizationId]
    );

    // Get month revenue
    const monthRevenueResult = await query(
      `SELECT COALESCE(SUM(paid_amount), 0) as revenue
       FROM financial_transactions
       WHERE organization_id = $1
         AND payment_status = 'PAID'
         AND created_at >= $2`,
      [organizationId, firstDayOfMonth]
    );

    const stats = {
      todayAppointments: parseInt(todayAppointmentsResult.rows[0].count),
      activePatients: parseInt(activePatientsResult.rows[0].count),
      pendingFollowUps: parseInt(pendingFollowUpsResult.rows[0].count),
      monthRevenue: parseFloat(monthRevenueResult.rows[0].revenue)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
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
         a.duration_minutes,
         a.appointment_type,
         a.status,
         a.notes,
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
        appointments: result.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching today appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s appointments'
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
         f.type,
         f.due_date,
         f.priority,
         f.notes,
         p.first_name || ' ' || p.last_name as patient_name,
         p.phone
       FROM followups f
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
        tasks: result.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching pending tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending tasks'
    });
  }
};
