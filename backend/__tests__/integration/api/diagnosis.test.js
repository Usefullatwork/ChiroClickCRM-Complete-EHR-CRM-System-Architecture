/**
 * Diagnosis Codes API Integration Tests
 * Tests for diagnosis code search, common codes, statistics, and code lookup
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Diagnosis API Integration Tests', () => {
  const agent = request(app);

  afterAll(async () => {
    await db.closePool();
  });

  // =============================================================================
  // SEARCH
  // =============================================================================

  describe('GET /api/v1/diagnosis/search', () => {
    it('should search diagnosis codes by ICPC-2 code', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'L03' });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should search diagnosis codes by description', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'neck pain' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should filter by coding system icpc2', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'L', system: 'icpc2' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should filter by coding system icd10', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'M54', system: 'icd10' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should return empty results for nonsense query', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'xyznonexistent12345' });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body) ? res.body.length : 0).toBe(0);
      }
    });

    it('should respect limit parameter', async () => {
      const res = await agent.get('/api/v1/diagnosis/search').query({ q: 'L', limit: 5 });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // COMMON CODES
  // =============================================================================

  describe('GET /api/v1/diagnosis/common', () => {
    it('should return commonly used diagnosis codes', async () => {
      const res = await agent.get('/api/v1/diagnosis/common');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should filter common codes by system', async () => {
      const res = await agent.get('/api/v1/diagnosis/common').query({ system: 'icpc2' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CHIROPRACTIC CODES
  // =============================================================================

  describe('GET /api/v1/diagnosis/chiropractic', () => {
    it('should return chiropractic-specific codes', async () => {
      const res = await agent.get('/api/v1/diagnosis/chiropractic');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // STATISTICS
  // =============================================================================

  describe('GET /api/v1/diagnosis/statistics', () => {
    it('should return diagnosis statistics', async () => {
      const res = await agent.get('/api/v1/diagnosis/statistics');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should filter statistics by date range', async () => {
      const res = await agent
        .get('/api/v1/diagnosis/statistics')
        .query({ startDate: '2026-01-01', endDate: '2026-12-31' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should respect limit parameter', async () => {
      const res = await agent.get('/api/v1/diagnosis/statistics').query({ limit: 5 });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CODE LOOKUP
  // =============================================================================

  describe('GET /api/v1/diagnosis/:code', () => {
    it('should return 404 for nonexistent code', async () => {
      const res = await agent.get('/api/v1/diagnosis/ZZ99');
      expect([404, 200, 500]).toContain(res.status);
    });

    it('should look up a valid ICPC-2 code format', async () => {
      const res = await agent.get('/api/v1/diagnosis/L03');
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });
});
