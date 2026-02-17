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

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'notifications' });
});

/**
 * GET /notifications
 * List user's notifications
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
 * GET /notifications/unread-count
 * Get unread notification count for badge
 */
router.get('/unread-count', async (req, res) => {
  const { organizationId, user } = req;
  const count = await notificationService.getUnreadCount(organizationId, user.id);
  res.json({ count });
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
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
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
  const { organizationId, user } = req;
  const result = await notificationService.markAllAsRead(organizationId, user.id);
  res.json(result);
});

/**
 * DELETE /notifications/:id
 * Delete a notification
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
