/**
 * Portal Service
 * Business logic for staff-facing patient portal data access.
 * All methods take organizationId as first parameter and return data objects.
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Get patient dashboard data with counts for appointments, exercises, outcomes.
 * @param {string} organizationId
 * @param {string} patientId
 * @returns {object|null} Dashboard data or null if patient not found
 */
export const getPatientDashboard = async (organizationId, patientId) => {
  const patientResult = await query(
    `SELECT id, first_name, last_name, email, phone, date_of_birth, status,
            portal_pin_hash IS NOT NULL AS portal_enabled
     FROM patients
     WHERE id = $1 AND organization_id = $2`,
    [patientId, organizationId]
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const patient = patientResult.rows[0];

  const [appointmentCount, exerciseCount, outcomeCount] = await Promise.all([
    query(
      `SELECT COUNT(*) as count FROM appointments
       WHERE patient_id = $1 AND organization_id = $2 AND appointment_date >= CURRENT_DATE`,
      [patientId, organizationId]
    ),
    query(
      `SELECT COUNT(*) as count FROM patient_exercise_prescriptions
       WHERE patient_id = $1 AND status = 'active'`,
      [patientId]
    ).catch(() => ({ rows: [{ count: 0 }] })),
    query(
      `SELECT COUNT(*) as count FROM outcome_submissions
       WHERE patient_id = $1`,
      [patientId]
    ).catch(() => ({ rows: [{ count: 0 }] })),
  ]);

  return {
    patient: {
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
      status: patient.status,
      portalEnabled: patient.portal_enabled,
    },
    counts: {
      upcomingAppointments: parseInt(appointmentCount.rows[0].count, 10),
      activeExercises: parseInt(exerciseCount.rows[0].count, 10),
      outcomeSubmissions: parseInt(outcomeCount.rows[0].count, 10),
    },
  };
};

/**
 * List patient appointments with optional upcoming-only filter.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {boolean} upcomingOnly
 * @returns {object[]} Array of appointment rows
 */
export const getPatientAppointments = async (organizationId, patientId, upcomingOnly) => {
  let sql = `
    SELECT id, appointment_date, appointment_time, duration, visit_type, status, notes
    FROM appointments
    WHERE patient_id = $1 AND organization_id = $2
  `;
  if (upcomingOnly) {
    sql += ` AND appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'no_show')`;
  }
  sql += ` ORDER BY appointment_date DESC, appointment_time DESC LIMIT 100`;

  const result = await query(sql, [patientId, organizationId]);
  return result.rows;
};

/**
 * Create an appointment on behalf of a patient.
 * Verifies patient belongs to the organization before inserting.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {object} appointmentData - { appointment_date, appointment_time, duration, visit_type, notes }
 * @param {string} createdBy - User ID of the staff member
 * @returns {object|null} Created appointment row, or null if patient not found
 */
export const createPatientAppointment = async (
  organizationId,
  patientId,
  appointmentData,
  createdBy
) => {
  const { appointment_date, appointment_time, duration, visit_type, notes } = appointmentData;

  const patientCheck = await query(
    'SELECT id FROM patients WHERE id = $1 AND organization_id = $2',
    [patientId, organizationId]
  );
  if (patientCheck.rows.length === 0) {
    return null;
  }

  const result = await query(
    `INSERT INTO appointments (patient_id, organization_id, appointment_date, appointment_time, duration, visit_type, status, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
     RETURNING *`,
    [
      patientId,
      organizationId,
      appointment_date,
      appointment_time,
      duration || 30,
      visit_type || 'consultation',
      notes,
      createdBy,
    ]
  );

  return result.rows[0];
};

/**
 * Get active exercise prescriptions for a patient (with org_id filter on pep table).
 * @param {string} organizationId
 * @param {string} patientId
 * @returns {object[]} Array of exercise rows
 */
export const getPatientExercises = async (organizationId, patientId) => {
  const result = await query(
    `SELECT
      pep.id, pep.exercise_id, pep.sets, pep.reps, pep.hold_seconds,
      pep.frequency, pep.instructions, pep.status, pep.start_date, pep.end_date,
      el.name, el.name_no, el.description, el.description_no,
      el.category, el.body_region, el.difficulty, el.video_url, el.image_url
    FROM patient_exercise_prescriptions pep
    JOIN exercise_library el ON el.id = pep.exercise_id
    WHERE pep.patient_id = $1 AND pep.organization_id = $2 AND pep.status = 'active'
    ORDER BY pep.created_at DESC`,
    [patientId, organizationId]
  );

  return result.rows;
};

/**
 * Get outcome questionnaire submissions for a patient (joins patients for org check).
 * @param {string} organizationId
 * @param {string} patientId
 * @returns {object[]} Array of outcome rows
 */
export const getPatientOutcomes = async (organizationId, patientId) => {
  const result = await query(
    `SELECT os.id, os.questionnaire_id, os.score, os.responses, os.submitted_at,
            oq.name, oq.name_no, oq.category
     FROM outcome_submissions os
     LEFT JOIN outcome_questionnaires oq ON oq.id = os.questionnaire_id
     JOIN patients p ON p.id = os.patient_id
     WHERE os.patient_id = $1 AND p.organization_id = $2
     ORDER BY os.submitted_at DESC
     LIMIT 50`,
    [patientId, organizationId]
  );

  return result.rows;
};

/**
 * Generate a 24-hour magic link token for patient portal access.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {string} ipAddress - Request IP for portal_sessions
 * @returns {object|null} { token, expiresAt, patient } or null if patient not found
 */
export const generateMagicLink = async (organizationId, patientId, ipAddress) => {
  const patientResult = await query(
    `SELECT id, email, first_name FROM patients WHERE id = $1 AND organization_id = $2`,
    [patientId, organizationId]
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await query(
      `INSERT INTO portal_sessions (patient_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [patientId, token, expiresAt, ipAddress]
    );
  } catch (tableError) {
    if (!tableError.message?.includes('relation "portal_sessions" does not exist')) {
      throw tableError;
    }
  }

  return {
    token,
    expiresAt,
    patient: {
      id: patientResult.rows[0].id,
      firstName: patientResult.rows[0].first_name,
    },
  };
};

/**
 * Enable portal access for a patient by setting a PIN hash.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {string} pin - Raw PIN (4-6 digits)
 * @returns {boolean|null} true on success, null if patient not found
 * @throws {Error} If portal_pin_hash column does not exist
 */
export const setPortalAccess = async (organizationId, patientId, pin) => {
  const patientResult = await query(
    'SELECT id FROM patients WHERE id = $1 AND organization_id = $2',
    [patientId, organizationId]
  );

  if (patientResult.rows.length === 0) {
    return null;
  }

  const pinHash = crypto
    .createHash('sha256')
    .update(pin + patientId)
    .digest('hex');

  await query('UPDATE patients SET portal_pin_hash = $1 WHERE id = $2', [pinHash, patientId]);

  return true;
};

/**
 * List booking requests for the organization with optional status filter and pagination.
 * @param {string} organizationId
 * @param {object} filters - { status, page, limit }
 * @returns {object} { requests, pagination: { page, limit, total } }
 */
export const listBookingRequests = async (organizationId, filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let whereClause = 'WHERE pbr.organization_id = $1';
  const params = [organizationId];
  let paramIdx = 2;

  if (status) {
    whereClause += ` AND pbr.status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  }

  params.push(parseInt(limit, 10), offset);

  const result = await query(
    `SELECT pbr.*, p.first_name, p.last_name, p.email, p.phone
     FROM portal_booking_requests pbr
     JOIN patients p ON pbr.patient_id = p.id
     ${whereClause}
     ORDER BY pbr.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    params
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM portal_booking_requests pbr ${whereClause}`,
    params.slice(0, paramIdx - 1)
  );

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    requests: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
    },
  };
};

