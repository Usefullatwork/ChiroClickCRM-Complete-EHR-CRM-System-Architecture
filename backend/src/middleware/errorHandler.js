/**
 * Centralized Error Handling Middleware
 * Production-ready error handling with GDPR compliance
 *
 * Handles:
 * - Validation errors (Joi)
 * - Database errors (PostgreSQL)
 * - Authentication/Authorization errors
 * - CSRF errors
 * - Rate limit errors
 * - Generic errors
 */

import { logSecurityEvent } from './security.js';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Handle Joi validation errors
 */
const handleJoiError = (error) => {
  const details = error.details?.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    type: detail.type
  }));

  return new ValidationError('Validation failed', details);
};

/**
 * Handle PostgreSQL errors
 */
const handleDatabaseError = (error) => {
  const { code, detail, constraint } = error;

  // PostgreSQL error codes
  switch (code) {
    case '23505': // unique_violation
      return new ValidationError(
        `Duplicate value: ${detail || 'A record with this value already exists'}`,
        { constraint, field: constraint?.replace('_key', '') }
      );

    case '23503': // foreign_key_violation
      return new ValidationError(
        `Invalid reference: ${detail || 'Referenced record does not exist'}`,
        { constraint }
      );

    case '23502': // not_null_violation
      const column = error.column || 'unknown';
      return new ValidationError(
        `Required field missing: ${column}`,
        { field: column }
      );

    case '22P02': // invalid_text_representation
      return new ValidationError(
        'Invalid data format',
        { detail: error.message }
      );

    case '42P01': // undefined_table
      return new DatabaseError('Database configuration error - table not found');

    case '42703': // undefined_column
      return new DatabaseError('Database configuration error - column not found');

    case '53300': // too_many_connections
      return new DatabaseError('Service temporarily unavailable - too many connections');

    case '57P01': // admin_shutdown
    case '57P02': // crash_shutdown
    case '57P03': // cannot_connect_now
      return new DatabaseError('Database is currently unavailable');

    case '40001': // serialization_failure
    case '40P01': // deadlock_detected
      return new DatabaseError('Database conflict - please retry');

    default:
      // Log unexpected database errors for investigation
      console.error('Unhandled database error:', { code, message: error.message });
      return new DatabaseError('Database operation failed');
  }
};

/**
 * Handle CSRF errors
 */
const handleCsrfError = (error) => {
  return new AuthorizationError('Invalid CSRF token - please refresh the page and try again');
};

/**
 * Log error for monitoring
 */
const logError = async (error, req) => {
  const errorLog = {
    name: error.name || 'Error',
    message: error.message,
    statusCode: error.statusCode || 500,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Log to console (in production, use proper logging service like Winston/Bunyan)
  if (process.env.NODE_ENV === 'production') {
    // Only log stack traces for non-operational errors
    if (!error.isOperational) {
      console.error('❌ CRITICAL ERROR:', errorLog);
    } else {
      console.warn('⚠️  Operational error:', {
        name: errorLog.name,
        message: errorLog.message,
        url: errorLog.url,
        userId: errorLog.userId
      });
    }
  } else {
    console.error('Error:', errorLog);
  }

  // Log security-relevant errors to audit log
  const securityRelevantErrors = [
    'AuthenticationError',
    'AuthorizationError',
    'EBADCSRFTOKEN'
  ];

  if (securityRelevantErrors.includes(error.name) || error.code === 'EBADCSRFTOKEN') {
    try {
      await logSecurityEvent(req, 'security_error', {
        errorType: error.name,
        errorMessage: error.message,
        statusCode: error.statusCode,
        success: false
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
  }
};

/**
 * Send error response to client
 */
const sendErrorResponse = (error, req, res) => {
  const statusCode = error.statusCode || 500;

  // Build error response
  const errorResponse = {
    error: error.name || 'Error',
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    path: req.originalUrl
  };

  // Add details for validation errors
  if (error.details) {
    errorResponse.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = error.stack;
  }

  // Add request ID if available (for tracing)
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Main error handling middleware
 * MUST be registered LAST in Express middleware chain
 */
export const errorHandler = async (err, req, res, next) => {
  let error = err;

  // Convert known error types
  if (err.isJoi || err.name === 'ValidationError') {
    error = handleJoiError(err);
  } else if (err.code && err.code.match(/^(23|22|42|53|57|40)/)) {
    // PostgreSQL error codes
    error = handleDatabaseError(err);
  } else if (err.code === 'EBADCSRFTOKEN') {
    error = handleCsrfError(err);
  } else if (err.name === 'UnauthorizedError') {
    // JWT/Auth errors
    error = new AuthenticationError('Invalid or expired token');
  } else if (err.name === 'MulterError') {
    // File upload errors
    error = new ValidationError(`File upload error: ${err.message}`);
  } else if (!(err instanceof AppError)) {
    // Wrap unknown errors
    error = new AppError(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      err.statusCode || 500,
      false // Not operational
    );
  }

  // Log error
  await logError(error, req);

  // Send response
  sendErrorResponse(error, req, res);
};

/**
 * Handle 404 Not Found
 * Register BEFORE errorHandler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 *
 * Usage:
 * router.get('/patients', asyncHandler(async (req, res) => {
 *   const patients = await getPatients();
 *   res.json(patients);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);

  // In production, you might want to:
  // 1. Log to monitoring service (Sentry, DataDog, etc.)
  // 2. Send alert to team
  // 3. Gracefully shutdown if critical

  if (process.env.NODE_ENV === 'production') {
    // Log but don't crash immediately
    console.error('Server will continue running, but this should be investigated');
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);

  // Uncaught exceptions are serious - the process is in an undefined state
  // Best practice: log and gracefully shutdown

  if (process.env.NODE_ENV === 'production') {
    console.error('Server shutting down due to uncaught exception');
    process.exit(1); // Exit with failure
  }
});

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
