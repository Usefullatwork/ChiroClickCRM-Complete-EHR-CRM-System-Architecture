/**
 * Error Reporting Endpoint
 * Accepts frontend error reports for centralized logging.
 * Rate-limited to prevent abuse.
 *
 * @swagger
 * /errors:
 *   post:
 *     summary: Report a frontend error
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *               stack:
 *                 type: string
 *                 maxLength: 5000
 *               componentStack:
 *                 type: string
 *                 maxLength: 5000
 *               url:
 *                 type: string
 *                 maxLength: 2000
 *               userAgent:
 *                 type: string
 *                 maxLength: 500
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Error report accepted
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */

import { Router } from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const router = Router();

// Rate limit: max 10 error reports per minute per IP
const errorReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many error reports. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Joi schema for error report validation
const errorReportSchema = Joi.object({
  message: Joi.string().max(2000).required(),
  stack: Joi.string().max(5000).allow('', null),
  componentStack: Joi.string().max(5000).allow('', null),
  url: Joi.string().max(2000).allow('', null),
  userAgent: Joi.string().max(500).allow('', null),
  timestamp: Joi.string().isoDate().allow('', null),
});

router.post('/', errorReportLimiter, (req, res) => {
  const { error: validationError, value } = errorReportSchema.validate(req.body, {
    stripUnknown: true,
  });

  if (validationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: validationError.details[0]?.message || 'Invalid error report',
    });
  }

  logger.error('Frontend error report', {
    frontendError: true,
    message: value.message,
    stack: value.stack || null,
    componentStack: value.componentStack || null,
    url: value.url || null,
    userAgent: value.userAgent || req.get('user-agent') || null,
    timestamp: value.timestamp || new Date().toISOString(),
    ip: req.ip,
    correlationId: req.correlationId,
  });

  return res.status(201).json({ accepted: true });
});

export default router;
