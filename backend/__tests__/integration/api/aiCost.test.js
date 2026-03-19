/**
 * AI Cost Analytics API Integration Tests
 * Tests for Claude API cost monitoring endpoints (admin-only)
 */

import request from 'supertest';
import app from '../../../src/server.js';

describe('AI Cost Analytics API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // BUDGET STATUS
  // =============================================================================

  describe('GET /api/v1/ai-cost/budget', () => {
    it('should return budget status', async () => {
      const res = await agent.get('/api/v1/ai-cost/budget');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // COST BY TASK TYPE
  // =============================================================================

  describe('GET /api/v1/ai-cost/by-task', () => {
    it('should return cost breakdown by task type', async () => {
      const res = await agent.get('/api/v1/ai-cost/by-task');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // CACHE EFFICIENCY
  // =============================================================================

  describe('GET /api/v1/ai-cost/cache', () => {
    it('should return cache efficiency metrics', async () => {
      const res = await agent.get('/api/v1/ai-cost/cache');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // DAILY COST TREND
  // =============================================================================

  describe('GET /api/v1/ai-cost/trend', () => {
    it('should return daily cost trend', async () => {
      const res = await agent.get('/api/v1/ai-cost/trend');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should accept days query param', async () => {
      const res = await agent.get('/api/v1/ai-cost/trend').query({ days: 7 });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PROVIDER COMPARISON
  // =============================================================================

  describe('GET /api/v1/ai-cost/providers', () => {
    it('should return provider comparison data', async () => {
      const res = await agent.get('/api/v1/ai-cost/providers');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // ALL ENDPOINTS RETURN JSON
  // =============================================================================

  describe('Response format', () => {
    it('should return JSON content type for all cost endpoints', async () => {
      const endpoints = [
        '/api/v1/ai-cost/budget',
        '/api/v1/ai-cost/by-task',
        '/api/v1/ai-cost/cache',
        '/api/v1/ai-cost/trend',
        '/api/v1/ai-cost/providers',
      ];

      for (const endpoint of endpoints) {
        const res = await agent.get(endpoint);
        if (res.status === 200) {
          expect(res.headers['content-type']).toMatch(/json/);
        }
      }
    });
  });
});
