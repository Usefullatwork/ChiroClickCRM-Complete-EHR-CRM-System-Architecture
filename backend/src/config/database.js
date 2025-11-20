/**
 * Database Configuration
 * PostgreSQL connection with connection pooling
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

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
    rejectUnauthorized: true,
    // Optional: Load custom certificates if provided
    ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined
  };

  console.log('✓ Database SSL enabled with certificate validation');
}

// Create connection pool
const pool = new Pool(poolConfig);

// Connection error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

/**
 * Execute a query with error handling
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100)
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<object>} Database client
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Transaction helper
 * @param {function} callback - Function containing transaction logic
 * @returns {Promise<any>} Transaction result
 */
export const transaction = async (callback) => {
  const client = await pool.connect();

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
 * Health check for database connection
 * @returns {Promise<boolean>} Connection status
 */
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Close all database connections (for graceful shutdown)
 */
export const closePool = async () => {
  await pool.end();
  console.log('✓ Database pool closed');
};

export default {
  query,
  getClient,
  transaction,
  healthCheck,
  closePool
};
