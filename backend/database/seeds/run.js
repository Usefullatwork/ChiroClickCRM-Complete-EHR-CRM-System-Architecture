/**
 * Seed Runner
 * Runs all SQL seed files in the backend/seeds directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chiroclickcrm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runSeeds() {
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to database...');

    // Get seed files from backend/seeds directory
    const seedsDir = path.join(__dirname, '../../seeds');

    if (!fs.existsSync(seedsDir)) {
      console.error(`❌ Seeds directory not found at ${seedsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${files.length} seed files.`);

    // Check for specific file argument
    const targetFile = process.argv[2];

    for (const file of files) {
      // If specific file requested, skip others
      if (targetFile && !file.includes(targetFile)) {
        continue;
      }

      console.log(`▶️  Running ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ ${file} completed.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error running ${file}:`, err.message);
        // Continue with other seeds
      }
    }

    console.log('✨ Seeding completed.');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds();
