/**
 * Exercise Search and CRUD — Library management operations.
 *
 * @module services/clinical/exerciseSearch
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Get all exercises for an organization
 */
export const getExercises = async (organizationId, filters = {}) => {
  try {
    const {
      category,
      subcategory,
      bodyRegion,
      difficultyLevel,
      search,
      isActive = true,
      limit = 100,
      offset = 0,
    } = filters;

    let sql = `
      SELECT
        id, organization_id, name, name_norwegian, description, description_norwegian,
        category, subcategory, body_region, difficulty_level,
        instructions, instructions_norwegian,
        sets_default, reps_default, hold_seconds,
        frequency_per_day, frequency_per_week, duration_weeks,
        image_url, video_url, thumbnail_url,
        contraindications, precautions,
        is_active, is_system, usage_count, display_order, tags,
        created_at, updated_at
      FROM exercise_library
      WHERE organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (isActive !== null) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      sql += ` AND subcategory = $${paramIndex}`;
      params.push(subcategory);
      paramIndex++;
    }

    if (bodyRegion) {
      sql += ` AND body_region = $${paramIndex}`;
      params.push(bodyRegion);
      paramIndex++;
    }

    if (difficultyLevel) {
      sql += ` AND difficulty_level = $${paramIndex}`;
      params.push(difficultyLevel);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (
        to_tsvector('norwegian', COALESCE(name_norwegian, name) || ' ' || COALESCE(description_norwegian, description, ''))
        @@ plainto_tsquery('norwegian', $${paramIndex})
        OR name ILIKE $${paramIndex + 1}
        OR name_norwegian ILIKE $${paramIndex + 1}
      )`;
      params.push(search, `%${search}%`);
      paramIndex += 2;
    }

    sql += ` ORDER BY display_order, name`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting exercises:', error);
    throw error;
  }
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (organizationId, exerciseId) => {
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
       FROM exercise_library WHERE organization_id = $1 AND id = $2`,
      [organizationId, exerciseId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting exercise by ID:', error);
    throw error;
  }
};

/**
 * Create a new exercise
 */
export const createExercise = async (organizationId, userId, exerciseData) => {
  try {
    const {
      name,
      nameNorwegian,
      description,
      descriptionNorwegian,
      category,
      subcategory,
      bodyRegion,
      difficultyLevel,
      instructions,
      instructionsNorwegian,
      setsDefault,
      repsDefault,
      holdSeconds,
      frequencyPerDay,
      frequencyPerWeek,
      durationWeeks,
      imageUrl,
      videoUrl,
      thumbnailUrl,
      contraindications,
      precautions,
      tags,
    } = exerciseData;

    const result = await query(
      `INSERT INTO exercise_library (
        organization_id, name, name_norwegian, description, description_norwegian,
        category, subcategory, body_region, difficulty_level,
        instructions, instructions_norwegian,
        sets_default, reps_default, hold_seconds,
        frequency_per_day, frequency_per_week, duration_weeks,
        image_url, video_url, thumbnail_url,
        contraindications, precautions, tags,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        organizationId,
        name,
        nameNorwegian,
        description,
        descriptionNorwegian,
        category,
        subcategory,
        bodyRegion,
        difficultyLevel || 'beginner',
        instructions,
        instructionsNorwegian,
        setsDefault || 3,
        repsDefault || 10,
        holdSeconds,
        frequencyPerDay || 1,
        frequencyPerWeek || 7,
        durationWeeks || 4,
        imageUrl,
        videoUrl,
        thumbnailUrl,
        contraindications || [],
        precautions || [],
        tags || [],
        userId,
      ]
    );

    logger.info('Exercise created:', { organizationId, exerciseId: result.rows[0].id });
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating exercise:', error);
    throw error;
  }
};

/**
 * Update an exercise
 */
export const updateExercise = async (organizationId, exerciseId, exerciseData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name',
      'name_norwegian',
      'description',
      'description_norwegian',
      'category',
      'subcategory',
      'body_region',
      'difficulty_level',
      'instructions',
      'instructions_norwegian',
      'sets_default',
      'reps_default',
      'hold_seconds',
      'frequency_per_day',
      'frequency_per_week',
      'duration_weeks',
      'image_url',
      'video_url',
      'thumbnail_url',
      'contraindications',
      'precautions',
      'tags',
      'is_active',
      'display_order',
    ];

    // Convert camelCase to snake_case and build update query
    for (const [key, value] of Object.entries(exerciseData)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(organizationId, exerciseId);

    const result = await query(
      `UPDATE exercise_library
       SET ${fields.join(', ')}
       WHERE organization_id = $${paramIndex} AND id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Exercise updated:', { organizationId, exerciseId });
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating exercise:', error);
    throw error;
  }
};

/**
 * Delete an exercise (soft delete by setting is_active = false)
 */
export const deleteExercise = async (organizationId, exerciseId) => {
  try {
    const result = await query(
      `UPDATE exercise_library SET is_active = false WHERE organization_id = $1 AND id = $2 RETURNING id`,
      [organizationId, exerciseId]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error deleting exercise:', error);
    throw error;
  }
};
