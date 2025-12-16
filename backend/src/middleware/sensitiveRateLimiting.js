/**
 * Sensitive Endpoint Rate Limiting
 * Stricter rate limits for sensitive operations (GDPR, deletion, etc.)
 */

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Create a custom rate limiter with logging
 */
const createLimiter = (options) => {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for sensitive endpoint', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      res.status(429).json({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'For mange forespørsler. Vennligst vent før du prøver igjen.',
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    ...options,
  });
};

/**
 * Rate limiter for GDPR data access requests
 * Limit: 5 requests per hour per user
 */
export const gdprAccessLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'For mange dataforespørsler. Maksimalt 5 forespørsler per time.',
  keyGenerator: (req) => `gdpr-access:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for GDPR erasure requests
 * Limit: 3 requests per hour per user
 */
export const gdprErasureLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'For mange sletteforespørsler. Maksimalt 3 forespørsler per time.',
  keyGenerator: (req) => `gdpr-erasure:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for patient deletion
 * Limit: 10 deletions per hour per user
 */
export const patientDeletionLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'For mange sletteoperasjoner. Maksimalt 10 per time.',
  keyGenerator: (req) => `patient-delete:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for bulk operations
 * Limit: 5 bulk operations per hour per user
 */
export const bulkOperationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'For mange masseoperasjoner. Maksimalt 5 per time.',
  keyGenerator: (req) => `bulk-op:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for data export
 * Limit: 10 exports per day per user
 */
export const dataExportLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: 'For mange dataeksporter. Maksimalt 10 per dag.',
  keyGenerator: (req) => `data-export:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for authentication attempts
 * Limit: 5 attempts per 15 minutes per IP
 */
export const authAttemptLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'For mange påloggingsforsøk. Vennligst vent 15 minutter.',
  keyGenerator: (req) => `auth:${req.ip}`,
});

/**
 * Rate limiter for password reset
 * Limit: 3 requests per hour per email
 */
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'For mange tilbakestillingsforespørsler. Maksimalt 3 per time.',
  keyGenerator: (req) => `password-reset:${req.body?.email || req.ip}`,
});

/**
 * Rate limiter for API key generation
 * Limit: 5 per day per user
 */
export const apiKeyGenerationLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: 'For mange API-nøkler generert. Maksimalt 5 per dag.',
  keyGenerator: (req) => `api-key:${req.user?.id || req.ip}`,
});

/**
 * Rate limiter for encounter signing
 * Limit: 50 signatures per hour per user
 */
export const encounterSigningLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'For mange signeringer. Maksimalt 50 per time.',
  keyGenerator: (req) => `encounter-sign:${req.user?.id || req.ip}`,
});

/**
 * Per-patient communication limiter
 * Limit: 3 messages per patient per 24 hours
 */
export const patientCommunicationLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: 'For mange meldinger til denne pasienten. Maksimalt 3 per dag.',
  keyGenerator: (req) => `patient-comm:${req.body?.patientId || 'unknown'}:${req.organizationId}`,
});

export default {
  gdprAccessLimiter,
  gdprErasureLimiter,
  patientDeletionLimiter,
  bulkOperationLimiter,
  dataExportLimiter,
  authAttemptLimiter,
  passwordResetLimiter,
  apiKeyGenerationLimiter,
  encounterSigningLimiter,
  patientCommunicationLimiter,
};
