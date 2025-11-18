/**
 * Appointments Controller
 */

import * as appointmentService from '../services/appointments.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getAppointments = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      practitionerId: req.query.practitionerId,
      patientId: req.query.patientId,
      status: req.query.status
    };

    const result = await appointmentService.getAllAppointments(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getAppointments controller:', error);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const appointment = await appointmentService.createAppointment(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'APPOINTMENT',
      resourceId: appointment.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(appointment);
  } catch (error) {
    logger.error('Error in createAppointment controller:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await appointmentService.updateAppointmentStatus(
      organizationId,
      id,
      status,
      user.id
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'APPOINTMENT',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(appointment);
  } catch (error) {
    logger.error('Error in updateStatus controller:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
};

export const getStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;
    const stats = await appointmentService.getAppointmentStats(organizationId, startDate, endDate);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getStats controller:', error);
    res.status(500).json({ error: 'Failed to get appointment statistics' });
  }
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await appointmentService.cancelAppointment(
      organizationId,
      id,
      reason || 'No reason provided',
      userId
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error('Error in cancelAppointment controller:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

export default {
  getAppointments,
  createAppointment,
  updateStatus,
  cancelAppointment,
  getStats
};
