/**
 * Exercise Programs
 * Program templates, assignment, and statistics
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { prescribeExercise } from './exercisePrescriptions.js';

/**
 * Get all exercise programs
 */
export const getAllPrograms = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    targetCondition = null,
    bodyRegion = null,
    includeGlobal = true,
    activeOnly = true,
  } = options;

  const offset = (page - 1) * limit;
  const params = [organizationId];
  let paramIndex = 2;
  const conditions = [];

  if (includeGlobal) {
    conditions.push(`(ep.organization_id = $1 OR ep.is_global = true)`);
  } else {
    conditions.push(`ep.organization_id = $1`);
  }

  if (activeOnly) {
    conditions.push(`ep.is_active = true`);
  }

  if (targetCondition) {
    params.push(targetCondition);
    conditions.push(`ep.target_condition = $${paramIndex++}`);
  }

  if (bodyRegion) {
    params.push(bodyRegion);
    conditions.push(`ep.body_region = $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM exercise_programs ep ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT
        ep.*,
        jsonb_array_length(ep.exercises) as exercise_count,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM exercise_programs ep
      LEFT JOIN users u ON u.id = ep.created_by
      ${whereClause}
      ORDER BY ep.usage_count DESC, ep.name_no ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Error fetching exercise programs:', error);
    throw error;
  }
};

/**
 * Get program by ID
 */
export const getProgramById = async (programId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        ep.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM exercise_programs ep
      LEFT JOIN users u ON u.id = ep.created_by
      WHERE ep.id = $1 AND (ep.organization_id = $2 OR ep.is_global = true)`,
      [programId, organizationId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching program by ID:', error);
    throw error;
  }
};

/**
 * Create an exercise program
 */
export const createProgram = async (organizationId, programData, createdBy) => {
  const {
    name_no,
    name_en,
    description_no,
    description_en,
    target_condition,
    body_region,
    difficulty = 'beginner',
    exercises = [],
    duration_weeks = 6,
    phases = 1,
    is_global = false,
  } = programData;

  try {
    const result = await query(
      `INSERT INTO exercise_programs (
        organization_id, name_no, name_en, description_no, description_en,
        target_condition, body_region, difficulty, exercises, duration_weeks,
        phases, is_global, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        organizationId,
        name_no,
        name_en,
        description_no,
        description_en,
        target_condition,
        body_region,
        difficulty,
        JSON.stringify(exercises),
        duration_weeks,
        phases,
        is_global,
        createdBy,
      ]
    );

    logger.info(`Exercise program created: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating exercise program:', error);
    throw error;
  }
};

/**
 * Update an exercise program
 */
export const updateProgram = async (programId, organizationId, updates) => {
  try {
    const allowedFields = [
      'name_no',
      'name_en',
      'description_no',
      'description_en',
      'target_condition',
      'body_region',
      'difficulty',
      'exercises',
      'duration_weeks',
      'phases',
      'is_active',
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(key === 'exercises' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(programId, organizationId);

    const result = await query(
      `UPDATE exercise_programs
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Exercise program updated: ${programId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating exercise program:', error);
    throw error;
  }
};

/**
 * Delete an exercise program
 */
export const deleteProgram = async (programId, organizationId) => {
  try {
    const result = await query(
      `UPDATE exercise_programs
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [programId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Exercise program deleted: ${programId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error deleting exercise program:', error);
    throw error;
  }
};

/**
 * Assign a program to a patient
 */
export const assignProgramToPatient = async (organizationId, assignmentData) => {
  const {
    patient_id,
    program_id,
    encounter_id,
    prescribed_by,
    custom_exercises,
    custom_duration_weeks,
  } = assignmentData;

  try {
    const program = await getProgramById(program_id, organizationId);
    if (!program) {
      throw new Error('Program not found');
    }

    const result = await query(
      `INSERT INTO patient_exercise_programs (
        organization_id, patient_id, program_id, encounter_id, prescribed_by,
        program_name, program_description, custom_exercises, custom_duration_weeks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        organizationId,
        patient_id,
        program_id,
        encounter_id,
        prescribed_by,
        program.name_no,
        program.description_no,
        custom_exercises ? JSON.stringify(custom_exercises) : null,
        custom_duration_weeks || program.duration_weeks,
      ]
    );

    const exercises = custom_exercises || program.exercises;
    for (const exercise of exercises) {
      await prescribeExercise(organizationId, {
        patient_id,
        encounter_id,
        prescribed_by,
        exercise_id: exercise.exercise_id,
        exercise_code: exercise.exercise_code,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        hold_seconds: exercise.hold_seconds,
        frequency: exercise.frequency,
        duration_weeks: custom_duration_weeks || program.duration_weeks,
        custom_instructions: exercise.notes,
      });
    }

    await query(`UPDATE exercise_programs SET usage_count = usage_count + 1 WHERE id = $1`, [
      program_id,
    ]);

    logger.info(`Program ${program_id} assigned to patient ${patient_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error assigning program to patient:', error);
    throw error;
  }
};

/**
 * Get exercise statistics for an organization
 */
export const getExerciseStats = async (organizationId) => {
  try {
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM exercise_library WHERE organization_id = $1 OR is_global = true) as total_exercises,
        (SELECT COUNT(*) FROM patient_exercise_prescriptions WHERE organization_id = $1 AND status = 'active') as active_prescriptions,
        (SELECT COUNT(*) FROM exercise_programs WHERE organization_id = $1 OR is_global = true) as total_programs,
        (SELECT COUNT(DISTINCT patient_id) FROM patient_exercise_prescriptions WHERE organization_id = $1 AND status = 'active') as patients_with_exercises`,
      [organizationId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching exercise stats:', error);
    throw error;
  }
};

/**
 * Get top prescribed exercises
 */
export const getTopPrescribedExercises = async (organizationId, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        exercise_code, exercise_name,
        COUNT(*) as prescription_count,
        AVG(CASE WHEN patient_rating IS NOT NULL THEN patient_rating END)::DECIMAL(3,1) as avg_rating
      FROM patient_exercise_prescriptions
      WHERE organization_id = $1
      GROUP BY exercise_code, exercise_name
      ORDER BY prescription_count DESC
      LIMIT $2`,
      [organizationId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching top prescribed exercises:', error);
    throw error;
  }
};

/**
 * Get compliance statistics
 */
export const getComplianceStats = async (organizationId, days = 30) => {
  try {
    const result = await query(
      `SELECT
        pep.id, pep.exercise_name, pep.patient_id,
        p.first_name || ' ' || p.last_name as patient_name,
        calculate_prescription_compliance(pep.id) as compliance_percent,
        pep.start_date, CURRENT_DATE - pep.start_date as days_active
      FROM patient_exercise_prescriptions pep
      JOIN patients p ON p.id = pep.patient_id
      WHERE pep.organization_id = $1
        AND pep.status = 'active'
        AND pep.start_date >= CURRENT_DATE - $2::INTEGER
      ORDER BY calculate_prescription_compliance(pep.id) ASC
      LIMIT 20`,
      [organizationId, days]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching compliance stats:', error);
    throw error;
  }
};
