/**
 * Authentication Service
 * Handles user registration, login, password reset, etc.
 */

import { query } from '../config/database.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  validatePasswordStrength
} from './password.js';
import { createSession, invalidateSession, invalidateAllUserSessions } from './sessions.js';
import logger from '../utils/logger.js';

/**
 * Register a new user (local auth)
 * @param {object} userData - User registration data
 * @returns {Promise<{ user: object, session: object }>}
 */
export const registerUser = async (userData) => {
  const {
    email,
    password,
    firstName,
    lastName,
    organizationId,
    role = 'PRACTITIONER',
    hprNumber = null
  } = userData;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
  }

  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate email verification token
  const emailVerifyToken = generateToken(32);

  // Create user
  const result = await query(
    `INSERT INTO users (
      organization_id,
      email,
      password_hash,
      first_name,
      last_name,
      role,
      hpr_number,
      email_verify_token,
      email_verified,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true)
    RETURNING id, organization_id, email, first_name, last_name, role, email_verified`,
    [organizationId, email.toLowerCase(), passwordHash, firstName, lastName, role, hprNumber, emailVerifyToken]
  );

  const user = result.rows[0];
  logger.info(`User registered: ${user.email}`);

  // Create session
  const session = await createSession(user.id);

  return {
    user: {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified
    },
    session,
    emailVerifyToken // Return for sending verification email
  };
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} metadata - Session metadata (IP, user agent)
 * @returns {Promise<{ user: object, session: object }>}
 */
export const loginWithPassword = async (email, password, metadata = {}) => {
  // Get user
  const result = await query(
    `SELECT
      id, organization_id, email, password_hash, first_name, last_name,
      role, is_active, locked_until, failed_login_attempts, email_verified
    FROM users
    WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    // Use same error message to prevent email enumeration
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.locked_until) - new Date()) / 1000 / 60
    );
    throw new Error(`Account is locked. Try again in ${remainingMinutes} minutes`);
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account is deactivated. Please contact support');
  }

  if (!user.password_hash) {
    throw new Error('No password set for this account');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    // Record failed attempt
    await query('SELECT record_failed_login($1)', [user.id]);
    logger.warn(`Failed login attempt for ${email}`);
    throw new Error('Invalid email or password');
  }

  // Reset failed attempts and update last login
  await query('SELECT record_successful_login($1)', [user.id]);

  // Create session
  const session = await createSession(user.id, metadata);

  logger.info(`User logged in: ${email}`);

  return {
    user: {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified
    },
    session
  };
};

/**
 * Logout (invalidate session)
 * @param {string} sessionId - Session ID
 */
export const logout = async (sessionId) => {
  await invalidateSession(sessionId);
};

/**
 * Logout from all devices
 * @param {string} userId - User ID
 */
export const logoutAllDevices = async (userId) => {
  await invalidateAllUserSessions(userId);
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<{ token: string, email: string } | null>}
 */
export const requestPasswordReset = async (email) => {
  const result = await query(
    'SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    // Don't reveal if email exists
    return null;
  }

  const user = result.rows[0];
  const token = generateToken(32);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    `UPDATE users
     SET password_reset_token = $1, password_reset_expires = $2
     WHERE id = $3`,
    [hashToken(token), expires, user.id]
  );

  logger.info(`Password reset requested for ${email}`);

  return {
    token,
    email: user.email,
    firstName: user.first_name
  };
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 */
export const resetPassword = async (token, newPassword) => {
  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
  }

  const tokenHash = hashToken(token);

  const result = await query(
    `SELECT id, email FROM users
     WHERE password_reset_token = $1
       AND password_reset_expires > NOW()
       AND is_active = true`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const user = result.rows[0];
  const passwordHash = await hashPassword(newPassword);

  await query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         last_password_change = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE id = $2`,
    [passwordHash, user.id]
  );

  // Invalidate all sessions (force re-login with new password)
  await invalidateAllUserSessions(user.id);

  logger.info(`Password reset completed for ${user.email}`);
};

/**
 * Change password (authenticated user)
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const { password_hash } = result.rows[0];

  if (!password_hash) {
    throw new Error('This account uses external authentication');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
  }

  // Update password
  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE users
     SET password_hash = $1, last_password_change = NOW()
     WHERE id = $2`,
    [newHash, userId]
  );

  logger.info(`Password changed for user ${userId}`);
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 */
export const verifyEmail = async (token) => {
  const result = await query(
    `UPDATE users
     SET email_verified = true, email_verify_token = NULL
     WHERE email_verify_token = $1
     RETURNING id, email`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid verification token');
  }

  logger.info(`Email verified for ${result.rows[0].email}`);
  return result.rows[0];
};

/**
 * Resend email verification
 * @param {string} userId - User ID
 * @returns {Promise<string>} - New verification token
 */
export const resendVerification = async (userId) => {
  const token = generateToken(32);

  const result = await query(
    `UPDATE users
     SET email_verify_token = $1
     WHERE id = $2 AND email_verified = false
     RETURNING email`,
    [token, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found or email already verified');
  }

  return token;
};

export default {
  registerUser,
  loginWithPassword,
  logout,
  logoutAllDevices,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification
};
