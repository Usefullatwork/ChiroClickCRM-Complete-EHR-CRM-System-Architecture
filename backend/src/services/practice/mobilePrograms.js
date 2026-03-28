/**
 * Mobile Programs Service
 * Business logic for coaching program browsing and enrollment
 */

import { query } from '../../config/database.js';

/**
 * List available coaching programs with optional filters
 * @param {object} filters - type, difficulty, search
 * @returns {Array} Array of program records with creator info
 */
export async function listPrograms(filters) {
  const { type, difficulty, search } = filters;

  let sql = `
    SELECT
      p.*,
      u.first_name || ' ' || u.last_name as created_by_name,
      (SELECT COUNT(*) FROM user_program_enrollments WHERE program_id = p.id) as enrollment_count
    FROM coaching_programs p
    LEFT JOIN users u ON u.id = p.created_by
    WHERE p.is_active = TRUE AND p.is_public = TRUE
  `;
  const params = [];
  let paramIndex = 1;

  if (type) {
    sql += ` AND p.program_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  if (difficulty) {
    sql += ` AND p.difficulty_level = $${paramIndex}`;
    params.push(difficulty);
    paramIndex++;
  }

  if (search) {
    sql += ` AND (p.name ILIKE $${paramIndex} OR p.name_norwegian ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  sql += ` ORDER BY p.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get detailed program info including weeks, exercises, and enrollment status
 * @param {string} programId - Program UUID
 * @param {string} mobileUserId - Mobile user UUID
 * @returns {object|null} Full program with weeks/exercises, or null if not found
 */
export async function getProgramDetails(programId, mobileUserId) {
  const programResult = await query(
    `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
     FROM coaching_programs p
     LEFT JOIN users u ON u.id = p.created_by
     WHERE p.id = $1 AND p.is_active = TRUE`,
    [programId]
  );

  if (programResult.rows.length === 0) {
    return null;
  }

  const program = programResult.rows[0];

  const weeksResult = await query(
    `SELECT
      pw.*,
      json_agg(
        json_build_object(
          'id', pe.id,
          'exerciseId', pe.exercise_id,
          'dayOfWeek', pe.day_of_week,
          'orderIndex', pe.order_index,
          'sets', pe.sets,
          'reps', pe.reps,
          'holdSeconds', pe.hold_seconds,
          'restSeconds', pe.rest_seconds,
          'rirTarget', pe.rir_target,
          'notes', pe.notes,
          'exercise', json_build_object(
            'id', e.id,
            'name', e.name,
            'nameNorwegian', e.name_norwegian,
            'videoUrl', e.video_url,
            'thumbnailUrl', e.thumbnail_url,
            'category', e.category
          )
        ) ORDER BY pe.day_of_week, pe.order_index
      ) FILTER (WHERE pe.id IS NOT NULL) as exercises
    FROM program_weeks pw
    LEFT JOIN program_exercises pe ON pe.program_week_id = pw.id
    LEFT JOIN exercise_library e ON e.id = pe.exercise_id
    WHERE pw.program_id = $1
    GROUP BY pw.id
    ORDER BY pw.week_number`,
    [programId]
  );

  const enrollmentResult = await query(
    `SELECT id, mobile_user_id, program_id, assigned_by, started_at, current_week, current_day,
            status, paused_at, completed_at, notes, created_at
     FROM user_program_enrollments
     WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'`,
    [mobileUserId, programId]
  );

  return {
    ...program,
    weeks: weeksResult.rows,
    isEnrolled: enrollmentResult.rows.length > 0,
    enrollment: enrollmentResult.rows[0] || null,
  };
}

/**
 * Enroll a mobile user in a program
 * @param {string} programId - Program UUID
 * @param {string} mobileUserId - Mobile user UUID
 * @returns {object} The enrollment record
 * @throws {Error} If already enrolled
 */
export async function enrollInProgram(programId, mobileUserId) {
  const existingResult = await query(
    `SELECT id, mobile_user_id, program_id, assigned_by, started_at, current_week, current_day,
            status, paused_at, completed_at, notes, created_at
     FROM user_program_enrollments
     WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'`,
    [mobileUserId, programId]
  );

  if (existingResult.rows.length > 0) {
    throw new Error('Already enrolled in this program');
  }

  const result = await query(
    `INSERT INTO user_program_enrollments (mobile_user_id, program_id)
     VALUES ($1, $2)
     RETURNING *`,
    [mobileUserId, programId]
  );

  return result.rows[0];
}

/**
 * Get all programs the user is enrolled in
 * @param {string} mobileUserId - Mobile user UUID
 * @returns {Array} Enrollment records with program details
 */
export async function getMyPrograms(mobileUserId) {
  const result = await query(
    `SELECT
      e.*,
      p.name, p.name_norwegian, p.description, p.description_norwegian,
      p.program_type, p.duration_weeks, p.difficulty_level, p.cover_image_url
    FROM user_program_enrollments e
    JOIN coaching_programs p ON p.id = e.program_id
    WHERE e.mobile_user_id = $1
    ORDER BY e.status = 'active' DESC, e.started_at DESC`,
    [mobileUserId]
  );
  return result.rows;
}
