/**
 * Portal Routes
 * API endpoints for clinic portal
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'portal' });
});

export default router;
