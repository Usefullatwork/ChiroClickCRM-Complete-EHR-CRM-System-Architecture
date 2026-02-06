/**
 * Authentication Middleware
 * Local-only authentication via sessions and API keys.
 */

import { query, setTenantContext } from '../config/database.js';
import { validateSession } from '../auth/sessions.js';
import logger from '../utils/logger.js';

/**
 * Get auth mode from request
 * Checks for session cookie (local) or Bearer token (API key)
 */
const getAuthMode = (req) => {
  if (req.cookies?.session) {
    return 'local';
  }
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return 'bearer';
  }
  return null;
};

/**
 * Local session authentication
 */
export const requireLocalAuth = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session required. Please login'
      });
    }

    const result = await validateSession(sessionId);

    if (!result) {
      res.clearCookie('session');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired. Please login again'
      });
    }

    req.user = result.user;
    req.session = result.session;
    req.organizationId = result.user.organizationId;

    next();
  } catch (error) {
    logger.error('Local auth error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Require a "fresh" session (recently authenticated)
 * Used for sensitive operations like password change
 */
export const requireFreshSession = (req, res, next) => {
  if (!req.session?.fresh) {
    return res.status(403).json({
      error: 'Fresh Session Required',
      message: 'Please confirm your password to continue',
      code: 'FRESH_SESSION_REQUIRED'
    });
  }
  next();
};

/**
 * Authentication middleware
 * Supports session-based auth and API key auth
 */
export const requireAuth = async (req, res, next) => {
  // Dev mode bypass - only in development with special header
  const DEV_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const DEV_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
    req.user = {
      id: DEV_USER_ID,
      email: 'dev@chiroclickcrm.local',
      first_name: 'Dev',
      last_name: 'User',
      role: 'ADMIN',
      organization_id: DEV_ORG_ID,
      organizationId: DEV_ORG_ID,
      is_active: true
    };
    req.organizationId = DEV_ORG_ID;
    logger.debug('Dev mode auth bypass active');
    return next();
  }

  const authMode = getAuthMode(req);

  if (!authMode) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (authMode === 'local') {
    return requireLocalAuth(req, res, next);
  }

  if (authMode === 'bearer') {
    return requireApiKey(req, res, next);
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid authentication method'
  });
};

/**
 * Multi-tenant middleware
 * Ensures user has access to the requested organization
 * Sets PostgreSQL RLS context
 */
export const requireOrganization = async (req, res, next) => {
  // Dev mode bypass - use valid UUID
  const DEV_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
    req.organizationId = DEV_ORG_ID;
    return next();
  }

  try {
    // Get organization from header or user
    const organizationId = req.headers['x-organization-id'] || req.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Organization context required'
      });
    }

    // Verify user belongs to the organization
    if (req.user && req.user.organizationId !== organizationId && req.user.organization_id !== organizationId) {
      logger.warn('Unauthorized organization access attempt', {
        userId: req.user.id,
        requestedOrg: organizationId,
        userOrg: req.user.organizationId || req.user.organization_id
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization'
      });
    }

    // Set PostgreSQL RLS context
    await setTenantContext(organizationId);

    req.organizationId = organizationId;
    next();
  } catch (error) {
    logger.error('Organization middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify organization access'
    });
  }
};

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || req.user.Role;
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * API Key authentication
 */
export const requireApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer cck_')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid API key required'
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    const prefix = apiKey.substring(0, 14); // 'cck_' + 10 char prefix

    // Hash the key for comparison
    const crypto = await import('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await query(
      `SELECT ak.*, o.name as organization_name
       FROM api_keys ak
       JOIN organizations o ON o.id = ak.organization_id
       WHERE ak.key_prefix = $1
         AND ak.key_hash = $2
         AND ak.is_active = true
         AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [prefix, keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key'
      });
    }

    const apiKeyRecord = result.rows[0];

    // Update last used timestamp (async, don't wait)
    query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [apiKeyRecord.id])
      .catch(err => logger.error('Failed to update API key last_used_at', err));

    req.apiKey = apiKeyRecord;
    req.organizationId = apiKeyRecord.organization_id;

    // Set tenant context
    await setTenantContext(apiKeyRecord.organization_id);

    next();
  } catch (error) {
    logger.error('API key auth error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Check if API key has required scope
 */
export const requireScope = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key authentication required'
      });
    }

    const keyScopes = req.apiKey.scopes || [];
    const hasScope = requiredScopes.some(scope =>
      keyScopes.includes(scope) || keyScopes.includes('admin')
    );

    if (!hasScope) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following scopes: ${requiredScopes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authMode = getAuthMode(req);

    if (!authMode) {
      return next();
    }

    if (authMode === 'local') {
      const sessionId = req.cookies?.session;
      if (sessionId) {
        const result = await validateSession(sessionId);
        if (result) {
          req.user = result.user;
          req.session = result.session;
          req.organizationId = result.user.organizationId;
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// Alias for backward compatibility
export const authenticate = requireAuth;

export default {
  requireAuth,
  authenticate,
  requireLocalAuth,
  requireFreshSession,
  requireOrganization,
  requireRole,
  requireApiKey,
  requireScope,
  optionalAuth
};
