/**
 * Automations Routes
 * API endpoints for workflow automations
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'automations' });
});

export default router;
