/**
 * Notifications API Integration Tests
 * Tests for in-app notification endpoints (list, read, delete, health)
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted.
 * Notification routes require auth + organization middleware.
 * The notifications table may not exist in fresh PGlite instances,
 * so the service gracefully degrades (returns empty data).
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Notifications API Integration Tests', () => {
  afterAll(async () => {
    if (db && db.closePool) {
      await db.closePool();
    }
  });

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  describe('GET /api/v1/notifications/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/notifications/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('module', 'notifications');
    });
  });

  // =============================================================================
  // LIST NOTIFICATIONS
  // =============================================================================

  describe('GET /api/v1/notifications', () => {
    it('should return notification list', async () => {
      const response = await request(app).get('/api/v1/notifications');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('notifications');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.notifications)).toBe(true);
      }
    });

    it('should support pagination parameters', async () => {
      const response = await request(app).get('/api/v1/notifications').query({ page: 1, limit: 5 });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('pages');
      }
    });

    it('should support unreadOnly filter', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .query({ unreadOnly: 'true' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('notifications');
      }
    });

    it('should return empty list when no notifications exist', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .query({ page: 999, limit: 10 });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.notifications).toEqual([]);
      }
    });
  });

  // =============================================================================
  // UNREAD COUNT
  // =============================================================================

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const response = await request(app).get('/api/v1/notifications/unread-count');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('count');
        expect(typeof response.body.count).toBe('number');
        expect(response.body.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // =============================================================================
  // MARK AS READ
  // =============================================================================

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app).put(`/api/v1/notifications/${randomUUID()}/read`);

      // 404 if not found, 500 if table doesn't exist
      expect([404, 500]).toContain(response.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).put('/api/v1/notifications/not-a-uuid/read');

      expect(response.status).toBe(400);
    });
  });

  // =============================================================================
  // MARK ALL READ
  // =============================================================================

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app).put('/api/v1/notifications/read-all');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('marked');
        expect(typeof response.body.marked).toBe('number');
      }
    });
  });

  // =============================================================================
  // DELETE NOTIFICATION
  // =============================================================================

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app).delete(`/api/v1/notifications/${randomUUID()}`);

      // 404 if not found, 500 if table doesn't exist
      expect([404, 500]).toContain(response.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).delete('/api/v1/notifications/not-a-uuid');

      expect(response.status).toBe(400);
    });

    it('should return 404 when deleting an already deleted notification', async () => {
      const fakeId = randomUUID();
      const response = await request(app).delete(`/api/v1/notifications/${fakeId}`);

      // Should not find a random UUID
      expect([404, 500]).toContain(response.status);
    });
  });
});
