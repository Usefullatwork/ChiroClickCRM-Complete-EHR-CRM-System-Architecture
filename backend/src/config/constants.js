/**
 * Application Constants
 * Centralized magic numbers and configuration values
 *
 * Import specific constants:
 *   import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants.js';
 */

// =============================================================================
// PAGINATION
// =============================================================================

/** Default number of items per page for list endpoints */
export const DEFAULT_PAGE_SIZE = 20;

/** Default page size for resource-heavy list endpoints (appointments, invoices, exercises) */
export const DEFAULT_PAGE_SIZE_LARGE = 50;

/** Maximum allowed page size to prevent excessive queries */
export const MAX_PAGE_SIZE = 1000;

/** Minimum page number */
export const MIN_PAGE = 1;

// =============================================================================
// RATE LIMITING
// =============================================================================

/** General API rate limit window: 15 minutes (ms) */
export const RATE_LIMIT_WINDOW_GENERAL = 15 * 60 * 1000;

/** General API max requests per window */
export const RATE_LIMIT_MAX_GENERAL = 100;

/** SMS rate limit window: 1 hour (ms) */
export const RATE_LIMIT_WINDOW_SMS = 60 * 60 * 1000;

/** SMS max sends per window per user */
export const RATE_LIMIT_MAX_SMS = 10;

/** Email rate limit window: 1 hour (ms) */
export const RATE_LIMIT_WINDOW_EMAIL = 60 * 60 * 1000;

/** Email max sends per window per user */
export const RATE_LIMIT_MAX_EMAIL = 20;

/** Auth rate limit window: 15 minutes (ms) */
export const RATE_LIMIT_WINDOW_AUTH = 15 * 60 * 1000;

/** Auth max login attempts per window */
export const RATE_LIMIT_MAX_AUTH = 5;

/** GDPR export rate limit window: 24 hours (ms) */
export const RATE_LIMIT_WINDOW_GDPR = 24 * 60 * 60 * 1000;

/** GDPR export max requests per window */
export const RATE_LIMIT_MAX_GDPR = 3;

/** AI endpoint rate limit window: 1 minute (ms) */
export const RATE_LIMIT_WINDOW_AI = 60 * 1000;

/** AI endpoint max requests per window */
export const RATE_LIMIT_MAX_AI = 10;

// =============================================================================
// SESSION & AUTH
// =============================================================================

/** Session cookie max age: 24 hours (ms) */
export const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

/** CSRF token max age: 1 hour (ms) */
export const CSRF_TOKEN_MAX_AGE = 60 * 60 * 1000;

/** Password reset token expiry: 1 hour (ms) */
export const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;

/** Max failed login attempts before lockout */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Account lockout duration: 30 minutes (ms) */
export const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000;

// =============================================================================
// VALIDATION
// =============================================================================

/** Maximum length for text input fields */
export const MAX_TEXT_LENGTH = 5000;

/** Maximum length for notes/description fields */
export const MAX_NOTES_LENGTH = 10000;

/** Maximum length for SOAP note sections */
export const MAX_SOAP_SECTION_LENGTH = 10000;

/** Norwegian phone number regex */
export const NORWEGIAN_PHONE_REGEX = /^\+?47\d{8}$/;

/** Invoice default due days */
export const DEFAULT_INVOICE_DUE_DAYS = 14;

// =============================================================================
// AI / OLLAMA
// =============================================================================

/** Ollama request timeout (ms) */
export const OLLAMA_TIMEOUT_MS = 30000;

/** Ollama retry backoff delay (ms) */
export const OLLAMA_RETRY_BACKOFF_MS = 2000;

/** Ollama max retries for timeout errors */
export const OLLAMA_MAX_RETRIES = 1;

/** AI model cache TTL: 5 minutes (ms) */
export const AI_MODEL_CACHE_TTL = 5 * 60 * 1000;

/** Max AI input length for guardrails */
export const AI_MAX_INPUT_LENGTH = 10000;

/** Max AI output length for guardrails */
export const AI_MAX_OUTPUT_LENGTH = 5000;

// =============================================================================
// CLINICAL
// =============================================================================

/** Excessive visit threshold (triggers clinical warning) */
export const EXCESSIVE_VISIT_THRESHOLD = 6;

/** Exercise prescription default duration in weeks */
export const DEFAULT_PRESCRIPTION_DURATION_WEEKS = 6;

/** Default exercise sets */
export const DEFAULT_EXERCISE_SETS = 3;

/** Default exercise reps */
export const DEFAULT_EXERCISE_REPS = 10;

/** Default rest between sets (seconds) */
export const DEFAULT_REST_SECONDS = 30;
