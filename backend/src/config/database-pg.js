/**
 * PostgreSQL Database Configuration (SaaS mode)
 * Standard PostgreSQL connection with connection pooling via pg.
 * Used when DB_ENGINE=postgres (cloud/Docker deployment).
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chiroclickcrm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Enable SSL in production with proper certificate validation
if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(process.env.DB_SSL_CA && { ca: process.env.DB_SSL_CA }),
    ...(process.env.DB_SSL_CERT && { cert: process.env.DB_SSL_CERT }),
    ...(process.env.DB_SSL_KEY && { key: process.env.DB_SSL_KEY }),
  };
}

// Create connection pool
const pool = new Pool(poolConfig);

// Export pool for direct access when needed (transactions, etc.)
export { pool };

// Connection error handling
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
  process.exit(-1);
});

// Test connection
pool.on('connect', () => {
  logger.info('Database connected successfully');
});

/**
 * Execute a query with error handling
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn('Slow query detected', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }

    return res;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: text.substring(0, 100),
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Transaction helper
 */
export const transaction = async (callback, options = {}) => {
  const client = await pool.connect();
  const isolationLevel = options.isolationLevel || 'READ COMMITTED';

  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Savepoint helper for nested transactions
 */
export const savepoint = async (client, name, callback) => {
  try {
    await client.query(`SAVEPOINT ${name}`);
    const result = await callback(client);
    await client.query(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    throw error;
  }
};

/**
 * Health check for database connection
 */
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return false;
  }
};

/**
 * Close all database connections (for graceful shutdown)
 */
export const closePool = async () => {
  await pool.end();
  logger.info('Database pool closed');
};

/**
 * Set tenant context for Row-Level Security (RLS)
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
  const client = await pool.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [organizationId]);
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.query(`SELECT set_config('app.current_tenant', '', false)`);
    client.release();
  }
};

export default {
  query,
  getClient,
  transaction,
  savepoint,
  healthCheck,
  closePool,
  setTenantContext,
  clearTenantContext,
  queryWithTenant
};
