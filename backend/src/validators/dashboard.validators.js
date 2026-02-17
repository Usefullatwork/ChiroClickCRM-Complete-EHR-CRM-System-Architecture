/**
 * Dashboard Validation Schemas
 * Dashboard routes are simple GETs with no params/body, so minimal validation needed.
 */

import _Joi from 'joi';

// No schemas needed - all three endpoints are simple GET requests
// with no params, query, or body. Auth/org middleware handles access.
// Exported as empty object for consistency.
