/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: GDPR Article 30 - Audit log viewer (admin only)
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { listAuditLogsSchema } from '../validators/auditLog.validators.js';
import * as auditLogService from '../services/auditLogs.js';

const router = Router();

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: List audit logs with filters and pagination
 *     tags: [AuditLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: resourceType
 *         schema: { type: string }
 *       - in: query
 *         name: userRole
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  validate(listAuditLogsSchema),
  async (req, res) => {
    try {
      const { page, limit, action, resourceType, userRole, startDate, endDate, search } = req.query;
      const result = await auditLogService.listAuditLogs(
        { action, resourceType, userRole, startDate, endDate, search },
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Get a single audit log entry
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Audit log entry
 *       404:
 *         description: Not found
 */
router.get('/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const entry = await auditLogService.getAuditLogById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log entry' });
  }
});

export default router;
