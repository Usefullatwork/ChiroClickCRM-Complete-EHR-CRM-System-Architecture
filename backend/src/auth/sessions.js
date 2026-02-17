/**
 * Session Management
 * Local session handling using PostgreSQL
 */

import { query } from '../config/database.js';
import { generateToken, _hashToken } from './password.js';
import logger from '../utils/logger.js';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// Fresh session duration: 30 minutes (for sensitive operations)
const FRESH_DURATION_MS = 30 * 60 * 1000;

/**
 * Create a new session for a user
 * @param {string} userId - User UUID
 * @param {object} metadata - Session metadata
 * @returns {Promise<{ sessionId: string, expiresAt: Date }>}
 */
export const createSession = async (userId, metadata = {}) => {
  const sessionId = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await query(
    `INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent, fresh)
     VALUES ($1, $2, $3, $4, $5, true)`,
    [sessionId, userId, expiresAt, metadata.ipAddress || null, metadata.userAgent || null]
  );

  logger.info(`Session created for user ${userId}`);

  return {
    sessionId,
    expiresAt,
  };
};

/**
 * Validate a session and get user data
 * @param {string} sessionId - Session ID
 * @returns {Promise<{ session: object, user: object } | null>}
 */
export const validateSession = async (sessionId) => {
  const result = await query(
    `SELECT
      s.id as session_id,
      s.user_id,
      s.expires_at,
      s.fresh,
      s.created_at as session_created,
      u.id,
      u.organization_id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.hpr_number,
      u.specializations,
      u.is_active,
      u.preferred_language,
      u.notification_preferences
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = $1 AND s.expires_at > NOW() AND u.is_active = true`,
    [sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Check if session is still "fresh" (within 30 minutes of creation)
  const isFresh =
    row.fresh && Date.now() - new Date(row.session_created).getTime() < FRESH_DURATION_MS;

  // If session was fresh but no longer is, update it
  if (row.fresh && !isFresh) {
    await query('UPDATE sessions SET fresh = false WHERE id = $1', [sessionId]);
  }

  return {
    session: {
      id: row.session_id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      fresh: isFresh,
    },
    user: {
      id: row.id,
      organizationId: row.organization_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      hprNumber: row.hpr_number,
      specializations: row.specializations,
      isActive: row.is_active,
      preferredLanguage: row.preferred_language,
      notificationPreferences: row.notification_preferences,
    },
  };
};

/**
 * Invalidate a session (logout)
 * @param {string} sessionId - Session ID
 */
export const invalidateSession = async (sessionId) => {
  await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  logger.info(`Session invalidated: ${sessionId.substring(0, 8)}...`);
};

/**
 * Invalidate all sessions for a user (logout everywhere)
 * @param {string} userId - User UUID
 */
export const invalidateAllUserSessions = async (userId) => {
  const result = await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  logger.info(`All sessions invalidated for user ${userId}: ${result.rowCount} sessions`);
};

/**
 * Extend a session (refresh)
 * @param {string} sessionId - Session ID
 * @returns {Promise<Date>} - New expiration date
 */
export const extendSession = async (sessionId) => {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await query('UPDATE sessions SET expires_at = $1 WHERE id = $2', [expiresAt, sessionId]);

  return expiresAt;
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User UUID
 * @returns {Promise<object[]>}
 */
export const getUserSessions = async (userId) => {
  const result = await query(
    `SELECT id, created_at, expires_at, ip_address, user_agent, fresh
     FROM sessions
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: `${row.id.substring(0, 8)}...`, // Mask full ID for security
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    fresh: row.fresh,
    current: false, // Will be set by caller
  }));
};

/**
 * Make a session "fresh" again (after password confirmation)
 * @param {string} sessionId - Session ID
 */
export const refreshSessionFreshness = async (sessionId) => {
  await query(`UPDATE sessions SET fresh = true, created_at = NOW() WHERE id = $1`, [sessionId]);
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async () => {
  const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
  if (result.rowCount > 0) {
    logger.info(`Cleaned up ${result.rowCount} expired sessions`);
  }
};

export default {
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  extendSession,
  getUserSessions,
  refreshSessionFreshness,
  cleanupExpiredSessions,
};
