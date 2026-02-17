/**
 * Vestibular Exercises Seeder
 * Seeds the exercise library with vestibular/BPPV exercises from POP
 *
 * Run with: node src/scripts/seedVestibularExercises.js <organizationId>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { _query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load seed data
const seedDataPath = path.join(__dirname, '../data/vestibular-exercises-seed.json');

async function seedVestibularExercises(organizationId) {
  if (!organizationId) {
    logger.error('Usage: node seedVestibularExercises.js <organizationId>');
    process.exit(1);
  }

  logger.info(`Seeding vestibular exercises for organization ${organizationId}...`);

  // Read seed data
  const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
  logger.info(
    `Loaded ${seedData.exercises.length} exercises in ${seedData.categories.length} categories`
  );

  const client = await transaction.start();

  try {
    let inserted = 0;
    let skipped = 0;

    for (const exercise of seedData.exercises) {
      // Check if exercise already exists (by name)
      const existing = await client.query(
        `SELECT id FROM exercise_library
         WHERE organization_id = $1 AND name = $2`,
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

      // Build thumbnail URL (from POP CDN if available)
      const thumbnailUrl = exercise.thumbnailId
        ? `https://pop.gpm.as/images/exercises/${exercise.thumbnailId}`
        : null;

      // Insert exercise
      await client.query(
        `INSERT INTO exercise_library (
          organization_id,
          name,
          name_norwegian,
          description,
          description_norwegian,
          category,
          subcategory,
          body_region,
          difficulty_level,
          video_url,
          thumbnail_url,
          is_active,
          is_system,
          tags,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          organizationId,
          exercise.name, // name (English - same as Norwegian for these)
          exercise.name, // name_norwegian
          exercise.description, // description (English - same as Norwegian)
          exercise.description, // description_norwegian
          exercise.category, // category (parent)
          exercise.subcategory, // subcategory
          exercise.bodyRegion || 'vestibular',
          exercise.difficultyLevel || 'beginner',
          videoUrl,
          thumbnailUrl,
          true, // is_active
          true, // is_system (system exercises)
          JSON.stringify(['vestibular', 'BPPV', 'VRT', 'neurological']),
          null, // created_by (system)
        ]
      );

      inserted++;
    }

    await transaction.commit(client);

    logger.info('Seeding complete', { inserted, skipped, total: seedData.exercises.length });

    return { inserted, skipped };
  } catch (error) {
    await transaction.rollback(client);
    logger.error('Error seeding vestibular exercises', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Run if called directly
const args = process.argv.slice(2);
if (args[0]) {
  seedVestibularExercises(args[0])
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedVestibularExercises;
