/**
 * Patient Portal Routes
 * API endpoints for patient self-service portal
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'patient-portal' });
});

export default router;
