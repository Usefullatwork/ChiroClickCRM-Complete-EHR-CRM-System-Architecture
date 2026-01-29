/**
 * Exercise Library Service
 * Business logic for exercise management, prescriptions, and programs
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// EXERCISE LIBRARY CRUD
// ============================================================================

/**
 * Get all exercises with filtering and pagination
 */
export const getAllExercises = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    category = null,
    bodyRegion = null,
    difficulty = null,
    search = null,
    tags = null,
    includeGlobal = true,
    activeOnly = true
  } = options;

  const offset = (page - 1) * limit;
  const params = [organizationId];
  let paramIndex = 2;
  const conditions = [];

  // Base condition: org-specific or global exercises
  if (includeGlobal) {
    conditions.push(`(e.organization_id = $1 OR e.is_global = true)`);
  } else {
    conditions.push(`e.organization_id = $1`);
  }

  // Active filter
  if (activeOnly) {
    conditions.push(`e.is_active = true`);
  }

  // Category filter
  if (category) {
    params.push(category);
    conditions.push(`e.category = $${paramIndex++}`);
  }

  // Body region filter
  if (bodyRegion) {
    params.push(bodyRegion);
    conditions.push(`e.body_region = $${paramIndex++}`);
  }

  // Difficulty filter
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`e.difficulty = $${paramIndex++}`);
  }

  // Search filter (name and instructions)
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(e.name_no ILIKE $${paramIndex} OR e.name_en ILIKE $${paramIndex} OR e.code ILIKE $${paramIndex})`);
    paramIndex++;
  }

  // Tags filter
  if (tags && Array.isArray(tags) && tags.length > 0) {
    params.push(tags);
    conditions.push(`e.tags && $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Count query
    const countResult = await query(
      `SELECT COUNT(*) FROM exercise_library e ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const result = await query(
      `SELECT
        e.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM exercise_library e
      LEFT JOIN users u ON u.id = e.created_by
      ${whereClause}
      ORDER BY e.name_no ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching exercises:', error);
    throw error;
  }
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (exerciseId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        e.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM exercise_library e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.id = $1 AND (e.organization_id = $2 OR e.is_global = true)`,
      [exerciseId, organizationId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching exercise by ID:', error);
    throw error;
  }
};

/**
 * Get exercise by code
 */
export const getExerciseByCode = async (code, organizationId) => {
  try {
    const result = await query(
      `SELECT * FROM exercise_library
       WHERE code = $1 AND (organization_id = $2 OR is_global = true)
       LIMIT 1`,
      [code, organizationId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching exercise by code:', error);
    throw error;
  }
};

/**
 * Create a new exercise
 */
export const createExercise = async (organizationId, exerciseData, createdBy) => {
  const {
    code,
    name_no,
    name_en,
    category,
    body_region,
    difficulty = 'beginner',
    instructions_no,
    instructions_en,
    contraindications,
    precautions,
    common_errors,
    video_url,
    image_url,
    thumbnail_url,
    default_sets = 3,
    default_reps = 10,
    default_hold_seconds,
    default_rest_seconds = 30,
    default_frequency = 'daily',
    equipment_needed = [],
    requires_supervision = false,
    source = 'custom',
    tags = [],
    is_global = false
  } = exerciseData;

  try {
    const result = await query(
      `INSERT INTO exercise_library (
        organization_id, code, name_no, name_en, category, body_region, difficulty,
        instructions_no, instructions_en, contraindications, precautions, common_errors,
        video_url, image_url, thumbnail_url,
        default_sets, default_reps, default_hold_seconds, default_rest_seconds, default_frequency,
        equipment_needed, requires_supervision, source, tags, is_global, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *`,
      [
        organizationId, code, name_no, name_en, category, body_region, difficulty,
        instructions_no, instructions_en, contraindications, precautions, common_errors,
        video_url, image_url, thumbnail_url,
        default_sets, default_reps, default_hold_seconds, default_rest_seconds, default_frequency,
        equipment_needed, requires_supervision, source, tags, is_global, createdBy
      ]
    );

    logger.info(`Exercise created: ${result.rows[0].id} (${code})`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating exercise:', error);
    throw error;
  }
};

/**
 * Update an exercise
 */
export const updateExercise = async (exerciseId, organizationId, updates) => {
  try {
    // Build dynamic update query
    const allowedFields = [
      'name_no', 'name_en', 'category', 'body_region', 'difficulty',
      'instructions_no', 'instructions_en', 'contraindications', 'precautions', 'common_errors',
      'video_url', 'image_url', 'thumbnail_url',
      'default_sets', 'default_reps', 'default_hold_seconds', 'default_rest_seconds', 'default_frequency',
      'equipment_needed', 'requires_supervision', 'tags', 'is_active'
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

    values.push(exerciseId, organizationId);

    const result = await query(
      `UPDATE exercise_library
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Exercise updated: ${exerciseId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating exercise:', error);
    throw error;
  }
};

/**
 * Delete an exercise (soft delete by setting is_active = false)
 */
export const deleteExercise = async (exerciseId, organizationId) => {
  try {
    const result = await query(
      `UPDATE exercise_library
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [exerciseId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Exercise deleted (soft): ${exerciseId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error deleting exercise:', error);
    throw error;
  }
};

/**
 * Get available categories
 */
export const getCategories = async () => {
  return [
    { id: 'stretching', name_no: 'Tøyning', name_en: 'Stretching' },
    { id: 'strengthening', name_no: 'Styrke', name_en: 'Strengthening' },
    { id: 'mobility', name_no: 'Mobilitet', name_en: 'Mobility' },
    { id: 'balance', name_no: 'Balanse', name_en: 'Balance' },
    { id: 'vestibular', name_no: 'Vestibulær', name_en: 'Vestibular' },
    { id: 'breathing', name_no: 'Pust', name_en: 'Breathing' },
    { id: 'posture', name_no: 'Holdning', name_en: 'Posture' },
    { id: 'nerve_glide', name_no: 'Nervegliding', name_en: 'Nerve Glide' }
  ];
};

/**
 * Get available body regions
 */
export const getBodyRegions = async () => {
  return [
    { id: 'cervical', name_no: 'Nakke', name_en: 'Neck' },
    { id: 'thoracic', name_no: 'Brystsøyle', name_en: 'Thoracic' },
    { id: 'lumbar', name_no: 'Korsrygg', name_en: 'Lower Back' },
    { id: 'shoulder', name_no: 'Skulder', name_en: 'Shoulder' },
    { id: 'hip', name_no: 'Hofte', name_en: 'Hip' },
    { id: 'knee', name_no: 'Kne', name_en: 'Knee' },
    { id: 'ankle', name_no: 'Ankel', name_en: 'Ankle' },
    { id: 'core', name_no: 'Kjerne', name_en: 'Core' },
    { id: 'full_body', name_no: 'Helkropp', name_en: 'Full Body' },
    { id: 'upper_extremity', name_no: 'Overekstremitet', name_en: 'Upper Extremity' },
    { id: 'lower_extremity', name_no: 'Underekstremitet', name_en: 'Lower Extremity' }
  ];
};

// ============================================================================
// PATIENT PRESCRIPTIONS
// ============================================================================

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
    reminder_time
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
        organizationId, patient_id, encounter_id, prescribed_by,
        exercise_id, exercise_code, exercise_name, exercise_instructions,
        sets, reps, hold_seconds, rest_seconds, frequency, duration_weeks,
        custom_instructions, progression_notes, start_date || new Date(), specific_days,
        reminder_enabled, reminder_time
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

    // Count query
    const countResult = await query(
      `SELECT COUNT(*) FROM patient_exercise_prescriptions pep
       WHERE pep.patient_id = $1 AND pep.organization_id = $2 ${statusCondition}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const result = await query(
      `SELECT
        pep.*,
        e.video_url,
        e.image_url,
        e.thumbnail_url,
        e.category,
        e.body_region,
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
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
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
        e.video_url,
        e.image_url,
        e.thumbnail_url,
        e.category,
        e.body_region,
        e.contraindications,
        e.precautions,
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
      'sets', 'reps', 'hold_seconds', 'rest_seconds', 'frequency', 'duration_weeks',
      'custom_instructions', 'progression_notes', 'end_date', 'specific_days',
      'reminder_enabled', 'reminder_time', 'patient_rating', 'patient_feedback',
      'clinician_rating', 'clinician_notes'
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
  const {
    date,
    completed,
    pain_level,
    notes,
    sets_completed,
    difficulty_rating
  } = complianceData;

  const logDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await query(
      `UPDATE patient_exercise_prescriptions
       SET compliance_log = compliance_log || $1::jsonb,
           updated_at = NOW()
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
            logged_at: new Date().toISOString()
          }
        }),
        prescriptionId,
        organizationId
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
       SET status = 'discontinued',
           discontinue_reason = $1,
           discontinued_at = NOW(),
           discontinued_by = $2,
           updated_at = NOW()
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
       SET status = 'completed',
           end_date = CURRENT_DATE,
           updated_at = NOW()
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

// ============================================================================
// EXERCISE PROGRAMS
// ============================================================================

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
    activeOnly = true
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
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
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
    is_global = false
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
        organizationId, name_no, name_en, description_no, description_en,
        target_condition, body_region, difficulty, JSON.stringify(exercises), duration_weeks,
        phases, is_global, createdBy
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
      'name_no', 'name_en', 'description_no', 'description_en',
      'target_condition', 'body_region', 'difficulty', 'exercises',
      'duration_weeks', 'phases', 'is_active'
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
    custom_duration_weeks
  } = assignmentData;

  try {
    // Get the program
    const program = await getProgramById(program_id, organizationId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Create patient program assignment
    const result = await query(
      `INSERT INTO patient_exercise_programs (
        organization_id, patient_id, program_id, encounter_id, prescribed_by,
        program_name, program_description, custom_exercises, custom_duration_weeks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        organizationId, patient_id, program_id, encounter_id, prescribed_by,
        program.name_no, program.description_no,
        custom_exercises ? JSON.stringify(custom_exercises) : null,
        custom_duration_weeks || program.duration_weeks
      ]
    );

    // Create individual prescriptions for each exercise in the program
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
        custom_instructions: exercise.notes
      });
    }

    // Increment program usage count
    await query(
      `UPDATE exercise_programs SET usage_count = usage_count + 1 WHERE id = $1`,
      [program_id]
    );

    logger.info(`Program ${program_id} assigned to patient ${patient_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error assigning program to patient:', error);
    throw error;
  }
};

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Get user's favorite exercises
 */
export const getUserFavorites = async (userId, organizationId, limit = 20) => {
  try {
    const result = await query(
      `SELECT
        e.*,
        ef.usage_count,
        ef.last_used_at
      FROM exercise_favorites ef
      JOIN exercise_library e ON e.id = ef.exercise_id
      WHERE ef.user_id = $1 AND ef.organization_id = $2 AND e.is_active = true
      ORDER BY ef.usage_count DESC, ef.last_used_at DESC
      LIMIT $3`,
      [userId, organizationId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching user favorites:', error);
    throw error;
  }
};

/**
 * Get recently used exercises
 */
export const getRecentlyUsed = async (userId, organizationId, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        e.*,
        ef.usage_count,
        ef.last_used_at
      FROM exercise_favorites ef
      JOIN exercise_library e ON e.id = ef.exercise_id
      WHERE ef.user_id = $1 AND ef.organization_id = $2 AND e.is_active = true
      ORDER BY ef.last_used_at DESC
      LIMIT $3`,
      [userId, organizationId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching recently used exercises:', error);
    throw error;
  }
};

// ============================================================================
// STATISTICS
// ============================================================================

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
        exercise_code,
        exercise_name,
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
        pep.id,
        pep.exercise_name,
        pep.patient_id,
        p.first_name || ' ' || p.last_name as patient_name,
        calculate_prescription_compliance(pep.id) as compliance_percent,
        pep.start_date,
        CURRENT_DATE - pep.start_date as days_active
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

export default {
  // Exercise Library
  getAllExercises,
  getExerciseById,
  getExerciseByCode,
  createExercise,
  updateExercise,
  deleteExercise,
  getCategories,
  getBodyRegions,
  // Prescriptions
  prescribeExercise,
  getPatientExercises,
  getPrescriptionById,
  updatePrescription,
  logCompliance,
  discontinuePrescription,
  completePrescription,
  // Programs
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  assignProgramToPatient,
  // Favorites
  getUserFavorites,
  getRecentlyUsed,
  // Statistics
  getExerciseStats,
  getTopPrescribedExercises,
  getComplianceStats
};
