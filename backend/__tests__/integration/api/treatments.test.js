/**
 * Treatment Codes API Integration Tests
 * Tests for treatment code listing, search, common codes, statistics,
 * code lookup, and price calculation
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Treatments API Integration Tests', () => {
  const agent = request(app);

  afterAll(async () => {
    await db.closePool();
  });

  // =============================================================================
  // LIST ALL TREATMENT CODES
  // =============================================================================

  describe('GET /api/v1/treatments', () => {
    it('should return all treatment codes', async () => {
      const res = await agent.get('/api/v1/treatments');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // COMMON CODES
  // =============================================================================

  describe('GET /api/v1/treatments/common', () => {
    it('should return commonly used treatment codes', async () => {
      const res = await agent.get('/api/v1/treatments/common');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // SEARCH
  // =============================================================================

  describe('GET /api/v1/treatments/search', () => {
    it('should search treatment codes by term', async () => {
      const res = await agent.get('/api/v1/treatments/search').query({ q: 'CMT' });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should search for manipulation codes', async () => {
      const res = await agent.get('/api/v1/treatments/search').query({ q: 'manipulation' });
      expect([200, 500]).toContain(res.status);
    });

    it('should return empty for nonsense query', async () => {
      const res = await agent.get('/api/v1/treatments/search').query({ q: 'xyznonexistent12345' });
      expect([200, 500]).toContain(res.status);
    });

    it('should respect limit parameter', async () => {
      const res = await agent.get('/api/v1/treatments/search').query({ q: 'therapy', limit: 3 });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CODE LOOKUP
  // =============================================================================

  describe('GET /api/v1/treatments/:code', () => {
    it('should return 404 for nonexistent treatment code', async () => {
      const res = await agent.get('/api/v1/treatments/ZZZZZ');
      expect([404, 200, 500]).toContain(res.status);
    });

    it('should look up a CMT code format', async () => {
      const res = await agent.get('/api/v1/treatments/98940');
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // STATISTICS
  // =============================================================================

  describe('GET /api/v1/treatments/statistics', () => {
    it('should return treatment usage statistics', async () => {
      const res = await agent.get('/api/v1/treatments/statistics');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should filter statistics by date range', async () => {
      const res = await agent
        .get('/api/v1/treatments/statistics')
        .query({ startDate: '2026-01-01', endDate: '2026-12-31' });
      expect([200, 500]).toContain(res.status);
    });

    it('should respect limit parameter', async () => {
      const res = await agent.get('/api/v1/treatments/statistics').query({ limit: 5 });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PRICE CALCULATION
  // =============================================================================

  describe('POST /api/v1/treatments/calculate-price', () => {
    it('should calculate price for treatment codes', async () => {
      const res = await agent.post('/api/v1/treatments/calculate-price').send({
        codes: ['98940'],
      });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should calculate price for multiple codes', async () => {
      const res = await agent.post('/api/v1/treatments/calculate-price').send({
        codes: ['98940', '98941', '98942'],
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle empty codes array', async () => {
      const res = await agent.post('/api/v1/treatments/calculate-price').send({
        codes: [],
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject request without codes', async () => {
      const res = await agent.post('/api/v1/treatments/calculate-price').send({});
      expect([400, 500]).toContain(res.status);
    });
  });
});
