/**
 * Mobile Authentication Service
 * Handles phone OTP, social login (Google/Apple), and JWT management
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import jwksClient from 'jwks-rsa';

const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_ACCESS_EXPIRY = '15m';
const _JWT_REFRESH_EXPIRY = '30d';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a token for secure storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate secure random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send OTP via Twilio (or mock for development)
 */
async function sendOTP(db, phoneNumber) {
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Check rate limiting (max 5 OTPs per hour)
  const rateLimitCheck = await db.query(
    `
    SELECT COUNT(*) as count FROM otp_codes
    WHERE phone_number = $1
    AND created_at > NOW() - INTERVAL '1 hour'
  `,
    [normalizedPhone]
  );

  if (parseInt(rateLimitCheck.rows[0].count) >= 5) {
    throw new Error('Too many OTP requests. Please try again later.');
  }

  // Generate OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP
  await db.query(
    `
    INSERT INTO otp_codes (phone_number, code, expires_at)
    VALUES ($1, $2, $3)
  `,
    [normalizedPhone, code, expiresAt]
  );

  // Send via Twilio (or mock in development)
  if (process.env.NODE_ENV === 'production' && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = (await import('twilio')).default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilio.messages.create({
      body: `Din ChiroClick-kode er: ${code}. Gyldig i ${OTP_EXPIRY_MINUTES} minutter.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });
  } else {
    // Development mode - log OTP
    logger.debug(`[DEV] OTP for ${normalizedPhone}: ${code}`);
  }

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
  };
}

/**
 * Verify OTP and create/login user
 */
async function verifyOTP(db, phoneNumber, code) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Find valid OTP
  const otpResult = await db.query(
    `
    SELECT id, attempts FROM otp_codes
    WHERE phone_number = $1
    AND code = $2
    AND expires_at > NOW()
    AND verified = FALSE
    AND attempts < $3
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [normalizedPhone, code, MAX_OTP_ATTEMPTS]
  );

  if (otpResult.rows.length === 0) {
    // Increment attempts on wrong code
    await db.query(
      `
      UPDATE otp_codes
      SET attempts = attempts + 1
      WHERE phone_number = $1
      AND expires_at > NOW()
      AND verified = FALSE
    `,
      [normalizedPhone]
    );

    throw new Error('Invalid or expired OTP code');
  }

  const otpRecord = otpResult.rows[0];

  // Mark OTP as verified
  await db.query(
    `
    UPDATE otp_codes SET verified = TRUE WHERE id = $1
  `,
    [otpRecord.id]
  );

  // Find or create mobile user
  const userResult = await db.query(
    `
    SELECT * FROM mobile_users WHERE phone_number = $1
  `,
    [normalizedPhone]
  );

  let user;
  let isNewUser = false;

  if (userResult.rows.length === 0) {
    // Create new user
    const createResult = await db.query(
      `
      INSERT INTO mobile_users (phone_number, phone_verified)
      VALUES ($1, TRUE)
      RETURNING *
    `,
      [normalizedPhone]
    );
    user = createResult.rows[0];
    isNewUser = true;

    // Initialize streak tracking
    await db.query(
      `
      INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak)
      VALUES ($1, 0, 0)
    `,
      [user.id]
    );
  } else {
    user = userResult.rows[0];
    // Update phone verified status
    await db.query(
      `
      UPDATE mobile_users
      SET phone_verified = TRUE, last_active_at = NOW()
      WHERE id = $1
    `,
      [user.id]
    );
  }

  // Generate tokens
  const tokens = await generateTokens(db, user);

  return {
    user: sanitizeUser(user),
    tokens,
    isNewUser,
  };
}

/**
 * Verify Google Sign-In token
 */
async function verifyGoogleToken(db, idToken) {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const _email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Find or create user
    const userResult = await db.query(
      `
      SELECT * FROM mobile_users WHERE google_id = $1
    `,
      [googleId]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // Create new user
      const createResult = await db.query(
        `
        INSERT INTO mobile_users (google_id, display_name, avatar_url, phone_number, phone_verified)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING *
      `,
        [googleId, name, picture, `google_${googleId}`]
      );
      user = createResult.rows[0];
      isNewUser = true;

      // Initialize streak
      await db.query(
        `
        INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak)
        VALUES ($1, 0, 0)
      `,
        [user.id]
      );
    } else {
      user = userResult.rows[0];
      // Update last active
      await db.query(
        `
        UPDATE mobile_users
        SET last_active_at = NOW(), display_name = COALESCE(display_name, $2), avatar_url = COALESCE(avatar_url, $3)
        WHERE id = $1
      `,
        [user.id, name, picture]
      );
    }

    const tokens = await generateTokens(db, user);

    return {
      user: sanitizeUser(user),
      tokens,
      isNewUser,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

/**
 * Verify Apple Sign-In token
 */
async function verifyAppleToken(db, identityToken, appleUser) {
  try {
    // Decode token header to get key id
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Get Apple's public key
    const client = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
    });

    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    // Verify token
    const payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID,
    });

    const appleId = payload.sub;
    const _email = payload.email || appleUser?.email;
    const name = appleUser?.fullName
      ? `${appleUser.fullName.givenName || ''} ${appleUser.fullName.familyName || ''}`.trim()
      : null;

    // Find or create user
    const userResult = await db.query(
      `
      SELECT * FROM mobile_users WHERE apple_id = $1
    `,
      [appleId]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      const createResult = await db.query(
        `
        INSERT INTO mobile_users (apple_id, display_name, phone_number, phone_verified)
        VALUES ($1, $2, $3, FALSE)
        RETURNING *
      `,
        [appleId, name, `apple_${appleId}`]
      );
      user = createResult.rows[0];
      isNewUser = true;

      await db.query(
        `
        INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak)
        VALUES ($1, 0, 0)
      `,
        [user.id]
      );
    } else {
      user = userResult.rows[0];
      await db.query(
        `
        UPDATE mobile_users
        SET last_active_at = NOW()
        WHERE id = $1
      `,
        [user.id]
      );
    }

    const tokens = await generateTokens(db, user);

    return {
      user: sanitizeUser(user),
      tokens,
      isNewUser,
    };
  } catch (error) {
    throw new Error('Invalid Apple token');
  }
}

