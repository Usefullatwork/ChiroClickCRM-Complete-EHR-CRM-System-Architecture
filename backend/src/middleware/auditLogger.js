/**
 * Audit Logging Middleware
 * Complete audit trail for GDPR Article 30 compliance
 */

import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * Actions that should be audited
 */
const AUDITABLE_ACTIONS = {
  GET: 'READ',
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE'
};

/**
 * Sensitive resources requiring mandatory audit
 */
const SENSITIVE_RESOURCES = [
  'patients',
  'clinical_encounters',
  'communications',
  'financial_metrics',
  'gdpr_requests'
];

/**
 * Extract resource type from request path
 * @param {string} path - Request path
 * @returns {string|null} Resource type
 */
const getResourceType = (path) => {
  // Remove /api/v1/ prefix and get first segment
  const segments = path.replace(/^\/api\/v[0-9]+\//, '').split('/');
  const resource = segments[0];

  // Map plurals to singular forms
  const resourceMap = {
    'patients': 'PATIENT',
    'appointments': 'APPOINTMENT',
    'communications': 'COMMUNICATION',
    'followups': 'FOLLOW_UP',
    'follow-ups': 'FOLLOW_UP',
    'financial': 'FINANCIAL_METRIC',
    'encounters': 'CLINICAL_ENCOUNTER',
    'templates': 'MESSAGE_TEMPLATE',
    'users': 'USER',
    'organizations': 'ORGANIZATION',
    'gdpr': 'GDPR_REQUEST'
  };

  return resourceMap[resource] || resource.toUpperCase();
};

/**
 * Extract resource ID from request
 * @param {Object} req - Express request
 * @returns {string|null} Resource ID
 */
const getResourceId = (req) => {
  // Try params first (e.g., /patients/:id)
  if (req.params.id) return req.params.id;
  if (req.params.patientId) return req.params.patientId;
  if (req.params.encounterId) return req.params.encounterId;

  // Try body for POST requests
  if (req.method === 'POST' && req.body?.id) return req.body.id;

  // Try response for CREATE operations (set by controller)
  if (req.auditResourceId) return req.auditResourceId;

  return null;
};

/**
 * Capture changes for UPDATE operations
 * @param {Object} req - Express request
 * @returns {Object|null} Changes object
 */
const captureChanges = (req) => {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    return {
      old_values: req.auditOldValues || {},
      new_values: req.body || {}
    };
  }
  return null;
};

/**
 * Determine if request should be audited
 * @param {Object} req - Express request
 * @returns {boolean} Should audit
 */
const shouldAudit = (req) => {
  // Always audit sensitive resources
  const resourceType = getResourceType(req.path);
  if (SENSITIVE_RESOURCES.some(r => resourceType.includes(r.toUpperCase()))) {
    return true;
  }

  // Audit all mutating operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return true;
  }

  // Audit reads of patient data
  if (req.method === 'GET' && req.path.includes('patients')) {
    return true;
  }

  // Skip health checks and static assets
  if (req.path.includes('/health') || req.path.includes('/static')) {
    return false;
  }

  return false;
};

/**
 * Audit logging middleware
 */
export const auditLogger = async (req, res, next) => {
  // Skip if not auditable
  if (!shouldAudit(req)) {
    return next();
  }

  // Capture request start time
  const startTime = Date.now();

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Log audit after successful response
    setImmediate(async () => {
      try {
        const action = AUDITABLE_ACTIONS[req.method] || req.method;
        const resourceType = getResourceType(req.path);
        const resourceId = getResourceId(req) || (data?.id) || (data?.data?.id);
        const changes = captureChanges(req);
        const duration = Date.now() - startTime;

        await logAudit({
          organizationId: req.organizationId,
          userId: req.user?.id,
          userEmail: req.user?.email || req.user?.emailAddress,
          userRole: req.user?.role,
          action,
          resourceType,
          resourceId,
          changes,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
          }
        });
      } catch (error) {
        // Don't fail the request if audit logging fails
        logger.error('Audit logging failed', {
          error: error.message,
          path: req.path,
          method: req.method
        });
      }
    });

    return originalJson(data);
  };

  next();
};

/**
 * Audit middleware for sensitive data access
 * Requires explicit reason for accessing patient data
 */
export const auditSensitiveAccess = (req, res, next) => {
  const resourceType = getResourceType(req.path);

  // Require reason for accessing encrypted personal data
  if (resourceType === 'PATIENT' && req.path.includes('decrypt')) {
    if (!req.body?.reason && !req.query?.reason) {
      return res.status(400).json({
        error: 'BadRequestError',
        code: 'AUDIT_REASON_REQUIRED',
        message: 'A reason must be provided for accessing sensitive patient data'
      });
    }

    // Log the reason
    req.auditReason = req.body?.reason || req.query?.reason;
  }

  next();
};

/**
 * Bulk operation audit helper
 * For operations affecting multiple records
 */
export const auditBulkOperation = async (req, action, resourceType, resourceIds, metadata = {}) => {
  try {
    await logAudit({
      organizationId: req.organizationId,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action,
      resourceType,
      resourceId: null, // Bulk operation
      metadata: {
        bulkOperation: true,
        affectedCount: resourceIds.length,
        resourceIds: resourceIds.slice(0, 100), // Limit logged IDs
        ...metadata
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    logger.error('Bulk audit logging failed', error);
  }
};

export default {
  auditLogger,
  auditSensitiveAccess,
  auditBulkOperation
};
