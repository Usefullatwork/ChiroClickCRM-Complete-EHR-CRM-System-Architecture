/**
 * Security Middleware
 * CRITICAL security enhancements for production deployment
 *
 * Includes:
 * - CSRF protection
 * - 2FA enforcement for admin users
 * - Rate limiting per user/endpoint
 * - Security headers
 * - Input sanitization
 */

import csrf from 'csurf';
import helmet from 'helmet';
import { redisRateLimiter } from '../config/redis.js';

/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks
 */
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

/**
 * Send CSRF token to client
 */
export const sendCsrfToken = (req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Accessible to JavaScript (needed for axios)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  next();
};

/**
 * 2FA Enforcement Middleware
 * CRITICAL: Admin users MUST have 2FA enabled
 */
export const enforce2FA = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin or has elevated privileges
  const requires2FA = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);

  if (requires2FA) {
    // Check if 2FA is enabled
    const has2FA = user.twoFactorEnabled || user.mfaEnabled;

    if (!has2FA) {
      return res.status(403).json({
        error: '2FA Required',
        message: 'Two-factor authentication is required for admin accounts',
        action: 'ENABLE_2FA',
        setupUrl: '/settings/security/2fa',
      });
    }

    // Verify 2FA session is valid
    const mfaVerified = req.session?.mfaVerified;
    const mfaVerifiedAt = req.session?.mfaVerifiedAt;

    if (!mfaVerified || !mfaVerifiedAt) {
      return res.status(403).json({
        error: '2FA Verification Required',
        message: 'Please verify your identity with 2FA',
        action: 'VERIFY_2FA',
      });
    }

    // Check if 2FA verification is stale (> 12 hours)
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    if (mfaVerifiedAt < twelveHoursAgo) {
      return res.status(403).json({
        error: '2FA Session Expired',
        message: 'Please re-verify your identity',
        action: 'VERIFY_2FA',
      });
    }
  }

  next();
};

/**
 * Role-based access control
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Strict rate limiting for sensitive endpoints
 *
 * Usage:
 * router.post('/admin/delete-patient', strictRateLimit, deletePatient);
 */
export const strictRateLimit = async (req, res, next) => {
  const identifier = `${req.user?.id || req.ip}:strict:${req.path}`;

  const result = await redisRateLimiter.checkLimit(identifier, 5, 15 * 60);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many attempts. Please try again later.',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }

  res.set('X-RateLimit-Remaining', String(result.remaining));

  next();
};

/**
 * Moderate rate limiting for normal endpoints
 */
export const moderateRateLimit = async (req, res, next) => {
  const identifier = `${req.user?.id || req.ip}:moderate:${req.path}`;

  const result = await redisRateLimiter.checkLimit(identifier, 60, 60);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }

  res.set('X-RateLimit-Remaining', String(result.remaining));

  next();
};

/**
 * Security headers using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: {
    action: 'deny',
  },
});

/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitize body (but preserve specific fields that need HTML)
  if (req.body) {
    const preserveFields = ['subjective', 'objective', 'assessment', 'plan', 'notes'];

    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string' && !preserveFields.includes(key)) {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  next();
};

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
const sanitizeString = (str) => {
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim();
};

/**
 * Validate organization ownership
 * Ensures users can only access data from their own organization
 */
export const validateOrganization = async (req, res, next) => {
  const user = req.user;
  const requestedOrgId =
    req.params.organizationId || req.body.organizationId || req.headers['x-organization-id'];

  if (!requestedOrgId) {
    return res.status(400).json({
      error: 'Organization ID required',
    });
  }

  // Super admins can access any organization
  if (user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Regular users must belong to the organization
  if (user.organizationId !== requestedOrgId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this organization',
    });
  }

  next();
};

/**
 * Require HTTPS in production
 */
export const requireHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
  }
  next();
};

/**
 * Session security
 */
export const secureSession = {
  name: 'sessionId', // Don't use default 'connect.sid'
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent JavaScript access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
  rolling: true, // Reset maxAge on each request
};

/**
 * Log security events
 */
export const logSecurityEvent = async (req, eventType, details = {}) => {
  const { logAction, ACTION_TYPES } = await import('../services/auditLog.js');

  await logAction(eventType, req.user?.id, {
    resourceType: 'security_event',
    metadata: {
      eventType,
      ...details,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      path: req.path,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: details.success !== false,
  });
};

export default {
  csrfProtection,
  sendCsrfToken,
  enforce2FA,
  requireRole,
  strictRateLimit,
  moderateRateLimit,
  securityHeaders,
  sanitizeInput,
  validateOrganization,
  requireHTTPS,
  secureSession,
  logSecurityEvent,
};
