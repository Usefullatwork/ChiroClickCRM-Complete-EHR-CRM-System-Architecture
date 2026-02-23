/**
 * Database shim - re-exports from config/database.js
 */
export {
  query,
  queryWithTenant,
  getClient,
  healthCheck,
  closePool,
  transaction,
  pool,
} from '../config/database.js';
