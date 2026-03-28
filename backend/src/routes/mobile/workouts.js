/**
 * Mobile Workout Routes
 * Today's workout, exercise logging, progress, and achievements
 */

import express from 'express';
import { authenticateMobile } from '../../middleware/mobileAuth.js';
import * as mobileWorkouts from '../../services/practice/mobileWorkouts.js';
import { logAction } from '../../services/practice/auditLog.js';

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
 * /mobile/today:
 *   get:
 *     summary: Get today's workout
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: Today's workout data grouped by program
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/today', authenticateMobile, async (req, res) => {
  try {
    const todayData = await mobileWorkouts.getTodayWorkout(req.mobileUser.id);
    await logAction('mobile_workout.today', req.mobileUser.id, {
      resourceType: 'mobile_workouts',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(todayData);
  } catch (error) {
    logger.error('Get today error:', error);
    res.status(500).json({ error: 'Failed to get today workout' });
  }
});

/**
 * @swagger
 * /mobile/log:
 *   post:
 *     summary: Log a completed exercise
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
 *               programExerciseId:
 *                 type: string
 *                 format: uuid
 *               exerciseId:
 *                 type: string
 *                 format: uuid
 *               enrollmentId:
 *                 type: string
 *                 format: uuid
 *               setsCompleted:
 *                 type: integer
 *               repsCompleted:
 *                 type: integer
 *               weightKg:
 *                 type: number
 *               holdSecondsCompleted:
 *                 type: integer
 *               rirActual:
 *                 type: integer
 *               painRating:
 *                 type: integer
 *               difficultyRating:
 *                 type: integer
 *               sorenessRating:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workout log entry created
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.post('/log', authenticateMobile, async (req, res) => {
  try {
    const logEntry = await mobileWorkouts.logWorkout(req.mobileUser.id, req.body);
    await logAction('mobile_workout.log', req.mobileUser.id, {
      resourceType: 'mobile_workouts',
      resourceId: logEntry?.id,
      metadata: {
        programExerciseId: req.body.programExerciseId,
        exerciseId: req.body.exerciseId,
        enrollmentId: req.body.enrollmentId,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(logEntry);
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
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Progress statistics
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/progress', authenticateMobile, async (req, res) => {
  try {
    const progress = await mobileWorkouts.getProgress(req.mobileUser.id, req.query.days);
    await logAction('mobile_workout.progress', req.mobileUser.id, {
      resourceType: 'mobile_workouts',
      metadata: { days: req.query.days },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(progress);
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
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of earned achievements
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/achievements', authenticateMobile, async (req, res) => {
  try {
    const achievements = await mobileWorkouts.getAchievements(req.mobileUser.id);
    await logAction('mobile_workout.achievements', req.mobileUser.id, {
      resourceType: 'mobile_workouts',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(achievements);
  } catch (error) {
    logger.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

export default router;
