/**
 * Password Utilities
 * Secure password hashing and verification using bcrypt
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} - Hex-encoded token
 */
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for storage
 * @param {string} token - Plain token
 * @returns {string} - SHA-256 hash of token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate a secure API key
 * @returns {{ key: string, prefix: string, hash: string }}
 */
export const generateApiKey = () => {
  const prefix = crypto.randomBytes(5).toString('hex'); // 10 chars
  const secret = crypto.randomBytes(32).toString('hex'); // 64 chars
  const key = `cck_${prefix}_${secret}`; // Total: 79 chars

  return {
    key,
    prefix: `cck_${prefix}`,
    hash: hashToken(key)
  };
};

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  validatePasswordStrength,
  generateApiKey
};
