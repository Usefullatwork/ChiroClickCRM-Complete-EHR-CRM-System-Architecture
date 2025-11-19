/**
 * Audit Logging Service
 * CRITICAL: Required for GDPR compliance and medical record keeping
 * Logs all clinical actions for legal and security purposes
 */

import pool from '../config/database.js';

/**
 * Action types for audit logging
 */
export const ACTION_TYPES = {
  // Clinical Encounters
  ENCOUNTER_CREATE: 'encounter.create',
  ENCOUNTER_READ: 'encounter.read',
  ENCOUNTER_UPDATE: 'encounter.update',
  ENCOUNTER_DELETE: 'encounter.delete',

  // Patient Records
  PATIENT_CREATE: 'patient.create',
  PATIENT_READ: 'patient.read',
  PATIENT_UPDATE: 'patient.update',
  PATIENT_DELETE: 'patient.delete',
  PATIENT_EXPORT: 'patient.export',

  // AI Operations
  AI_SUGGESTION_GENERATE: 'ai.suggestion.generate',
  AI_SUGGESTION_ACCEPT: 'ai.suggestion.accept',
  AI_SUGGESTION_REJECT: 'ai.suggestion.reject',
  AI_SUGGESTION_MODIFY: 'ai.suggestion.modify',

  // Templates
  TEMPLATE_CREATE: 'template.create',
  TEMPLATE_UPDATE: 'template.update',
  TEMPLATE_DELETE: 'template.delete',
  TEMPLATE_USE: 'template.use',

  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_LOGIN_FAILED: 'user.login.failed',

  // System
  BACKUP_CREATE: 'system.backup.create',
  EXPORT_DATA: 'system.export.data',
  IMPORT_DATA: 'system.import.data'
};

/**
 * Log a clinical or system action
 * @param {string} actionType - Type of action (from ACTION_TYPES)
 * @param {string} userId - ID of user performing action
 * @param {Object} details - Action details
 * @returns {Promise<Object>} Audit log entry
 */
