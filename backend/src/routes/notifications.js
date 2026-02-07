/**
 * Notifications Routes
 * API endpoints for in-app user notifications
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import * as notificationService from '../services/notifications.js';
import logger from '../utils/logger.js';

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
router.get('/', async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getNotifications(organizationId, user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true',
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count for badge
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { organizationId, user } = req;
    const count = await notificationService.getUnreadCount(organizationId, user.id);
    res.json({ count });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const notification = await notificationService.markAsRead(id, user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
  try {
    const { organizationId, user } = req;
    const result = await notificationService.markAllAsRead(organizationId, user.id);
    res.json(result);
  } catch (error) {
    logger.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const deleted = await notificationService.deleteNotification(id, user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
