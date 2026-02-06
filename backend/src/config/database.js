/**
 * Database Configuration Router
 * Routes to PGlite (desktop mode) or PostgreSQL (SaaS mode).
 *
 * DB_ENGINE=pglite  -> Embedded PostgreSQL via PGlite (default for desktop)
 * DB_ENGINE=postgres -> Standard PostgreSQL via pg Pool (for SaaS)
 *
 * All consumers import from this file - the switch is transparent.
 */

import dotenv from 'dotenv';
dotenv.config();

const DB_ENGINE = process.env.DB_ENGINE || (process.env.DESKTOP_MODE === 'true' ? 'pglite' : 'postgres');

let dbModule;

if (DB_ENGINE === 'pglite') {
  // Desktop mode: embedded PostgreSQL
  dbModule = await import('./database-pglite.js');
} else {
  // SaaS mode: standard PostgreSQL pool
  dbModule = await import('./database-pg.js');
}

// Re-export all named exports
export const query = dbModule.query;
export const getClient = dbModule.getClient;
export const transaction = dbModule.transaction;
export const savepoint = dbModule.savepoint;
export const healthCheck = dbModule.healthCheck;
export const closePool = dbModule.closePool;
export const setTenantContext = dbModule.setTenantContext;
export const clearTenantContext = dbModule.clearTenantContext;
export const queryWithTenant = dbModule.queryWithTenant;
export const pool = dbModule.pool || null;

// PGlite-specific exports (only available in desktop mode)
export const initPGlite = dbModule.initPGlite || null;
export const execSQL = dbModule.execSQL || null;

export default {
  query,
  getClient,
  transaction,
  savepoint,
  healthCheck,
  closePool,
  setTenantContext,
  clearTenantContext,
  queryWithTenant,
};
