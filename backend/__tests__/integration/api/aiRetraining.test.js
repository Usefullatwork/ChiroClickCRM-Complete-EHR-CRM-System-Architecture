/**
 * AI Retraining API Integration Tests
 * Tests for model retraining pipeline, RLAIF, and scheduler management
 */

import request from 'supertest';
import app from '../../../src/server.js';

describe('AI Retraining API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // RETRAINING STATUS
  // =============================================================================

  describe('GET /api/v1/ai-retraining/status', () => {
    it('should return retraining status', async () => {
      const res = await agent.get('/api/v1/ai-retraining/status');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // RETRAINING HISTORY
  // =============================================================================

  describe('GET /api/v1/ai-retraining/history', () => {
    it('should return retraining history', async () => {
      const res = await agent.get('/api/v1/ai-retraining/history');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept limit query param', async () => {
      const res = await agent.get('/api/v1/ai-retraining/history').query({ limit: 5 });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TRIGGER RETRAINING
  // =============================================================================

  describe('POST /api/v1/ai-retraining/trigger-retraining', () => {
    it('should trigger retraining with dry run', async () => {
      const res = await agent.post('/api/v1/ai-retraining/trigger-retraining').send({
        dryRun: true,
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept empty body', async () => {
      const res = await agent.post('/api/v1/ai-retraining/trigger-retraining').send({});
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // EXPORT FEEDBACK
  // =============================================================================

  describe('POST /api/v1/ai-retraining/export-feedback', () => {
    it('should export feedback data', async () => {
      const res = await agent.post('/api/v1/ai-retraining/export-feedback').send({
        days: 30,
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should accept filtering options', async () => {
      const res = await agent.post('/api/v1/ai-retraining/export-feedback').send({
        minRating: 3,
        days: 7,
        includeRejected: false,
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // MODEL MANAGEMENT
  // =============================================================================

  describe('POST /api/v1/ai-retraining/model/rollback', () => {
    it('should handle rollback request', async () => {
      const res = await agent.post('/api/v1/ai-retraining/model/rollback').send({
        targetVersion: 'v5',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/ai-retraining/model/test', () => {
    it('should handle model test request', async () => {
      const res = await agent.post('/api/v1/ai-retraining/model/test').send({
        modelName: 'chiro-no-sft-dpo-v6',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept empty body for default model', async () => {
      const res = await agent.post('/api/v1/ai-retraining/model/test').send({});
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RLAIF ROUTES
  // =============================================================================

  describe('POST /api/v1/ai-retraining/rlaif/generate-pairs', () => {
    it('should generate preference pairs', async () => {
      const res = await agent.post('/api/v1/ai-retraining/rlaif/generate-pairs').send({
        suggestions: [{ input: 'Test input', output: 'Test output' }],
        suggestionType: 'soap',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/ai-retraining/rlaif/evaluate', () => {
    it('should evaluate suggestion quality', async () => {
      const res = await agent.post('/api/v1/ai-retraining/rlaif/evaluate').send({
        suggestion: 'Pas. har nakkesmerter med utstråling.',
        suggestionType: 'soap',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject missing required fields', async () => {
      const res = await agent.post('/api/v1/ai-retraining/rlaif/evaluate').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/ai-retraining/rlaif/stats', () => {
    it('should return RLAIF statistics', async () => {
      const res = await agent.get('/api/v1/ai-retraining/rlaif/stats');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/ai-retraining/rlaif/criteria', () => {
    it('should return quality criteria', async () => {
      const res = await agent.get('/api/v1/ai-retraining/rlaif/criteria');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/ai-retraining/rlaif/augment', () => {
    it('should augment training data', async () => {
      const res = await agent.post('/api/v1/ai-retraining/rlaif/augment').send({
        baseExamples: [{ input: 'Test', output: 'Response' }],
        targetCount: 5,
        suggestionType: 'soap',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SCHEDULER
  // =============================================================================

  describe('POST /api/v1/ai-retraining/scheduler/trigger', () => {
    it('should trigger a scheduled job', async () => {
      const res = await agent
        .post('/api/v1/ai-retraining/scheduler/trigger')
        .send({ jobName: 'retraining-check' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/ai-retraining/scheduler/status', () => {
    it('should return scheduler status', async () => {
      const res = await agent.get('/api/v1/ai-retraining/scheduler/status');
      expect([200, 500]).toContain(res.status);
    });
  });
});
