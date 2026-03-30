/**
 * Portal Controller
 * HTTP handlers for staff-facing patient portal endpoints.
 * Extracts request data, delegates to portalService, returns responses.
 */

import * as portalService from '../services/practice/portal.js';
import { logAudit } from '../utils/audit.js';
import { logAction, ACTION_TYPES } from '../services/practice/auditLog.js';
import logger from '../utils/logger.js';

/**
 * GET /portal/patient/:patientId
 * Get patient portal dashboard data
 */
export const getPatientDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await portalService.getPatientDashboard(req.organizationId, patientId);

    if (!result) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'patient',
      resourceId: patientId,
      metadata: { endpoint: 'portal_dashboard', organizationId: req.organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting portal patient data:', error);
    res.status(500).json({ error: 'Failed to get patient portal data' });
  }
};

/**
 * GET /portal/patient/:patientId/appointments
 * Get patient appointment history
 */
export const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const upcomingOnly = req.query.upcoming === 'true';

    const appointments = await portalService.getPatientAppointments(
      req.organizationId,
      patientId,
      upcomingOnly
    );

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'patient',
      resourceId: patientId,
      metadata: {
        endpoint: 'portal_appointments',
        upcomingOnly,
        organizationId: req.organizationId,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ appointments });
  } catch (error) {
    logger.error('Error getting portal patient appointments:', error);
    res.status(500).json({ error: 'Failed to get patient appointments' });
  }
};

/**
 * POST /portal/patient/:patientId/appointments
 * Create an appointment on behalf of a patient
 */
export const createPatientAppointment = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { appointment_date, appointment_time } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'appointment_date and appointment_time are required' });
    }

    const appointment = await portalService.createPatientAppointment(
      req.organizationId,
      patientId,
      req.body,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CREATE',
      resourceType: 'APPOINTMENT',
      resourceId: appointment.id,
      details: { patientId, source: 'portal' },
    });

    res.status(201).json(appointment);
  } catch (error) {
    logger.error('Error creating portal appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

/**
 * GET /portal/patient/:patientId/exercises
 * Get patient's active exercise prescriptions
 */
export const getPatientExercises = async (req, res) => {
  try {
    const { patientId } = req.params;

    const exercises = await portalService.getPatientExercises(req.organizationId, patientId);

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'patient',
      resourceId: patientId,
      metadata: { endpoint: 'portal_exercises', organizationId: req.organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ exercises });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ exercises: [] });
    }
    logger.error('Error getting portal patient exercises:', error);
    res.status(500).json({ error: 'Failed to get patient exercises' });
  }
};

/**
 * GET /portal/patient/:patientId/outcomes
 * Get patient outcome questionnaire results
 */
export const getPatientOutcomes = async (req, res) => {
  try {
    const { patientId } = req.params;

    const outcomes = await portalService.getPatientOutcomes(req.organizationId, patientId);

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'patient',
      resourceId: patientId,
      metadata: { endpoint: 'portal_outcomes', organizationId: req.organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ outcomes });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ outcomes: [] });
    }
    logger.error('Error getting portal patient outcomes:', error);
    res.status(500).json({ error: 'Failed to get patient outcomes' });
  }
};

/**
 * POST /portal/auth/magic-link
 * Generate a magic link for patient portal access
 */
export const generateMagicLink = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    const result = await portalService.generateMagicLink(req.organizationId, patientId, req.ip);

    if (!result) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CREATE',
      resourceType: 'MAGIC_LINK',
      resourceId: patientId,
      details: { source: 'portal' },
    });

    res.json(result);
  } catch (error) {
    logger.error('Error generating magic link:', error);
    res.status(500).json({ error: 'Failed to generate magic link' });
  }
};

/**
 * POST /portal/patient/:patientId/portal-access
 * Enable or reset portal access for a patient (set PIN)
 */
export const setPortalAccess = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { pin } = req.body;

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    const result = await portalService.setPortalAccess(req.organizationId, patientId, pin);

    if (result === null) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'UPDATE',
      resourceType: 'PORTAL_ACCESS',
      resourceId: patientId,
      details: { action: 'set_pin' },
    });

    res.json({ success: true, message: 'Portal access enabled' });
  } catch (error) {
    if (error.message?.includes('column "portal_pin_hash" does not exist')) {
      return res.status(503).json({ error: 'Portal not yet configured - run migration 030' });
    }
    logger.error('Error setting portal access:', error);
    res.status(500).json({ error: 'Failed to set portal access' });
  }
};

/**
 * GET /portal/booking-requests
 * List booking requests for the organization
 */
export const listBookingRequests = async (req, res) => {
  try {
    const result = await portalService.listBookingRequests(req.organizationId, req.query);

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'booking_request',
      resourceId: null,
      metadata: {
        endpoint: 'portal_booking_requests',
        organizationId: req.organizationId,
        filters: req.query,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ requests: [], pagination: { page: 1, limit: 20, total: 0 } });
    }
    logger.error('Error getting booking requests:', error);
    res.status(500).json({ error: 'Failed to get booking requests' });
  }
};

/**
 * PATCH /portal/booking-requests/:id
 * Approve or reject a booking request
 */
export const handleBookingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, appointment_date, appointment_time, duration, visit_type } = req.body;

    const result = await portalService.handleBookingRequest(req.organizationId, id, action, {
      appointment_date,
      appointment_time,
      duration,
      visit_type,
      userId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      resourceType: 'BOOKING_REQUEST',
      resourceId: id,
      details: { status: result.status },
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Booking system not yet configured' });
    }
    logger.error('Error handling booking request:', error);
    res.status(500).json({ error: 'Failed to handle booking request' });
  }
};

/**
 * GET /portal/booking-requests/count
 * Get count of pending booking requests
 */
export const getBookingRequestCount = async (req, res) => {
  try {
    const pending = await portalService.getBookingRequestCount(req.organizationId);
    res.json({ pending });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ pending: 0 });
    }
    logger.error('Error getting booking request count:', error);
    res.status(500).json({ error: 'Failed to get booking request count' });
  }
};

/**
 * GET /portal/patient/:patientId/messages
 * Staff retrieves messages for a patient
 */
export const getPatientMessages = async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await portalService.getPatientMessages(req.organizationId, patientId, req.query);

    if (!result) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAction(ACTION_TYPES.PATIENT_READ, req.user?.id, {
      resourceType: 'patient',
      resourceId: patientId,
      metadata: { endpoint: 'portal_messages', organizationId: req.organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ messages: [], pagination: { page: 1, limit: 50, total: 0 } });
    }
    logger.error('Error getting patient messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * POST /portal/patient/:patientId/messages
 * Staff sends a message to a patient
 */
export const sendPatientMessage = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { body: msgBody } = req.body;

    if (!msgBody) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    const message = await portalService.sendPatientMessage(
      req.organizationId,
      patientId,
      req.body,
      req.user.id
    );

    if (!message) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await logAudit({
      organizationId: req.organizationId,
      userId: req.userId,
      action: 'CREATE',
      resourceType: 'PATIENT_MESSAGE',
      resourceId: message.id,
      details: { patientId, source: 'portal' },
    });

    res.status(201).json(message);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Messaging not yet configured' });
    }
    logger.error('Error sending patient message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
