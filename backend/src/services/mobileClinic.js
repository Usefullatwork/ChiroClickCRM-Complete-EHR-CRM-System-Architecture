/**
 * Mobile Clinic Service
 * Business logic for patient messaging, documents, and appointment booking
 * via the mobile app (v2.1 clinic connectivity)
 */

import { query } from '../config/database.js';
import { generatePdf } from './documentDelivery.js';

// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

/**
 * Get paginated messages for a patient
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @param {object} pagination - { page, limit }
 * @returns {object} { messages, unread_count, pagination }
 */
export async function getMessages(patientId, organizationId, pagination) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
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
}

/**
 * Send a message from a patient
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @param {object} content - { subject, body, parent_message_id }
 * @returns {object} The created message record
 */
export async function sendMessage(patientId, organizationId, content) {
  const { subject, body: msgBody, parent_message_id } = content;

  if (!msgBody) {
    throw new Error('Meldingstekst er påkrevd');
  }

  const result = await query(
    `INSERT INTO patient_messages (patient_id, organization_id, sender_type, sender_id, subject, body, parent_message_id)
     VALUES ($1, $2, 'PATIENT', NULL, $3, $4, $5)
     RETURNING *`,
    [patientId, organizationId, subject || null, msgBody, parent_message_id || null]
  );

  return result.rows[0];
}

/**
 * Mark a message as read
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @param {string} messageId - Message UUID
 */
export async function markMessageRead(patientId, organizationId, messageId) {
  await query(
    `UPDATE patient_messages SET is_read = true, read_at = NOW()
     WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
    [messageId, patientId, organizationId]
  );
}

/**
 * List portal documents for a patient
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @returns {object} { documents }
 */
export async function getDocuments(patientId, organizationId) {
  const result = await query(
    `SELECT id, title, document_type, created_at, token_expires_at, downloaded_at, download_token
     FROM portal_documents
     WHERE patient_id = $1 AND organization_id = $2
     ORDER BY created_at DESC`,
    [patientId, organizationId]
  );

  const documents = result.rows.map((doc) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.document_type,
    createdAt: doc.created_at,
    expired: doc.token_expires_at < new Date(),
    downloadedAt: doc.downloaded_at,
    downloadToken: doc.token_expires_at > new Date() ? doc.download_token : null,
  }));

  return { documents };
}

/**
 * Download a document by its token
 * @param {string} token - Download token
 * @returns {object} { buffer, filename }
 */
export async function downloadDocument(token) {
  const result = await query(
    `SELECT id, document_type, document_id, organization_id, token_expires_at
     FROM portal_documents
     WHERE download_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { error: 'not_found' };
  }

  const doc = result.rows[0];

  if (doc.token_expires_at < new Date()) {
    return { error: 'expired' };
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
}

/**
 * Get available appointment slots for a date
 * @param {string} organizationId - Organization UUID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string|null} practitionerId - Optional practitioner filter
 * @returns {object} { slots }
 */
export async function getAvailableSlots(organizationId, date, practitionerId) {
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

  return { slots };
}

/**
 * Create a booking request from a patient
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @param {object} bookingData - { preferredDate, preferredTime, reason }
 * @returns {object} { id, status }
 */
export async function requestBooking(patientId, organizationId, bookingData) {
  const { preferredDate, preferredTime, reason } = bookingData;

  if (!preferredDate) {
    throw new Error('preferredDate is required');
  }

  const result = await query(
    `INSERT INTO portal_booking_requests
      (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [patientId, organizationId, preferredDate, preferredTime || null, reason || null]
  );

  return { id: result.rows[0].id, status: 'PENDING' };
}

/**
 * Get a patient's booking requests
 * @param {string} patientId - Patient UUID
 * @param {string} organizationId - Organization UUID
 * @returns {object} { requests }
 */
export async function getBookingRequests(patientId, organizationId) {
  const result = await query(
    `SELECT id, preferred_date, preferred_time_slot, reason, status, created_at
     FROM portal_booking_requests
     WHERE patient_id = $1 AND organization_id = $2
     ORDER BY created_at DESC`,
    [patientId, organizationId]
  );

  return { requests: result.rows };
}
