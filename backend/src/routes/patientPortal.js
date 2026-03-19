/**
 * Patient Portal Routes
 * API endpoints for patient self-service portal
 * Uses PIN-based authentication (no main system auth required)
 */

import express from 'express';
import { query } from '../config/database.js';
import validate from '../middleware/validation.js';
import {
  pinAuthSchema,
  logComplianceSchema,
  bookingRequestSchema,
  rescheduleSchema,
  cancelAppointmentSchema,
  messageSchema,
} from '../validators/patientPortal.validators.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { generatePdf } from '../services/documentDelivery.js';
import { broadcastToOrg } from '../services/websocket.js';
import { notifyByRole, NOTIFICATION_TYPES } from '../services/notifications.js';

const router = express.Router();

/**
 * @swagger
 * /patient-portal/health:
 *   get:
 *     summary: Patient portal health check
 *     tags: [Portal]
 *     security: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'patient-portal' });
});

/**
 * Portal auth middleware
 * Validates portal session token from cookie or header
 */
const requirePortalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.portal_session || req.headers['x-portal-token'];

    if (!token) {
      return res.status(401).json({ error: 'Portal authentication required' });
    }

    const result = await query(
      `
      SELECT ps.*, p.id as patient_id, p.first_name, p.last_name,
             p.email, p.phone, p.date_of_birth, p.organization_id
      FROM portal_sessions ps
      JOIN patients p ON p.id = ps.patient_id
      WHERE ps.token = $1 AND ps.expires_at > NOW()
    `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Portal session expired or invalid' });
    }

    req.portalPatient = result.rows[0];
    req.organizationId = result.rows[0].organization_id;
    next();
  } catch (error) {
    // If portal_sessions table doesn't exist yet, return 503
    if (error.message?.includes('relation "portal_sessions" does not exist')) {
      return res.status(503).json({
        error: 'Portal not yet configured',
        message: 'Patient portal database tables need to be created first',
      });
    }
    logger.error('Portal auth error:', error);
    res.status(500).json({ error: 'Portal authentication failed' });
  }
};

/**
 * @swagger
 * /patient-portal/auth/pin:
 *   post:
 *     summary: Authenticate patient with PIN
 *     tags: [Portal]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Authentication successful, portal session token returned
 *       401:
 *         description: Invalid credentials
 *       503:
 *         description: Portal not yet configured
 */
router.post('/auth/pin', validate(pinAuthSchema), async (req, res) => {
  try {
    const { pin, patientId, dateOfBirth } = req.body;

    // Find patient by ID or date of birth
    let patientResult;
    if (patientId) {
      patientResult = await query(
        `
        SELECT id, first_name, last_name, email, phone, date_of_birth, organization_id, portal_pin_hash
        FROM patients WHERE id = $1
      `,
        [patientId]
      );
    } else {
      patientResult = await query(
        `
        SELECT id, first_name, last_name, email, phone, date_of_birth, organization_id, portal_pin_hash
        FROM patients WHERE date_of_birth = $1
      `,
        [dateOfBirth]
      );
    }

    if (patientResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const patient = patientResult.rows[0];

    // Verify PIN (hash comparison)
    const pinHash = crypto
      .createHash('sha256')
      .update(pin + patient.id)
      .digest('hex');

    if (patient.portal_pin_hash && patient.portal_pin_hash !== pinHash) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // If no PIN set yet, accept any 4-digit PIN for first-time setup and save it
    if (!patient.portal_pin_hash) {
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be 4 digits' });
      }
      await query('UPDATE patients SET portal_pin_hash = $1 WHERE id = $2', [pinHash, patient.id]);
    }

    // Create portal session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      await query(
        `
        INSERT INTO portal_sessions (patient_id, token, expires_at, ip_address)
        VALUES ($1, $2, $3, $4)
      `,
        [patient.id, token, expiresAt, req.ip]
      );
    } catch (tableError) {
      // If table doesn't exist, still return token (stateless mode)
      if (!tableError.message?.includes('relation "portal_sessions" does not exist')) {
        throw tableError;
      }
    }

    res.cookie('portal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
      },
      expiresAt,
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
});

