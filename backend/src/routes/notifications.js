/**
 * Notifications Routes
 * API endpoints for in-app user notifications
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import * as notificationService from '../services/notifications.js';
import validate from '../middleware/validation.js';
import {
  listNotificationsSchema,
  markAsReadSchema,
  deleteNotificationSchema,
} from '../validators/notifications.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /notifications/health:
 *   get:
 *     summary: Notifications module health check
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Module health status
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'notifications' });
});

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List user's notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 */
router.get('/', validate(listNotificationsSchema), async (req, res) => {
  const { organizationId, user } = req;
  const { page, limit, unreadOnly } = req.query;

  const result = await notificationService.getNotifications(organizationId, user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    unreadOnly: unreadOnly === 'true',
  });

  res.json(result);
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for badge
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get('/unread-count', async (req, res) => {
  const { organizationId, user } = req;
  const count = await notificationService.getUnreadCount(organizationId, user.id);
  res.json({ count });
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', validate(markAsReadSchema), async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const notification = await notificationService.markAsRead(id, user.id);

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found or already read' });
  }

  res.json(notification);
});

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', async (req, res) => {
  const { organizationId, user } = req;
  const result = await notificationService.markAllAsRead(organizationId, user.id);
  res.json(result);
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', validate(deleteNotificationSchema), async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const deleted = await notificationService.deleteNotification(id, user.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ success: true });
});

export default router;
