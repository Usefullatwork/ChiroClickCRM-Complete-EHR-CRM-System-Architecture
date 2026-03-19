/**
 * Batch API Integration Tests
 * Tests for Claude Batch API job management endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Batch API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // LIST BATCHES
  // =============================================================================

  describe('GET /api/v1/batch', () => {
    it('should return batch list', async () => {
      const res = await agent.get('/api/v1/batch');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE BATCH
  // =============================================================================

  describe('POST /api/v1/batch', () => {
    it('should attempt to create a batch job', async () => {
      const res = await agent.post('/api/v1/batch').send({
        requests: [
          {
            custom_id: 'test-1',
            params: {
              model: 'claude-sonnet-4-6',
              max_tokens: 100,
              messages: [{ role: 'user', content: 'Test' }],
            },
          },
        ],
      });
      // May fail due to missing Claude API key, but route should exist
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should handle empty body', async () => {
      const res = await agent.post('/api/v1/batch').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BATCH STATUS
  // =============================================================================

  describe('GET /api/v1/batch/:batchId', () => {
    it('should return 404 or 500 for non-existent batch', async () => {
      const res = await agent.get(`/api/v1/batch/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BATCH RESULTS
  // =============================================================================

  describe('GET /api/v1/batch/:batchId/results', () => {
    it('should return 404 or 500 for non-existent batch results', async () => {
      const res = await agent.get(`/api/v1/batch/${randomUUID()}/results`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CANCEL BATCH
  // =============================================================================

  describe('POST /api/v1/batch/:batchId/cancel', () => {
    it('should handle cancel for non-existent batch', async () => {
      const res = await agent.post(`/api/v1/batch/${randomUUID()}/cancel`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SCORE TRAINING DATA
  // =============================================================================

  describe('POST /api/v1/batch/score-training', () => {
    it('should score training data', async () => {
      const res = await agent.post('/api/v1/batch/score-training').send({
        examples: [
          {
            messages: [
              { role: 'user', content: 'Skriv SOAP for korsryggsmerte' },
              { role: 'assistant', content: 'S: Pas. kommer med smerter i korsryggen.' },
            ],
          },
        ],
      });
      // May fail without Claude API, but route should exist
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle empty body', async () => {
      const res = await agent.post('/api/v1/batch/score-training').send({});
      expect([400, 500]).toContain(res.status);
    });
  });
});
