/**
 * Patient Portal Service
 * Business logic and database queries for patient self-service portal
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { generatePdf } from './documentDelivery.js';
import { broadcastToOrg } from './websocket.js';
import { notifyByRole, NOTIFICATION_TYPES } from './notifications.js';

export const DEFAULT_COMM_PREFERENCES = {
  sms_enabled: true,
  email_enabled: true,
  reminder_enabled: true,
  exercise_reminder_enabled: true,
  recall_enabled: true,
  marketing_enabled: false,
};

/** Authenticate a patient using PIN + patientId or dateOfBirth. */
export const authenticateWithPIN = async (pin, patientId, dateOfBirth, ipAddress) => {
  let patientResult;
  if (patientId) {
    patientResult = await query(
      `SELECT id, first_name, last_name, email, phone, date_of_birth, organization_id, portal_pin_hash
       FROM patients WHERE id = $1`,
      [patientId]
    );
  } else {
    patientResult = await query(
      `SELECT id, first_name, last_name, email, phone, date_of_birth, organization_id, portal_pin_hash
       FROM patients WHERE date_of_birth = $1`,
      [dateOfBirth]
    );
  }

  if (patientResult.rows.length === 0) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  const patient = patientResult.rows[0];

  // Verify PIN (hash comparison)
  const pinHash = crypto
    .createHash('sha256')
    .update(pin + patient.id)
    .digest('hex');

  if (patient.portal_pin_hash && patient.portal_pin_hash !== pinHash) {
    return { error: 'INVALID_PIN' };
  }

  // If no PIN set yet, accept any 4-digit PIN for first-time setup and save it
  if (!patient.portal_pin_hash) {
    if (!/^\d{4}$/.test(pin)) {
      return { error: 'INVALID_PIN_FORMAT' };
    }
    await query('UPDATE patients SET portal_pin_hash = $1 WHERE id = $2', [pinHash, patient.id]);
  }

  // Create portal session
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    await query(
      `INSERT INTO portal_sessions (patient_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [patient.id, token, expiresAt, ipAddress]
    );
  } catch (tableError) {
    // If table doesn't exist, still return token (stateless mode)
    if (!tableError.message?.includes('relation "portal_sessions" does not exist')) {
      throw tableError;
    }
  }

  return {
    token,
    patient: {
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
    },
    expiresAt,
  };
};

/** Get patient profile data (already loaded by middleware). */
export const getProfile = (portalPatient) => {
  return {
    id: portalPatient.patient_id,
    firstName: portalPatient.first_name,
    lastName: portalPatient.last_name,
    email: portalPatient.email,
    phone: portalPatient.phone,
    dateOfBirth: portalPatient.date_of_birth,
  };
};

/** Get upcoming appointments for a patient. */
export const getAppointments = async (patientId, organizationId) => {
  const result = await query(
    `SELECT id, appointment_date, appointment_time, duration, visit_type, status, notes
     FROM appointments
     WHERE patient_id = $1 AND organization_id = $2
     AND appointment_date >= CURRENT_DATE
     AND status NOT IN ('cancelled', 'no_show')
     ORDER BY appointment_date ASC, appointment_time ASC`,
    [patientId, organizationId]
  );

  return result.rows;
};

/** Get active exercise prescriptions for a patient. */
export const getExercises = async (patientId) => {
  const result = await query(
    `SELECT
       pep.id, pep.exercise_id, pep.sets, pep.reps, pep.hold_seconds,
       pep.frequency, pep.instructions, pep.status, pep.start_date, pep.end_date,
       el.name, el.name_no, el.description, el.description_no,
       el.category, el.body_region, el.difficulty, el.video_url, el.image_url
     FROM patient_exercise_prescriptions pep
     JOIN exercise_library el ON el.id = pep.exercise_id
     WHERE pep.patient_id = $1 AND pep.status = 'active'
     ORDER BY pep.created_at DESC`,
    [patientId]
  );

  return result.rows;
};

/** Log exercise compliance for a prescription. */
export const logExerciseCompliance = async (prescriptionId, patientId, data) => {
  const { completed, pain_level, difficulty_rating, notes } = data;

  const result = await query(
    `INSERT INTO exercise_compliance_logs (
       prescription_id, patient_id, completed, pain_level, difficulty_rating, notes, logged_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [prescriptionId, patientId, completed !== false, pain_level, difficulty_rating, notes]
  );

  return result.rows[0];
};

/** Get available appointment slots for a given date. */
export const getAvailableSlots = async (organizationId, date, practitionerId) => {
  let existingQuery = `
    SELECT appointment_time, duration
    FROM appointments
    WHERE organization_id = $1
      AND appointment_date = $2
      AND status NOT IN ('cancelled', 'no_show')
  `;
  const params = [organizationId, date];

  if (practitionerId) {
    existingQuery += ' AND practitioner_id = $3';
    params.push(practitionerId);
  }

  const existing = await query(existingQuery, params);

  // Generate 30-min slots from 08:00 to 17:00
  const bookedTimes = new Set(existing.rows.map((r) => r.appointment_time?.substring(0, 5)));
  const slots = [];
  for (let hour = 8; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push({ time, available: !bookedTimes.has(time) });
    }
  }

  return slots;
};

