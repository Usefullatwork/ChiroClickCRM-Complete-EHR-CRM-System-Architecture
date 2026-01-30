/**
 * Bulk Communication Routes
 * API endpoints for mass SMS/email communications
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'bulk-communication' });
});

export default router;
