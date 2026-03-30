/**
 * Exercise Categories and Seeding — Category listing and default exercise provisioning.
 *
 * @module services/clinical/exerciseCategories
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Get exercise categories
 */
export const getCategories = async (organizationId) => {
  try {
    const result = await query(
      `SELECT DISTINCT category,
        array_agg(DISTINCT subcategory) FILTER (WHERE subcategory IS NOT NULL) as subcategories,
        COUNT(*) as exercise_count
       FROM exercise_library
       WHERE organization_id = $1 AND is_active = true
       GROUP BY category
       ORDER BY category`,
      [organizationId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting exercise categories:', error);
    throw error;
  }
};

/**
 * Seed default exercises for an organization
 * Uses vestibular/BPPV exercises from POP exercise library
 */
export const seedDefaultExercises = async (organizationId) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Load seed data
    const seedDataPath = path.join(__dirname, '../data/vestibular-exercises-seed.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

    let inserted = 0;
    let skipped = 0;

    for (const exercise of seedData.exercises) {
      // Check if exercise already exists (by name)
      const existing = await query(
        `SELECT id FROM exercise_library WHERE organization_id = $1 AND name = $2`,
        [organizationId, exercise.name]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Build Vimeo embed URL
      const videoUrl = exercise.vimeoId
        ? `https://player.vimeo.com/video/${exercise.vimeoId}`
        : null;

      // Insert exercise
      await query(
        `INSERT INTO exercise_library (
          organization_id, name, name_norwegian, description, description_norwegian,
          category, subcategory, body_region, difficulty_level,
          video_url, is_active, is_system, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          organizationId,
          exercise.name,
          exercise.name,
          exercise.description,
          exercise.description,
          exercise.category,
          exercise.subcategory,
          exercise.bodyRegion || 'vestibular',
          exercise.difficultyLevel || 'beginner',
          videoUrl,
          true,
          true,
          JSON.stringify(['vestibular', 'BPPV', 'VRT', 'neurological']),
        ]
      );

      inserted++;
    }

    logger.info('Default exercises seeded:', { organizationId, inserted, skipped });
    return { inserted, skipped, total: seedData.exercises.length };
  } catch (error) {
    logger.error('Error seeding default exercises:', error);
    throw error;
  }
};
