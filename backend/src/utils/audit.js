/**
 * Audit Trail Utilities
 * GDPR Article 30 - Record of processing activities
 */

import { query } from '../config/database.js';
import logger from './logger.js';

/**
 * Log an audit event
 * @param {object} params - Audit log parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.userEmail - User email
 * @param {string} params.userRole - User role
 * @param {string} params.action - Action performed (CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN)
 * @param {string} params.resourceType - Type of resource (PATIENT, ENCOUNTER, APPOINTMENT, etc.)
 * @param {string} params.resourceId - ID of the resource
 * @param {object} params.changes - Object containing old and new values
 * @param {string} params.reason - Reason for the action (optional, for sensitive operations)
 * @param {string} params.ipAddress - IP address of the request
 * @param {string} params.userAgent - User agent string
 */
export const logAudit = async ({
  organizationId,
  userId,
  userEmail,
  userRole,
  action,
  resourceType,
  resourceId,
  changes = null,
  reason = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await query(
      `INSERT INTO audit_logs (
        organization_id,
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        changes,
        reason,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        organizationId,
        userId,
        userEmail,
        userRole,
        action,
        resourceType,
        resourceId,
        changes ? JSON.stringify(changes) : null,
        reason,
        ipAddress,
        userAgent,
      ]
    );

    logger.info('Audit log created', {
      organizationId,
      userId,
      action,
      resourceType,
      resourceId,
    });
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      organizationId,
      userId,
      action,
      resourceType,
    });
    // Don't throw - audit logging should not break the application
  }
};

/**
 * Create audit middleware for Express routes
 * Automatically logs actions based on HTTP method
 * @param {string} resourceType - Type of resource being accessed
 */
export const auditMiddleware = (resourceType) => async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data) {
    // Determine action based on method and status
    let action;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      switch (req.method) {
        case 'POST':
          action = 'CREATE';
          break;
        case 'GET':
          action = 'READ';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'UPDATE';
          break;
        case 'DELETE':
          action = 'DELETE';
          break;
        default:
          action = req.method;
      }

      // Log the audit event
      logAudit({
        organizationId: req.organizationId,
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action,
        resourceType,
        resourceId: req.params.id || req.body?.id,
        changes:
          req.method !== 'GET'
            ? {
                old: req.originalData,
                new: req.body,
              }
            : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });
    }

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @param {number} limit - Maximum number of logs to retrieve
 * @returns {Promise<Array>} Array of audit logs
 */
export const getResourceAuditLogs = async (resourceType, resourceId, limit = 50) => {
  try {
    const result = await query(
      `SELECT
        al.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.resource_type = $1 AND al.resource_id = $2
      ORDER BY al.created_at DESC
      LIMIT $3`,
      [resourceType, resourceId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve audit logs', {
      error: error.message,
      resourceType,
      resourceId,
    });
    throw error;
  }
};

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {Date} options.startDate - Start date for logs
 * @param {Date} options.endDate - End date for logs
 * @param {number} options.limit - Maximum number of logs
 * @returns {Promise<Array>} Array of audit logs
 */
export const getUserAuditLogs = async (userId, options = {}) => {
  const { startDate = null, endDate = null, limit = 100 } = options;

  try {
    let queryText = `
      SELECT *
      FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      queryText += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      queryText += ` AND created_at <= $${params.length}`;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve user audit logs', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Export audit logs for GDPR compliance
 * @param {string} organizationId - Organization ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Complete audit logs
 */
export const exportAuditLogs = async (organizationId, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT
        al.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.organization_id = $1
        AND al.created_at BETWEEN $2 AND $3
      ORDER BY al.created_at ASC`,
      [organizationId, startDate, endDate]
    );

    logger.info('Audit logs exported', {
      organizationId,
      count: result.rows.length,
      startDate,
      endDate,
    });

    return result.rows;
  } catch (error) {
    logger.error('Failed to export audit logs', {
      error: error.message,
      organizationId,
    });
    throw error;
  }
};

export default {
  logAudit,
  auditMiddleware,
  getResourceAuditLogs,
  getUserAuditLogs,
  exportAuditLogs,
};
