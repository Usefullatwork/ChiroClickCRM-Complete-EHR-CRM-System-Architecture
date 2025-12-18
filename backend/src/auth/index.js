/**
 * Authentication Module
 *
 * Local-first authentication that works without external services.
 * Supports optional Clerk.com integration for production if configured.
 *
 * Features:
 * - Password-based authentication with bcrypt
 * - PostgreSQL session storage
 * - Fresh session concept for sensitive operations
 * - Password reset flow
 * - Email verification
 * - Account lockout after failed attempts
 * - API key authentication for programmatic access
 */

export * from './password.js';
export * from './sessions.js';
export * from './authService.js';

// Re-export defaults
import password from './password.js';
import sessions from './sessions.js';
import authService from './authService.js';

export default {
  password,
  sessions,
  authService
};
