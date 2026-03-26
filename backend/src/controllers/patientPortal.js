/**
 * Patient Portal Controller
 * HTTP request handling for patient self-service portal endpoints
 */

import * as patientPortalService from '../services/patientPortal.js';
import { logAction } from '../services/auditLog.js';
import logger from '../utils/logger.js';

/**
 * POST /patient-portal/auth/pin
 * Authenticate patient with PIN
 */
export const authenticateWithPIN = async (req, res) => {
  try {
    const { pin, patientId, dateOfBirth } = req.body;

    const result = await patientPortalService.authenticateWithPIN(
      pin,
      patientId,
      dateOfBirth,
      req.ip
    );

    if (result.error === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (result.error === 'INVALID_PIN') {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    if (result.error === 'INVALID_PIN_FORMAT') {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    res.cookie('portal_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      token: result.token,
      patient: result.patient,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error.message?.includes('column "portal_pin_hash" does not exist')) {
      return res.status(503).json({
        error: 'Portal not yet configured',
        message: 'Portal PIN column needs to be added to patients table',
      });
    }
    logger.error('Portal PIN auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * GET /patient-portal/profile
 * Get patient's own profile
 */
export const getProfile = async (req, res) => {
  try {
    const profile = patientPortalService.getProfile(req.portalPatient);
    res.json(profile);
  } catch (error) {
    logger.error('Error getting portal profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * GET /patient-portal/appointments
 * Get patient's upcoming appointments
 */
export const getAppointments = async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const appointments = await patientPortalService.getAppointments(patient_id, organization_id);

    await logAction('portal.appointments.read', patient_id, {
      resourceType: 'portal_appointments',
      resourceId: patient_id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, count: appointments.length },
    });

    res.json({ appointments });
  } catch (error) {
    logger.error('Error getting portal appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
};

/**
 * GET /patient-portal/exercises
 * Get patient's active exercise prescriptions
 */
export const getExercises = async (req, res) => {
  try {
    const { patient_id } = req.portalPatient;
    const exercises = await patientPortalService.getExercises(patient_id);
    res.json({ exercises });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ exercises: [] });
    }
    logger.error('Error getting portal exercises:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
};

/**
 * POST /patient-portal/exercises/:id/compliance
 * Log exercise compliance
 */
export const logExerciseCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, organization_id } = req.portalPatient;

    const entry = await patientPortalService.logExerciseCompliance(id, patient_id, req.body);

    await logAction('portal.exercise.compliance.create', patient_id, {
      resourceType: 'exercise_compliance',
      resourceId: id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, prescriptionId: id },
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Exercise compliance tracking not yet configured' });
    }
    logger.error('Error logging compliance:', error);
    res.status(500).json({ error: 'Failed to log compliance' });
  }
};

/**
 * GET /patient-portal/available-slots
 * Get available appointment slots for a date
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, practitioner_id } = req.query;
    const { organization_id } = req.portalPatient;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const slots = await patientPortalService.getAvailableSlots(
      organization_id,
      date,
      practitioner_id
    );
    res.json({ slots });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Booking system not yet configured' });
    }
    logger.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

/**
 * POST /patient-portal/appointments/request
 * Patient requests a new appointment
 */
export const requestBooking = async (req, res) => {
  try {
    const { patient_id, organization_id, first_name, last_name } = req.portalPatient;
    const patientName = `${first_name} ${last_name}`;

    const result = await patientPortalService.requestBooking(
      patient_id,
      organization_id,
      patientName,
      req.body
    );

    await logAction('portal.booking.create', patient_id, {
      resourceType: 'booking_request',
      resourceId: result.id,
      ipAddress: req.ip,
      metadata: {
        organizationId: organization_id,
        preferredDate: req.body.preferredDate,
        preferredTime: req.body.preferredTime,
      },
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Booking system not yet configured' });
    }
    logger.error('Error creating booking request:', error);
    res.status(500).json({ error: 'Failed to create booking request' });
  }
};

/**
 * PATCH /patient-portal/appointments/:id/reschedule
 * Patient requests to reschedule an appointment
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, organization_id, first_name, last_name } = req.portalPatient;
    const patientName = `${first_name} ${last_name}`;

    const result = await patientPortalService.rescheduleAppointment(
      patient_id,
      organization_id,
      id,
      patientName,
      req.body
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await logAction('portal.appointment.reschedule', patient_id, {
      resourceType: 'appointment',
      resourceId: id,
      ipAddress: req.ip,
      metadata: {
        organizationId: organization_id,
        preferredDate: req.body.preferredDate,
        preferredTime: req.body.preferredTime,
      },
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Booking system not yet configured' });
    }
    logger.error('Error creating reschedule request:', error);
    res.status(500).json({ error: 'Failed to create reschedule request' });
  }
};

/**
 * POST /patient-portal/appointments/:id/cancel
 * Patient cancels an appointment
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, organization_id, first_name, last_name } = req.portalPatient;
    const patientName = `${first_name} ${last_name}`;
    const { reason } = req.body;

    const result = await patientPortalService.cancelAppointment(
      patient_id,
      organization_id,
      id,
      patientName,
      reason
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (result.error === 'ALREADY_CANCELLED') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    await logAction('portal.appointment.cancel', patient_id, {
      resourceType: 'appointment',
      resourceId: id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, reason },
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Appointment system not yet configured' });
    }
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

/**
 * GET /patient-portal/messages
 * Get patient's messages with pagination
 */
export const getMessages = async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await patientPortalService.getMessages(patient_id, organization_id, page, limit);

    await logAction('portal.messages.read', patient_id, {
      resourceType: 'portal_messages',
      resourceId: patient_id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, page, limit },
    });

    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({
        messages: [],
        unread_count: 0,
        pagination: { page: 1, limit: 20, total: 0 },
      });
    }
    logger.error('Error getting portal messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * POST /patient-portal/messages
 * Patient sends a new message
 */
export const sendMessage = async (req, res) => {
  try {
    const { patient_id, organization_id, first_name, last_name } = req.portalPatient;
    const patientName = `${first_name} ${last_name}`;

    const message = await patientPortalService.sendMessage(
      patient_id,
      organization_id,
      patientName,
      req.body
    );

    await logAction('portal.message.create', patient_id, {
      resourceType: 'portal_message',
      resourceId: message.id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, subject: req.body.subject },
    });

    res.status(201).json(message);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Messaging not yet configured' });
    }
    logger.error('Error sending portal message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * PATCH /patient-portal/messages/:id/read
 * Mark a message as read
 */
export const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, organization_id } = req.portalPatient;

    await patientPortalService.markMessageRead(id, patient_id, organization_id);

    await logAction('portal.message.read', patient_id, {
      resourceType: 'portal_message',
      resourceId: id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ success: true });
    }
    logger.error('Error marking message read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

/**
 * GET /patient-portal/documents
 * Get patient's documents
 */
export const getDocuments = async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const documents = await patientPortalService.getDocuments(patient_id, organization_id);

    await logAction('portal.documents.read', patient_id, {
      resourceType: 'portal_documents',
      resourceId: patient_id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id, count: documents.length },
    });

    res.json({ documents });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ documents: [] });
    }
    logger.error('Error getting portal documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

/**
 * GET /patient-portal/documents/:token/download
 * Download a document by token (no portal auth required)
 */
export const downloadDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await patientPortalService.downloadDocument(token);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (result.error === 'EXPIRED') {
      return res.status(410).json({ error: 'Download link has expired' });
    }

    await logAction('DOCUMENT_DOWNLOAD', null, {
      resourceType: 'portal_document',
      resourceId: result.documentId,
      ipAddress: req.ip,
      metadata: { organizationId: result.organizationId, method: 'token_download' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Error downloading portal document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

/**
 * GET /patient-portal/communication-preferences
 * Get patient's communication preferences
 */
export const getCommPreferences = async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const prefs = await patientPortalService.getCommPreferences(patient_id);

    await logAction('portal.comm_preferences.read', patient_id, {
      resourceType: 'comm_preferences',
      resourceId: patient_id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id },
    });

    res.json(prefs);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json(patientPortalService.DEFAULT_COMM_PREFERENCES);
    }
    logger.error('Error getting communication preferences:', error);
    res.status(500).json({ error: 'Failed to get communication preferences' });
  }
};

/**
 * PUT /patient-portal/communication-preferences
 * Update patient's communication preferences
 */
export const updateCommPreferences = async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const prefs = await patientPortalService.updateCommPreferences(
      patient_id,
      organization_id,
      req.body
    );

    await logAction('portal.comm_preferences.update', patient_id, {
      resourceType: 'comm_preferences',
      resourceId: patient_id,
      ipAddress: req.ip,
      metadata: { organizationId: organization_id },
    });

    res.json(prefs);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Communication preferences not yet configured' });
    }
    logger.error('Error updating communication preferences:', error);
    res.status(500).json({ error: 'Failed to update communication preferences' });
  }
};

/**
 * POST /patient-portal/logout
 * Invalidate portal session
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.portal_session || req.headers['x-portal-token'];
    await patientPortalService.logout(token);
    res.clearCookie('portal_session');
    res.json({ success: true });
  } catch (error) {
    logger.error('Portal logout error:', error);
    res.clearCookie('portal_session');
    res.json({ success: true });
  }
};
