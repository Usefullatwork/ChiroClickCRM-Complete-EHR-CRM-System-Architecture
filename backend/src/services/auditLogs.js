/**
 * Audit Logs Service
 * GDPR Article 30 — query and filter audit log entries
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Build WHERE clause and params from filter options
 */
const buildFilters = (filters) => {
  const conditions = ['1=1'];
  const params = [];
  let paramIdx = 0;

  if (filters.action) {
    paramIdx++;
    conditions.push(`al.action = $${paramIdx}`);
    params.push(filters.action.toUpperCase());
  }

  if (filters.resourceType) {
    paramIdx++;
    conditions.push(`al.resource_type = $${paramIdx}`);
    params.push(filters.resourceType.toUpperCase());
  }

  if (filters.userRole) {
    paramIdx++;
    conditions.push(`al.user_role = $${paramIdx}`);
    params.push(filters.userRole.toUpperCase());
  }

  if (filters.startDate) {
    paramIdx++;
    conditions.push(`al.created_at >= $${paramIdx}::date`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    paramIdx++;
    conditions.push(`al.created_at < ($${paramIdx}::date + interval '1 day')`);
    params.push(filters.endDate);
  }

  if (filters.search) {
    paramIdx++;
    const searchParam = `%${filters.search}%`;
    conditions.push(
      `(al.user_email ILIKE $${paramIdx} OR u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx} OR al.resource_id::text ILIKE $${paramIdx})`
    );
    params.push(searchParam);
  }

  return { whereClause: conditions.join(' AND '), params, paramIdx };
};

/**
 * List audit logs with filters and pagination
 * @param {Object} filters - action, resourceType, userRole, startDate, endDate, search
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Results per page
 * @returns {{ logs: Array, total: number, page: number, limit: number, totalPages: number }}
 */
export const listAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const { whereClause, params, paramIdx } = buildFilters(filters);

  try {
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const logsResult = await query(
      `SELECT
        al.id,
        al.created_at,
        al.user_id,
        al.user_email,
        COALESCE(u.first_name || ' ' || u.last_name, al.user_email) as user_name,
        COALESCE(al.user_role, u.role) as user_role,
        al.action,
        al.resource_type,
        al.resource_id,
        al.changes,
        al.reason,
        al.ip_address,
        al.user_agent
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIdx + 1} OFFSET $${paramIdx + 2}`,
      [...params, limitNum, offset]
    );

    return {
      logs: logsResult.rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  } catch (error) {
    logger.error('Failed to fetch audit logs', { error: error.message });
    throw error;
  }
};

/**
 * Get a single audit log entry by ID
 * @param {string} id - Audit log UUID
 * @returns {Object|null} - Audit log entry or null if not found
 */
export const getAuditLogById = async (id) => {
  try {
    const result = await query(
      `SELECT
        al.id,
        al.created_at,
        al.user_id,
        al.user_email,
        COALESCE(u.first_name || ' ' || u.last_name, al.user_email) as user_name,
        COALESCE(al.user_role, u.role) as user_role,
        al.action,
        al.resource_type,
        al.resource_id,
        al.changes,
        al.reason,
        al.ip_address,
        al.user_agent
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.id = $1`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Failed to fetch audit log entry', { error: error.message });
    throw error;
  }
};
