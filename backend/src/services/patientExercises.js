/**
 * Patient Exercises Service
 * Handles patient portal access to exercise prescriptions
 *
 * @module services/patientExercises
 */

import { query, _transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Generate a secure random access token
 */
const generateToken = () => {
  const bytes = crypto.randomBytes(32);
  if (bytes && typeof bytes.toString === 'function') {
    return bytes.toString('hex');
  }
  // Fallback for environments where crypto is unavailable
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * Create a portal access token for a patient
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {string} tokenType - Type of token (exercises, documents, forms, general)
 * @param {number} expiryDays - Days until token expires (default 30)
 */
export const createPortalToken = async (
  organizationId,
  patientId,
  tokenType = 'exercises',
  expiryDays = 30
) => {
  try {
    const accessToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const result = await query(
      `INSERT INTO patient_portal_tokens (
        patient_id, organization_id, access_token, token_type, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [patientId, organizationId, accessToken, tokenType, expiresAt]
    );

    logger.info('Portal token created:', { patientId, tokenType, expiresAt });
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating portal token:', error);
    throw error;
  }
};

/**
 * Validate a portal access token
 * @param {string} token - Access token
 * @returns {object|null} Token data with patient info or null if invalid
 */
export const validatePortalToken = async (token) => {
  try {
    if (!token || token.length < 32) {
      return null;
    }

    const result = await query(
      `SELECT
        t.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        o.name as organization_name,
        o.phone as organization_phone
       FROM patient_portal_tokens t
       JOIN patients p ON p.id = t.patient_id
       JOIN organizations o ON o.id = t.organization_id
       WHERE t.access_token = $1
         AND t.expires_at > CURRENT_TIMESTAMP
         AND NOT t.is_revoked`,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Update usage tracking
    await query(
      `UPDATE patient_portal_tokens
       SET last_used_at = CURRENT_TIMESTAMP, use_count = use_count + 1
       WHERE access_token = $1`,
      [token]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error validating portal token:', error);
    throw error;
  }
};

/**
 * Revoke a portal token
 * @param {string} token - Access token to revoke
 */
export const revokePortalToken = async (token) => {
  try {
    await query(`UPDATE patient_portal_tokens SET is_revoked = true WHERE access_token = $1`, [
      token,
    ]);
    return true;
  } catch (error) {
    logger.error('Error revoking portal token:', error);
    throw error;
  }
};

// ============================================================================
// PATIENT PRESCRIPTION ACCESS
// ============================================================================

/**
 * Get all prescriptions for a patient via portal token
 * @param {string} token - Portal access token
 */
export const getPatientPrescriptions = async (token) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      return null;
    }

    const result = await query(
      `SELECT
        p.id,
        p.status,
        p.start_date,
        p.end_date,
        p.patient_instructions,
        p.prescribed_at,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        (
          SELECT COUNT(*) FROM prescribed_exercises pe WHERE pe.prescription_id = p.id
        ) as exercise_count,
        (
          SELECT COUNT(DISTINCT ep.exercise_id)
          FROM exercise_progress ep
          WHERE ep.prescription_id = p.id
            AND ep.completed_at::date = CURRENT_DATE
        ) as completed_today
       FROM exercise_prescriptions p
       LEFT JOIN users u ON u.id = p.prescribed_by
       WHERE p.patient_id = $1
         AND p.organization_id = $2
         AND p.status IN ('active', 'paused')
       ORDER BY p.prescribed_at DESC`,
      [tokenData.patient_id, tokenData.organization_id]
    );

    return {
      patient: {
        firstName: tokenData.patient_first_name,
        lastName: tokenData.patient_last_name,
      },
      clinic: {
        name: tokenData.organization_name,
        phone: tokenData.organization_phone,
      },
      prescriptions: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        patientInstructions: row.patient_instructions,
        prescribedAt: row.prescribed_at,
        prescribedBy: row.prescribed_by_name,
        exerciseCount: parseInt(row.exercise_count),
        completedToday: parseInt(row.completed_today),
      })),
    };
  } catch (error) {
    logger.error('Error getting patient prescriptions:', error);
    throw error;
  }
};

/**
 * Get a specific prescription with exercises for patient portal
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 */
export const getPrescriptionDetail = async (token, prescriptionId) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      return null;
    }

    // Get prescription
    const prescriptionResult = await query(
      `SELECT
        p.*,
        u.first_name || ' ' || u.last_name as prescribed_by_name
       FROM exercise_prescriptions p
       LEFT JOIN users u ON u.id = p.prescribed_by
       WHERE p.id = $1
         AND p.patient_id = $2
         AND p.organization_id = $3
         AND p.status IN ('active', 'paused')`,
      [prescriptionId, tokenData.patient_id, tokenData.organization_id]
    );

    if (prescriptionResult.rows.length === 0) {
      return null;
    }

    const prescription = prescriptionResult.rows[0];

    // Get exercises with completion status for today
    const exercisesResult = await query(
      `SELECT
        pe.id as prescribed_exercise_id,
        pe.sets,
        pe.reps,
        pe.hold_seconds,
        pe.frequency_per_day,
        pe.frequency_per_week,
        pe.custom_instructions,
        pe.display_order,
        el.id as exercise_id,
        el.name,
        el.name_norwegian,
        el.description,
        el.description_norwegian,
        el.category,
        el.subcategory,
        el.body_region,
        el.difficulty_level,
        el.instructions,
        el.instructions_norwegian,
        el.image_url,
        el.video_url,
        el.thumbnail_url,
        el.precautions,
        COALESCE(el.sets_default, 3) as sets_default,
        COALESCE(el.reps_default, 10) as reps_default,
        el.hold_seconds as hold_seconds_default,
        (
          SELECT COUNT(*) > 0
          FROM exercise_progress ep
          WHERE ep.prescription_id = $1
            AND ep.exercise_id = el.id
            AND ep.completed_at::date = CURRENT_DATE
        ) as completed_today
       FROM prescribed_exercises pe
       JOIN exercise_library el ON el.id = pe.exercise_id
       WHERE pe.prescription_id = $1
       ORDER BY pe.display_order, el.name`,
      [prescriptionId]
    );

    return {
      patient: {
        firstName: tokenData.patient_first_name,
        lastName: tokenData.patient_last_name,
      },
      clinic: {
        name: tokenData.organization_name,
        phone: tokenData.organization_phone,
      },
      prescription: {
        id: prescription.id,
        status: prescription.status,
        startDate: prescription.start_date,
        endDate: prescription.end_date,
        patientInstructions: prescription.patient_instructions,
        prescribedAt: prescription.prescribed_at,
        prescribedBy: prescription.prescribed_by_name,
      },
      exercises: exercisesResult.rows.map((row) => ({
        id: row.prescribed_exercise_id,
        exerciseId: row.exercise_id,
        name: row.name_norwegian || row.name,
        nameEnglish: row.name,
        description: row.description_norwegian || row.description,
        category: row.category,
        subcategory: row.subcategory,
        bodyRegion: row.body_region,
        difficultyLevel: row.difficulty_level,
        instructions: row.instructions_norwegian || row.instructions,
        imageUrl: row.image_url,
        videoUrl: row.video_url,
        thumbnailUrl: row.thumbnail_url,
        precautions: row.precautions,
        sets: row.sets || row.sets_default,
        reps: row.reps || row.reps_default,
        holdSeconds: row.hold_seconds || row.hold_seconds_default,
        frequencyPerDay: row.frequency_per_day,
        frequencyPerWeek: row.frequency_per_week,
        customInstructions: row.custom_instructions,
        completedToday: row.completed_today,
      })),
    };
  } catch (error) {
    logger.error('Error getting prescription detail:', error);
    throw error;
  }
};

/**
 * Get exercise detail for patient portal
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {string} exerciseId - Exercise ID
 */
export const getExerciseDetail = async (token, prescriptionId, exerciseId) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      return null;
    }

    // Verify prescription belongs to patient
    const prescriptionCheck = await query(
      `SELECT id FROM exercise_prescriptions
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
      [prescriptionId, tokenData.patient_id, tokenData.organization_id]
    );

    if (prescriptionCheck.rows.length === 0) {
      return null;
    }

    // Get exercise detail
    const result = await query(
      `SELECT
        pe.id as prescribed_exercise_id,
        pe.sets,
        pe.reps,
        pe.hold_seconds,
        pe.frequency_per_day,
        pe.frequency_per_week,
        pe.custom_instructions,
        el.*,
        (
          SELECT COUNT(*) > 0
          FROM exercise_progress ep
          WHERE ep.prescription_id = $1
            AND ep.exercise_id = el.id
            AND ep.completed_at::date = CURRENT_DATE
        ) as completed_today,
        (
          SELECT json_agg(json_build_object(
            'completedAt', ep.completed_at,
            'setsCompleted', ep.sets_completed,
            'repsCompleted', ep.reps_completed,
            'difficultyRating', ep.difficulty_rating,
            'painRating', ep.pain_rating,
            'notes', ep.notes
          ) ORDER BY ep.completed_at DESC)
          FROM exercise_progress ep
          WHERE ep.prescription_id = $1
            AND ep.exercise_id = el.id
          LIMIT 10
        ) as progress_history
       FROM prescribed_exercises pe
       JOIN exercise_library el ON el.id = pe.exercise_id
       WHERE pe.prescription_id = $1
         AND pe.exercise_id = $2`,
      [prescriptionId, exerciseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      patient: {
        firstName: tokenData.patient_first_name,
        lastName: tokenData.patient_last_name,
      },
      clinic: {
        name: tokenData.organization_name,
        phone: tokenData.organization_phone,
      },
      exercise: {
        id: row.prescribed_exercise_id,
        exerciseId: row.id,
        name: row.name_norwegian || row.name,
        nameEnglish: row.name,
        description: row.description_norwegian || row.description,
        category: row.category,
        subcategory: row.subcategory,
        bodyRegion: row.body_region,
        difficultyLevel: row.difficulty_level,
        instructions: row.instructions_norwegian || row.instructions,
        imageUrl: row.image_url,
        videoUrl: row.video_url,
        thumbnailUrl: row.thumbnail_url,
        precautions: row.precautions,
        contraindications: row.contraindications,
        sets: row.sets || row.sets_default,
        reps: row.reps || row.reps_default,
        holdSeconds: row.hold_seconds || row.hold_seconds_default,
        frequencyPerDay: row.frequency_per_day || row.frequency_per_day_default,
        frequencyPerWeek: row.frequency_per_week || row.frequency_per_week_default,
        customInstructions: row.custom_instructions,
        completedToday: row.completed_today,
        progressHistory: row.progress_history || [],
      },
    };
  } catch (error) {
    logger.error('Error getting exercise detail:', error);
    throw error;
  }
};

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Record exercise completion from patient portal
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {string} exerciseId - Exercise ID
 * @param {object} progressData - Progress data
 */
export const recordExerciseProgress = async (token, prescriptionId, exerciseId, progressData) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      throw new Error('Ugyldig eller utlopt tilgangstoken');
    }

    // Verify prescription belongs to patient
    const prescriptionCheck = await query(
      `SELECT id FROM exercise_prescriptions
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3 AND status = 'active'`,
      [prescriptionId, tokenData.patient_id, tokenData.organization_id]
    );

    if (prescriptionCheck.rows.length === 0) {
      throw new Error('Oppskriften ble ikke funnet eller er ikke aktiv');
    }

    const {
      setsCompleted,
      repsCompleted,
      holdSecondsCompleted,
      difficultyRating,
      painRating,
      notes,
    } = progressData;

    const result = await query(
      `INSERT INTO exercise_progress (
        prescription_id, patient_id, exercise_id,
        sets_completed, reps_completed, hold_seconds_completed,
        difficulty_rating, pain_rating, notes, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'portal')
      RETURNING *`,
      [
        prescriptionId,
        tokenData.patient_id,
        exerciseId,
        setsCompleted,
        repsCompleted,
        holdSecondsCompleted,
        difficultyRating,
        painRating,
        notes,
      ]
    );

    logger.info('Exercise progress recorded:', {
      patientId: tokenData.patient_id,
      prescriptionId,
      exerciseId,
    });

    return {
      success: true,
      progress: result.rows[0],
      message: 'Fremgang registrert!',
    };
  } catch (error) {
    logger.error('Error recording exercise progress:', error);
    throw error;
  }
};

