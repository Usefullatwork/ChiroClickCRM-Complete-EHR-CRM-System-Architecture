/**
 * Mobile Documents & Booking API Integration Tests
 * Tests for mobile-facing document + appointment endpoints (v2.1 clinic connectivity).
 *
 * Document endpoints: /api/v1/mobile/documents
 * Booking endpoints: /api/v1/mobile/appointments
 * All require Bearer token auth; without it they return 401.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Mobile Documents & Booking API Tests', () => {
  const agent = request(app);

  // =============================================================================
  // GET /mobile/documents
  // =============================================================================

  describe('GET /api/v1/mobile/documents', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get('/api/v1/mobile/documents');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // GET /mobile/documents/:token/download
  // =============================================================================

  describe('GET /api/v1/mobile/documents/:token/download', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get(`/api/v1/mobile/documents/${randomUUID()}/download`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // GET /mobile/appointments/available-slots
  // =============================================================================

  describe('GET /api/v1/mobile/appointments/available-slots', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent
        .get('/api/v1/mobile/appointments/available-slots')
        .query({ date: '2026-04-01' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // POST /mobile/appointments/request
  // =============================================================================

  describe('POST /api/v1/mobile/appointments/request', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent
        .post('/api/v1/mobile/appointments/request')
        .send({ preferredDate: '2026-04-15', reason: 'Ryggsmerte' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
