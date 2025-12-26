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

// Configure SSL for database connections
// In production: require verified SSL with CA certificate
// In development: optionally enable SSL without strict verification
if (process.env.NODE_ENV === 'production') {
  const sslConfig = {
    rejectUnauthorized: true
  };

  // Load CA certificate if provided for full certificate chain verification
  if (process.env.SSL_CA_PATH) {
    try {
      sslConfig.ca = fs.readFileSync(process.env.SSL_CA_PATH).toString();
      console.log('✓ SSL CA certificate loaded from:', process.env.SSL_CA_PATH);
    } catch (error) {
      console.error('⚠ Failed to load SSL CA certificate:', error.message);
      console.error('  Ensure SSL_CA_PATH environment variable points to a valid certificate file');
      process.exit(1);
    }
  } else {
    console.warn('⚠ SSL_CA_PATH not set - using system CA certificates');
    console.warn('  For enhanced security, set SSL_CA_PATH to your database CA certificate');
  }

  poolConfig.ssl = sslConfig;
} else if (process.env.DB_SSL === 'true') {
  // Development/staging SSL - less strict for testing
  poolConfig.ssl = {
    rejectUnauthorized: process.env.SSL_REJECT_UNAUTHORIZED !== 'false'
  };

  // Optionally load CA cert in non-production if provided
  if (process.env.SSL_CA_PATH) {
    try {
      poolConfig.ssl.ca = fs.readFileSync(process.env.SSL_CA_PATH).toString();
    } catch (error) {
      console.warn('⚠ Could not load SSL CA certificate:', error.message);
    }
  }
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
 * @param {object} options - Transaction options (isolationLevel)
 * @returns {Promise<any>} Transaction result
 */
export const transaction = async (callback, options = {}) => {
  const client = await pool.connect();
  const isolationLevel = options.isolationLevel || 'READ COMMITTED';

  try {
    // Start transaction with specified isolation level
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
 * @param {object} client - Database client from transaction
 * @param {string} name - Savepoint name
 * @param {function} callback - Function containing savepoint logic
 * @returns {Promise<any>} Savepoint result
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
  savepoint,
  healthCheck,
  closePool
};