/**
 * Generate access and refresh tokens
 */
async function generateTokens(db, user) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      type: 'mobile',
      phone: user.phone_number,
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );

  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Store refresh token
  await db.query(
    `
    INSERT INTO mobile_refresh_tokens (mobile_user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `,
    [user.id, refreshTokenHash, refreshExpiry]
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    refreshExpiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  };
}

/**
 * Refresh access token
 */
async function refreshAccessToken(db, refreshToken) {
  const tokenHash = hashToken(refreshToken);

  const result = await db.query(
    `
    SELECT rt.*, mu.*
    FROM mobile_refresh_tokens rt
    JOIN mobile_users mu ON mu.id = rt.mobile_user_id
    WHERE rt.token_hash = $1
    AND rt.expires_at > NOW()
    AND rt.revoked = FALSE
  `,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = result.rows[0];

  // Generate new access token
  const accessToken = jwt.sign(
    {
      userId: user.mobile_user_id,
      type: 'mobile',
      phone: user.phone_number,
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );

  // Update last active
  await db.query(
    `
    UPDATE mobile_users SET last_active_at = NOW() WHERE id = $1
  `,
    [user.mobile_user_id]
  );

  return {
    accessToken,
    expiresIn: 15 * 60,
  };
}

/**
 * Revoke refresh token (logout)
 */
async function revokeToken(db, refreshToken) {
  const tokenHash = hashToken(refreshToken);

  await db.query(
    `
    UPDATE mobile_refresh_tokens
    SET revoked = TRUE, revoked_at = NOW()
    WHERE token_hash = $1
  `,
    [tokenHash]
  );

  return { success: true };
}

/**
 * Revoke all user tokens (logout everywhere)
 */
async function revokeAllUserTokens(db, userId) {
  await db.query(
    `
    UPDATE mobile_refresh_tokens
    SET revoked = TRUE, revoked_at = NOW()
    WHERE mobile_user_id = $1 AND revoked = FALSE
  `,
    [userId]
  );

  return { success: true };
}

/**
 * Verify JWT access token
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'mobile') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Register device token for push notifications
 */
async function registerDeviceToken(db, userId, deviceToken, _deviceInfo = {}) {
  await db.query(
    `
    UPDATE mobile_users
    SET device_tokens = array_append(
      array_remove(device_tokens, $2),
      $2
    )
    WHERE id = $1
  `,
    [userId, deviceToken]
  );

  return { success: true };
}

/**
 * Unregister device token
 */
async function unregisterDeviceToken(db, userId, deviceToken) {
  await db.query(
    `
    UPDATE mobile_users
    SET device_tokens = array_remove(device_tokens, $2)
    WHERE id = $1
  `,
    [userId, deviceToken]
  );

  return { success: true };
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Add Norway country code if missing
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('00')) {
      normalized = `+${normalized.slice(2)}`;
    } else if (normalized.length === 8) {
      // Assume Norwegian number
      normalized = `+47${normalized}`;
    } else {
      normalized = `+${normalized}`;
    }
  }

  return normalized;
}

/**
 * Sanitize user object for client
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    phoneVerified: user.phone_verified,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    preferredLanguage: user.preferred_language,
    notificationTime: user.notification_time,
    notificationEnabled: user.notification_enabled,
    createdAt: user.created_at,
  };
}

/**
 * Get user by ID
 */
async function getUserById(db, userId) {
  const result = await db.query(
    `
    SELECT * FROM mobile_users WHERE id = $1
  `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return sanitizeUser(result.rows[0]);
}

/**
 * Update user profile
 */
async function updateProfile(db, userId, updates) {
  const allowedFields = [
    'display_name',
    'avatar_url',
    'preferred_language',
    'notification_time',
    'notification_enabled',
    'timezone',
  ];
  const setClauses = [];
  const values = [userId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setClauses.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  const result = await db.query(
    `
    UPDATE mobile_users
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING *
  `,
    values
  );

  return sanitizeUser(result.rows[0]);
}

export {
  sendOTP,
  verifyOTP,
  verifyGoogleToken,
  verifyAppleToken,
  generateTokens,
  refreshAccessToken,
  revokeToken,
  revokeAllUserTokens,
  verifyAccessToken,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserById,
  updateProfile,
  normalizePhoneNumber,
};
