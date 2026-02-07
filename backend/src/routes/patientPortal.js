/**
 * Patient Portal Routes
 * API endpoints for patient self-service portal
 * Uses PIN-based authentication (no main system auth required)
 */

import express from 'express';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

// Health check (no auth required)
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
 * POST /patient-portal/auth/pin
 * Authenticate patient with PIN
 */
router.post('/auth/pin', async (req, res) => {
  try {
    const { pin, patientId, dateOfBirth } = req.body;

    if (!pin || (!patientId && !dateOfBirth)) {
      return res.status(400).json({ error: 'PIN and patient identifier required' });
    }

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
 * GET /patient-portal/profile
 * Get patient's own profile
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
 * GET /patient-portal/appointments
 * Get patient's upcoming appointments
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
 * GET /patient-portal/exercises
 * Get patient's exercise programs
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
 * POST /patient-portal/exercises/:id/compliance
 * Log exercise compliance
 */
router.post('/exercises/:id/compliance', requirePortalAuth, async (req, res) => {
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
});

/**
 * POST /patient-portal/logout
 * Invalidate portal session
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