/**
 * Approve or reject a booking request.
 * @param {string} organizationId
 * @param {string} requestId
 * @param {string} action - 'approve' or 'reject'
 * @param {object} data - { appointment_date, appointment_time, duration, visit_type, userId }
 * @returns {object|null} Updated booking request, or null if not found
 */
export const handleBookingRequest = async (organizationId, requestId, action, data) => {
  const { appointment_date, appointment_time, duration, visit_type, userId } = data;

  const reqResult = await query(
    `SELECT * FROM portal_booking_requests WHERE id = $1 AND organization_id = $2`,
    [requestId, organizationId]
  );

  if (reqResult.rows.length === 0) {
    return null;
  }

  const bookingReq = reqResult.rows[0];

  if (action === 'approve') {
    const apptResult = await query(
      `INSERT INTO appointments
        (patient_id, organization_id, appointment_date, appointment_time, duration, visit_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7)
       RETURNING *`,
      [
        bookingReq.patient_id,
        organizationId,
        appointment_date,
        appointment_time,
        duration || 30,
        visit_type || 'consultation',
        userId,
      ]
    );

    await query(
      `UPDATE portal_booking_requests
       SET status = 'CONFIRMED', handled_by = $1, handled_at = NOW(), appointment_id = $2
       WHERE id = $3`,
      [userId, apptResult.rows[0].id, requestId]
    );

    return { ...bookingReq, status: 'CONFIRMED', appointment_id: apptResult.rows[0].id };
  }

  // Reject
  await query(
    `UPDATE portal_booking_requests
     SET status = 'REJECTED', handled_by = $1, handled_at = NOW()
     WHERE id = $2`,
    [userId, requestId]
  );

  return { ...bookingReq, status: 'REJECTED' };
};

