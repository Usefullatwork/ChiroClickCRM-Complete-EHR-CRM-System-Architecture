/**
 * Exercise Prescriptions
 * Patient exercise prescription management and compliance tracking
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Prescribe exercise to a patient
 */
export const prescribeExercise = async (organizationId, prescriptionData) => {
  const {
    patient_id,
    encounter_id,
    prescribed_by,
    exercise_id,
    exercise_code,
    exercise_name,
    exercise_instructions,
    sets,
    reps,
    hold_seconds,
    rest_seconds,
    frequency = 'daily',
    duration_weeks = 6,
    custom_instructions,
    progression_notes,
    start_date,
    specific_days,
    reminder_enabled = false,
    reminder_time,
  } = prescriptionData;

  try {
    const result = await query(
      `INSERT INTO patient_exercise_prescriptions (
        organization_id, patient_id, encounter_id, prescribed_by,
        exercise_id, exercise_code, exercise_name, exercise_instructions,
        sets, reps, hold_seconds, rest_seconds, frequency, duration_weeks,
        custom_instructions, progression_notes, start_date, specific_days,
        reminder_enabled, reminder_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *`,
      [
        organizationId,
        patient_id,
        encounter_id,
        prescribed_by,
        exercise_id,
        exercise_code,
        exercise_name,
        exercise_instructions,
        sets,
        reps,
        hold_seconds,
        rest_seconds,
        frequency,
        duration_weeks,
        custom_instructions,
        progression_notes,
        start_date || new Date(),
        specific_days,
        reminder_enabled,
        reminder_time,
      ]
    );

    // Update exercise favorites count
    if (exercise_id && prescribed_by) {
      await query(
        `INSERT INTO exercise_favorites (user_id, exercise_id, organization_id, usage_count, last_used_at)
         VALUES ($1, $2, $3, 1, NOW())
         ON CONFLICT (user_id, exercise_id) DO UPDATE
         SET usage_count = exercise_favorites.usage_count + 1, last_used_at = NOW()`,
        [prescribed_by, exercise_id, organizationId]
      );
    }

    logger.info(`Exercise prescribed: ${result.rows[0].id} for patient ${patient_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error prescribing exercise:', error);
    throw error;
  }
};

/**
 * Get patient's exercise prescriptions
 */
export const getPatientExercises = async (patientId, organizationId, options = {}) => {
  const { status = 'active', includeCompleted = false, page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  try {
    let statusCondition = '';
    const params = [patientId, organizationId];

    if (!includeCompleted) {
      if (status === 'all') {
        statusCondition = '';
      } else {
        params.push(status);
        statusCondition = `AND pep.status = $3`;
      }
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM patient_exercise_prescriptions pep
       WHERE pep.patient_id = $1 AND pep.organization_id = $2 ${statusCondition}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT
        pep.*,
        e.video_url, e.image_url, e.thumbnail_url, e.category, e.body_region,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        calculate_prescription_compliance(pep.id) as compliance_percent
      FROM patient_exercise_prescriptions pep
      LEFT JOIN exercise_library e ON e.id = pep.exercise_id
      LEFT JOIN users u ON u.id = pep.prescribed_by
      WHERE pep.patient_id = $1 AND pep.organization_id = $2 ${statusCondition}
      ORDER BY pep.start_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Error fetching patient exercises:', error);
    throw error;
  }
};

/**
 * Get prescription by ID
 */
export const getPrescriptionById = async (prescriptionId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        pep.*,
        e.video_url, e.image_url, e.thumbnail_url, e.category, e.body_region,
        e.contraindications, e.precautions,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        p.first_name || ' ' || p.last_name as patient_name,
        calculate_prescription_compliance(pep.id) as compliance_percent
      FROM patient_exercise_prescriptions pep
      LEFT JOIN exercise_library e ON e.id = pep.exercise_id
      LEFT JOIN users u ON u.id = pep.prescribed_by
      LEFT JOIN patients p ON p.id = pep.patient_id
      WHERE pep.id = $1 AND pep.organization_id = $2`,
      [prescriptionId, organizationId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching prescription by ID:', error);
    throw error;
  }
};

/**
 * Update prescription
 */
export const updatePrescription = async (prescriptionId, organizationId, updates) => {
  try {
    const allowedFields = [
      'sets',
      'reps',
      'hold_seconds',
      'rest_seconds',
      'frequency',
      'duration_weeks',
      'custom_instructions',
      'progression_notes',
      'end_date',
      'specific_days',
      'reminder_enabled',
      'reminder_time',
      'patient_rating',
      'patient_feedback',
      'clinician_rating',
      'clinician_notes',
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(prescriptionId, organizationId);

    const result = await query(
      `UPDATE patient_exercise_prescriptions
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Prescription updated: ${prescriptionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating prescription:', error);
    throw error;
  }
};

/**
 * Log compliance for a prescription
 */
export const logCompliance = async (prescriptionId, organizationId, complianceData) => {
  const { date, completed, pain_level, notes, sets_completed, difficulty_rating } = complianceData;
  const logDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await query(
      `UPDATE patient_exercise_prescriptions
       SET compliance_log = compliance_log || $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [
        JSON.stringify({
          [logDate]: {
            completed,
            pain_level,
            notes,
            sets_completed,
            difficulty_rating,
            logged_at: new Date().toISOString(),
          },
        }),
        prescriptionId,
        organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Compliance logged for prescription ${prescriptionId}: ${logDate}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error logging compliance:', error);
    throw error;
  }
};

/**
 * Discontinue a prescription
 */
export const discontinuePrescription = async (prescriptionId, organizationId, userId, reason) => {
  try {
    const result = await query(
      `UPDATE patient_exercise_prescriptions
       SET status = 'discontinued', discontinue_reason = $1,
           discontinued_at = NOW(), discontinued_by = $2, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [reason, userId, prescriptionId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Prescription discontinued: ${prescriptionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error discontinuing prescription:', error);
    throw error;
  }
};

/**
 * Mark prescription as completed
 */
export const completePrescription = async (prescriptionId, organizationId) => {
  try {
    const result = await query(
      `UPDATE patient_exercise_prescriptions
       SET status = 'completed', end_date = CURRENT_DATE, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [prescriptionId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Prescription completed: ${prescriptionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error completing prescription:', error);
    throw error;
  }
};