/**
 * @swagger
 * /patient-portal/profile:
 *   get:
 *     summary: Get patient's own profile
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile data
 *       401:
 *         description: Portal session expired
 */
router.get('/profile', requirePortalAuth, async (req, res) => {
  try {
    const patient = req.portalPatient;
    res.json({
      id: patient.patient_id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
    });
  } catch (error) {
    logger.error('Error getting portal profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * @swagger
 * /patient-portal/appointments:
 *   get:
 *     summary: Get patient's upcoming appointments
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming appointments
 *       401:
 *         description: Portal session expired
 */
router.get('/appointments', requirePortalAuth, async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;

    const result = await query(
      `
      SELECT id, appointment_date, appointment_time, duration, visit_type, status, notes
      FROM appointments
      WHERE patient_id = $1 AND organization_id = $2
      AND appointment_date >= CURRENT_DATE
      AND status NOT IN ('cancelled', 'no_show')
      ORDER BY appointment_date ASC, appointment_time ASC
    `,
      [patient_id, organization_id]
    );

    res.json({ appointments: result.rows });
  } catch (error) {
    logger.error('Error getting portal appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

/**
 * @swagger
 * /patient-portal/exercises:
 *   get:
 *     summary: Get patient's exercise programs
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active exercise prescriptions
 *       401:
 *         description: Portal session expired
 */
router.get('/exercises', requirePortalAuth, async (req, res) => {
  try {
    const { patient_id } = req.portalPatient;

    const result = await query(
      `
      SELECT
        pep.id, pep.exercise_id, pep.sets, pep.reps, pep.hold_seconds,
        pep.frequency, pep.instructions, pep.status, pep.start_date, pep.end_date,
        el.name, el.name_no, el.description, el.description_no,
        el.category, el.body_region, el.difficulty, el.video_url, el.image_url
      FROM patient_exercise_prescriptions pep
      JOIN exercise_library el ON el.id = pep.exercise_id
      WHERE pep.patient_id = $1 AND pep.status = 'active'
      ORDER BY pep.created_at DESC
    `,
      [patient_id]
    );

    res.json({ exercises: result.rows });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ exercises: [] });
    }
    logger.error('Error getting portal exercises:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
});

/**
 * @swagger
 * /patient-portal/exercises/{id}/compliance:
 *   post:
 *     summary: Log exercise compliance
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *               pain_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               difficulty_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compliance logged
 *       401:
 *         description: Portal session expired
 */
router.post(
  '/exercises/:id/compliance',
  requirePortalAuth,
  validate(logComplianceSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { patient_id } = req.portalPatient;
      const { completed, pain_level, difficulty_rating, notes } = req.body;

      const result = await query(
        `
      INSERT INTO exercise_compliance_logs (
        prescription_id, patient_id, completed, pain_level, difficulty_rating, notes, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `,
        [id, patient_id, completed !== false, pain_level, difficulty_rating, notes]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Exercise compliance tracking not yet configured' });
      }
      logger.error('Error logging compliance:', error);
      res.status(500).json({ error: 'Failed to log compliance' });
    }
  }
);

// =============================================================================
// BOOKING ENDPOINTS (patient-facing)
// =============================================================================

/**
 * GET /patient-portal/available-slots
 * Returns available 30-min slots for a given date
 */
router.get('/available-slots', requirePortalAuth, async (req, res) => {
  try {
    const { date, practitioner_id } = req.query;
    const { organization_id } = req.portalPatient;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    // Get existing appointments for the date
    let existingQuery = `
      SELECT appointment_time, duration
      FROM appointments
      WHERE organization_id = $1
        AND appointment_date = $2
        AND status NOT IN ('cancelled', 'no_show')
    `;
    const params = [organization_id, date];

    if (practitioner_id) {
      existingQuery += ' AND practitioner_id = $3';
      params.push(practitioner_id);
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

    res.json({ slots });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Booking system not yet configured' });
    }
    logger.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

/**
 * POST /patient-portal/appointments/request
 * Patient requests a new appointment
 */
router.post(
  '/appointments/request',
  requirePortalAuth,
  validate(bookingRequestSchema),
  async (req, res) => {
    try {
      const { preferredDate, preferredTime, reason } = req.body;
      const { patient_id, organization_id, first_name, last_name } = req.portalPatient;

      const result = await query(
        `INSERT INTO portal_booking_requests
          (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         RETURNING *`,
        [patient_id, organization_id, preferredDate, preferredTime || null, reason || null]
      );

      const request = result.rows[0];

      // Notify staff via WebSocket
      try {
        broadcastToOrg(organization_id, 'booking:new-request', {
          id: request.id,
          patientName: `${first_name} ${last_name}`,
          preferredDate,
          preferredTime,
        });
      } catch (wsErr) {
        logger.debug('WebSocket broadcast failed:', wsErr.message);
      }

      // Create in-app notifications for staff
      try {
        await notifyByRole(organization_id, ['ADMIN', 'PRACTITIONER'], {
          type: NOTIFICATION_TYPES.BOOKING_REQUEST,
          title: 'Ny timeforespørsel',
          message: `${first_name} ${last_name} ønsker time ${preferredDate}`,
        });
      } catch (notifErr) {
        logger.debug('Staff notification failed:', notifErr.message);
      }

      res.status(201).json({ id: request.id, status: 'PENDING' });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error creating booking request:', error);
      res.status(500).json({ error: 'Failed to create booking request' });
    }
  }
);

/**
 * PATCH /patient-portal/appointments/:id/reschedule
 * Patient requests to reschedule an existing appointment
 */
router.patch(
  '/appointments/:id/reschedule',
  requirePortalAuth,
  validate(rescheduleSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { preferredDate, preferredTime, reason } = req.body;
      const { patient_id, organization_id, first_name, last_name } = req.portalPatient;

      // Verify appointment belongs to this patient's org
      const apptResult = await query(
        `SELECT id FROM appointments
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
        [id, patient_id, organization_id]
      );

      if (apptResult.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Create a new booking request referencing the original appointment
      const result = await query(
        `INSERT INTO portal_booking_requests
          (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status, original_appointment_id)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
         RETURNING *`,
        [patient_id, organization_id, preferredDate, preferredTime || null, reason || null, id]
      );

      const request = result.rows[0];

      try {
        broadcastToOrg(organization_id, 'booking:reschedule-request', {
          id: request.id,
          originalAppointmentId: id,
          patientName: `${first_name} ${last_name}`,
          preferredDate,
        });
      } catch (wsErr) {
        logger.debug('WebSocket broadcast failed:', wsErr.message);
      }

      res.json({ id: request.id, status: 'PENDING' });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error creating reschedule request:', error);
      res.status(500).json({ error: 'Failed to create reschedule request' });
    }
  }
);

/**
 * POST /patient-portal/appointments/:id/cancel
 * Patient cancels an appointment
 */
router.post(
  '/appointments/:id/cancel',
  requirePortalAuth,
  validate(cancelAppointmentSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { patient_id, organization_id, first_name, last_name } = req.portalPatient;

      // Verify appointment belongs to this patient
      const apptResult = await query(
        `SELECT id, status FROM appointments
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
        [id, patient_id, organization_id]
      );

      if (apptResult.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (apptResult.rows[0].status === 'cancelled') {
        return res.status(400).json({ error: 'Appointment is already cancelled' });
      }

      await query(
        `UPDATE appointments
         SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
         WHERE id = $2`,
        [reason || null, id]
      );

      try {
        broadcastToOrg(organization_id, 'appointment:cancelled', {
          appointmentId: id,
          patientName: `${first_name} ${last_name}`,
          reason,
        });
      } catch (wsErr) {
        logger.debug('WebSocket broadcast failed:', wsErr.message);
      }

      res.json({ success: true });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Appointment system not yet configured' });
      }
      logger.error('Error cancelling appointment:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

// =============================================================================
// MESSAGING ENDPOINTS (patient-facing)
// =============================================================================

/**
 * GET /patient-portal/messages
 * Patient retrieves their messages
 */
router.get('/messages', requirePortalAuth, async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [messagesResult, countResult, unreadResult] = await Promise.all([
      query(
        `SELECT id, sender_type, sender_id, subject, body, is_read, read_at, parent_message_id, created_at
         FROM patient_messages
         WHERE patient_id = $1 AND organization_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [patient_id, organization_id, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM patient_messages WHERE patient_id = $1 AND organization_id = $2`,
        [patient_id, organization_id]
      ),
      query(
        `SELECT COUNT(*) as count FROM patient_messages
         WHERE patient_id = $1 AND organization_id = $2 AND sender_type != 'PATIENT' AND is_read = false`,
        [patient_id, organization_id]
      ),
    ]);

    res.json({
      messages: messagesResult.rows,
      unread_count: parseInt(unreadResult.rows[0].count, 10),
      pagination: { page, limit, total: parseInt(countResult.rows[0].total, 10) },
    });
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
});

/**
 * POST /patient-portal/messages
 * Patient sends a new message
 */
router.post('/messages', requirePortalAuth, validate(messageSchema), async (req, res) => {
  try {
    const { patient_id, organization_id, first_name, last_name } = req.portalPatient;
    const { subject, body: msgBody, parent_message_id } = req.body;

    const result = await query(
      `INSERT INTO patient_messages (patient_id, organization_id, sender_type, sender_id, subject, body, parent_message_id)
       VALUES ($1, $2, 'PATIENT', NULL, $3, $4, $5)
       RETURNING *`,
      [patient_id, organization_id, subject || null, msgBody, parent_message_id || null]
    );

    broadcastToOrg(organization_id, 'message:new-patient-message', {
      patientId: patient_id,
      patientName: `${first_name} ${last_name}`,
      subject: subject || '(Ingen emne)',
    });

    notifyByRole(organization_id, ['ADMIN', 'PRACTITIONER'], {
      type: NOTIFICATION_TYPES.NEW_PATIENT_MESSAGE,
      title: 'Ny melding fra pasient',
      message: `${first_name} ${last_name}: ${subject || msgBody.substring(0, 100)}`,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Messaging not yet configured' });
    }
    logger.error('Error sending portal message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PATCH /patient-portal/messages/:id/read
 * Patient marks a message as read
 */
router.patch('/messages/:id/read', requirePortalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, organization_id } = req.portalPatient;

    await query(
      `UPDATE patient_messages SET is_read = true, read_at = NOW()
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
      [id, patient_id, organization_id]
    );

    res.json({ success: true });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ success: true });
    }
    logger.error('Error marking message read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// =============================================================================
// DOCUMENTS
// =============================================================================

router.get('/documents', requirePortalAuth, async (req, res) => {
  try {
    const { patient_id, organization_id } = req.portalPatient;

    const result = await query(
      `SELECT id, title, document_type, created_at, token_expires_at, downloaded_at, download_token
       FROM portal_documents
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [patient_id, organization_id]
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

    res.json({ documents });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ documents: [] });
    }
    logger.error('Error getting portal documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

router.get('/documents/:token/download', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT id, document_type, document_id, organization_id, token_expires_at
       FROM portal_documents
       WHERE download_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    if (doc.token_expires_at < new Date()) {
      return res.status(410).json({ error: 'Download link has expired' });
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error downloading portal document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

/**
 * @swagger
 * /patient-portal/logout:
 *   post:
 *     summary: Invalidate portal session
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', requirePortalAuth, async (req, res) => {
  try {
    const token = req.cookies?.portal_session || req.headers['x-portal-token'];
    await query('DELETE FROM portal_sessions WHERE token = $1', [token]);
    res.clearCookie('portal_session');
    res.json({ success: true });
  } catch (error) {
    logger.error('Portal logout error:', error);
    res.clearCookie('portal_session');
    res.json({ success: true });
  }
});

export default router;
