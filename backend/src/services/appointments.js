/**
 * Appointments Service
 * Scheduling and appointment management
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all appointments
 */
export const getAllAppointments = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    startDate = null,
    endDate = null,
    practitionerId = null,
    patientId = null,
    status = null
  } = options;

  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE a.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND a.start_time >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND a.start_time <= $${paramIndex}`;
      paramIndex++;
    }

    if (practitionerId) {
      params.push(practitionerId);
      whereClause += ` AND a.practitioner_id = $${paramIndex}`;
      paramIndex++;
    }

    if (patientId) {
      params.push(patientId);
      whereClause += ` AND a.patient_id = $${paramIndex}`;
      paramIndex++;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND a.status = $${paramIndex}`;
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM appointments a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT
        a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.phone as patient_phone,
        u.first_name || ' ' || u.last_name as practitioner_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN users u ON u.id = a.practitioner_id
      ${whereClause}
      ORDER BY a.start_time ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      appointments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting appointments:', error);
    throw error;
  }
};

/**
 * Create appointment
 */
export const createAppointment = async (organizationId, appointmentData) => {
  try {
    const result = await query(
      `INSERT INTO appointments (
        organization_id,
        patient_id,
        practitioner_id,
        start_time,
        end_time,
        appointment_type,
        status,
        recurring_pattern,
        recurring_end_date,
        patient_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        organizationId,
        appointmentData.patient_id,
        appointmentData.practitioner_id,
        appointmentData.start_time,
        appointmentData.end_time,
        appointmentData.appointment_type,
        'SCHEDULED',
        appointmentData.recurring_pattern || null,
        appointmentData.recurring_end_date || null,
        appointmentData.patient_notes || null
      ]
    );

    logger.info('Appointment created:', {
      organizationId,
      appointmentId: result.rows[0].id
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (organizationId, appointmentId, status, userId) => {
  try {
    const result = await query(
      `UPDATE appointments
       SET status = $3, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, appointmentId, status]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Appointment status updated:', {
      organizationId,
      appointmentId,
      status
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * Get appointment statistics
 */
export const getAppointmentStats = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
        COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) as confirmed
      FROM appointments
      WHERE organization_id = $1
        AND start_time BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting appointment stats:', error);
    throw error;
  }
};

export default {
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
  getAppointmentStats
};
