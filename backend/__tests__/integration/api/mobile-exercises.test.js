/**
 * Mobile Exercises API Integration Tests
 * Tests for mobile-facing exercise library endpoints.
 *
 * Exercise endpoints: /api/v1/mobile/exercises, /api/v1/mobile/exercise-categories
 * All require Bearer token auth; without it they return 401.
 * Audit logging: uses resourceType 'mobile_exercises'.
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

// Audit log mock — verifies logAction is not called for unauthenticated requests
const mockLogAction = jest.fn().mockResolvedValue(null);
jest.unstable_mockModule('../../../src/services/auditLog.js', () => ({
  logAction: mockLogAction,
}));

describe('Mobile Exercises API Tests', () => {
  const agent = request(app);

  beforeEach(() => {
    mockLogAction.mockClear();
  });

  // =============================================================================
  // GET /mobile/exercises
  // =============================================================================

  describe('GET /api/v1/mobile/exercises', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get('/api/v1/mobile/exercises');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const res = await agent
        .get('/api/v1/mobile/exercises')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // GET /mobile/exercises/:id
  // =============================================================================

  describe('GET /api/v1/mobile/exercises/:id', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get(`/api/v1/mobile/exercises/${randomUUID()}`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const res = await agent
        .get(`/api/v1/mobile/exercises/${randomUUID()}`)
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // GET /mobile/exercise-categories
  // =============================================================================

  describe('GET /api/v1/mobile/exercise-categories', () => {
    it('should return 401 without auth token', async () => {
      const res = await agent.get('/api/v1/mobile/exercise-categories');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const res = await agent
        .get('/api/v1/mobile/exercise-categories')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // =============================================================================
  // Audit logging — action types for mobile_exercises resourceType
  // =============================================================================

  describe('Audit logging action types', () => {
    it('GET /exercises uses MOBILE_EXERCISES_READ and does not log on 401', async () => {
      const res = await agent.get('/api/v1/mobile/exercises');
      expect(res.status).toBe(401);
      expect(mockLogAction).not.toHaveBeenCalled();
    });

    it('GET /exercises/:id uses MOBILE_EXERCISE_READ and does not log on 401', async () => {
      const res = await agent.get(`/api/v1/mobile/exercises/${randomUUID()}`);
      expect(res.status).toBe(401);
      expect(mockLogAction).not.toHaveBeenCalled();
    });

    it('GET /exercise-categories uses MOBILE_EXERCISE_CATEGORIES_READ and does not log on 401', async () => {
      const res = await agent.get('/api/v1/mobile/exercise-categories');
      expect(res.status).toBe(401);
      expect(mockLogAction).not.toHaveBeenCalled();
    });
  });
});
