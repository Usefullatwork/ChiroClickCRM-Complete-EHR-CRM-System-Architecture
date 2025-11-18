/**
 * Encryption Utilities
 * For sensitive data like Norwegian fødselsnummer (personal ID)
 * Uses AES-256-CBC encryption
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('⚠️  WARNING: ENCRYPTION_KEY must be exactly 32 characters long');
  console.error('⚠️  Please set a proper ENCRYPTION_KEY in your .env file');
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV prepended (hex format)
 */
export const encrypt = (text) => {
  if (!text) return null;

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text with IV (hex format)
 * @returns {string} Decrypted plain text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data (one-way, for comparison only)
 * Useful for searching without decrypting
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash (hex format)
 */
export const hash = (text) => {
  if (!text) return null;

  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
};

/**
 * Validate Norwegian fødselsnummer (11 digits)
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if valid format
 */
export const validateFodselsnummer = (fodselsnummer) => {
  if (!fodselsnummer) return false;

  // Remove any spaces or dashes
  const cleaned = fodselsnummer.replace(/[\s-]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Extract date parts (DDMMYY)
  const day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const year = parseInt(cleaned.substring(4, 6));

  // Basic date validation
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  // TODO: Implement full checksum validation (Modulo 11 algorithm)
  // For now, we just validate format

  return true;
};

/**
 * Mask sensitive data for logging/display
 * @param {string} text - Sensitive text
 * @param {number} visibleChars - Number of characters to show at start
 * @returns {string} Masked text (e.g., "12****5678")
 */
export const maskSensitive = (text, visibleChars = 2) => {
  if (!text || text.length <= visibleChars * 2) {
    return '****';
  }

  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const masked = '*'.repeat(text.length - (visibleChars * 2));

  return start + masked + end;
};

export default {
  encrypt,
  decrypt,
  hash,
  validateFodselsnummer,
  maskSensitive
};
