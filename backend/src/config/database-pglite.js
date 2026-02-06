/**
 * PGlite Database Adapter
 * Embedded PostgreSQL via WebAssembly - zero schema changes needed.
 * Same API as database.js (query, transaction, getClient, healthCheck).
 *
 * PGlite IS PostgreSQL - same SQL, same $1/$2 params, same JSONB, same pgvector.
 * Just runs in-process instead of a separate server.
 */

import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/contrib/vector';
import { getPGliteDataDir, ensureDataDirectories } from './data-paths.js';
import logger from '../utils/logger.js';

let db = null;
let initialized = false;

/**
 * Initialize PGlite database
 * Creates the embedded PostgreSQL instance with pgvector extension
 */
export const initPGlite = async () => {
  if (db && initialized) {
    return db;
  }

  ensureDataDirectories();
  const dataDir = getPGliteDataDir();

  logger.info(`Initializing PGlite database at: ${dataDir}`);

  try {
    db = new PGlite(dataDir, {
      extensions: {
        vector,
      },
    });

    // Wait for PGlite to be ready
    await db.waitReady;

    // Enable pgcrypto for gen_random_uuid() (used throughout schema)
    await db.exec('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Enable vector extension for RAG
    try {
      await db.exec('CREATE EXTENSION IF NOT EXISTS "vector"');
    } catch (e) {
      logger.warn('pgvector extension not available in PGlite, RAG search will be limited:', e.message);
    }

    initialized = true;
    logger.info('PGlite database initialized successfully');
    return db;
  } catch (error) {
    logger.error('Failed to initialize PGlite:', error);
    throw error;
  }
};

/**
 * Get the PGlite instance (initializes if needed)
 */
const getDB = async () => {
  if (!db || !initialized) {
    await initPGlite();
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
