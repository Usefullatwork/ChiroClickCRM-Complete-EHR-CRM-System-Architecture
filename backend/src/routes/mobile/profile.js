/**
 * Mobile Profile Routes
 * User profile, device tokens, and social links
 */

import express from 'express';
import * as mobileAuth from '../../services/practice/mobileAuth.js';
import { query } from '../../config/database.js';
import { authenticateMobile } from '../../middleware/mobileAuth.js';

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
 * /mobile/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with streak data
 *       401:
 *         description: Missing or invalid Bearer token
 *       404:
 *         description: User not found
 */
router.get('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.getUserById(req.mobileUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get streak info
    const streakResult = await query(
      `SELECT id, mobile_user_id, current_streak, longest_streak, last_workout_date, streak_start_date, updated_at
       FROM user_streaks WHERE mobile_user_id = $1`,
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
 *     tags: [Mobile]
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
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.patch('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.updateProfile(req.mobileUser.id, req.body);
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /mobile/device-token:
 *   post:
 *     summary: Register device token for push notifications
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *               deviceInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Device token registered
 *       400:
 *         description: Token missing
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.post('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.registerDeviceToken(req.mobileUser.id, token, deviceInfo);
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
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device token unregistered
 *       400:
 *         description: Token missing
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.delete('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.unregisterDeviceToken(req.mobileUser.id, token);
    res.json({ success: true });
  } catch (error) {
    logger.error('Unregister device token error:', error);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
});

/**
 * @swagger
 * /mobile/social-links:
 *   get:
 *     summary: Get clinician social links
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: Clinicians with their public social links
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/social-links', authenticateMobile, async (req, res) => {
  try {
    const result = await query(`
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

export default router;
