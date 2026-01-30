/**
 * Kiosk Routes
 * API endpoints for patient self-service kiosk
 */

import express from 'express';

const router = express.Router();

// GET /api/v1/kiosk/health - Kiosk health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'kiosk',
    timestamp: new Date().toISOString()
  });
});

// Placeholder routes for kiosk functionality
// TODO: Implement patient check-in, form submission, etc.

export default router;
