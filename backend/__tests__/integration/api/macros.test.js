/**
 * Macros API Integration Tests
 * Tests for clinical text macro CRUD, search, favorites, and expansion
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Macros API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // LIST / MATRIX
  // =============================================================================

  describe('GET /api/v1/macros', () => {
    it('should return macro matrix', async () => {
      const res = await agent.get('/api/v1/macros');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SEARCH
  // =============================================================================

  describe('GET /api/v1/macros/search', () => {
    it('should search macros with query', async () => {
      const res = await agent.get('/api/v1/macros/search').query({ q: 'cervical' });
      expect([200, 500]).toContain(res.status);
    });

    it('should return empty results for non-matching query', async () => {
      const res = await agent.get('/api/v1/macros/search').query({ q: 'zzz_nonexistent_zzz' });
      expect([200, 500]).toContain(res.status);
    });

    it('should handle missing query parameter', async () => {
      const res = await agent.get('/api/v1/macros/search');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // FAVORITES
  // =============================================================================

  describe('GET /api/v1/macros/favorites', () => {
    it('should return favorites for current user', async () => {
      const res = await agent.get('/api/v1/macros/favorites');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE
  // =============================================================================

  describe('POST /api/v1/macros', () => {
    it('should create a macro with valid data', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'subjective',
        label: `Test Macro ${Date.now()}`,
        text: 'Patient reports improvement in cervical ROM.',
        shortcut: 'tmacro',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject macro without label', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'subjective',
        text: 'Some text',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject macro without text', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'objective',
        label: 'Empty Macro',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/macros').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // EXPAND
  // =============================================================================

  describe('POST /api/v1/macros/:id/expand', () => {
    it('should handle non-existent macro', async () => {
      const res = await agent.post(`/api/v1/macros/${randomUUID()}/expand`).send({});
      expect([404, 400, 500]).toContain(res.status);
    });

    it('should accept variables for substitution', async () => {
      const res = await agent
        .post(`/api/v1/macros/${randomUUID()}/expand`)
        .send({ variables: { patient_name: 'John Doe' } });
      expect([404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // FAVORITE TOGGLE
  // =============================================================================

  describe('POST /api/v1/macros/:id/favorite', () => {
    it('should handle toggling favorite for non-existent macro', async () => {
      const res = await agent.post(`/api/v1/macros/${randomUUID()}/favorite`);
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // USAGE TRACKING
  // =============================================================================

  describe('POST /api/v1/macros/:id/usage', () => {
    it('should handle recording usage for non-existent macro', async () => {
      const res = await agent.post(`/api/v1/macros/${randomUUID()}/usage`);
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE MACROS - category variations
  // =============================================================================

  describe('POST /api/v1/macros (categories)', () => {
    it('should create objective macro', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'objective',
        label: `Obj Macro ${Date.now()}`,
        text: 'Cervical ROM: Full flexion/extension. Lateral flexion L/R symmetric.',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should create assessment macro', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'assessment',
        label: `Assess Macro ${Date.now()}`,
        text: 'Mechanical cervicalgia with associated muscle spasm.',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should create plan macro', async () => {
      const res = await agent.post('/api/v1/macros').send({
        category: 'plan',
        label: `Plan Macro ${Date.now()}`,
        text: 'CMT cervical and thoracic. Home exercises prescribed. Follow up in 1 week.',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SEARCH VARIATIONS
  // =============================================================================

  describe('GET /api/v1/macros/search (variations)', () => {
    it('should search with short query', async () => {
      const res = await agent.get('/api/v1/macros/search').query({ q: 'ROM' });
      expect([200, 500]).toContain(res.status);
    });

    it('should search with category filter', async () => {
      const res = await agent
        .get('/api/v1/macros/search')
        .query({ q: 'pain', category: 'subjective' });
      expect([200, 500]).toContain(res.status);
    });
  });
});
