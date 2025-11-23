/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Error handler middleware
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    organizationId: req.organizationId
  });

  // If it's an operational error (expected), send structured response
  if (err.isOperational && err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle specific non-operational errors

  // Joi validation errors (from old validation if any)
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(400).json({
      error: 'ValidationError',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Database constraint errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'ConflictError',
      code: 'RESOURCE_CONFLICT',
      message: 'Resource already exists',
      details: { constraint: err.constraint }
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'BadRequestError',
      code: 'INVALID_REFERENCE',
      message: 'Referenced resource does not exist',
      details: { constraint: err.constraint }
    });
  }

  if (err.code === '23502') { // PostgreSQL not null violation
    return res.status(400).json({
      error: 'BadRequestError',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Required field is missing',
      details: { column: err.column }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'AuthenticationError',
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'AuthenticationError',
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    });
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'BadRequestError',
      code: 'FILE_UPLOAD_ERROR',
      message: err.message,
      details: { field: err.field }
    });
  }

  // Default to 500 server error for unexpected errors
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    error: 'InternalServerError',
    code: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFoundError',
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
    details: {
      method: req.method,
      path: req.path
    }
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
