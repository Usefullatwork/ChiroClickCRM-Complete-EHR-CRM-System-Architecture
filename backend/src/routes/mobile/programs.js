/**
 * Mobile Program Routes
 * Coaching program browsing and enrollment
 */

import express from 'express';
import { authenticateMobile } from '../../middleware/mobileAuth.js';
import * as mobilePrograms from '../../services/mobilePrograms.js';
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
 * /mobile/programs:
 *   get:
 *     summary: Get available coaching programs
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
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
 *     responses:
 *       200:
 *         description: List of available programs
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/programs', authenticateMobile, async (req, res) => {
  try {
    const programs = await mobilePrograms.listPrograms(req.query);
    await logAction('mobile_program.list', req.mobileUser.id, {
      resourceType: 'mobile_programs',
      metadata: { query: req.query },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(programs);
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
 *         description: Program details with weeks, exercises, and enrollment status
 *       404:
 *         description: Program not found
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/programs/:id', authenticateMobile, async (req, res) => {
  try {
    const program = await mobilePrograms.getProgramDetails(req.params.id, req.mobileUser.id);

    if (!program) {
      await logAction('mobile_program.read', req.mobileUser.id, {
        resourceType: 'mobile_programs',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: 'Program not found',
      });
      return res.status(404).json({ error: 'Program not found' });
    }

    await logAction('mobile_program.read', req.mobileUser.id, {
      resourceType: 'mobile_programs',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(program);
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
 *         description: Enrollment created
 *       400:
 *         description: Already enrolled
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.post('/programs/:id/enroll', authenticateMobile, async (req, res) => {
  try {
    const enrollment = await mobilePrograms.enrollInProgram(req.params.id, req.mobileUser.id);
    await logAction('mobile_program.enroll', req.mobileUser.id, {
      resourceType: 'mobile_programs',
      resourceId: req.params.id,
      metadata: { enrollmentId: enrollment?.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(enrollment);
  } catch (error) {
    if (error.message === 'Already enrolled in this program') {
      await logAction('mobile_program.enroll', req.mobileUser.id, {
        resourceType: 'mobile_programs',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: error.message,
      });
      return res.status(400).json({ error: error.message });
    }
    logger.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in program' });
  }
});

/**
 * @swagger
 * /mobile/my-programs:
 *   get:
 *     summary: Get the user's enrolled programs
 *     tags: [Mobile]
 *     security:
 *       - mobileBearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled programs
 *       401:
 *         description: Missing or invalid Bearer token
 */
router.get('/my-programs', authenticateMobile, async (req, res) => {
  try {
    const programs = await mobilePrograms.getMyPrograms(req.mobileUser.id);
    await logAction('mobile_program.list_enrolled', req.mobileUser.id, {
      resourceType: 'mobile_programs',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    res.json(programs);
  } catch (error) {
    logger.error('Get my programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

export default router;