/**
 * Get count of pending booking requests for the organization.
 * @param {string} organizationId
 * @returns {number} Pending count
 */
export const getBookingRequestCount = async (organizationId) => {
  const result = await query(
    `SELECT COUNT(*) FROM portal_booking_requests
     WHERE organization_id = $1 AND status = 'PENDING'`,
    [organizationId]
  );

  return parseInt(result.rows[0].count, 10);
};

/**
 * Get messages for a patient with pagination.
 * Verifies patient belongs to the organization.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {object} pagination - { page, limit }
 * @returns {object|null} { messages, pagination } or null if patient not found
 */
export const getPatientMessages = async (organizationId, patientId, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 50;
  const offset = (page - 1) * limit;

  const patientCheck = await query(
    'SELECT id FROM patients WHERE id = $1 AND organization_id = $2',
    [patientId, organizationId]
  );
  if (patientCheck.rows.length === 0) {
    return null;
  }

  const [messagesResult, countResult] = await Promise.all([
    query(
      `SELECT pm.id, pm.sender_type, pm.sender_id, pm.subject, pm.body, pm.is_read, pm.read_at,
              pm.parent_message_id, pm.created_at,
              u.full_name as sender_name
       FROM patient_messages pm
       LEFT JOIN users u ON pm.sender_id = u.id
       WHERE pm.patient_id = $1 AND pm.organization_id = $2
       ORDER BY pm.created_at ASC
       LIMIT $3 OFFSET $4`,
      [patientId, organizationId, limit, offset]
    ),
    query(
      'SELECT COUNT(*) as total FROM patient_messages WHERE patient_id = $1 AND organization_id = $2',
      [patientId, organizationId]
    ),
  ]);

  return {
    messages: messagesResult.rows,
    pagination: { page, limit, total: parseInt(countResult.rows[0].total, 10) },
  };
};

/**
 * Send a message from a clinician to a patient.
 * Verifies patient belongs to the organization. Sends best-effort SMS and push.
 * @param {string} organizationId
 * @param {string} patientId
 * @param {object} messageData - { subject, body, parent_message_id }
 * @param {string} sentBy - User ID of the staff member
 * @returns {object|null} Created message row, or null if patient not found
 */
export const sendPatientMessage = async (organizationId, patientId, messageData, sentBy) => {
  const { subject, body: msgBody, parent_message_id } = messageData;

  const patientCheck = await query(
    'SELECT id, phone, first_name FROM patients WHERE id = $1 AND organization_id = $2',
    [patientId, organizationId]
  );
  if (patientCheck.rows.length === 0) {
    return null;
  }

  const result = await query(
    `INSERT INTO patient_messages (patient_id, organization_id, sender_type, sender_id, subject, body, parent_message_id)
     VALUES ($1, $2, 'CLINICIAN', $3, $4, $5, $6)
     RETURNING *`,
    [patientId, organizationId, sentBy, subject || null, msgBody, parent_message_id || null]
  );

  // Best-effort SMS notification to patient
  const patient = patientCheck.rows[0];
  if (patient.phone) {
    try {
      const { sendSMS } = await import('./communications.js');
      await sendSMS(
        organizationId,
        {
          to: patient.phone,
          message: `Ny melding fra klinikken. Logg inn på pasientportalen for å lese.`,
          patientId,
        },
        sentBy
      );
    } catch (smsError) {
      logger.error('Failed to send SMS notification for message:', smsError);
    }
  }

  // Best-effort push notification to patient's mobile app
  try {
    const { sendPushToPatient } = await import('./pushNotification.js');
    await sendPushToPatient(patientId, {
      title: 'Ny melding fra klinikken',
      body: (subject || msgBody).substring(0, 100),
      data: { type: 'message', id: result.rows[0].id, route: '/clinic/messages' },
    });
  } catch (_pushErr) {
    logger.debug('Push to patient mobile app skipped:', _pushErr.message);
  }

  return result.rows[0];
};
