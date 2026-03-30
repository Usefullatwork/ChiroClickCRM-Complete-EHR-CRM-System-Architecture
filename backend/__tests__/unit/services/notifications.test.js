/**
 * Unit Tests for Notifications Service
 * Tests creation, retrieval, marking read, deletion, role-based dispatch, and preference checking
 */

import { jest } from '@jest/globals';

// ── Mock database ─────────────────────────────────────────────────────────────
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
  },
}));

// ── Mock logger ───────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock websocket ────────────────────────────────────────────────────────────
const mockSendToUser = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/websocket.js', () => ({
  sendToUser: mockSendToUser,
  default: { sendToUser: mockSendToUser },
}));

// ── Import after all mocks are set up ─────────────────────────────────────────
const {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyByRole,
  NOTIFICATION_TYPES,
} = await import('../../../src/services/communication/notifications.js');

// ── Test constants ────────────────────────────────────────────────────────────
const ORG_ID = 'org-test-001';
const USER_ID = 'user-test-001';
const NOTIF_ID = 'notif-test-001';

const MOCK_NOTIFICATION = {
  id: NOTIF_ID,
  organization_id: ORG_ID,
  user_id: USER_ID,
  type: 'NEW_LEAD',
  title: 'Ny henvendelse',
  message: 'En ny pasient har sendt en henvendelse',
  link: '/leads/123',
  metadata: null,
  priority: 'MEDIUM',
  read_at: null,
  created_at: '2026-01-15T10:00:00Z',
};

// =============================================================================
// NOTIFICATION_TYPES
// =============================================================================

describe('NOTIFICATION_TYPES', () => {
  it('should export expected notification type constants', () => {
    expect(NOTIFICATION_TYPES.NEW_LEAD).toBe('NEW_LEAD');
    expect(NOTIFICATION_TYPES.OVERDUE_PATIENT).toBe('OVERDUE_PATIENT');
    expect(NOTIFICATION_TYPES.RECALL_ALERT).toBe('RECALL_ALERT');
    expect(NOTIFICATION_TYPES.EXERCISE_NONCOMPLIANCE).toBe('EXERCISE_NONCOMPLIANCE');
    expect(NOTIFICATION_TYPES.APPOINTMENT_REMINDER).toBe('APPOINTMENT_REMINDER');
    expect(NOTIFICATION_TYPES.SYSTEM).toBe('SYSTEM');
    expect(NOTIFICATION_TYPES.SECURITY_ALERT).toBe('SECURITY_ALERT');
    expect(NOTIFICATION_TYPES.BOOKING_REQUEST).toBe('BOOKING_REQUEST');
  });
});

// =============================================================================
// createNotification
// =============================================================================

describe('createNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a notification and push via WebSocket', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_NOTIFICATION] });

    const result = await createNotification({
      organizationId: ORG_ID,
      userId: USER_ID,
      type: 'NEW_LEAD',
      title: 'Ny henvendelse',
      message: 'En ny pasient har sendt en henvendelse',
      link: '/leads/123',
      priority: 'MEDIUM',
    });

    expect(result).toEqual(MOCK_NOTIFICATION);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notifications'),
      expect.arrayContaining([ORG_ID, USER_ID, 'NEW_LEAD', 'Ny henvendelse'])
    );
    expect(mockSendToUser).toHaveBeenCalledWith(USER_ID, 'notification:new', MOCK_NOTIFICATION);
  });

  it('should succeed even when WebSocket push fails', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_NOTIFICATION] });
    mockSendToUser.mockImplementation(() => {
      throw new Error('WebSocket unavailable');
    });

    const result = await createNotification({
      organizationId: ORG_ID,
      userId: USER_ID,
      type: 'SYSTEM',
      title: 'System Update',
      message: 'System maintenance scheduled',
    });

    expect(result).toEqual(MOCK_NOTIFICATION);
  });

  it('should return null when notifications table does not exist', async () => {
    mockQuery.mockRejectedValueOnce(new Error('relation "notifications" does not exist'));

    const result = await createNotification({
      organizationId: ORG_ID,
      userId: USER_ID,
      type: 'SYSTEM',
      title: 'Test',
      message: 'Test message',
    });

    expect(result).toBeNull();
  });

  it('should re-throw non-table-missing errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(
      createNotification({
        organizationId: ORG_ID,
        userId: USER_ID,
        type: 'SYSTEM',
        title: 'Test',
        message: 'Test message',
      })
    ).rejects.toThrow('Connection refused');
  });

  it('should serialize metadata as JSON', async () => {
    const metadata = { leadSource: 'website', score: 85 };
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_NOTIFICATION, metadata }] });

    await createNotification({
      organizationId: ORG_ID,
      userId: USER_ID,
      type: 'NEW_LEAD',
      title: 'Test',
      message: 'Test',
      metadata,
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([JSON.stringify(metadata)])
    );
  });
});

