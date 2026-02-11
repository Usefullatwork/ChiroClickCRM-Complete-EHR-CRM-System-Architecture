/**
 * Custom Error Classes
 * Provides structured error handling with codes
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource, identifier = null) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'RESOURCE_NOT_FOUND', { resource, identifier });
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(resource, field, value) {
    super(`${resource} with ${field} '${value}' already exists`, 409, 'RESOURCE_CONFLICT', {
      resource,
      field,
      value,
    });
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      originalError ? { originalError: originalError.message } : null
    );
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service, message = null) {
    super(
      message || `External service '${service}' is unavailable`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { service }
    );
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = null) {
    super(
      'Too many requests, please try again later',
      429,
      'RATE_LIMIT_EXCEEDED',
      retryAfter ? { retryAfter } : null
    );
  }
}

/**
 * Business Logic Error (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
  }
}

/**
 * GDPR Compliance Error (451)
 */
export class GDPRError extends AppError {
  constructor(message) {
    super(message, 451, 'GDPR_COMPLIANCE_ERROR');
  }
}

/**
 * Gone Error (410)
 */
export class GoneError extends AppError {
  constructor(resource, identifier = null) {
    const message = identifier
      ? `${resource} '${identifier}' has been permanently removed`
      : `${resource} has been permanently removed`;
    super(message, 410, 'RESOURCE_GONE', { resource, identifier });
  }
}

/**
 * Unprocessable Entity Error (422)
 */
export class UnprocessableError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(service, retryAfter = null) {
    super(
      `${service} is temporarily unavailable`,
      503,
      'SERVICE_UNAVAILABLE',
      retryAfter ? { retryAfter } : null
    );
  }
}

export default {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  BadRequestError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  BusinessLogicError,
  GDPRError,
  GoneError,
  UnprocessableError,
  ServiceUnavailableError,
};
