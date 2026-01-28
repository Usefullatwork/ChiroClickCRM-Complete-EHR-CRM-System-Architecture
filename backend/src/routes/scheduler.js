/**
 * Scheduler Routes
 * API endpoints for managing background jobs and viewing job status/logs
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as scheduler from '../jobs/scheduler.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/scheduler/status:
 *   get:
 *     summary: Get scheduler status
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status
 */
router.get('/status', async (req, res) => {
  try {
    const status = scheduler.getSchedulerStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/jobs:
 *   get:
 *     summary: List all scheduled jobs
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const status = scheduler.getSchedulerStatus();
    res.json({
      success: true,
      data: {
        jobs: status.jobs,
        count: status.jobCount,
        running: status.running
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/jobs/{jobName}/run:
 *   post:
 *     summary: Manually run a job
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job execution result
 */
router.post('/jobs/:jobName/run', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { jobName } = req.params;
    const result = await scheduler.runJobNow(jobName);
    res.json({
      success: true,
      data: {
        jobName,
        result,
        executedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/logs:
 *   get:
 *     summary: Get recent job execution logs
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: jobName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of job logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, jobName } = req.query;
    const logs = await scheduler.getJobLogs(parseInt(limit), jobName || null);
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/logs/{jobName}:
 *   get:
 *     summary: Get logs for a specific job
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Job-specific logs
 */
router.get('/logs/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    const { limit = 20 } = req.query;
    const logs = await scheduler.getJobLogs(parseInt(limit), jobName);
    res.json({
      success: true,
      data: {
        jobName,
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/restart:
 *   post:
 *     summary: Restart the scheduler
 *     tags: [Scheduler]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Scheduler restarted
 */
router.post('/restart', requireRole(['ADMIN']), async (req, res) => {
  try {
    scheduler.shutdownScheduler();
    const result = await scheduler.initializeScheduler();
    res.json({
      success: true,
      data: {
        message: 'Scheduler restarted',
        ...result
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/scheduler/health:
 *   get:
 *     summary: Scheduler health check
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Scheduler health status
 */
router.get('/health', async (req, res) => {
  const status = scheduler.getSchedulerStatus();
  const healthy = status.running && status.jobCount > 0;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      healthy,
      running: status.running,
      jobCount: status.jobCount,
      timezone: status.timezone
    }
  });
});

export default router;
