/**
 * Scheduler Routes Stub
 * Temporary stub for testing - replace with actual implementation
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as scheduler from '../jobs/scheduler.js';

const router = Router();

router.use(requireAuth);

// Get scheduler status
router.get('/status', async (req, res) => {
  const status = scheduler.getSchedulerStatus();
  res.json({ success: true, data: status });
});

// List scheduled jobs
router.get('/jobs', async (req, res) => {
  res.json({ success: true, data: { jobs: [] } });
});

export default router;
