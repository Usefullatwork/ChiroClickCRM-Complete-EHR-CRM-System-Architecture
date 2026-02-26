/**
 * PGlite Database Adapter
 * Embedded PostgreSQL via WebAssembly - zero schema changes needed.
 * Same API as database.js (query, transaction, getClient, healthCheck).
 *
 * PGlite IS PostgreSQL - same SQL, same $1/$2 params, same JSONB, same pgvector.
 * Just runs in-process instead of a separate server.
 */

import { PGlite } from '@electric-sql/pglite';
import { getPGliteDataDir, ensureDataDirectories } from './data-paths.js';
import { rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import logger from '../utils/logger.js';

// Optional contrib extensions
let vector = null;
let uuid_ossp = null;
try {
  const mod = await import('@electric-sql/pglite/contrib/vector');
  vector = mod.vector;
} catch {
  // vector extension not available in this PGlite version
}
try {
  const mod = await import('@electric-sql/pglite/contrib/uuid_ossp');
  uuid_ossp = mod.uuid_ossp;
} catch {
  // uuid_ossp not available
}

let db = null;
let initialized = false;
let connectionHealthy = true;

/** Recovery counter — only attempt auto-recovery ONCE per process lifetime */
let recoveryAttempted = false;

/**
 * Detect if an error indicates PGlite/WASM corruption.
 * These errors mean the data directory is unrecoverable and must be replaced.
 */
const isCorruptionError = (error) => {
  const message = (error?.message || '').toLowerCase();
  const name = (error?.name || '').toLowerCase();

  // WASM RuntimeError (abort signal from the WASM module)
  if (name === 'runtimeerror' || error instanceof WebAssembly?.RuntimeError) {
    return true;
  }

  const corruptionPatterns = [
    'abort', // WASM abort
    'invalid_state', // PGlite internal state corruption
    'could not read', // Filesystem read failure on data files
    'could not open', // Filesystem open failure on data files
    'checksum', // WAL or page checksum mismatch
  ];

  return corruptionPatterns.some((pattern) => message.includes(pattern));
};

/**
 * Initialize PGlite database
 * Creates the embedded PostgreSQL instance with pgvector extension
 */
export const initPGlite = async () => {
  if (db && initialized) {
    return db;
  }

  const isTestMode = process.env.NODE_ENV === 'test';

  if (!isTestMode) {
    ensureDataDirectories();
  }
  const dataDir = isTestMode ? undefined : getPGliteDataDir();

  logger.info(`Initializing PGlite database${dataDir ? ` at: ${dataDir}` : ' (in-memory)'}`);

  try {
    const extensions = {};
    if (vector) {
      extensions.vector = vector;
    }
    if (uuid_ossp) {
      extensions.uuid_ossp = uuid_ossp;
    }

    db = dataDir ? new PGlite(dataDir, { extensions }) : new PGlite({ extensions });

    // Wait for PGlite to be ready
    await db.waitReady;

    // Enable uuid_ossp for UUID generation (pgcrypto not available in PGlite)
    // gen_random_uuid() is built-in for PG14+, but uuid_ossp provides uuid_generate_v4()
    try {
      await db.exec('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (e) {
      logger.warn('uuid-ossp not available, using built-in gen_random_uuid()');
    }

    // Enable vector extension for RAG (optional)
    try {
      await db.exec('CREATE EXTENSION IF NOT EXISTS "vector"');
    } catch (e) {
      logger.warn('pgvector extension not available in PGlite, RAG search will be limited');
    }

    initialized = true;
    connectionHealthy = true;

    // Verify connection with a simple health check
    try {
      await db.query('SELECT 1 AS health');
      logger.info('PGlite connection health check passed');
    } catch (hcErr) {
      logger.warn('PGlite connection health check failed on init:', hcErr.message);
      connectionHealthy = false;
    }

    logger.info('PGlite database initialized successfully');

    // Run first-time schema + seed setup if needed
    try {
      const { initializeDatabase } = await import('./db-init.js');
      await initializeDatabase({
        query: async (text, params) => {
          const res = await db.query(text, params || []);
          return { rows: res.rows || [], rowCount: res.affectedRows ?? res.rows?.length ?? 0 };
        },
      });
    } catch (initErr) {
      logger.warn('DB init skipped:', initErr.message);
    }

    return db;
  } catch (error) {
    logger.error('Failed to initialize PGlite:', error);

    // Auto-recovery: if corruption detected and we haven't tried yet, nuke and retry
    if (isCorruptionError(error) && !recoveryAttempted && !isTestMode) {
      recoveryAttempted = true;
      logger.warn('PGlite corruption detected — attempting auto-recovery...');

      // 1. Close the old db instance if possible
      if (db) {
        try {
          await db.close();
        } catch {
          // Ignore close errors on a corrupted instance
        }
        db = null;
        initialized = false;
        connectionHealthy = false;
      }

      // 2. Rename corrupted data dir to data/pglite-corrupted-{timestamp}
      const corruptedDir = dataDir;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const parentDir = path.dirname(corruptedDir);
      const corruptedDest = path.join(parentDir, `pglite-corrupted-${timestamp}`);

      try {
        if (existsSync(corruptedDir)) {
          await rename(corruptedDir, corruptedDest);
          logger.warn(`Moved corrupted PGlite data to: ${corruptedDest}`);
        }
      } catch (moveErr) {
        logger.error('Failed to move corrupted PGlite data dir:', moveErr.message);
        throw error; // Can't recover if we can't move the dir
      }

      // 3. Create a fresh data/pglite directory
      try {
        await mkdir(corruptedDir, { recursive: true });
        logger.info(`Created fresh PGlite data directory: ${corruptedDir}`);
      } catch (mkdirErr) {
        logger.error('Failed to create fresh PGlite data dir:', mkdirErr.message);
        throw error;
      }

      // 4. Retry initialization ONCE
      try {
        logger.info('Retrying PGlite initialization with fresh data directory...');
        return await initPGlite();
      } catch (retryErr) {
        logger.error('PGlite retry after recovery also failed:', retryErr);
        throw error; // Throw the original error for clarity
      }
    }

    throw error;
  }
};

/**
 * Get the PGlite instance (initializes if needed)
 * Includes reconnection logic if the connection has dropped.
 */
const getDB = async () => {
  if (!db || !initialized) {
    await initPGlite();
    return db;
  }

  // Reconnect if previous health check flagged connection as unhealthy
  if (!connectionHealthy) {
    logger.info('PGlite connection was unhealthy, attempting reconnection...');
    try {
      await db.query('SELECT 1 AS health');
      connectionHealthy = true;
      logger.info('PGlite reconnection check passed');
    } catch {
      // Close and reinitialize
      logger.warn('PGlite reconnection failed, reinitializing...');
      try {
        await db.close();
      } catch {
        // ignore close errors
      }
      db = null;
      initialized = false;
      connectionHealthy = false;
      await initPGlite();
    }
  }

  return db;
};

/**
 * Execute a query with error handling
 * Same signature as pg Pool.query()
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result with { rows, rowCount }
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  const database = await getDB();

  try {
    const res = await database.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rows?.length || 0,
      });
    }

    // Normalize result to match pg Pool format
    return {
      rows: res.rows || [],
      rowCount: res.affectedRows ?? res.rows?.length ?? 0,
      fields: res.fields || [],
    };
  } catch (error) {
    // Flag connection as unhealthy on connection-level errors
    if (error.message && /connection|closed|terminated/i.test(error.message)) {
      connectionHealthy = false;
    }
    logger.error('PGlite query error', {
      error: error.message,
      query: text.substring(0, 100),
    });
    throw error;
  }
};

/**
 * Get a "client" for transactions.
 * PGlite doesn't have a pool, so we return a wrapper that matches pg Client API.
 */
export const getClient = async () => {
  const database = await getDB();

  // Return a client-like wrapper for compatibility
  const client = {
    query: async (text, params = []) => {
      const res = await database.query(text, params);
      return {
        rows: res.rows || [],
        rowCount: res.affectedRows ?? res.rows?.length ?? 0,
        fields: res.fields || [],
      };
    },
    release: () => {
      // No-op for PGlite (no pool to return to)
    },
  };

  return client;
};

/**
 * Transaction helper
 * @param {function} callback - Function containing transaction logic
 * @param {object} options - Transaction options (isolationLevel)
 * @returns {Promise<any>} Transaction result
 */
export const transaction = async (callback, options = {}) => {
  const database = await getDB();
  const isolationLevel = options.isolationLevel || 'READ COMMITTED';

  // Create a client-like wrapper for the callback
  const client = {
    query: async (text, params = []) => {
      const res = await database.query(text, params);
      return {
        rows: res.rows || [],
        rowCount: res.affectedRows ?? res.rows?.length ?? 0,
        fields: res.fields || [],
      };
    },
    release: () => {},
  };

  try {
    await database.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await callback(client);
    await database.query('COMMIT');
    return result;
  } catch (error) {
    await database.query('ROLLBACK');
    throw error;
  }
};

/**
 * Savepoint helper for nested transactions
 */
export const savepoint = async (client, name, callback) => {
  const database = await getDB();
  try {
    await database.query(`SAVEPOINT ${name}`);
    const result = await callback(client);
    await database.query(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (error) {
    await database.query(`ROLLBACK TO SAVEPOINT ${name}`);
    throw error;
  }
};

/**
 * Health check for PGlite
 */
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('PGlite health check failed', { error: error.message });
    return false;
  }
};

/**
 * Close PGlite (for graceful shutdown)
 */
export const closePool = async () => {
  if (db) {
    await db.close();
    db = null;
    initialized = false;
    logger.info('PGlite database closed');
  }
};

/**
 * Set tenant context for RLS
 * Uses set_config just like the pg version
 */
export const setTenantContext = async (organizationId) => {
  if (!organizationId) {
    throw new Error('Organization ID required for tenant context');
  }
  await query(`SELECT set_config('app.current_tenant', $1, false)`, [organizationId]);
};

/**
 * Clear tenant context
 */
export const clearTenantContext = async () => {
  await query(`SELECT set_config('app.current_tenant', '', false)`);
};

/**
 * Execute query with tenant context
 */
export const queryWithTenant = async (organizationId, text, params = []) => {
  await setTenantContext(organizationId);
  try {
    const result = await query(text, params);
    return result;
  } finally {
    await clearTenantContext();
  }
};

/**
 * Execute raw SQL (for schema initialization)
 * Splits on semicolons and runs statements individually
 */
export const execSQL = async (sql) => {
  const database = await getDB();
  await database.exec(sql);
};

// Re-export pool as null (PGlite has no pool concept)
export const pool = null;

export default {
  initPGlite,
  query,
  getClient,
  transaction,
  savepoint,
  healthCheck,
  closePool,
  setTenantContext,
  clearTenantContext,
  queryWithTenant,
  execSQL,
};
