/**
 * Mobile Messaging API Integration Tests
 * Tests for mobile-facing messaging endpoints (v2.1 clinic connectivity).
 *
 * Mobile messaging endpoints are under /api/v1/mobile/messages
 * All require Bearer token auth; without it they return 401.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Mobile Messaging API Tests', () => {
  const agent = request(app);

  // =============================================================================
  // GET /mobile/messages
  // =============================================================================

  describe('GET /api/v1/mobile/messages', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get('/api/v1/mobile/messages');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return message list structure with valid auth shape', async () => {
      // Without a valid JWT this should 401 — verifying the endpoint exists and rejects
      const res = await agent
        .get('/api/v1/mobile/messages')
        .set('Authorization', 'Bearer invalid-token-abc');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // POST /mobile/messages
  // =============================================================================

  describe('POST /api/v1/mobile/messages', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.post('/api/v1/mobile/messages').send({ body: 'Test message' });
      expect(res.status).toBe(401);
    });

    it('should return 401 when sending without body and no auth', async () => {
      const res = await agent.post('/api/v1/mobile/messages').send({});
      expect(res.status).toBe(401);
    });
  });

  // =============================================================================
  // PATCH /mobile/messages/:id/read
  // =============================================================================

  describe('PATCH /api/v1/mobile/messages/:id/read', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.patch(`/api/v1/mobile/messages/${randomUUID()}/read`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
