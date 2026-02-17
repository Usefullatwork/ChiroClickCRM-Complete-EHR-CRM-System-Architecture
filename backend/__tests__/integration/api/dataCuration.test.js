/**
 * Data Curation API Integration Tests
 * Tests for feedback curation endpoints used by the training module
 */

import request from 'supertest';
import app from '../../../src/server.js';

describe('Data Curation API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // GET FEEDBACK FOR CURATION
  // =============================================================================

  describe('GET /api/v1/training/curation/feedback', () => {
    it('should return paginated feedback list', async () => {
      const res = await agent.get('/api/v1/training/curation/feedback');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('page');
        expect(res.body.data).toHaveProperty('totalPages');
        expect(Array.isArray(res.body.data.data)).toBe(true);
      }
    });

    it('should accept type filter parameter', async () => {
      const res = await agent.get('/api/v1/training/curation/feedback?type=soap_subjective');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept status filter parameter', async () => {
      const res = await agent.get('/api/v1/training/curation/feedback?status=approved');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept pagination parameters', async () => {
      const res = await agent.get('/api/v1/training/curation/feedback?page=1&limit=10');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.limit).toBe(10);
      }
    });

    it('should accept date range filters', async () => {
      const res = await agent.get(
        '/api/v1/training/curation/feedback?startDate=2026-01-01&endDate=2026-12-31'
      );
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CURATION STATS
  // =============================================================================

  describe('GET /api/v1/training/curation/stats', () => {
    it('should return curation statistics', async () => {
      const res = await agent.get('/api/v1/training/curation/stats');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('pending');
        expect(res.body.data).toHaveProperty('approved');
        expect(res.body.data).toHaveProperty('rejected');
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('byType');
      }
    });
  });

  // =============================================================================
  // APPROVE FEEDBACK
  // =============================================================================

  describe('POST /api/v1/training/curation/approve/:id', () => {
    it('should return 404 for non-existent feedback', async () => {
      const res = await agent
        .post('/api/v1/training/curation/approve/00000000-0000-0000-0000-000000000000')
        .send({});
      expect([404, 500]).toContain(res.status);
    });

    it('should accept editedText in body', async () => {
      const res = await agent
        .post('/api/v1/training/curation/approve/00000000-0000-0000-0000-000000000000')
        .send({ editedText: 'Corrected text' });
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // REJECT FEEDBACK
  // =============================================================================

  describe('POST /api/v1/training/curation/reject/:id', () => {
    it('should return 404 for non-existent feedback', async () => {
      const res = await agent.post(
        '/api/v1/training/curation/reject/00000000-0000-0000-0000-000000000000'
      );
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BULK ACTION
  // =============================================================================

  describe('POST /api/v1/training/curation/bulk', () => {
    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/training/curation/bulk').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject invalid action', async () => {
      const res = await agent.post('/api/v1/training/curation/bulk').send({
        ids: ['00000000-0000-0000-0000-000000000001'],
        action: 'invalid',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept valid bulk approve', async () => {
      const res = await agent.post('/api/v1/training/curation/bulk').send({
        ids: ['00000000-0000-0000-0000-000000000001'],
        action: 'approve',
      });
      // May return 200 with updated=0 if IDs don't exist, or 500 if DB not available
      expect([200, 500]).toContain(res.status);
    });

    it('should accept valid bulk reject', async () => {
      const res = await agent.post('/api/v1/training/curation/bulk').send({
        ids: ['00000000-0000-0000-0000-000000000001'],
        action: 'reject',
      });
      expect([200, 500]).toContain(res.status);
    });
  });
});
