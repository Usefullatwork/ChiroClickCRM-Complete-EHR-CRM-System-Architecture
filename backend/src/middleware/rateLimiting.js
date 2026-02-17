/**
 * Rate Limiting Middleware
 * Prevents abuse and controls costs for communication endpoints
 */

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { RateLimitError } from '../utils/errors.js';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequestsError',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
  },
  handler: (req, _res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id,
    });
    throw new RateLimitError(req.rateLimit.resetTime);
  },
});

/**
 * SMS rate limiter
 * 10 SMS per hour per user to prevent spam and cost overruns
 */
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    // Rate limit per user (not IP)
    req.user?.id || req.ip,
  message: {
    error: 'SMSRateLimitError',
    code: 'SMS_RATE_LIMIT_EXCEEDED',
    message: 'SMS rate limit exceeded. Maximum 10 SMS per hour.',
    details: {
      limit: 10,
      window: '1 hour',
    },
  },
  handler: (req, _res) => {
    logger.warn('SMS rate limit exceeded', {
      userId: req.user?.id,
      patientId: req.body?.patient_id,
      organizationId: req.organizationId,
    });
    throw new RateLimitError(req.rateLimit.resetTime);
  },
  skip: (req) =>
    // Skip rate limiting for admins in development
    process.env.NODE_ENV === 'development' && req.user?.role === 'ADMIN',
});

/**
 * Email rate limiter
 * 20 emails per hour per user
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'EmailRateLimitError',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED',
    message: 'Email rate limit exceeded. Maximum 20 emails per hour.',
    details: {
      limit: 20,
      window: '1 hour',
    },
  },
  handler: (req, _res) => {
    logger.warn('Email rate limit exceeded', {
      userId: req.user?.id,
      patientId: req.body?.patient_id,
      organizationId: req.organizationId,
    });
    throw new RateLimitError(req.rateLimit.resetTime);
  },
  skip: (req) => process.env.NODE_ENV === 'development' && req.user?.role === 'ADMIN',
});

/**
 * Per-patient communication rate limiter
 * Prevents spamming individual patients
 * 3 messages per patient per day
 */
export const perPatientLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per patient
    const patientId = req.body?.patient_id || req.params?.patientId;
    return `patient:${patientId}`;
  },
  message: {
    error: 'PatientCommunicationLimitError',
    code: 'PATIENT_COMMUNICATION_LIMIT_EXCEEDED',
    message:
      'Communication limit for this patient exceeded. Maximum 3 messages per patient per day.',
    details: {
      limit: 3,
      window: '24 hours',
    },
  },
  handler: (req, _res) => {
    logger.warn('Per-patient communication limit exceeded', {
      userId: req.user?.id,
      patientId: req.body?.patient_id || req.params?.patientId,
      organizationId: req.organizationId,
    });
    throw new RateLimitError(req.rateLimit.resetTime);
  },
  skip: (req) =>
    // Skip if no patient_id (shouldn't happen with proper validation)
    !req.body?.patient_id && !req.params?.patientId,
});

/**
 * Login rate limiter
 * 5 login attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts
  skip: () => ['test', 'e2e'].includes(process.env.NODE_ENV),
  message: {
    error: 'LoginRateLimitError',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts. Please try again later.',
    details: {
      limit: 5,
      window: '15 minutes',
    },
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'StrictRateLimitError',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded for this sensitive endpoint.',
  },
});

export default {
  generalLimiter,
  smsLimiter,
  emailLimiter,
  perPatientLimiter,
  loginLimiter,
  strictLimiter,
};
