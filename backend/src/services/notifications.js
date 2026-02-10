/**
 * In-App Notifications Service
 * Stores and retrieves notifications for users within PGlite
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { sendToUser } from './websocket.js';

/**
 * Create a notification
 */
export async function createNotification({
  organizationId,
  userId,
  type,
  title,
  message,
  link = null,
  metadata = null,
  priority = 'MEDIUM',
}) {
  try {
    const result = await query(
      `
      INSERT INTO notifications (
        organization_id, user_id, type, title, message, link, metadata, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [organizationId, userId, type, title, message, link, JSON.stringify(metadata), priority]
    );

    // Push notification via WebSocket
    try {
      sendToUser(userId, 'notification:new', result.rows[0]);
    } catch (wsError) {
      // WebSocket push is best-effort, don't fail the notification
      logger.debug('WebSocket notification push failed:', wsError.message);
    }

    return result.rows[0];
  } catch (error) {
    // If the notifications table doesn't exist yet, log and return null
    if (error.message?.includes('relation "notifications" does not exist')) {
      logger.debug('Notifications table not yet created, skipping notification');
      return null;
    }
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(organizationId, userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE n.organization_id = $1 AND n.user_id = $2';
    const params = [organizationId, userId];
    let paramIndex = 3;

    if (unreadOnly) {
      whereClause += ' AND n.read_at IS NULL';
    }

    params.push(limit, offset);

    const result = await query(
      `
      SELECT n.*
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      params
    );

    const countResult = await query(
      `
      SELECT COUNT(*) FROM notifications n ${whereClause}
    `,
      params.slice(0, -2)
    );

    return {
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  } catch (error) {
    if (error.message?.includes('relation "notifications" does not exist')) {
      return { notifications: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(organizationId, userId) {
  try {
    const result = await query(
      `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL
    `,
      [organizationId, userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    if (error.message?.includes('relation "notifications" does not exist')) {
      return 0;
    }
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId, userId) {
  const result = await query(
    `
    UPDATE notifications
    SET read_at = NOW()
    WHERE id = $1 AND user_id = $2 AND read_at IS NULL
    RETURNING *
  `,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(organizationId, userId) {
  const result = await query(
    `
    UPDATE notifications
    SET read_at = NOW()
    WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL
  `,
    [organizationId, userId]
  );
  return { marked: result.rowCount };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId, userId) {
  const result = await query(
    `
    DELETE FROM notifications
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `,
    [notificationId, userId]
  );
  return result.rows.length > 0;
}

// Notification types for trigger integration
export const NOTIFICATION_TYPES = {
  NEW_LEAD: 'NEW_LEAD',
  OVERDUE_PATIENT: 'OVERDUE_PATIENT',
  RECALL_ALERT: 'RECALL_ALERT',
  EXERCISE_NONCOMPLIANCE: 'EXERCISE_NONCOMPLIANCE',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  SYSTEM: 'SYSTEM',
  WORKFLOW: 'WORKFLOW',
};

/**
 * Send notification to all users with a given role in an organization
 */
export async function notifyByRole(organizationId, roles, notification) {
  try {
    const usersResult = await query(
      `
      SELECT id FROM users
      WHERE organization_id = $1 AND role = ANY($2) AND is_active = true
    `,
      [organizationId, roles]
    );

    const notifications = [];
    for (const user of usersResult.rows) {
      const n = await createNotification({
        organizationId,
        userId: user.id,
        ...notification,
      });
      if (n) notifications.push(n);
    }
    return notifications;
  } catch (error) {
    logger.error('Error sending role notifications:', error);
    return [];
  }
}

export default {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyByRole,
  NOTIFICATION_TYPES,
};
