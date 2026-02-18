/**
 * Portal Routes
 * API endpoints for clinic portal
 */

import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /portal/health:
 *   get:
 *     summary: Portal module health check
 *     tags: [Portal]
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'portal' });
});

export default router;
