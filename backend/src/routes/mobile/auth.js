/**
 * Mobile Auth Routes
 * Public endpoints: OTP, Google, Apple, token refresh, logout
 */

import express from 'express';
import * as mobileAuth from '../../services/mobileAuth.js';

const router = express.Router();

// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

/**
 * @swagger
 * /mobile/auth/send-otp:
 *   post:
 *     summary: Send OTP code to phone number
 *     tags: [Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+4791234567"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Phone number missing or OTP delivery failed
 */
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await mobileAuth.sendOTP(phoneNumber);
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
 *     tags: [Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, code]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified — returns JWT tokens
 *       400:
 *         description: Missing fields or invalid/expired OTP
 */
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const result = await mobileAuth.verifyOTP(phoneNumber, code);
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
 *     tags: [Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authentication successful
 *       400:
 *         description: Missing ID token or verification failed
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const result = await mobileAuth.verifyGoogleToken(idToken);
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
 *     tags: [Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identityToken]
 *             properties:
 *               identityToken:
 *                 type: string
 *               user:
 *                 type: object
 *     responses:
 *       200:
 *         description: Apple authentication successful
 *       400:
 *         description: Missing identity token or verification failed
 */
router.post('/auth/apple', async (req, res) => {
  try {
    const { identityToken, user } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    const result = await mobileAuth.verifyAppleToken(identityToken, user);
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
 *     tags: [Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Refresh token missing, invalid, or revoked
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await mobileAuth.refreshAccessToken(refreshToken);
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
 *     tags: [Mobile]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful (always returned)
 */
router.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await mobileAuth.revokeToken(refreshToken);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    res.json({ success: true }); // Always return success for logout
  }
});

export default router;
