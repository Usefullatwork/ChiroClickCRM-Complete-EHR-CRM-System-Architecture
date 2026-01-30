/**
 * Scheduler Routes
 * API endpoints for smart scheduling
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'scheduler' });
});

export default router;
