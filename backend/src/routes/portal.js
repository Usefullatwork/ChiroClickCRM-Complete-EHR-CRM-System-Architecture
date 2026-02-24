/**
 * Portal Routes
 * Practitioner-facing API endpoints for patient portal data access.
 * These routes require standard auth and let staff view/manage portal data for patients.
 * Patient self-service routes are in patientPortal.js (/patient-portal/*).
 */

import express from 'express';
import { query } from '../config/database.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * @swagger
 * /portal/health:
 *   get:
 *     summary: Portal module health check
 *     tags: [Portal]
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'portal' });
});

// All routes below require practitioner/admin auth
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /portal/patient/{patientId}:
 *   get:
 *     summary: Get patient portal dashboard data
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient portal dashboard data
 *       404:
 *         description: Patient not found
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const orgId = req.organizationId;

    const patientResult = await query(
      `SELECT id, first_name, last_name, email, phone, date_of_birth, status,
              portal_pin_hash IS NOT NULL AS portal_enabled
       FROM patients
       WHERE id = $1 AND organization_id = $2`,
      [patientId, orgId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];

    // Get counts for dashboard
    const [appointmentCount, exerciseCount, outcomeCount] = await Promise.all([
      query(
        `SELECT COUNT(*) as count FROM appointments
         WHERE patient_id = $1 AND organization_id = $2 AND appointment_date >= CURRENT_DATE`,
        [patientId, orgId]
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

    res.json({
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
    });
  } catch (error) {
    logger.error('Error getting portal patient data:', error);
    res.status(500).json({ error: 'Failed to get patient portal data' });
  }
});

/**
 * @swagger
 * /portal/patient/{patientId}/appointments:
 *   get:
 *     summary: Get patient appointment history
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Patient appointments
 */
router.get('/patient/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;
    const orgId = req.organizationId;
    const upcomingOnly = req.query.upcoming === 'true';

    let sql = `
      SELECT id, appointment_date, appointment_time, duration, visit_type, status, notes
      FROM appointments
      WHERE patient_id = $1 AND organization_id = $2
    `;
    if (upcomingOnly) {
      sql += ` AND appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'no_show')`;
    }
    sql += ` ORDER BY appointment_date DESC, appointment_time DESC LIMIT 100`;

    const result = await query(sql, [patientId, orgId]);
    res.json({ appointments: result.rows });
  } catch (error) {
    logger.error('Error getting portal patient appointments:', error);
    res.status(500).json({ error: 'Failed to get patient appointments' });
  }
});

/**
 * @swagger
 * /portal/patient/{patientId}/appointments:
 *   post:
 *     summary: Request an appointment on behalf of patient
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointment_date, appointment_time]
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date
 *               appointment_time:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 default: 30
 *               visit_type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment request created
 */
router.post('/patient/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;
    const orgId = req.organizationId;
    const { appointment_date, appointment_time, duration, visit_type, notes } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'appointment_date and appointment_time are required' });
    }

    const result = await query(
      `INSERT INTO appointments (patient_id, organization_id, appointment_date, appointment_time, duration, visit_type, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
       RETURNING *`,
      [
        patientId,
        orgId,
        appointment_date,
        appointment_time,
        duration || 30,
        visit_type || 'consultation',
        notes,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating portal appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * @swagger
 * /portal/patient/{patientId}/exercises:
 *   get:
 *     summary: Get patient's active exercise prescriptions
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Active exercise prescriptions
 */
router.get('/patient/:patientId/exercises', async (req, res) => {
  try {
    const { patientId } = req.params;

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

    res.json({ exercises: result.rows });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ exercises: [] });
    }
    logger.error('Error getting portal patient exercises:', error);
    res.status(500).json({ error: 'Failed to get patient exercises' });
  }
});

/**
 * @swagger
 * /portal/patient/{patientId}/outcomes:
 *   get:
 *     summary: Get patient outcome questionnaire results
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Outcome submissions
 */
router.get('/patient/:patientId/outcomes', async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await query(
      `SELECT os.id, os.questionnaire_id, os.score, os.responses, os.submitted_at,
              oq.name, oq.name_no, oq.category
       FROM outcome_submissions os
       LEFT JOIN outcome_questionnaires oq ON oq.id = os.questionnaire_id
       WHERE os.patient_id = $1
       ORDER BY os.submitted_at DESC
       LIMIT 50`,
      [patientId]
    );

    res.json({ outcomes: result.rows });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ outcomes: [] });
    }
    logger.error('Error getting portal patient outcomes:', error);
    res.status(500).json({ error: 'Failed to get patient outcomes' });
  }
});

/**
 * @swagger
 * /portal/auth/magic-link:
 *   post:
 *     summary: Generate a magic link for patient portal access
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Magic link generated (returns token, not emailed in dev)
 */
router.post('/auth/magic-link', async (req, res) => {
  try {
    const { patientId } = req.body;
    const orgId = req.organizationId;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    // Verify patient belongs to organization
    const patientResult = await query(
      `SELECT id, email, first_name FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, orgId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      await query(
        `INSERT INTO portal_sessions (patient_id, token, expires_at, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [patientId, token, expiresAt, req.ip]
      );
    } catch (tableError) {
      if (!tableError.message?.includes('relation "portal_sessions" does not exist')) {
        throw tableError;
      }
    }

    res.json({
      token,
      expiresAt,
      patient: {
        id: patientResult.rows[0].id,
        firstName: patientResult.rows[0].first_name,
      },
    });
  } catch (error) {
    logger.error('Error generating magic link:', error);
    res.status(500).json({ error: 'Failed to generate magic link' });
  }
});

/**
 * @swagger
 * /portal/patient/{patientId}/portal-access:
 *   post:
 *     summary: Enable or reset portal access for a patient (set PIN)
 *     tags: [Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: Portal access enabled
 */
router.post('/patient/:patientId/portal-access', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { pin } = req.body;
    const orgId = req.organizationId;

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    // Verify patient belongs to org
    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1 AND organization_id = $2',
      [patientId, orgId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const pinHash = crypto
      .createHash('sha256')
      .update(pin + patientId)
      .digest('hex');

    await query('UPDATE patients SET portal_pin_hash = $1 WHERE id = $2', [pinHash, patientId]);

    res.json({ success: true, message: 'Portal access enabled' });
  } catch (error) {
    if (error.message?.includes('column "portal_pin_hash" does not exist')) {
      return res.status(503).json({ error: 'Portal not yet configured - run migration 030' });
    }
    logger.error('Error setting portal access:', error);
    res.status(500).json({ error: 'Failed to set portal access' });
  }
});

export default router;
