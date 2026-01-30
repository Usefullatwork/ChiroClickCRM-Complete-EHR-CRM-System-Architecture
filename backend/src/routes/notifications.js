/**
 * Notifications Routes
 * API endpoints for user notifications
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'notifications' });
});

export default router;
