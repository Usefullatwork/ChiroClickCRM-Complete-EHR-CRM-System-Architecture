/**
 * Database Migration Runner
 * Runs all pending SQL migrations in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chiroclickcrm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
  console.log('✓ Migrations table ready');
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  try {
    const result = await pool.query('SELECT migration_name FROM schema_migrations ORDER BY id');
    return result.rows.map(row => row.migration_name);
  } catch (error) {
    console.error('Error fetching executed migrations:', error);
    return [];
  }
}

/**
 * Mark migration as executed
 */
async function markMigrationAsExecuted(migrationName) {
  await pool.query(
    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
    [migrationName]
  );
}

/**
 * Run a single migration file
 */
async function runMigration(filePath, fileName) {
  console.log(`\nRunning migration: ${fileName}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    await markMigrationAsExecuted(fileName);
    console.log(`✓ Migration ${fileName} completed successfully`);
  } catch (error) {
    console.error(`✗ Error running migration ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('Starting database migrations...\n');

  try {
    // Create migrations table
    await createMigrationsTable();

    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`Already executed: ${executedMigrations.length} migrations`);

    // Get all migration files from both directories
    const migrationDirs = [
      __dirname, // /database/migrations/
      path.join(__dirname, '../../backend/migrations') // /backend/migrations/
    ];

    const allMigrations = [];

    for (const dir of migrationDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(file => file.endsWith('.sql'))
          .sort();

        files.forEach(file => {
          allMigrations.push({
            fileName: file,
            filePath: path.join(dir, file),
            dir: path.basename(dir)
          });
        });
      }
    }

    // Sort all migrations by filename
    allMigrations.sort((a, b) => a.fileName.localeCompare(b.fileName));

    // Filter out already executed migrations
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.fileName)
    );

    if (pendingMigrations.length === 0) {
      console.log('\n✓ All migrations are up to date!');
      return;
    }

    console.log(`\nFound ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(m => {
      console.log(`  - ${m.fileName}`);
    });

    // Run pending migrations
    for (const migration of pendingMigrations) {
      await runMigration(migration.filePath, migration.fileName);
    }

    console.log('\n✓ All migrations completed successfully!');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
