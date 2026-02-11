/**
 * Request Correlation ID Middleware
 * Generates a unique ID per request for distributed tracing
 */

import crypto from 'crypto';

export const correlationId = (req, res, next) => {
  // Use existing correlation ID from header (for distributed tracing) or generate new one
  const id = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = id;
  res.set('X-Correlation-ID', id);
  next();
};

export default correlationId;
