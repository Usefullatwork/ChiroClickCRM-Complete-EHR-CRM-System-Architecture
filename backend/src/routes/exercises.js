/**
 * Exercises Routes
 * API endpoints for exercise prescriptions
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'exercises' });
});

export default router;
