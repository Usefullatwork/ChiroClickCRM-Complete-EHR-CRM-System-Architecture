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

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { redisRateLimiter } from '../config/redis.js';
import { csrfProtection as customCsrfProtection, csrfErrorHandler } from './csrf.js';

/**
 * Sanitize-html presets: strict for non-clinical, permissive for SOAP fields
 */
const STRICT_SANITIZE_OPTS = {
  allowedTags: [],
  allowedAttributes: {},
};

const CLINICAL_SANITIZE_OPTS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'br', 'p', 'sub', 'sup'],
  allowedAttributes: {},
};

/**
 * Strip dangerous URI protocols and inline event handlers that sanitize-html
 * may not catch in plain text (non-attribute) contexts
 */
const stripDangerousProtocols = (str) =>
  str.replace(/javascript\s*:/gi, '').replace(/on\w+\s*=/gi, '');

/**
 * CSRF Protection Middleware
 * Uses custom Double Submit Cookie implementation (csrf.js)
 * instead of deprecated csurf package
 */
export const csrfProtection = customCsrfProtection();

/**
 * Send CSRF token to client
 * Token is already set as a cookie by the custom CSRF middleware.
 * This middleware exposes it via a response header for convenience.
 */
export const sendCsrfToken = (req, res, next) => {
  if (req.csrfToken) {
    res.set('X-CSRF-TOKEN', req.csrfToken());
  }
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
export const requireRole = (allowedRoles) => (req, res, next) => {
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
 * CSP allows connections to Ollama (localhost:11434) for AI features
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:11434', 'http://127.0.0.1:11434'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
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
 * AI-specific rate limit: 10 requests/minute per user
 * Apply to /api/v1/ai/* routes
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'AI Rate Limit Exceeded',
    message: 'Too many AI requests. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth brute-force protection: 5 attempts per 15 minutes per IP
 * Apply to /api/v1/auth/login
 */
export const authBruteForceLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  skip: () => ['test', 'e2e'].includes(process.env.NODE_ENV),
  message: {
    error: 'Too Many Login Attempts',
    message:
      'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks using allow-list approach (sanitize-html)
 */
export const sanitizeInput = (req, res, next) => {
  // Clinical fields that may contain basic formatting
  const clinicalFields = ['subjective', 'objective', 'assessment', 'plan', 'notes'];

  // Sanitize query parameters (strict — no HTML allowed)
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = stripDangerousProtocols(
          sanitizeHtml(req.query[key], STRICT_SANITIZE_OPTS)
        ).trim();
      }
    });
  }

  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        const opts = clinicalFields.includes(key) ? CLINICAL_SANITIZE_OPTS : STRICT_SANITIZE_OPTS;
        req.body[key] = stripDangerousProtocols(sanitizeHtml(req.body[key], opts)).trim();
      }
    });
  }

  next();
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
  const { logAction, _ACTION_TYPES } = await import('../services/auditLog.js');

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
  csrfErrorHandler,
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
  aiRateLimit,
  authBruteForceLimit,
};