/** Create a booking request from the patient portal. */
export const requestBooking = async (patientId, organizationId, patientName, bookingData) => {
  const { preferredDate, preferredTime, reason } = bookingData;

  const result = await query(
    `INSERT INTO portal_booking_requests
       (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [patientId, organizationId, preferredDate, preferredTime || null, reason || null]
  );

  const request = result.rows[0];

  // Notify staff via WebSocket
  try {
    broadcastToOrg(organizationId, 'booking:new-request', {
      id: request.id,
      patientName,
      preferredDate,
      preferredTime,
    });
  } catch (wsErr) {
    logger.debug('WebSocket broadcast failed:', wsErr.message);
  }

  // Create in-app notifications for staff
  try {
    await notifyByRole(organizationId, ['ADMIN', 'PRACTITIONER'], {
      type: NOTIFICATION_TYPES.BOOKING_REQUEST,
      title: 'Ny timeforespørsel',
      message: `${patientName} ønsker time ${preferredDate}`,
    });
  } catch (notifErr) {
    logger.debug('Staff notification failed:', notifErr.message);
  }

  return { id: request.id, status: 'PENDING' };
};

/** Create a reschedule request for an existing appointment. */
export const rescheduleAppointment = async (
  patientId,
  organizationId,
  appointmentId,
  patientName,
  data
) => {
  const { preferredDate, preferredTime, reason } = data;

  // Verify appointment belongs to this patient's org
  const apptResult = await query(
    `SELECT id FROM appointments
     WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
    [appointmentId, patientId, organizationId]
  );

  if (apptResult.rows.length === 0) {
    return { error: 'NOT_FOUND' };
  }

  // Create a new booking request referencing the original appointment
  const result = await query(
    `INSERT INTO portal_booking_requests
       (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status, original_appointment_id)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
     RETURNING *`,
    [patientId, organizationId, preferredDate, preferredTime || null, reason || null, appointmentId]
  );

  const request = result.rows[0];

  try {
    broadcastToOrg(organizationId, 'booking:reschedule-request', {
      id: request.id,
      originalAppointmentId: appointmentId,
      patientName,
      preferredDate,
    });
  } catch (wsErr) {
    logger.debug('WebSocket broadcast failed:', wsErr.message);
  }

  return { id: request.id, status: 'PENDING' };
};

/** Cancel a patient appointment. */
export const cancelAppointment = async (
  patientId,
  organizationId,
  appointmentId,
  patientName,
  reason
) => {
  // Verify appointment belongs to this patient
  const apptResult = await query(
    `SELECT id, status FROM appointments
     WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
    [appointmentId, patientId, organizationId]
  );

  if (apptResult.rows.length === 0) {
    return { error: 'NOT_FOUND' };
  }

  if (apptResult.rows[0].status === 'cancelled') {
    return { error: 'ALREADY_CANCELLED' };
  }

  await query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
     WHERE id = $2`,
    [reason || null, appointmentId]
  );

  try {
    broadcastToOrg(organizationId, 'appointment:cancelled', {
      appointmentId,
      patientName,
      reason,
    });
  } catch (wsErr) {
    logger.debug('WebSocket broadcast failed:', wsErr.message);
  }

  return { success: true };
};

