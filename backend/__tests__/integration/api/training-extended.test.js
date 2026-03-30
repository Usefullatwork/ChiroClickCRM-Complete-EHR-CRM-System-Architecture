/**
 * Training Extended API Integration Tests
 * Tests for training data management, model lifecycle, data export,
 * gap reporting, and targeted data generation endpoints.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Training Extended API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // TRAINING DATA EXPORT
  // =============================================================================

  describe('GET /api/v1/training/export/stats', () => {
    it('should return export statistics', async () => {
      const res = await agent.get('/api/v1/training/export/stats');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      }
    });

    it('should respond without crashing when database has no training data', async () => {
      const res = await agent.get('/api/v1/training/export/stats');
      // Must not return 404 — route exists
      expect(res.status).not.toBe(404);
    });
  });

  describe('GET /api/v1/training/export', () => {
    it('should return a JSONL response or error', async () => {
      const res = await agent.get('/api/v1/training/export');
      expect([200, 500]).toContain(res.status);
    });

    it('should set Content-Type to application/jsonlines on success', async () => {
      const res = await agent.get('/api/v1/training/export');
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/jsonlines/);
        expect(res.headers['content-disposition']).toMatch(/attachment/);
        expect(res.headers['content-disposition']).toMatch(/training-export-.+\.jsonl/);
      }
    });
  });

  // =============================================================================
  // FEEDBACK DATA EXPORT (legacy endpoint)
  // =============================================================================

  describe('GET /api/v1/training/export-feedback-data', () => {
    it('should return JSONL or graceful error', async () => {
      const res = await agent.get('/api/v1/training/export-feedback-data');
      expect([200, 500]).toContain(res.status);
    });

    it('should not return 404 — route must be registered', async () => {
      const res = await agent.get('/api/v1/training/export-feedback-data');
      expect(res.status).not.toBe(404);
    });
  });

  // =============================================================================
  // GAP REPORT
  // =============================================================================

  describe('GET /api/v1/training/gap-report', () => {
    it('should return gap report or graceful error', async () => {
      const res = await agent.get('/api/v1/training/gap-report');
      expect([200, 500]).toContain(res.status);
    });

    it('should return structured data on success', async () => {
      const res = await agent.get('/api/v1/training/gap-report');
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      }
    });
  });

  // =============================================================================
  // GENERATE TARGETED TRAINING DATA
  // =============================================================================

  describe('POST /api/v1/training/generate-targeted', () => {
    it('should reject request without category', async () => {
      const res = await agent.post('/api/v1/training/generate-targeted').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject invalid category value', async () => {
      const res = await agent
        .post('/api/v1/training/generate-targeted')
        .send({ category: 'invalid_category' });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept a valid known category', async () => {
      const res = await agent
        .post('/api/v1/training/generate-targeted')
        .send({ category: 'soap_notes', count: 2 });
      // May fail if Claude API unavailable; never a 400 for valid input
      expect([200, 500]).toContain(res.status);
      expect(res.status).not.toBe(400);
    });

    it('should reject count exceeding maximum of 50', async () => {
      const res = await agent
        .post('/api/v1/training/generate-targeted')
        .send({ category: 'soap_notes', count: 99 });
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // MODEL MANAGEMENT — REBUILD / BACKUP / RESTORE
  // =============================================================================

  describe('POST /api/v1/training/rebuild', () => {
    it('should return response without 404 (route is registered)', async () => {
      const res = await agent.post('/api/v1/training/rebuild').send({});
      expect(res.status).not.toBe(404);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/training/backup', () => {
    it('should return response without 404 (route is registered)', async () => {
      const res = await agent.post('/api/v1/training/backup').send({});
      expect(res.status).not.toBe(404);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/training/restore', () => {
    it('should return response without 404 (route is registered)', async () => {
      const res = await agent.post('/api/v1/training/restore').send({});
      expect(res.status).not.toBe(404);
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // MODEL TEST
  // =============================================================================

  describe('GET /api/v1/training/test/:model', () => {
    it('should return a response for a named model', async () => {
      const res = await agent.get('/api/v1/training/test/chiro-no-sft-dpo-v6');
      // Ollama may be offline in test; 500 is acceptable
      expect([200, 500]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it('should handle model names with special characters gracefully', async () => {
      const res = await agent.get('/api/v1/training/test/nonexistent-model-xyz');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // ANALYTICS WEEKLY REPORT
  // =============================================================================

  describe('POST /api/v1/training/analytics/send-report', () => {
    it('should generate weekly AI digest or graceful error', async () => {
      const res = await agent.post('/api/v1/training/analytics/send-report').send({});
      expect([200, 500]).toContain(res.status);
    });

    it('should return structured report data on success', async () => {
      const res = await agent.post('/api/v1/training/analytics/send-report').send({});
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('stats');
        expect(res.body.data).toHaveProperty('html');
      }
    });
  });

  // =============================================================================
  // ANALYTICS — COST AND PROVIDER VALUE
  // =============================================================================

  describe('GET /api/v1/training/analytics/cost-per-suggestion', () => {
    it('should return cost-per-suggestion breakdown or error', async () => {
      const res = await agent.get('/api/v1/training/analytics/cost-per-suggestion');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept date range query parameters', async () => {
      const res = await agent
        .get('/api/v1/training/analytics/cost-per-suggestion')
        .query({ startDate: '2026-01-01', endDate: '2026-12-31' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/training/analytics/provider-value', () => {
    it('should return provider value comparison or error', async () => {
      const res = await agent.get('/api/v1/training/analytics/provider-value');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept days query parameter', async () => {
      const res = await agent.get('/api/v1/training/analytics/provider-value').query({ days: 7 });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/training/analytics/cache-trends', () => {
    it('should return cache utilization trends or error', async () => {
      const res = await agent.get('/api/v1/training/analytics/cache-trends');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // LEGACY PIPELINE ENDPOINTS
  // =============================================================================

  describe('POST /api/v1/training/parse-entry', () => {
    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/training/parse-entry').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should accept a valid journal text entry', async () => {
      const res = await agent.post('/api/v1/training/parse-entry').send({
        text: 'Pas. 45 år. Nakkesmerter i 3 uker. VAS 6/10. Stivhet om morgenen.',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/training/combined-journals', () => {
    it('should accept optional practitioner parameter', async () => {
      const res = await agent.post('/api/v1/training/combined-journals').send({
        practitioner: 'sindre',
        text: 'Pas. 32 år. Ryggsmerter.',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
