/**
 * Database Migration Runner
 * Supports both PGlite (desktop) and PostgreSQL (SaaS) modes.
 * Runs all pending SQL migrations in order.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const DB_ENGINE = process.env.DB_ENGINE || (process.env.DESKTOP_MODE === 'true' ? 'pglite' : 'postgres');

/**
 * Get a database connection based on engine type
 */
async function getDatabase() {
  if (DB_ENGINE === 'pglite') {
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = process.env.PGLITE_DATA_DIR || path.join(__dirname, '../../data/pglite');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new PGlite(dataDir);
    await db.waitReady;

    // Enable pgcrypto
    await db.exec('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    return {
      query: async (text, params) => {
        const res = await db.query(text, params || []);
        return { rows: res.rows || [], rowCount: res.affectedRows ?? res.rows?.length ?? 0 };
      },
      exec: async (sql) => await db.exec(sql),
      end: async () => await db.close(),
      type: 'pglite',
    };
  } else {
    const pg = await import('pg');
    const { Pool } = pg.default;

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

    return {
      query: async (text, params) => await pool.query(text, params),
      exec: async (sql) => await pool.query(sql),
      end: async () => await pool.end(),
      type: 'postgres',
    };
  }
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(db) {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  if (db.type === 'pglite') {
    await db.exec(sql);
  } else {
    await db.query(sql);
  }
  console.log('Migrations table ready');
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(db) {
  try {
    const result = await db.query('SELECT migration_name FROM schema_migrations ORDER BY id');
    return result.rows.map(row => row.migration_name);
  } catch (error) {
    console.error('Error fetching executed migrations:', error);
    return [];
  }
}

/**
 * Mark migration as executed
 */
async function markMigrationAsExecuted(db, migrationName) {
  await db.query(
    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
    [migrationName]
  );
}

/**
 * Run a single migration file
 */
async function runMigration(db, filePath, fileName) {
  console.log(`\nRunning migration: ${fileName}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    if (db.type === 'pglite') {
      await db.exec(sql);
    } else {
      await db.query(sql);
    }
    await markMigrationAsExecuted(db, fileName);
    console.log(`Migration ${fileName} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Run initial schema if this is a fresh PGlite database
 */
async function runInitialSchema(db) {
  const schemaPath = path.join(__dirname, '../schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.log('No schema.sql found, skipping initial schema');
    return;
  }

  console.log('Running initial schema...');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  if (db.type === 'pglite') {
    // Split and run statements to handle PGlite limitations
    await db.exec(sql);
  } else {
    await db.query(sql);
  }
  console.log('Initial schema loaded');
}

/**
 * Run seed files for initial data
 */
async function runSeeds(db) {
  const seedDir = path.join(__dirname, '../seeds');
  if (!fs.existsSync(seedDir)) {
    console.log('No seeds directory found, skipping');
    return;
  }

  const seedFiles = fs.readdirSync(seedDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (seedFiles.length === 0) {
    console.log('No seed files found');
    return;
  }

  console.log(`\nRunning ${seedFiles.length} seed file(s)...`);

  for (const file of seedFiles) {
    try {
      console.log(`  Seeding: ${file}`);
      const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');
      if (db.type === 'pglite') {
        await db.exec(sql);
      } else {
        await db.query(sql);
      }
      console.log(`  Seed ${file} completed`);
    } catch (error) {
      console.warn(`  Warning: Seed ${file} failed:`, error.message);
      // Continue with next seed (some may fail on duplicate data)
    }
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log(`Starting database migrations (engine: ${DB_ENGINE})...\n`);

  const db = await getDatabase();

  try {
    // For PGlite first run: load initial schema + seeds
    if (DB_ENGINE === 'pglite') {
      try {
        await db.query('SELECT 1 FROM organizations LIMIT 1');
      } catch {
        console.log('Fresh PGlite database detected, loading initial schema...');
        await runInitialSchema(db);
        await runSeeds(db);
      }
    }

    // Create migrations table
    await createMigrationsTable(db);

    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations(db);
    console.log(`Already executed: ${executedMigrations.length} migrations`);

    // Get all migration files from the canonical directory
    const migrationDirs = [
      path.join(__dirname, '../../backend/migrations') // /backend/migrations/ (single source of truth)
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
      console.log('\nAll migrations are up to date!');
      return;
    }

    console.log(`\nFound ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(m => {
      console.log(`  - ${m.fileName}`);
    });

    // Run pending migrations
    for (const migration of pendingMigrations) {
      await runMigration(db, migration.filePath, migration.fileName);
    }

    console.log('\nAll migrations completed successfully!');

  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
