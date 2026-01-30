/**
 * Auto Accept Routes
 * API endpoints for auto-accept appointments
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'auto-accept' });
});

export default router;
