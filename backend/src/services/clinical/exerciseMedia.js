/**
 * Exercise Prescriptions and Portal — Prescription management and patient portal access.
 *
 * @module services/clinical/exerciseMedia
 */

import { query, transaction } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Create a new exercise prescription
 */
export const createPrescription = async (organizationId, prescriptionData) => {
  const client = await transaction.start();

  try {
    const {
      patientId,
      encounterId,
      prescribedBy,
      startDate,
      endDate,
      clinicalNotes,
      patientInstructions,
      deliveryMethod,
      exercises, // Array of { exerciseId, sets, reps, holdSeconds, customInstructions }
    } = prescriptionData;

    // Create prescription
    const prescriptionResult = await client.query(
      `INSERT INTO exercise_prescriptions (
        organization_id, patient_id, encounter_id, prescribed_by,
        start_date, end_date, clinical_notes, patient_instructions,
        delivery_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        organizationId,
        patientId,
        encounterId,
        prescribedBy,
        startDate || new Date(),
        endDate,
        clinicalNotes,
        patientInstructions,
        deliveryMethod || 'portal',
      ]
    );

    const prescription = prescriptionResult.rows[0];

    // Add exercises to prescription
    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          `INSERT INTO prescribed_exercises (
            prescription_id, exercise_id, sets, reps, hold_seconds,
            frequency_per_day, frequency_per_week, custom_instructions, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            prescription.id,
            ex.exerciseId,
            ex.sets,
            ex.reps,
            ex.holdSeconds,
            ex.frequencyPerDay,
            ex.frequencyPerWeek,
            ex.customInstructions,
            i,
          ]
        );

        // Increment usage count
        await client.query(
          `UPDATE exercise_library SET usage_count = usage_count + 1 WHERE id = $1`,
          [ex.exerciseId]
        );
      }
    }

    await transaction.commit(client);

    logger.info('Exercise prescription created:', {
      organizationId,
      prescriptionId: prescription.id,
      patientId,
      exerciseCount: exercises?.length || 0,
    });

    return prescription;
  } catch (error) {
    await transaction.rollback(client);
    logger.error('Error creating prescription:', error);
    throw error;
  }
};

/**
 * Get prescriptions for a patient
 */