/** Get patient messages with pagination. */
export const getMessages = async (patientId, organizationId, page, limit) => {
  const offset = (page - 1) * limit;

  const [messagesResult, countResult, unreadResult] = await Promise.all([
    query(
      `SELECT id, sender_type, sender_id, subject, body, is_read, read_at, parent_message_id, created_at
       FROM patient_messages
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [patientId, organizationId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM patient_messages WHERE patient_id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    ),
    query(
      `SELECT COUNT(*) as count FROM patient_messages
       WHERE patient_id = $1 AND organization_id = $2 AND sender_type != 'PATIENT' AND is_read = false`,
      [patientId, organizationId]
    ),
  ]);

  return {
    messages: messagesResult.rows,
    unread_count: parseInt(unreadResult.rows[0].count, 10),
    pagination: { page, limit, total: parseInt(countResult.rows[0].total, 10) },
  };
};

/** Send a message from the patient. */
export const sendMessage = async (patientId, organizationId, patientName, messageData) => {
  const { subject, body, parent_message_id } = messageData;

  const result = await query(
    `INSERT INTO patient_messages (patient_id, organization_id, sender_type, sender_id, subject, body, parent_message_id)
     VALUES ($1, $2, 'PATIENT', NULL, $3, $4, $5)
     RETURNING *`,
    [patientId, organizationId, subject || null, body, parent_message_id || null]
  );

  broadcastToOrg(organizationId, 'message:new-patient-message', {
    patientId,
    patientName,
    subject: subject || '(Ingen emne)',
  });

  notifyByRole(organizationId, ['ADMIN', 'PRACTITIONER'], {
    type: NOTIFICATION_TYPES.NEW_PATIENT_MESSAGE,
    title: 'Ny melding fra pasient',
    message: `${patientName}: ${subject || body.substring(0, 100)}`,
  });

  return result.rows[0];
};

/** Mark a message as read. */
export const markMessageRead = async (messageId, patientId, organizationId) => {
  await query(
    `UPDATE patient_messages SET is_read = true, read_at = NOW()
     WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
    [messageId, patientId, organizationId]
  );
};

/** Get patient documents with download eligibility. */
export const getDocuments = async (patientId, organizationId) => {
  const result = await query(
    `SELECT id, title, document_type, created_at, token_expires_at, downloaded_at, download_token
     FROM portal_documents
     WHERE patient_id = $1 AND organization_id = $2
     ORDER BY created_at DESC`,
    [patientId, organizationId]
  );

  return result.rows.map((doc) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.document_type,
    createdAt: doc.created_at,
    expired: doc.token_expires_at < new Date(),
    downloadedAt: doc.downloaded_at,
    downloadToken: doc.token_expires_at > new Date() ? doc.download_token : null,
  }));
};

/** Download a document by its token. No auth required (token IS the auth). */
export const downloadDocument = async (token) => {
  const result = await query(
    `SELECT id, document_type, document_id, organization_id, token_expires_at
     FROM portal_documents
     WHERE download_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { error: 'NOT_FOUND' };
  }

  const doc = result.rows[0];

  if (doc.token_expires_at < new Date()) {
    return { error: 'EXPIRED' };
  }

  const { buffer, filename } = await generatePdf(
    doc.document_type,
    doc.document_id,
    doc.organization_id
  );

  // Mark as downloaded
  await query(
    `UPDATE portal_documents SET downloaded_at = NOW() WHERE id = $1 AND downloaded_at IS NULL`,
    [doc.id]
  );

  return { buffer, filename };
};

/** Get patient communication preferences. */
export const getCommPreferences = async (patientId) => {
  const result = await query(
    `SELECT sms_enabled, email_enabled, reminder_enabled, exercise_reminder_enabled, recall_enabled, marketing_enabled
     FROM patient_communication_preferences WHERE patient_id = $1`,
    [patientId]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return DEFAULT_COMM_PREFERENCES;
};

/** Update patient communication preferences (upsert). */
export const updateCommPreferences = async (patientId, organizationId, preferences) => {
  const {
    sms_enabled,
    email_enabled,
    reminder_enabled,
    exercise_reminder_enabled,
    recall_enabled,
    marketing_enabled,
  } = preferences;

  const result = await query(
    `INSERT INTO patient_communication_preferences
       (patient_id, organization_id, sms_enabled, email_enabled, reminder_enabled, exercise_reminder_enabled, recall_enabled, marketing_enabled, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (patient_id) DO UPDATE SET
       sms_enabled = EXCLUDED.sms_enabled,
       email_enabled = EXCLUDED.email_enabled,
       reminder_enabled = EXCLUDED.reminder_enabled,
       exercise_reminder_enabled = EXCLUDED.exercise_reminder_enabled,
       recall_enabled = EXCLUDED.recall_enabled,
       marketing_enabled = EXCLUDED.marketing_enabled,
       updated_at = NOW()
     RETURNING *`,
    [
      patientId,
      organizationId,
      sms_enabled !== false,
      email_enabled !== false,
      reminder_enabled !== false,
      exercise_reminder_enabled !== false,
      recall_enabled !== false,
      marketing_enabled === true,
    ]
  );

  return result.rows[0];
};

/** Invalidate a portal session by token. */
export const logout = async (token) => {
  await query('DELETE FROM portal_sessions WHERE token = $1', [token]);
};
