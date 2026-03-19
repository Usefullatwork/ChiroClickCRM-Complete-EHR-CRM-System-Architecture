/**
 * Mobile API Routes
 * All endpoints for the ChiroClick mobile app
 */

import express from 'express';
import * as mobileAuth from '../services/mobileAuth.js';
import { generatePdf } from '../services/documentDelivery.js';

const router = express.Router();

// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

/**
 * Middleware to verify mobile JWT token
 */
const authenticateMobile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = mobileAuth.verifyAccessToken(token);

    req.mobileUser = {
      id: decoded.userId,
      phone: decoded.phone,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to resolve patient context from mobile user
 * Links mobile auth (phone-based) to patient records (UUID-based)
 */
const resolvePatientContext = async (req, res, next) => {
  try {
    const result = await req.db.query(
      'SELECT patient_id, organization_id FROM mobile_users WHERE id = $1',
      [req.mobileUser.id]
    );
    if (!result.rows[0]?.patient_id) {
      return res.status(403).json({ error: 'Ingen koblet pasientkonto. Kontakt klinikken din.' });
    }
    req.mobileUser.patientId = result.rows[0].patient_id;
    req.mobileUser.organizationId = result.rows[0].organization_id;
    next();
  } catch (error) {
    logger.error('Patient context error:', error);
    res.status(500).json({ error: 'Feil ved oppslag av pasientkontekst' });
  }
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

/**
 * @swagger
 * /mobile/auth/send-otp:
 *   post:
 *     summary: Send OTP code to phone number
 *     description: >
 *       Initiates OTP-based authentication by sending a one-time password
 *       to the provided phone number. This is a public endpoint — no authentication required.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: The mobile phone number to send the OTP to (E.164 format recommended)
 *                 example: "+4791234567"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent"
 *       400:
 *         description: Phone number missing or OTP delivery failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Phone number is required"
 */
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await mobileAuth.sendOTP(req.db, phoneNumber);
    res.json(result);
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login or register user
 *     description: >
 *       Verifies the OTP code sent to the user's phone number. On success, returns
 *       access and refresh tokens. A new mobile user account is created automatically
 *       if one does not already exist for the phone number. This is a public endpoint.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: The phone number the OTP was sent to
 *                 example: "+4791234567"
 *               code:
 *                 type: string
 *                 description: The 6-digit OTP code received via SMS
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified — returns JWT tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Short-lived JWT for API authentication
 *                 refreshToken:
 *                   type: string
 *                   description: Long-lived token used to obtain new access tokens
 *                 user:
 *                   type: object
 *                   description: The authenticated mobile user profile
 *       400:
 *         description: Missing fields or invalid/expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Phone number and code are required"
 */
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const result = await mobileAuth.verifyOTP(req.db, phoneNumber, code);
    res.json(result);
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/auth/google:
 *   post:
 *     summary: Login with Google
 *     description: >
 *       Authenticates a mobile user using a Google ID token obtained from the
 *       Google Sign-In SDK. Creates a new mobile user account if one does not
 *       already exist. This is a public endpoint.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: The Google ID token from the client-side Google Sign-In flow
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Google authentication successful — returns JWT tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing ID token or Google token verification failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ID token is required"
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const result = await mobileAuth.verifyGoogleToken(req.db, idToken);
    res.json(result);
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/auth/apple:
 *   post:
 *     summary: Login with Apple
 *     description: >
 *       Authenticates a mobile user using an Apple identity token obtained from
 *       the Sign in with Apple SDK. The optional `user` object is provided by Apple
 *       only on the first sign-in and contains name and email. This is a public endpoint.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identityToken
 *             properties:
 *               identityToken:
 *                 type: string
 *                 description: The identity token from Apple's Sign in with Apple flow
 *                 example: "eyJraWQiOiJZdXlYb1kiLCJhbGciOiJSUzI1NiJ9..."
 *               user:
 *                 type: object
 *                 description: Optional user info provided by Apple on first sign-in only
 *                 properties:
 *                   name:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                         example: "Mads"
 *                       lastName:
 *                         type: string
 *                         example: "Fjeldheim"
 *                   email:
 *                     type: string
 *                     example: "mads@example.com"
 *     responses:
 *       200:
 *         description: Apple authentication successful — returns JWT tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing identity token or Apple token verification failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Identity token is required"
 */
router.post('/auth/apple', async (req, res) => {
  try {
    const { identityToken, user } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    const result = await mobileAuth.verifyAppleToken(req.db, identityToken, user);
    res.json(result);
  } catch (error) {
    logger.error('Apple auth error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: >
 *       Exchanges a valid refresh token for a new access token. Use this when the
 *       access token has expired. The refresh token must not have been revoked.
 *       This is a public endpoint — no Bearer token required.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token previously issued by send-otp, verify-otp, Google, or Apple auth
 *                 example: "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: A new short-lived JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: A new or existing refresh token
 *       401:
 *         description: Refresh token missing, invalid, or revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Refresh token is required"
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await mobileAuth.refreshAccessToken(req.db, refreshToken);
    res.json(result);
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     description: >
 *       Logs the user out by revoking the provided refresh token. If no refresh token
 *       is supplied, the call is still treated as successful. Always returns
 *       `{ success: true }` regardless of errors.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to revoke
 *                 example: "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
 *     responses:
 *       200:
 *         description: Logout successful (always returned, even on errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
router.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await mobileAuth.revokeToken(req.db, refreshToken);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    res.json({ success: true }); // Always return success for logout
  }
});

// ============================================
// USER PROFILE ROUTES
// ============================================

/**
 * @swagger
 * /mobile/me:
 *   get:
 *     summary: Get current user profile
 *     description: >
 *       Returns the authenticated mobile user's profile data along with their
 *       current and longest workout streak information.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with streak data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 phoneNumber:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 currentStreak:
 *                   type: integer
 *                   description: Consecutive days with at least one logged workout
 *                   example: 7
 *                 longestStreak:
 *                   type: integer
 *                   description: All-time longest consecutive-day streak
 *                   example: 30
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       404:
 *         description: Authenticated user record not found in the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
router.get('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.getUserById(req.db, req.mobileUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get streak info
    const streakResult = await req.db.query(
      `
      SELECT * FROM user_streaks WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0 };

    res.json({
      ...user,
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * @swagger
 * /mobile/me:
 *   patch:
 *     summary: Update user profile
 *     description: Partially updates the authenticated mobile user's profile fields.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Mads"
 *               lastName:
 *                 type: string
 *                 example: "Fjeldheim"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "mads@example.com"
 *               preferredLanguage:
 *                 type: string
 *                 enum: [no, en]
 *                 example: "no"
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.example.com/avatars/user123.jpg"
 *     responses:
 *       200:
 *         description: Updated user profile object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The full updated mobile user profile
 *       400:
 *         description: Validation error or invalid field value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.patch('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.updateProfile(req.db, req.mobileUser.id, req.body);
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// DEVICE TOKEN ROUTES (Push Notifications)
// ============================================

/**
 * @swagger
 * /mobile/device-token:
 *   post:
 *     summary: Register device token for push notifications
 *     description: >
 *       Registers the mobile device's push notification token (APNs or FCM) with the
 *       server so the clinic can send push notifications to this device.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The push notification device token (APNs or FCM)
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *               deviceInfo:
 *                 type: object
 *                 description: Optional metadata about the device
 *                 properties:
 *                   platform:
 *                     type: string
 *                     enum: [ios, android]
 *                     example: "ios"
 *                   osVersion:
 *                     type: string
 *                     example: "17.4"
 *                   appVersion:
 *                     type: string
 *                     example: "1.2.0"
 *                   deviceModel:
 *                     type: string
 *                     example: "iPhone 15 Pro"
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Device token is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Device token is required"
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.post('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.registerDeviceToken(req.db, req.mobileUser.id, token, deviceInfo);
    res.json({ success: true });
  } catch (error) {
    logger.error('Register device token error:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

/**
 * @swagger
 * /mobile/device-token:
 *   delete:
 *     summary: Unregister device token
 *     description: >
 *       Removes a previously registered push notification device token. Call this
 *       when the user logs out or disables push notifications on their device.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The push notification device token to remove
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Device token unregistered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Device token is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Device token is required"
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.delete('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.unregisterDeviceToken(req.db, req.mobileUser.id, token);
    res.json({ success: true });
  } catch (error) {
    logger.error('Unregister device token error:', error);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
});

// ============================================
// EXERCISE LIBRARY ROUTES
// ============================================

/**
 * @swagger
 * /mobile/exercises:
 *   get:
 *     summary: Get exercise library
 *     description: >
 *       Returns a paginated list of active exercises from the exercise library.
 *       Results can be filtered by category, body region, difficulty level, and
 *       a free-text search that matches against both Norwegian and English name/description fields.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by exercise category (e.g. "stretching", "strengthening")
 *         example: "stretching"
 *       - in: query
 *         name: bodyRegion
 *         schema:
 *           type: string
 *         description: Filter by body region (e.g. "cervical", "lumbar", "shoulder")
 *         example: "cervical"
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *         example: "beginner"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Free-text search across name and description in Norwegian and English
 *         example: "nakke"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *         description: Maximum number of exercises to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of exercises to skip for pagination
 *     responses:
 *       200:
 *         description: Paginated list of exercises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exercises:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       name_norwegian:
 *                         type: string
 *                       description:
 *                         type: string
 *                       description_norwegian:
 *                         type: string
 *                       category:
 *                         type: string
 *                       subcategory:
 *                         type: string
 *                       body_region:
 *                         type: string
 *                       difficulty_level:
 *                         type: string
 *                       instructions:
 *                         type: string
 *                       instructions_norwegian:
 *                         type: string
 *                       sets_default:
 *                         type: integer
 *                       reps_default:
 *                         type: integer
 *                       hold_seconds:
 *                         type: integer
 *                       video_url:
 *                         type: string
 *                         format: uri
 *                       thumbnail_url:
 *                         type: string
 *                         format: uri
 *                       image_url:
 *                         type: string
 *                         format: uri
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                 total:
 *                   type: integer
 *                   description: Number of exercises returned in this page
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/exercises', authenticateMobile, async (req, res) => {
  try {
    const { category, bodyRegion, difficulty, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        id, name, name_norwegian, description, description_norwegian,
        category, subcategory, body_region, difficulty_level,
        instructions, instructions_norwegian,
        sets_default, reps_default, hold_seconds,
        video_url, thumbnail_url, image_url,
        tags
      FROM exercise_library
      WHERE is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (bodyRegion) {
      query += ` AND body_region = $${paramIndex}`;
      params.push(bodyRegion);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        name ILIKE $${paramIndex} OR
        name_norwegian ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        description_norwegian ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY name_norwegian, name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await req.db.query(query, params);

    // Get total count
    const _countQuery = `SELECT COUNT(*) FROM exercise_library WHERE is_active = TRUE`;
    // Add same filters for count...

    res.json({
      exercises: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    logger.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
});

/**
 * @swagger
 * /mobile/exercises/{id}:
 *   get:
 *     summary: Get single exercise details
 *     description: Returns the full details of an active exercise by its UUID.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the exercise
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Full exercise record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: All columns from the exercise_library table
 *       401:
 *         description: Missing or invalid Bearer token
 *       404:
 *         description: Exercise not found or is inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Exercise not found"
 *       500:
 *         description: Internal server error
 */
router.get('/exercises/:id', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT * FROM exercise_library
      WHERE id = $1 AND is_active = TRUE
    `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get exercise error:', error);
    res.status(500).json({ error: 'Failed to get exercise' });
  }
});

/**
 * @swagger
 * /mobile/exercise-categories:
 *   get:
 *     summary: Get exercise categories
 *     description: Returns all distinct exercise categories with a count of exercises in each category.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories with exercise counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     example: "stretching"
 *                   count:
 *                     type: integer
 *                     example: 12
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/exercise-categories', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM exercise_library
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY category
    `);

    res.json(result.rows);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// ============================================
// PROGRAM ROUTES
// ============================================

/**
 * @swagger
 * /mobile/programs:
 *   get:
 *     summary: Get available coaching programs
 *     description: >
 *       Returns all active, publicly available coaching programs. Results can be
 *       filtered by program type, difficulty level, and a name search. The creator's
 *       name and total enrollment count are included with each program.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by program type (e.g. "rehabilitation", "strength")
 *         example: "rehabilitation"
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *         example: "beginner"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Free-text search against program name in Norwegian and English
 *         example: "nakke"
 *     responses:
 *       200:
 *         description: List of available programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   name_norwegian:
 *                     type: string
 *                   description:
 *                     type: string
 *                   program_type:
 *                     type: string
 *                   duration_weeks:
 *                     type: integer
 *                   difficulty_level:
 *                     type: string
 *                   cover_image_url:
 *                     type: string
 *                     format: uri
 *                   created_by_name:
 *                     type: string
 *                   enrollment_count:
 *                     type: integer
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/programs', authenticateMobile, async (req, res) => {
  try {
    const { type, difficulty, search } = req.query;

    let query = `
      SELECT
        p.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        (SELECT COUNT(*) FROM user_program_enrollments WHERE program_id = p.id) as enrollment_count
      FROM coaching_programs p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.is_active = TRUE AND p.is_public = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND p.program_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND p.difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.name_norwegian ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await req.db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

/**
 * @swagger
 * /mobile/programs/{id}:
 *   get:
 *     summary: Get program details with weeks and exercises
 *     description: >
 *       Returns the full details of a single coaching program, including all
 *       weekly plans and per-day exercises. Also indicates whether the currently
 *       authenticated user is enrolled and their enrollment record if so.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the coaching program
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Program details with weeks, exercises, and enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 name_norwegian:
 *                   type: string
 *                 created_by_name:
 *                   type: string
 *                 weeks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       week_number:
 *                         type: integer
 *                       focus_area:
 *                         type: string
 *                       exercises:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             exerciseId:
 *                               type: string
 *                               format: uuid
 *                             dayOfWeek:
 *                               type: integer
 *                               description: 1=Monday, 7=Sunday
 *                             orderIndex:
 *                               type: integer
 *                             sets:
 *                               type: integer
 *                             reps:
 *                               type: integer
 *                             holdSeconds:
 *                               type: integer
 *                             restSeconds:
 *                               type: integer
 *                             rirTarget:
 *                               type: integer
 *                             notes:
 *                               type: string
 *                             exercise:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 nameNorwegian:
 *                                   type: string
 *                                 videoUrl:
 *                                   type: string
 *                                 thumbnailUrl:
 *                                   type: string
 *                                 category:
 *                                   type: string
 *                 isEnrolled:
 *                   type: boolean
 *                 enrollment:
 *                   type: object
 *                   nullable: true
 *                   description: Active enrollment record, or null if not enrolled
 *       401:
 *         description: Missing or invalid Bearer token
 *       404:
 *         description: Program not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Program not found"
 *       500:
 *         description: Internal server error
 */
router.get('/programs/:id', authenticateMobile, async (req, res) => {
  try {
    // Get program
    const programResult = await req.db.query(
      `
      SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
      FROM coaching_programs p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = $1 AND p.is_active = TRUE
    `,
      [req.params.id]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programResult.rows[0];

    // Get weeks with exercises
    const weeksResult = await req.db.query(
      `
      SELECT
        pw.*,
        json_agg(
          json_build_object(
            'id', pe.id,
            'exerciseId', pe.exercise_id,
            'dayOfWeek', pe.day_of_week,
            'orderIndex', pe.order_index,
            'sets', pe.sets,
            'reps', pe.reps,
            'holdSeconds', pe.hold_seconds,
            'restSeconds', pe.rest_seconds,
            'rirTarget', pe.rir_target,
            'notes', pe.notes,
            'exercise', json_build_object(
              'id', e.id,
              'name', e.name,
              'nameNorwegian', e.name_norwegian,
              'videoUrl', e.video_url,
              'thumbnailUrl', e.thumbnail_url,
              'category', e.category
            )
          ) ORDER BY pe.day_of_week, pe.order_index
        ) FILTER (WHERE pe.id IS NOT NULL) as exercises
      FROM program_weeks pw
      LEFT JOIN program_exercises pe ON pe.program_week_id = pw.id
      LEFT JOIN exercise_library e ON e.id = pe.exercise_id
      WHERE pw.program_id = $1
      GROUP BY pw.id
      ORDER BY pw.week_number
    `,
      [req.params.id]
    );

    // Check if user is enrolled
    const enrollmentResult = await req.db.query(
      `
      SELECT * FROM user_program_enrollments
      WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'
    `,
      [req.mobileUser.id, req.params.id]
    );

    res.json({
      ...program,
      weeks: weeksResult.rows,
      isEnrolled: enrollmentResult.rows.length > 0,
      enrollment: enrollmentResult.rows[0] || null,
    });
  } catch (error) {
    logger.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to get program' });
  }
});

/**
 * @swagger
 * /mobile/programs/{id}/enroll:
 *   post:
 *     summary: Enroll in a coaching program
 *     description: >
 *       Creates an active enrollment for the authenticated user in the specified
 *       program. Returns 400 if the user is already actively enrolled.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the program to enroll in
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The newly created enrollment record from user_program_enrollments
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 mobile_user_id:
 *                   type: string
 *                   format: uuid
 *                 program_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 started_at:
 *                   type: string
 *                   format: date-time
 *                 current_week:
 *                   type: integer
 *       400:
 *         description: User is already enrolled in this program
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Already enrolled in this program"
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.post('/programs/:id/enroll', authenticateMobile, async (req, res) => {
  try {
    // Check if already enrolled
    const existingResult = await req.db.query(
      `
      SELECT * FROM user_program_enrollments
      WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'
    `,
      [req.mobileUser.id, req.params.id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this program' });
    }

    // Create enrollment
    const result = await req.db.query(
      `
      INSERT INTO user_program_enrollments (mobile_user_id, program_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [req.mobileUser.id, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in program' });
  }
});

/**
 * @swagger
 * /mobile/my-programs:
 *   get:
 *     summary: Get the user's enrolled programs
 *     description: >
 *       Returns all programs the authenticated user has enrolled in, including
 *       both active and completed enrollments. Active enrollments are listed first,
 *       then sorted by most recently started.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrollment records with program details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Enrollment ID
 *                   mobile_user_id:
 *                     type: string
 *                     format: uuid
 *                   program_id:
 *                     type: string
 *                     format: uuid
 *                   status:
 *                     type: string
 *                     enum: [active, completed, paused]
 *                   current_week:
 *                     type: integer
 *                   started_at:
 *                     type: string
 *                     format: date-time
 *                   name:
 *                     type: string
 *                   name_norwegian:
 *                     type: string
 *                   description:
 *                     type: string
 *                   program_type:
 *                     type: string
 *                   duration_weeks:
 *                     type: integer
 *                   difficulty_level:
 *                     type: string
 *                   cover_image_url:
 *                     type: string
 *                     format: uri
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/my-programs', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT
        e.*,
        p.name, p.name_norwegian, p.description, p.description_norwegian,
        p.program_type, p.duration_weeks, p.difficulty_level, p.cover_image_url
      FROM user_program_enrollments e
      JOIN coaching_programs p ON p.id = e.program_id
      WHERE e.mobile_user_id = $1
      ORDER BY e.status = 'active' DESC, e.started_at DESC
    `,
      [req.mobileUser.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get my programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

// ============================================
// TODAY'S WORKOUT ROUTES
// ============================================

/**
 * @swagger
 * /mobile/today:
 *   get:
 *     summary: Get today's workout
 *     description: >
 *       Returns all exercises scheduled for today (based on server date and day of week)
 *       across all of the authenticated user's active program enrollments. Each exercise
 *       includes a `completedToday` flag indicating whether it has already been logged.
 *       Results are grouped by program.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: Today's workout data grouped by program
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2026-02-18"
 *                 dayOfWeek:
 *                   type: integer
 *                   description: ISO day of week — 1=Monday, 7=Sunday
 *                   example: 3
 *                 programs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       programId:
 *                         type: string
 *                         format: uuid
 *                       programName:
 *                         type: string
 *                       programNameNorwegian:
 *                         type: string
 *                       enrollmentId:
 *                         type: string
 *                         format: uuid
 *                       currentWeek:
 *                         type: integer
 *                       weekFocus:
 *                         type: string
 *                       exercises:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             programExerciseId:
 *                               type: string
 *                               format: uuid
 *                             exerciseId:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             nameNorwegian:
 *                               type: string
 *                             videoUrl:
 *                               type: string
 *                               format: uri
 *                             thumbnailUrl:
 *                               type: string
 *                               format: uri
 *                             category:
 *                               type: string
 *                             instructions:
 *                               type: string
 *                             sets:
 *                               type: integer
 *                             reps:
 *                               type: integer
 *                             holdSeconds:
 *                               type: integer
 *                             restSeconds:
 *                               type: integer
 *                             rirTarget:
 *                               type: integer
 *                             notes:
 *                               type: string
 *                             completedToday:
 *                               type: boolean
 *                               description: Whether this exercise has been logged today
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/today', authenticateMobile, async (req, res) => {
  try {
    const dayOfWeek = new Date().getDay() || 7; // 1-7 (Monday-Sunday)

    // Get active enrollments with today's exercises
    const result = await req.db.query(
      `
      SELECT
        e.id as enrollment_id,
        e.current_week,
        e.current_day,
        p.id as program_id,
        p.name as program_name,
        p.name_norwegian as program_name_norwegian,
        pw.id as week_id,
        pw.focus_area,
        pe.id as program_exercise_id,
        pe.sets,
        pe.reps,
        pe.hold_seconds,
        pe.rest_seconds,
        pe.rir_target,
        pe.notes as exercise_notes,
        ex.id as exercise_id,
        ex.name as exercise_name,
        ex.name_norwegian as exercise_name_norwegian,
        ex.video_url,
        ex.thumbnail_url,
        ex.category,
        ex.instructions_norwegian,
        (
          SELECT COUNT(*) FROM workout_logs wl
          WHERE wl.program_exercise_id = pe.id
          AND wl.mobile_user_id = $1
          AND DATE(wl.completed_at) = CURRENT_DATE
        ) > 0 as completed_today
      FROM user_program_enrollments e
      JOIN coaching_programs p ON p.id = e.program_id
      JOIN program_weeks pw ON pw.program_id = p.id AND pw.week_number = e.current_week
      JOIN program_exercises pe ON pe.program_week_id = pw.id AND pe.day_of_week = $2
      JOIN exercise_library ex ON ex.id = pe.exercise_id
      WHERE e.mobile_user_id = $1 AND e.status = 'active'
      ORDER BY p.name, pe.order_index
    `,
      [req.mobileUser.id, dayOfWeek]
    );

    // Group by program
    const programsMap = new Map();
    for (const row of result.rows) {
      if (!programsMap.has(row.program_id)) {
        programsMap.set(row.program_id, {
          programId: row.program_id,
          programName: row.program_name,
          programNameNorwegian: row.program_name_norwegian,
          enrollmentId: row.enrollment_id,
          currentWeek: row.current_week,
          weekFocus: row.focus_area,
          exercises: [],
        });
      }
      programsMap.get(row.program_id).exercises.push({
        programExerciseId: row.program_exercise_id,
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        nameNorwegian: row.exercise_name_norwegian,
        videoUrl: row.video_url,
        thumbnailUrl: row.thumbnail_url,
        category: row.category,
        instructions: row.instructions_norwegian,
        sets: row.sets,
        reps: row.reps,
        holdSeconds: row.hold_seconds,
        restSeconds: row.rest_seconds,
        rirTarget: row.rir_target,
        notes: row.exercise_notes,
        completedToday: row.completed_today,
      });
    }

    res.json({
      date: new Date().toISOString().split('T')[0],
      dayOfWeek,
      programs: Array.from(programsMap.values()),
    });
  } catch (error) {
    logger.error('Get today error:', error);
    res.status(500).json({ error: 'Failed to get today workout' });
  }
});

// ============================================
// WORKOUT LOGGING ROUTES
// ============================================

/**
 * @swagger
 * /mobile/log:
 *   post:
 *     summary: Log a completed exercise
 *     description: >
 *       Records a completed exercise set for the authenticated user. All numeric
 *       rating fields (pain, difficulty, soreness) are optional and typically use a
 *       1-10 scale. Logging a workout also triggers the streak update logic.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programExerciseId:
 *                 type: string
 *                 format: uuid
 *                 description: ID from program_exercises (for program-based workouts)
 *               exerciseId:
 *                 type: string
 *                 format: uuid
 *                 description: ID from exercise_library
 *               enrollmentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID from user_program_enrollments
 *               setsCompleted:
 *                 type: integer
 *                 example: 3
 *               repsCompleted:
 *                 type: integer
 *                 example: 12
 *               weightKg:
 *                 type: number
 *                 format: float
 *                 example: 10.5
 *               holdSecondsCompleted:
 *                 type: integer
 *                 example: 30
 *               rirActual:
 *                 type: integer
 *                 description: Reps in Reserve — actual RIR achieved
 *                 example: 2
 *               painRating:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Pain level during exercise (0=none, 10=worst)
 *                 example: 2
 *               difficultyRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Perceived difficulty (1=very easy, 10=maximal effort)
 *                 example: 7
 *               sorenessRating:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Muscle soreness level before/after exercise
 *                 example: 3
 *               notes:
 *                 type: string
 *                 description: Free-text notes about this exercise session
 *                 example: "Felt good, increased weight slightly"
 *     responses:
 *       200:
 *         description: Workout log entry created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The newly created workout_logs record
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 mobile_user_id:
 *                   type: string
 *                   format: uuid
 *                 exercise_id:
 *                   type: string
 *                   format: uuid
 *                 sets_completed:
 *                   type: integer
 *                 reps_completed:
 *                   type: integer
 *                 completed_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.post('/log', authenticateMobile, async (req, res) => {
  try {
    const {
      programExerciseId,
      exerciseId,
      enrollmentId,
      setsCompleted,
      repsCompleted,
      weightKg,
      holdSecondsCompleted,
      rirActual,
      painRating,
      difficultyRating,
      sorenessRating,
      notes,
    } = req.body;

    const result = await req.db.query(
      `
      INSERT INTO workout_logs (
        mobile_user_id, enrollment_id, program_exercise_id, exercise_id,
        sets_completed, reps_completed, weight_kg, hold_seconds_completed,
        rir_actual, pain_rating, difficulty_rating, soreness_rating, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        req.mobileUser.id,
        enrollmentId,
        programExerciseId,
        exerciseId,
        setsCompleted,
        repsCompleted,
        weightKg,
        holdSecondsCompleted,
        rirActual,
        painRating,
        difficultyRating,
        sorenessRating,
        notes,
      ]
    );

    // Update streak
    await updateStreak(req.db, req.mobileUser.id);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Log workout error:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

/**
 * @swagger
 * /mobile/progress:
 *   get:
 *     summary: Get user progress statistics
 *     description: >
 *       Returns workout statistics for the authenticated user over a configurable
 *       number of past days. Includes per-day workout counts and average ratings,
 *       the current and longest streak, and all-time totals.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Number of past days to include in the per-date breakdown
 *         example: 30
 *     responses:
 *       200:
 *         description: Progress statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streak:
 *                   type: object
 *                   properties:
 *                     current_streak:
 *                       type: integer
 *                       example: 7
 *                     longest_streak:
 *                       type: integer
 *                       example: 30
 *                     last_workout_date:
 *                       type: string
 *                       format: date
 *                     streak_start_date:
 *                       type: string
 *                       format: date
 *                 workoutsByDate:
 *                   type: array
 *                   description: Daily aggregates for the requested time window, ordered newest first
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       workout_count:
 *                         type: integer
 *                       avg_pain:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                       avg_difficulty:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                 totalStats:
 *                   type: object
 *                   properties:
 *                     total_workouts:
 *                       type: integer
 *                     active_days:
 *                       type: integer
 *                     avg_pain_overall:
 *                       type: number
 *                       format: float
 *                       nullable: true
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/progress', authenticateMobile, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get workout counts by date
    const workoutsByDate = await req.db.query(
      `
      SELECT
        DATE(completed_at) as date,
        COUNT(*) as workout_count,
        AVG(pain_rating) as avg_pain,
        AVG(difficulty_rating) as avg_difficulty
      FROM workout_logs
      WHERE mobile_user_id = $1
      AND completed_at > NOW() - make_interval(days => $2)
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `,
      [req.mobileUser.id, parseInt(days)]
    );

    // Get streak info
    const streakResult = await req.db.query(
      `
      SELECT * FROM user_streaks WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    // Get total stats
    const totalStats = await req.db.query(
      `
      SELECT
        COUNT(*) as total_workouts,
        COUNT(DISTINCT DATE(completed_at)) as active_days,
        AVG(pain_rating) as avg_pain_overall
      FROM workout_logs
      WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    res.json({
      streak: streakResult.rows[0] || { current_streak: 0, longest_streak: 0 },
      workoutsByDate: workoutsByDate.rows,
      totalStats: totalStats.rows[0],
    });
  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * @swagger
 * /mobile/achievements:
 *   get:
 *     summary: Get user achievements
 *     description: >
 *       Returns all achievements earned by the authenticated user, ordered by
 *       most recently earned first. Achievements are awarded automatically for
 *       streak milestones (7, 14, 30, 60, 100 days).
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of earned achievements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   mobile_user_id:
 *                     type: string
 *                     format: uuid
 *                   achievement_type:
 *                     type: string
 *                     description: Machine-readable type identifier
 *                     example: "streak_30"
 *                   achievement_name:
 *                     type: string
 *                     example: "Monthly Master"
 *                   description:
 *                     type: string
 *                     example: "Completed 30 consecutive days of workouts!"
 *                   earned_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/achievements', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT * FROM user_achievements
      WHERE mobile_user_id = $1
      ORDER BY earned_at DESC
    `,
      [req.mobileUser.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// ============================================
// SOCIAL LINKS ROUTES
// ============================================

/**
 * @swagger
 * /mobile/social-links:
 *   get:
 *     summary: Get clinician social links
 *     description: >
 *       Returns all public social media profile links for clinicians in the system,
 *       grouped by clinician. Useful for the mobile app's "Meet the Team" or
 *       social follow section.
 *     tags:
 *       - Mobile
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: Clinicians with their public social links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                     example: "Mads Fjeldheim"
 *                   links:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         platform:
 *                           type: string
 *                           example: "instagram"
 *                         url:
 *                           type: string
 *                           format: uri
 *                           example: "https://instagram.com/chiroclickno"
 *                         displayName:
 *                           type: string
 *                           example: "@chiroclickno"
 *       401:
 *         description: Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
router.get('/social-links', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT
        sl.*,
        u.first_name || ' ' || u.last_name as clinician_name
      FROM social_links sl
      JOIN users u ON u.id = sl.user_id
      WHERE sl.is_public = TRUE
      ORDER BY u.first_name, sl.platform
    `);

    // Group by clinician
    const cliniciansMap = new Map();
    for (const row of result.rows) {
      if (!cliniciansMap.has(row.user_id)) {
        cliniciansMap.set(row.user_id, {
          userId: row.user_id,
          name: row.clinician_name,
          links: [],
        });
      }
      cliniciansMap.get(row.user_id).links.push({
        platform: row.platform,
        url: row.profile_url,
        displayName: row.display_name,
      });
    }

    res.json(Array.from(cliniciansMap.values()));
  } catch (error) {
    logger.error('Get social links error:', error);
    res.status(500).json({ error: 'Failed to get social links' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update user streak after logging workout
 */
async function updateStreak(db, userId) {
  const today = new Date().toISOString().split('T')[0];

  // Get current streak info
  const streakResult = await db.query(
    `
    SELECT * FROM user_streaks WHERE mobile_user_id = $1
  `,
    [userId]
  );

  if (streakResult.rows.length === 0) {
    // Initialize streak
    await db.query(
      `
      INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak, last_workout_date, streak_start_date)
      VALUES ($1, 1, 1, $2, $2)
    `,
      [userId, today]
    );
    return;
  }

  const streak = streakResult.rows[0];
  const lastWorkout = streak.last_workout_date
    ? new Date(streak.last_workout_date).toISOString().split('T')[0]
    : null;

  if (lastWorkout === today) {
    // Already worked out today
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak, newLongest, streakStart;

  if (lastWorkout === yesterdayStr) {
    // Continuing streak
    newStreak = streak.current_streak + 1;
    newLongest = Math.max(newStreak, streak.longest_streak);
    streakStart = streak.streak_start_date;
  } else {
    // Streak broken, start new
    newStreak = 1;
    newLongest = streak.longest_streak;
    streakStart = today;
  }

  await db.query(
    `
    UPDATE user_streaks
    SET current_streak = $1, longest_streak = $2, last_workout_date = $3, streak_start_date = $4, updated_at = NOW()
    WHERE mobile_user_id = $5
  `,
    [newStreak, newLongest, today, streakStart, userId]
  );

  // Check for streak achievements
  await checkStreakAchievements(db, userId, newStreak);
}

/**
 * Check and award streak achievements
 */
async function checkStreakAchievements(db, userId, streak) {
  const milestones = [
    { days: 7, type: 'streak_7', name: '7-Day Streak' },
    { days: 14, type: 'streak_14', name: '2-Week Streak' },
    { days: 30, type: 'streak_30', name: 'Monthly Master' },
    { days: 60, type: 'streak_60', name: '2-Month Champion' },
    { days: 100, type: 'streak_100', name: 'Century Streak' },
  ];

  for (const milestone of milestones) {
    if (streak >= milestone.days) {
      await db.query(
        `
        INSERT INTO user_achievements (mobile_user_id, achievement_type, achievement_name, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (mobile_user_id, achievement_type, achievement_name) DO NOTHING
      `,
        [
          userId,
          milestone.type,
          milestone.name,
          `Completed ${milestone.days} consecutive days of workouts!`,
        ]
      );
    }
  }
}

// ============================================
// CLINIC CONNECTIVITY (v2.1)
// ============================================

/**
 * GET /mobile/messages — Patient's message inbox
 */
router.get('/messages', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const patientId = req.mobileUser.patientId;
    const orgId = req.mobileUser.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [messagesResult, countResult, unreadResult] = await Promise.all([
      req.db.query(
        `SELECT id, sender_type, sender_id, subject, body, is_read, read_at, parent_message_id, created_at
         FROM patient_messages
         WHERE patient_id = $1 AND organization_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [patientId, orgId, limit, offset]
      ),
      req.db.query(
        `SELECT COUNT(*) as total FROM patient_messages WHERE patient_id = $1 AND organization_id = $2`,
        [patientId, orgId]
      ),
      req.db.query(
        `SELECT COUNT(*) as count FROM patient_messages
         WHERE patient_id = $1 AND organization_id = $2 AND sender_type != 'PATIENT' AND is_read = false`,
        [patientId, orgId]
      ),
    ]);

    res.json({
      messages: messagesResult.rows,
      unread_count: parseInt(unreadResult.rows[0].count, 10),
      pagination: { page, limit, total: parseInt(countResult.rows[0].total, 10) },
    });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({
        messages: [],
        unread_count: 0,
        pagination: { page: 1, limit: 20, total: 0 },
      });
    }
    logger.error('Error getting mobile messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /mobile/messages — Patient sends a message
 */
router.post('/messages', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const patientId = req.mobileUser.patientId;
    const orgId = req.mobileUser.organizationId;
    const { subject, body: msgBody, parent_message_id } = req.body;

    if (!msgBody) {
      return res.status(400).json({ error: 'Meldingstekst er påkrevd' });
    }

    const result = await req.db.query(
      `INSERT INTO patient_messages (patient_id, organization_id, sender_type, sender_id, subject, body, parent_message_id)
       VALUES ($1, $2, 'PATIENT', NULL, $3, $4, $5)
       RETURNING *`,
      [patientId, orgId, subject || null, msgBody, parent_message_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Meldingssystemet er ikke konfigurert ennå' });
    }
    logger.error('Error sending mobile message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PATCH /mobile/messages/:id/read — Mark message as read
 */
router.patch('/messages/:id/read', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.mobileUser.patientId;
    const orgId = req.mobileUser.organizationId;

    await req.db.query(
      `UPDATE patient_messages SET is_read = true, read_at = NOW()
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3`,
      [id, patientId, orgId]
    );

    res.json({ success: true });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ success: true });
    }
    logger.error('Error marking mobile message read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * GET /mobile/documents — List portal documents for patient
 */
router.get('/documents', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const patientId = req.mobileUser.patientId;
    const orgId = req.mobileUser.organizationId;

    const result = await req.db.query(
      `SELECT id, title, document_type, created_at, token_expires_at, downloaded_at, download_token
       FROM portal_documents
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [patientId, orgId]
    );

    const documents = result.rows.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.document_type,
      createdAt: doc.created_at,
      expired: doc.token_expires_at < new Date(),
      downloadedAt: doc.downloaded_at,
      downloadToken: doc.token_expires_at > new Date() ? doc.download_token : null,
    }));

    res.json({ documents });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ documents: [] });
    }
    logger.error('Error getting mobile documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

/**
 * GET /mobile/documents/:token/download — Token-based document download
 */
router.get('/documents/:token/download', authenticateMobile, async (req, res) => {
  try {
    const { token } = req.params;

    const result = await req.db.query(
      `SELECT id, document_type, document_id, organization_id, token_expires_at
       FROM portal_documents
       WHERE download_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    if (doc.token_expires_at < new Date()) {
      return res.status(410).json({ error: 'Download link has expired' });
    }

    const { buffer, filename } = await generatePdf(
      doc.document_type,
      doc.document_id,
      doc.organization_id
    );

    // Mark as downloaded
    await req.db.query(
      `UPDATE portal_documents SET downloaded_at = NOW() WHERE id = $1 AND downloaded_at IS NULL`,
      [doc.id]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error downloading mobile document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

/**
 * GET /mobile/appointments/available-slots — Available time slots
 */
router.get(
  '/appointments/available-slots',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const { date, practitioner_id } = req.query;
      const orgId = req.mobileUser.organizationId;

      if (!date) {
        return res.status(400).json({ error: 'date query parameter is required' });
      }

      let existingQuery = `
      SELECT appointment_time, duration
      FROM appointments
      WHERE organization_id = $1
        AND appointment_date = $2
        AND status NOT IN ('cancelled', 'no_show')
    `;
      const params = [orgId, date];

      if (practitioner_id) {
        existingQuery += ' AND practitioner_id = $3';
        params.push(practitioner_id);
      }

      const existing = await req.db.query(existingQuery, params);

      // Generate 30-min slots from 08:00 to 17:00
      const bookedTimes = new Set(existing.rows.map((r) => r.appointment_time?.substring(0, 5)));
      const slots = [];
      for (let hour = 8; hour < 17; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          slots.push({ time, available: !bookedTimes.has(time) });
        }
      }

      res.json({ slots });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error getting mobile available slots:', error);
      res.status(500).json({ error: 'Failed to get available slots' });
    }
  }
);

/**
 * POST /mobile/appointments/request — Patient requests a new appointment
 */
router.post(
  '/appointments/request',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const { preferredDate, preferredTime, reason } = req.body;
      const patientId = req.mobileUser.patientId;
      const orgId = req.mobileUser.organizationId;

      if (!preferredDate) {
        return res.status(400).json({ error: 'preferredDate is required' });
      }

      const result = await req.db.query(
        `INSERT INTO portal_booking_requests
        (patient_id, organization_id, preferred_date, preferred_time_slot, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
        [patientId, orgId, preferredDate, preferredTime || null, reason || null]
      );

      const bookingRequest = result.rows[0];

      res.status(201).json({ id: bookingRequest.id, status: 'PENDING' });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error creating mobile booking request:', error);
      res.status(500).json({ error: 'Failed to create booking request' });
    }
  }
);

/**
 * GET /mobile/appointments/requests — List patient's booking requests
 */
router.get(
  '/appointments/requests',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const patientId = req.mobileUser.patientId;
      const orgId = req.mobileUser.organizationId;

      const result = await req.db.query(
        `SELECT id, preferred_date, preferred_time_slot, reason, status, created_at
       FROM portal_booking_requests
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
        [patientId, orgId]
      );

      res.json({ requests: result.rows });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.json({ requests: [] });
      }
      logger.error('Error getting mobile booking requests:', error);
      res.status(500).json({ error: 'Failed to get booking requests' });
    }
  }
);

export default router;
