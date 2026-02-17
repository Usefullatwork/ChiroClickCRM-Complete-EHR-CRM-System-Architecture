/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 *
 * Note: Uses custom implementation instead of csurf (deprecated)
 */

import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
const generateToken = () => crypto.randomBytes(TOKEN_LENGTH).toString('hex');

/**
 * CSRF Protection Configuration
 */
const defaultConfig = {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
  cookieOptions: {
    httpOnly: false, // Must be accessible by JavaScript to set header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: [
    '/health',
    '/api/v1/webhooks', // Webhooks need their own verification
  ],
};

/**
 * Create CSRF Protection Middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
export const csrfProtection = (options = {}) => {
  const config = { ...defaultConfig, ...options };

  return (req, res, next) => {
    // Skip for ignored methods
    if (config.ignoreMethods.includes(req.method)) {
      // Generate and set CSRF token for GET requests (for forms)
      if (req.method === 'GET') {
        const token = generateToken();
        res.cookie(config.cookieName, token, config.cookieOptions);
        req.csrfToken = () => token;
      }
      return next();
    }

    // Skip for ignored paths
    if (config.ignorePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Get token from cookie
    const cookieToken = req.cookies?.[config.cookieName];

    // Get token from header or body
    const headerToken =
      req.headers[config.headerName.toLowerCase()] ||
      req.headers[config.headerName] ||
      req.body?._csrf;

    // Validate tokens exist
    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        error: 'CSRFError',
        code: 'CSRF_TOKEN_MISSING',
        message:
          'CSRF token missing. Include X-XSRF-TOKEN header with the value from XSRF-TOKEN cookie.',
      });
    }

    // Validate tokens match
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return res.status(403).json({
        error: 'CSRFError',
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token validation failed.',
      });
    }

    // Generate new token for next request (token rotation)
    const newToken = generateToken();
    res.cookie(config.cookieName, newToken, config.cookieOptions);
    req.csrfToken = () => newToken;

    next();
  };
};

/**
 * Error handler for CSRF errors
 */
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.code?.startsWith('CSRF_')) {
    return res.status(403).json({
      error: 'CSRFError',
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Form has been tampered with or session expired. Please refresh and try again.',
    });
  }
  next(err);
};

/**
 * Middleware to expose CSRF token to templates
 */
export const csrfTokenProvider = (req, res, next) => {
  // Make CSRF token available to response locals for templates
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  next();
};

export default {
  csrfProtection,
  csrfErrorHandler,
  csrfTokenProvider,
};