// =============================================================================
// getNotifications
// =============================================================================

describe('getNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated notifications', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [MOCK_NOTIFICATION] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const result = await getNotifications(ORG_ID, USER_ID);

    expect(result.notifications).toEqual([MOCK_NOTIFICATION]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    });
  });

  it('should apply pagination parameters', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '50' }] });

    const result = await getNotifications(ORG_ID, USER_ID, { page: 3, limit: 10 });

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBe(50);
    expect(result.pagination.pages).toBe(5);
  });

  it('should filter unread only when specified', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });

    await getNotifications(ORG_ID, USER_ID, { unreadOnly: true });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('read_at IS NULL'),
      expect.any(Array)
    );
  });

  it('should return empty result when table does not exist', async () => {
    mockQuery.mockRejectedValueOnce(new Error('relation "notifications" does not exist'));

    const result = await getNotifications(ORG_ID, USER_ID);

    expect(result.notifications).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

// =============================================================================
// getUnreadCount
// =============================================================================

describe('getUnreadCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the unread notification count', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '7' }] });

    const count = await getUnreadCount(ORG_ID, USER_ID);

    expect(count).toBe(7);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('read_at IS NULL'), [
      ORG_ID,
      USER_ID,
    ]);
  });

  it('should return 0 when table does not exist', async () => {
    mockQuery.mockRejectedValueOnce(new Error('relation "notifications" does not exist'));

    const count = await getUnreadCount(ORG_ID, USER_ID);

    expect(count).toBe(0);
  });
});

// =============================================================================
// markAsRead
// =============================================================================

describe('markAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark a notification as read and return it', async () => {
    const readNotif = { ...MOCK_NOTIFICATION, read_at: '2026-01-15T12:00:00Z' };
    mockQuery.mockResolvedValueOnce({ rows: [readNotif] });

    const result = await markAsRead(NOTIF_ID, USER_ID);

    expect(result).toEqual(readNotif);
    expect(result.read_at).toBeTruthy();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications'), [
      NOTIF_ID,
      USER_ID,
    ]);
  });

  it('should return null when notification not found or already read', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await markAsRead(NOTIF_ID, USER_ID);

    expect(result).toBeNull();
  });
});

// =============================================================================
// markAllAsRead
// =============================================================================

describe('markAllAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark all unread notifications as read and return count', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 5 });

    const result = await markAllAsRead(ORG_ID, USER_ID);

    expect(result).toEqual({ marked: 5 });
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications'), [
      ORG_ID,
      USER_ID,
    ]);
  });

  it('should return zero count when no unread notifications exist', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 });

    const result = await markAllAsRead(ORG_ID, USER_ID);

    expect(result).toEqual({ marked: 0 });
  });
});

// =============================================================================
// deleteNotification
// =============================================================================

describe('deleteNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a notification and return true', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTIF_ID }] });

    const result = await deleteNotification(NOTIF_ID, USER_ID);

    expect(result).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM notifications'), [
      NOTIF_ID,
      USER_ID,
    ]);
  });

  it('should return false when notification not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await deleteNotification(NOTIF_ID, USER_ID);

    expect(result).toBe(false);
  });
});

// =============================================================================
// notifyByRole
// =============================================================================

describe('notifyByRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notifications to all active users with the specified roles', async () => {
    const users = [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }];
    mockQuery.mockResolvedValueOnce({ rows: users });

    // Three createNotification calls
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_NOTIFICATION, user_id: 'user-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_NOTIFICATION, user_id: 'user-2' }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_NOTIFICATION, user_id: 'user-3' }] });

    const result = await notifyByRole(ORG_ID, ['admin', 'chiropractor'], {
      type: 'RECALL_ALERT',
      title: 'Recall Alert',
      message: 'Patient overdue for follow-up',
    });

    expect(result).toHaveLength(3);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('role = ANY'), [
      ORG_ID,
      ['admin', 'chiropractor'],
    ]);
  });

  it('should return empty array when no users match roles', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await notifyByRole(ORG_ID, ['nonexistent_role'], {
      type: 'SYSTEM',
      title: 'Test',
      message: 'Test',
    });

    expect(result).toEqual([]);
  });

  it('should return empty array on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection timeout'));

    const result = await notifyByRole(ORG_ID, ['admin'], {
      type: 'SYSTEM',
      title: 'Test',
      message: 'Test',
    });

    expect(result).toEqual([]);
  });
});
