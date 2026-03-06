/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: GDPR Article 30 - Audit log viewer (admin only)
 */

import { Router } from 'express';
import { query } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

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
router.get('/', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const {
    page = 1,
    limit = 50,
    action,
    resourceType,
    userRole,
    startDate,
    endDate,
    search,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['1=1'];
  const params = [];
  let paramIdx = 0;

  if (action) {
    paramIdx++;
    conditions.push(`al.action = $${paramIdx}`);
    params.push(action.toUpperCase());
  }

  if (resourceType) {
    paramIdx++;
    conditions.push(`al.resource_type = $${paramIdx}`);
    params.push(resourceType.toUpperCase());
  }

  if (userRole) {
    paramIdx++;
    conditions.push(`al.user_role = $${paramIdx}`);
    params.push(userRole.toUpperCase());
  }

  if (startDate) {
    paramIdx++;
    conditions.push(`al.created_at >= $${paramIdx}::date`);
    params.push(startDate);
  }

  if (endDate) {
    paramIdx++;
    conditions.push(`al.created_at < ($${paramIdx}::date + interval '1 day')`);
    params.push(endDate);
  }

  if (search) {
    paramIdx++;
    const searchParam = `%${search}%`;
    conditions.push(
      `(al.user_email ILIKE $${paramIdx} OR u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx} OR al.resource_id::text ILIKE $${paramIdx})`
    );
    params.push(searchParam);
  }

  const whereClause = conditions.join(' AND ');

  try {
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const logsResult = await query(
      `SELECT
        al.id,
        al.created_at,
        al.user_id,
        al.user_email,
        COALESCE(u.first_name || ' ' || u.last_name, al.user_email) as user_name,
        COALESCE(al.user_role, u.role) as user_role,
        al.action,
        al.resource_type,
        al.resource_id,
        al.changes,
        al.reason,
        al.ip_address,
        al.user_agent
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIdx + 1} OFFSET $${paramIdx + 2}`,
      [...params, limitNum, offset]
    );

    res.json({
      logs: logsResult.rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Failed to fetch audit logs', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

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
    const result = await query(
      `SELECT
        al.*,
        COALESCE(u.first_name || ' ' || u.last_name, al.user_email) as user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to fetch audit log entry', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit log entry' });
  }
});

export default router;
