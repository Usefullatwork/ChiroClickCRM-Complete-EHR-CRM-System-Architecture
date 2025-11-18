/**
 * Authentication Middleware
 * Integrates with Clerk.com for user authentication
 */

import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Verify Clerk authentication and attach user info to request
 */
export const requireAuth = ClerkExpressRequireAuth();

/**
 * Multi-tenant middleware
 * Ensures user has access to the requested organization
 */
export const requireOrganization = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id'];

    if (!organizationId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'X-Organization-Id header is required'
      });
    }

    // Get user from database using Clerk ID
    const userResult = await query(
      'SELECT * FROM users WHERE clerk_user_id = $1 AND is_active = true',
      [req.auth.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database'
      });
    }

    const user = userResult.rows[0];

    // Verify user belongs to the organization
    if (user.organization_id !== organizationId) {
      logger.warn('Unauthorized organization access attempt', {
        userId: user.id,
        requestedOrg: organizationId,
        userOrg: user.organization_id
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization'
      });
    }

    // Attach user and organization to request
    req.user = user;
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

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
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
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    // Try to authenticate
    requireAuth(req, res, async (error) => {
      if (error) {
        // Authentication failed, but that's okay for optional routes
        return next();
      }

      // User is authenticated, attach user info
      try {
        const userResult = await query(
          'SELECT * FROM users WHERE clerk_user_id = $1 AND is_active = true',
          [req.auth.userId]
        );

        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0];
        }
      } catch (dbError) {
        logger.error('Optional auth database error:', dbError);
      }

      next();
    });
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

export default {
  requireAuth,
  requireOrganization,
  requireRole,
  optionalAuth
};