export const logAction = async (actionType, userId, details = {}) => {
  const {
    resourceType = null,
    resourceId = null,
    changes = null,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    success = true,
    errorMessage = null
  } = details;

  try {
    const result = await pool.query(
      `INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        changes,
        metadata,
        ip_address,
        user_agent,
        session_id,
        success,
        error_message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        actionType,
        userId,
        resourceType,
        resourceId,
        changes ? JSON.stringify(changes) : null,
        JSON.stringify(metadata),
        ipAddress,
        userAgent,
        sessionId,
        success,
        errorMessage
      ]
    );

    return result.rows[0];
  } catch (error) {
    // CRITICAL: Audit logging failure should be logged to system logs
    console.error('AUDIT LOG FAILURE:', {
      actionType,
      userId,
      error: error.message,
      stack: error.stack
    });

    // Don't throw - we don't want to break the application
    // But we should alert admins
    await alertAuditFailure(error, { actionType, userId });

    return null;
  }
};

/**
 * Log clinical encounter action with full context
 */
export const logEncounterAction = async (action, userId, encounterId, details = {}) => {
  return await logAction(action, userId, {
    resourceType: 'clinical_encounter',
    resourceId: encounterId,
    ...details
  });
};

/**
 * Log AI suggestion with full context for quality tracking
 */
export const logAISuggestion = async (userId, suggestionDetails) => {
  const {
    suggestionType,
    originalText,
    suggestedText,
    confidence,
    accepted,
    modified,
    finalText,
    encounterId,
    ...metadata
  } = suggestionDetails;

  return await logAction(
    accepted ? ACTION_TYPES.AI_SUGGESTION_ACCEPT :
    modified ? ACTION_TYPES.AI_SUGGESTION_MODIFY :
    ACTION_TYPES.AI_SUGGESTION_REJECT,
    userId,
    {
      resourceType: 'ai_suggestion',
      resourceId: encounterId,
      changes: {
        original: originalText,
        suggested: suggestedText,
        final: finalText,
        confidence
      },
      metadata: {
        suggestionType,
        accepted,
        modified,
        ...metadata
      }
    }
  );
};

/**
 * Log patient data access (GDPR requirement)
 */
export const logPatientAccess = async (userId, patientId, reason, ipAddress, userAgent) => {
  return await logAction(ACTION_TYPES.PATIENT_READ, userId, {
    resourceType: 'patient',
    resourceId: patientId,
    metadata: { reason },
    ipAddress,
    userAgent
  });
};

/**
 * Get audit trail for a specific resource
 */
export const getAuditTrail = async (resourceType, resourceId, options = {}) => {
  const {
    limit = 100,
    offset = 0,
    startDate = null,
    endDate = null,
    userId = null,
    actionTypes = null
  } = options;

  let query = `
    SELECT
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.resource_type = $1 AND al.resource_id = $2
  `;

  const params = [resourceType, resourceId];
  let paramCount = 2;

  if (startDate) {
    paramCount++;
    query += ` AND al.created_at >= $${paramCount}`;
    params.push(startDate);
  }

  if (endDate) {
    paramCount++;
    query += ` AND al.created_at <= $${paramCount}`;
    params.push(endDate);
  }

  if (userId) {
    paramCount++;
    query += ` AND al.user_id = $${paramCount}`;
    params.push(userId);
  }

  if (actionTypes && Array.isArray(actionTypes)) {
    paramCount++;
    query += ` AND al.action_type = ANY($${paramCount})`;
    params.push(actionTypes);
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (userId, days = 30) => {
  const result = await pool.query(
    `SELECT
      action_type,
      COUNT(*) as count,
      MAX(created_at) as last_action
    FROM audit_log
    WHERE user_id = $1
      AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY action_type
    ORDER BY count DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Get failed login attempts (security monitoring)
 */
export const getFailedLoginAttempts = async (timeWindow = '1 hour') => {
  const result = await pool.query(
    `SELECT
      ip_address,
      COUNT(*) as attempt_count,
      MAX(created_at) as last_attempt,
      array_agg(DISTINCT metadata->>'username') as usernames_tried
    FROM audit_log
    WHERE action_type = $1
      AND created_at > NOW() - INTERVAL '${timeWindow}'
      AND success = false
    GROUP BY ip_address
    HAVING COUNT(*) >= 3
    ORDER BY attempt_count DESC`,
    [ACTION_TYPES.USER_LOGIN_FAILED]
  );

  return result.rows;
};

/**
 * Alert on audit log failure (implement based on your alerting system)
 */
const alertAuditFailure = async (error, context) => {
  // TODO: Implement alerting (email, Slack, PagerDuty, etc.)
  console.error('CRITICAL: Audit log failure - alerting admins', {
    error: error.message,
    context
  });

  // Example: Send to monitoring service
  // await sendToSentry(error, { tags: { type: 'audit_failure' }, extra: context });
};

/**
 * Express middleware for automatic audit logging
 */
export const auditMiddleware = (actionType) => {
  return async (req, res, next) => {
    // Capture original res.json to log after response
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Log the action
      await logAction(actionType, req.user?.id, {
        resourceType: req.params.resourceType || extractResourceType(req.path),
        resourceId: req.params.id || data?.id,
        changes: req.method === 'PUT' || req.method === 'PATCH' ? {
          before: req.originalData,
          after: data
        } : null,
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id,
        success: res.statusCode < 400
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Extract resource type from URL path
 */
const extractResourceType = (path) => {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
};

/**
 * Clean up old audit logs (retention policy)
 * Keep logs for required legal period (typically 10 years for medical records in Norway)
 */
export const cleanupOldLogs = async (retentionYears = 10) => {
  const result = await pool.query(
    `DELETE FROM audit_log
     WHERE created_at < NOW() - INTERVAL '${retentionYears} years'
     RETURNING id`,
  );

  console.log(`Cleaned up ${result.rowCount} audit log entries older than ${retentionYears} years`);
  return result.rowCount;
};

export default {
  logAction,
  logEncounterAction,
  logAISuggestion,
  logPatientAccess,
  getAuditTrail,
  getUserActivitySummary,
  getFailedLoginAttempts,
  auditMiddleware,
  cleanupOldLogs,
  ACTION_TYPES
};
