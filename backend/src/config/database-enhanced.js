/**
 * Enhanced Database Connection Pool Configuration
 * Production-optimized with Vault integration, read replicas, and monitoring
 *
 * Use this to replace backend/src/config/database.js for production
 */

import pg from 'pg';
import logger from '../utils/logger.js';
const { Pool } = pg;

// Try to load Vault, fallback to env vars if not available
let getDatabaseCredentials;
try {
  const vaultModule = await import('./vault.js');
  getDatabaseCredentials = vaultModule.getDatabaseCredentials;
} catch {
  // Fallback to env vars if Vault not configured
  getDatabaseCredentials = async () => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'chiroclickcrm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Pool configuration
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || (isProduction ? '20' : '10')),
  min: parseInt(process.env.DB_POOL_MIN || (isProduction ? '5' : '2')),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  application_name: 'ChiroClickCRM',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: isProduction ? { rejectUnauthorized: true } : false,
};

let pool = null;
let readReplicaPool = null;

/**
 * Initialize database pools
 */
export const initializeDatabase = async () => {
  try {
    logger.info('🔄 Initializing database...');

    const credentials = await getDatabaseCredentials();

    pool = new Pool({ ...poolConfig, ...credentials });

    // Event handlers
    pool.on('connect', () => isDevelopment && logger.info('✅ DB connected'));
    pool.on('error', (err) => logger.error('❌ DB error:', err));

    // Test connection
    const test = await pool.query('SELECT NOW() as time, version()');
    logger.info('✅ Database ready:', test.rows[0].time);

    // Read replica (optional)
    if (process.env.DB_READ_REPLICA_HOST) {
      readReplicaPool = new Pool({
        ...poolConfig,
        host: process.env.DB_READ_REPLICA_HOST,
        port: process.env.DB_READ_REPLICA_PORT || credentials.port,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
      });
      logger.info('✅ Read replica ready');
    }

    return pool;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Get main pool
 */
export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase()');
  }
  return pool;
};

/**
 * Execute query
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;

    if (isDevelopment || duration > 1000) {
      logger.info('Query:', text.substring(0, 100), `(${duration}ms)`);
    }

    return result;
  } catch (error) {
    logger.error('Query error:', error.message);
    throw error;
  }
};

/**
 * Execute read query (uses replica if available)
 */
export const queryRead = async (text, params) => {
  const targetPool = readReplicaPool || pool;
  return await targetPool.query(text, params);
};

/**
 * Get client for transactions
 */
export const getClient = async () => await getPool().connect();

/**
 * Transaction helper
 */
export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
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
 * Health check
 */
export const healthCheck = async () => {
  try {
    const _result = await query('SELECT 1 as healthy');
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

/**
 * Get pool stats
 */
export const getPoolStats = () =>
  pool
    ? {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      }
    : null;

/**
 * Close pools
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
  }
  if (readReplicaPool) {
    await readReplicaPool.end();
  }
  logger.info('✅ Database pools closed');
};

export default {
  query,
  queryRead,
  getClient,
  transaction,
  healthCheck,
  getPoolStats,
  initializeDatabase,
  closeDatabase,
};
