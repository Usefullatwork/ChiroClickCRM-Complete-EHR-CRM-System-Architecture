/**
 * Exercise Library CRUD Operations
 * Handles exercise creation, reading, updating, and deletion
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

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
    activeOnly = true,
  } = options;

  const offset = (page - 1) * limit;
  const params = [organizationId];
  let paramIndex = 2;
  const conditions = [];

  if (includeGlobal) {
    conditions.push(`(e.organization_id = $1 OR e.is_global = true)`);
  } else {
    conditions.push(`e.organization_id = $1`);
  }

  if (activeOnly) {
    conditions.push(`e.is_active = true`);
  }

  if (category) {
    params.push(category);
    conditions.push(`e.category = $${paramIndex++}`);
  }

  if (bodyRegion) {
    params.push(bodyRegion);
    conditions.push(`e.body_region = $${paramIndex++}`);
  }

  if (difficulty) {
    params.push(difficulty);
    conditions.push(`e.difficulty = $${paramIndex++}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(e.name_no ILIKE $${paramIndex} OR e.name_en ILIKE $${paramIndex} OR e.code ILIKE $${paramIndex})`
    );
    paramIndex++;
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    params.push(tags);
    conditions.push(`e.tags && $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM exercise_library e ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

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
        totalPages: Math.ceil(total / limit),
      },
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
       FROM exercise_library
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
    is_global = false,
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
        organizationId,
        code,
        name_no,
        name_en,
        category,
        body_region,
        difficulty,
        instructions_no,
        instructions_en,
        contraindications,
        precautions,
        common_errors,
        video_url,
        image_url,
        thumbnail_url,
        default_sets,
        default_reps,
        default_hold_seconds,
        default_rest_seconds,
        default_frequency,
        equipment_needed,
        requires_supervision,
        source,
        tags,
        is_global,
        createdBy,
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
    const allowedFields = [
      'name_no',
      'name_en',
      'category',
      'body_region',
      'difficulty',
      'instructions_no',
      'instructions_en',
      'contraindications',
      'precautions',
      'common_errors',
      'video_url',
      'image_url',
      'thumbnail_url',
      'default_sets',
      'default_reps',
      'default_hold_seconds',
      'default_rest_seconds',
      'default_frequency',
      'equipment_needed',
      'requires_supervision',
      'tags',
      'is_active',
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
export const getCategories = async () => [
  { id: 'stretching', name_no: 'Tøyning', name_en: 'Stretching' },
  { id: 'strengthening', name_no: 'Styrke', name_en: 'Strengthening' },
  { id: 'mobility', name_no: 'Mobilitet', name_en: 'Mobility' },
  { id: 'balance', name_no: 'Balanse', name_en: 'Balance' },
  { id: 'vestibular', name_no: 'Vestibulær', name_en: 'Vestibular' },
  { id: 'breathing', name_no: 'Pust', name_en: 'Breathing' },
  { id: 'posture', name_no: 'Holdning', name_en: 'Posture' },
  { id: 'nerve_glide', name_no: 'Nervegliding', name_en: 'Nerve Glide' },
];

/**
 * Get available body regions
 */
export const getBodyRegions = async () => [
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
  { id: 'lower_extremity', name_no: 'Underekstremitet', name_en: 'Lower Extremity' },
];

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
