/**
 * Mobile Exercise Routes
 * Exercise library browsing
 */

import express from 'express';
import { authenticateMobile } from '../../middleware/mobileAuth.js';
import * as mobileExercises from '../../services/mobileExercises.js';
import { logAction } from '../../services/auditLog.js';

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
 * /mobile/exercises:
 *   get:
 *     summary: Get exercise library
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: bodyRegion
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of exercises
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/exercises', authenticateMobile, async (req, res) => {
  try {
    const result = await mobileExercises.listExercises(req.query);
    await logAction('MOBILE_EXERCISES_READ', req.mobileUser.id, {
      resourceType: 'mobile_exercises',
      metadata: {
        filters: {
          category: req.query.category || null,
          bodyRegion: req.query.bodyRegion || null,
          difficulty: req.query.difficulty || null,
          search: req.query.search || null,
        },
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(result);
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
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Full exercise record
 *       404:
 *         description: Exercise not found
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/exercises/:id', authenticateMobile, async (req, res) => {
  try {
    const exercise = await mobileExercises.getExerciseById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await logAction('MOBILE_EXERCISE_READ', req.mobileUser.id, {
      resourceType: 'mobile_exercises',
      resourceId: req.params.id,
      metadata: {
        exerciseName: exercise.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    res.json(exercise);
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
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories with exercise counts
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/exercise-categories', authenticateMobile, async (req, res) => {
  try {
    const categories = await mobileExercises.getCategories();
    await logAction('MOBILE_EXERCISE_CATEGORIES_READ', req.mobileUser.id, {
      resourceType: 'mobile_exercises',
      metadata: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(categories);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

export default router;