export const getPatientPrescriptions = async (organizationId, patientId, status = null) => {
  try {
    let sql = `
      SELECT
        p.*,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        (
          SELECT json_agg(json_build_object(
            'id', pe.id,
            'exerciseId', pe.exercise_id,
            'sets', COALESCE(pe.sets, el.sets_default),
            'reps', COALESCE(pe.reps, el.reps_default),
            'holdSeconds', COALESCE(pe.hold_seconds, el.hold_seconds),
            'frequencyPerDay', COALESCE(pe.frequency_per_day, el.frequency_per_day),
            'frequencyPerWeek', COALESCE(pe.frequency_per_week, el.frequency_per_week),
            'customInstructions', pe.custom_instructions,
            'displayOrder', pe.display_order,
            'exercise', json_build_object(
              'id', el.id,
              'name', el.name,
              'nameNorwegian', el.name_norwegian,
              'category', el.category,
              'instructions', el.instructions,
              'instructionsNorwegian', el.instructions_norwegian,
              'imageUrl', el.image_url,
              'videoUrl', el.video_url
            )
          ) ORDER BY pe.display_order)
          FROM prescribed_exercises pe
          JOIN exercise_library el ON el.id = pe.exercise_id
          WHERE pe.prescription_id = p.id
        ) as exercises
      FROM exercise_prescriptions p
      LEFT JOIN users u ON u.id = p.prescribed_by
      WHERE p.organization_id = $1 AND p.patient_id = $2
    `;
    const params = [organizationId, patientId];

    if (status) {
      sql += ` AND p.status = $3`;
      params.push(status);
    }

    sql += ` ORDER BY p.prescribed_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting patient prescriptions:', error);
    throw error;
  }
};

/**
 * Get prescription by ID
 */
export const getPrescriptionById = async (organizationId, prescriptionId) => {
  try {
    const result = await query(
      `SELECT
        p.*,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        pt.first_name || ' ' || pt.last_name as patient_name,
        pt.email as patient_email,
        (
          SELECT json_agg(json_build_object(
            'id', pe.id,
            'exerciseId', pe.exercise_id,
            'sets', COALESCE(pe.sets, el.sets_default),
            'reps', COALESCE(pe.reps, el.reps_default),
            'holdSeconds', COALESCE(pe.hold_seconds, el.hold_seconds),
            'frequencyPerDay', COALESCE(pe.frequency_per_day, el.frequency_per_day),
            'frequencyPerWeek', COALESCE(pe.frequency_per_week, el.frequency_per_week),
            'customInstructions', pe.custom_instructions,
            'displayOrder', pe.display_order,
            'exercise', json_build_object(
              'id', el.id,
              'name', el.name,
              'nameNorwegian', el.name_norwegian,
              'description', el.description,
              'descriptionNorwegian', el.description_norwegian,
              'category', el.category,
              'subcategory', el.subcategory,
              'bodyRegion', el.body_region,
              'difficultyLevel', el.difficulty_level,
              'instructions', el.instructions,
              'instructionsNorwegian', el.instructions_norwegian,
              'imageUrl', el.image_url,
              'videoUrl', el.video_url,
              'contraindications', el.contraindications,
              'precautions', el.precautions
            )
          ) ORDER BY pe.display_order)
          FROM prescribed_exercises pe
          JOIN exercise_library el ON el.id = pe.exercise_id
          WHERE pe.prescription_id = p.id
        ) as exercises
      FROM exercise_prescriptions p
      LEFT JOIN users u ON u.id = p.prescribed_by
      LEFT JOIN patients pt ON pt.id = p.patient_id
      WHERE p.organization_id = $1 AND p.id = $2`,
      [organizationId, prescriptionId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting prescription by ID:', error);
    throw error;
  }
};

/**
 * Update prescription status
 */
export const updatePrescriptionStatus = async (organizationId, prescriptionId, status) => {
  try {
    const validStatuses = ['active', 'completed', 'cancelled', 'paused'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const result = await query(
      `UPDATE exercise_prescriptions
       SET status = $1
       WHERE organization_id = $2 AND id = $3
       RETURNING *`,
      [status, organizationId, prescriptionId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating prescription status:', error);
    throw error;
  }
};

/**
 * Update prescription email delivery status
 */
export const updatePrescriptionEmailStatus = async (prescriptionId, delivered) => {
  try {
    await query(
      `UPDATE exercise_prescriptions
       SET email_sent_at = CURRENT_TIMESTAMP, email_delivered = $1
       WHERE id = $2`,
      [delivered, prescriptionId]
    );
    return true;
  } catch (error) {
    logger.error('Error updating prescription email status:', error);
    throw error;
  }
};

/**
 * Get prescription by portal access token (for patient portal)
 */
export const getPrescriptionByPortalToken = async (token) => {
  try {
    const result = await query(
      `SELECT
        p.*,
        u.first_name || ' ' || u.last_name as prescribed_by_name,
        o.name as clinic_name,
        o.phone as clinic_phone,
        (
          SELECT json_agg(json_build_object(
            'id', pe.id,
            'exerciseId', pe.exercise_id,
            'sets', COALESCE(pe.sets, el.sets_default),
            'reps', COALESCE(pe.reps, el.reps_default),
            'holdSeconds', COALESCE(pe.hold_seconds, el.hold_seconds),
            'frequencyPerDay', COALESCE(pe.frequency_per_day, el.frequency_per_day),
            'frequencyPerWeek', COALESCE(pe.frequency_per_week, el.frequency_per_week),
            'customInstructions', pe.custom_instructions,
            'displayOrder', pe.display_order,
            'isCompleted', pe.is_completed,
            'exercise', json_build_object(
              'id', el.id,
              'name', el.name,
              'nameNorwegian', el.name_norwegian,
              'description', el.description,
              'descriptionNorwegian', el.description_norwegian,
              'category', el.category,
              'difficultyLevel', el.difficulty_level,
              'instructions', el.instructions,
              'instructionsNorwegian', el.instructions_norwegian,
              'imageUrl', el.image_url,
              'videoUrl', el.video_url,
              'contraindications', el.contraindications,
              'precautions', el.precautions
            )
          ) ORDER BY pe.display_order)
          FROM prescribed_exercises pe
          JOIN exercise_library el ON el.id = pe.exercise_id
          WHERE pe.prescription_id = p.id
        ) as exercises
      FROM exercise_prescriptions p
      LEFT JOIN users u ON u.id = p.prescribed_by
      LEFT JOIN organizations o ON o.id = p.organization_id
      WHERE p.portal_access_token = $1
        AND p.portal_expires_at > CURRENT_TIMESTAMP
        AND p.status = 'active'`,
      [token]
    );

    if (result.rows.length > 0) {
      // Update view count and last accessed
      await query(
        `UPDATE exercise_prescriptions
         SET portal_view_count = portal_view_count + 1,
             portal_last_accessed = CURRENT_TIMESTAMP
         WHERE portal_access_token = $1`,
        [token]
      );
    }

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting prescription by portal token:', error);
    throw error;
  }
};

/**
 * Record exercise progress from patient portal
 */
export const recordProgress = async (token, progressData) => {
  try {
    // Verify token is valid
    const prescription = await query(
      `SELECT id, patient_id FROM exercise_prescriptions
       WHERE portal_access_token = $1
         AND portal_expires_at > CURRENT_TIMESTAMP
         AND status = 'active'`,
      [token]
    );

    if (prescription.rows.length === 0) {
      throw new Error('Invalid or expired access token');
    }

    const { id: prescriptionId, patient_id: patientId } = prescription.rows[0];
    const { exerciseId, setsCompleted, repsCompleted, difficultyRating, painRating, notes } =
      progressData;

    const result = await query(
      `INSERT INTO exercise_progress (
        prescription_id, patient_id, exercise_id,
        sets_completed, reps_completed, difficulty_rating, pain_rating, notes,
        source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'portal')
      RETURNING *`,
      [
        prescriptionId,
        patientId,
        exerciseId,
        setsCompleted,
        repsCompleted,
        difficultyRating,
        painRating,
        notes,
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error recording exercise progress:', error);
    throw error;
  }
};

/**
 * Get progress history for a prescription
 */
export const getProgressHistory = async (organizationId, prescriptionId) => {
  try {
    const result = await query(
      `SELECT
        ep.*,
        el.name as exercise_name,
        el.name_norwegian as exercise_name_norwegian
       FROM exercise_progress ep
       JOIN exercise_prescriptions p ON p.id = ep.prescription_id
       JOIN exercise_library el ON el.id = ep.exercise_id
       WHERE p.organization_id = $1 AND ep.prescription_id = $2
       ORDER BY ep.completed_at DESC`,
      [organizationId, prescriptionId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting progress history:', error);
    throw error;
  }
};
