/**
 * CRM Routes
 * API endpoints for CRM functionality
 */

import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'crm' });
});

export default router;
