/**
 * Auto Accept Routes
 * API endpoints for auto-accept appointments
 */

import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /auto-accept/health:
 *   get:
 *     summary: Auto-accept module health check
 *     tags: [Auto Accept]
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'auto-accept' });
});

export default router;
