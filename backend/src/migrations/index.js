/**
 * Database Migrations System
 * Manages schema changes and versioning
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create migrations table if it doesn't exist
 */
export const createMigrationsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name);
  `);
  logger.info('Migrations table ready');
};

/**
 * Get list of executed migrations
 */
export const getExecutedMigrations = async () => {
  const result = await query('SELECT name FROM migrations ORDER BY executed_at');
  return result.rows.map(row => row.name);
};

/**
 * Get list of pending migrations
 */
export const getPendingMigrations = async () => {
  const executed = await getExecutedMigrations();
  const migrationsDir = path.join(__dirname, 'scripts');

  try {
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();

    return migrationFiles.filter(f => !executed.includes(f));
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('Migrations scripts directory not found');
      return [];
    }
    throw error;
  }
};

/**
 * Run a single migration
 */
export const runMigration = async (migrationName) => {
  const migrationPath = path.join(__dirname, 'scripts', migrationName);

  logger.info(`Running migration: ${migrationName}`);

  try {
    const migration = await import(migrationPath);

    await transaction(async (client) => {
      // Run the migration
      await migration.up(client);

      // Record the migration
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [migrationName]
      );
    });

    logger.info(`Migration completed: ${migrationName}`);
  } catch (error) {
    logger.error(`Migration failed: ${migrationName}`, error);
    throw error;
  }
};

/**
 * Run all pending migrations
 */
export const runAllMigrations = async () => {
  await createMigrationsTable();

  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return { executed: 0, migrations: [] };
  }

  logger.info(`Found ${pending.length} pending migrations`);

  const executed = [];

  for (const migration of pending) {
    await runMigration(migration);
    executed.push(migration);
  }

  return { executed: executed.length, migrations: executed };
};

/**
 * Rollback last migration
 */
export const rollbackMigration = async () => {
  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    logger.info('No migrations to rollback');
    return null;
  }

  const lastMigration = executed[executed.length - 1];
  const migrationPath = path.join(__dirname, 'scripts', lastMigration);

  logger.info(`Rolling back migration: ${lastMigration}`);

  try {
    const migration = await import(migrationPath);

    if (!migration.down) {
      throw new Error(`Migration ${lastMigration} does not have a down function`);
    }

    await transaction(async (client) => {
      // Run rollback
      await migration.down(client);

      // Remove migration record
      await client.query(
        'DELETE FROM migrations WHERE name = $1',
        [lastMigration]
      );
    });

    logger.info(`Rollback completed: ${lastMigration}`);
    return lastMigration;
  } catch (error) {
    logger.error(`Rollback failed: ${lastMigration}`, error);
    throw error;
  }
};

/**
 * Get migration status
 */
export const getMigrationStatus = async () => {
  await createMigrationsTable();

  const executed = await getExecutedMigrations();
  const pending = await getPendingMigrations();

  return {
    executed: executed.length,
    pending: pending.length,
    executedMigrations: executed,
    pendingMigrations: pending,
  };
};

export default {
  createMigrationsTable,
  getExecutedMigrations,
  getPendingMigrations,
  runMigration,
  runAllMigrations,
  rollbackMigration,
  getMigrationStatus,
};
