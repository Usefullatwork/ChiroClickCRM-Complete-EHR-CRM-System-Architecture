/**
 * Validation Middleware
 * Provides request validation using Joi schemas
 */

import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Validate request middleware factory
 * @param {Object} schema - Joi schema object with optional body, query, params keys
 */
export const validate = (schema) => (req, res, next) => {
  const validationOptions = {
    abortEarly: false, // Return all errors
    allowUnknown: true, // Allow unknown keys (for middleware-added fields)
    stripUnknown: false, // Don't strip unknown keys
  };

  const toValidate = {};
  if (schema.body) {
    toValidate.body = req.body;
  }
  if (schema.query) {
    toValidate.query = req.query;
  }
  if (schema.params) {
    toValidate.params = req.params;
  }

  const schemaToValidate = Joi.object(schema);
  const { error, value } = schemaToValidate.validate(toValidate, validationOptions);

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors,
    });

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }

  // Replace req values with validated values
  if (value.body) {
    req.body = value.body;
  }
  if (value.query) {
    req.query = value.query;
  }
  if (value.params) {
    req.params = value.params;
  }

  next();
};

export default validate;