/**
 * Get progress history for a prescription
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {object} options - Query options (limit, offset)
 */
export const getProgressHistory = async (token, prescriptionId, options = {}) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      return null;
    }

    const { limit = 50, offset = 0 } = options;

    // Verify prescription belongs to patient
    const prescriptionCheck = await query(
      `SELECT id FROM exercise_prescriptions
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
      [prescriptionId, tokenData.patient_id, tokenData.organization_id]
    );

    if (prescriptionCheck.rows.length === 0) {
      return null;
    }

    const result = await query(
      `SELECT
        ep.*,
        el.name as exercise_name,
        el.name_norwegian as exercise_name_norwegian,
        el.category
       FROM exercise_progress ep
       JOIN exercise_library el ON el.id = ep.exercise_id
       WHERE ep.prescription_id = $1
       ORDER BY ep.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [prescriptionId, limit, offset]
    );

    // Get summary stats
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_completions,
        COUNT(DISTINCT DATE(completed_at)) as active_days,
        AVG(difficulty_rating) as avg_difficulty,
        AVG(pain_rating) as avg_pain
       FROM exercise_progress
       WHERE prescription_id = $1`,
      [prescriptionId]
    );

    const stats = statsResult.rows[0];

    return {
      progress: result.rows.map((row) => ({
        id: row.id,
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name_norwegian || row.exercise_name,
        category: row.category,
        completedAt: row.completed_at,
        setsCompleted: row.sets_completed,
        repsCompleted: row.reps_completed,
        holdSecondsCompleted: row.hold_seconds_completed,
        difficultyRating: row.difficulty_rating,
        painRating: row.pain_rating,
        notes: row.notes,
      })),
      stats: {
        totalCompletions: parseInt(stats.total_completions),
        activeDays: parseInt(stats.active_days),
        avgDifficulty: parseFloat(stats.avg_difficulty) || 0,
        avgPain: parseFloat(stats.avg_pain) || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting progress history:', error);
    throw error;
  }
};

/**
 * Get daily progress summary for patient
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {Date} date - Date to get summary for
 */
export const getDailyProgressSummary = async (token, prescriptionId, date = new Date()) => {
  try {
    const tokenData = await validatePortalToken(token);
    if (!tokenData) {
      return null;
    }

    const dateStr = date.toISOString().split('T')[0];

    const result = await query(
      `SELECT
        COUNT(DISTINCT ep.exercise_id) as exercises_completed,
        (SELECT COUNT(*) FROM prescribed_exercises WHERE prescription_id = $1) as total_exercises,
        SUM(ep.sets_completed) as total_sets,
        SUM(ep.reps_completed) as total_reps,
        AVG(ep.difficulty_rating) as avg_difficulty,
        AVG(ep.pain_rating) as avg_pain
       FROM exercise_progress ep
       JOIN exercise_prescriptions p ON p.id = ep.prescription_id
       WHERE ep.prescription_id = $1
         AND p.patient_id = $2
         AND ep.completed_at::date = $3`,
      [prescriptionId, tokenData.patient_id, dateStr]
    );

    const row = result.rows[0] || {};
    const exercisesCompleted = parseInt(row.exercises_completed) || 0;
    const totalExercises = parseInt(row.total_exercises) || 0;

    return {
      date: dateStr,
      exercisesCompleted,
      totalExercises,
      completionPercentage:
        totalExercises > 0 ? Math.round((exercisesCompleted / totalExercises) * 100) : 0,
      totalSets: parseInt(row.total_sets) || 0,
      totalReps: parseInt(row.total_reps) || 0,
      avgDifficulty: parseFloat(row.avg_difficulty) || 0,
      avgPain: parseFloat(row.avg_pain) || 0,
    };
  } catch (error) {
    logger.error('Error getting daily progress summary:', error);
    throw error;
  }
};

// Export default for service
export default {
  // Token management
  createPortalToken,
  validatePortalToken,
  revokePortalToken,

  // Patient access
  getPatientPrescriptions,
  getPrescriptionDetail,
  getExerciseDetail,

  // Progress tracking
  recordExerciseProgress,
  getProgressHistory,
  getDailyProgressSummary,
};
