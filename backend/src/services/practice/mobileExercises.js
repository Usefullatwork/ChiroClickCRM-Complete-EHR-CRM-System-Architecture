/**
 * Mobile Exercises Service
 * Business logic for exercise library browsing from the mobile app
 */

import { query } from '../../config/database.js';

/**
 * List exercises with optional filters and pagination
 * @param {object} filters - category, bodyRegion, difficulty, search, limit, offset
 * @returns {object} { exercises, total, limit, offset }
 */
export async function listExercises(filters) {
  const { category, bodyRegion, difficulty, search, limit = 50, offset = 0 } = filters;

  let sql = `
    SELECT
      id, name, name_norwegian, description, description_norwegian,
      category, subcategory, body_region, difficulty_level,
      instructions, instructions_norwegian,
      sets_default, reps_default, hold_seconds,
      video_url, thumbnail_url, image_url,
      tags
    FROM exercise_library
    WHERE is_active = TRUE
  `;
  const params = [];
  let paramIndex = 1;

  if (category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (bodyRegion) {
    sql += ` AND body_region = $${paramIndex}`;
    params.push(bodyRegion);
    paramIndex++;
  }

  if (difficulty) {
    sql += ` AND difficulty_level = $${paramIndex}`;
    params.push(difficulty);
    paramIndex++;
  }

  if (search) {
    sql += ` AND (
      name ILIKE $${paramIndex} OR
      name_norwegian ILIKE $${paramIndex} OR
      description ILIKE $${paramIndex} OR
      description_norwegian ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  sql += ` ORDER BY name_norwegian, name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await query(sql, params);

  return {
    exercises: result.rows,
    total: result.rows.length,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

/**
 * Get a single exercise by UUID
 * @param {string} id - Exercise UUID
 * @returns {object|null} Exercise record or null
 */
export async function getExerciseById(id) {
  const result = await query(
    `SELECT
    id, organization_id, code,
    name, name_norwegian, name_no, name_en,
    description, description_norwegian,
    category, subcategory, body_region,
    difficulty_level, difficulty,
    instructions, instructions_norwegian, instructions_no, instructions_en,
    sets_default, reps_default, hold_seconds,
    default_sets, default_reps, default_hold_seconds, default_rest_seconds, default_frequency,
    frequency_per_day, frequency_per_week, duration_weeks,
    image_url, video_url, thumbnail_url,
    contraindications, precautions, common_errors,
    equipment_needed, requires_supervision,
    source, is_active, is_system, is_global,
    usage_count, display_order, tags,
    created_by, created_at, updated_at
  FROM exercise_library WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get distinct exercise categories with counts
 * @returns {Array} Array of { category, count }
 */
export async function getCategories() {
  const result = await query(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM exercise_library
    WHERE is_active = TRUE
    GROUP BY category
    ORDER BY category
  `);
  return result.rows;
}
