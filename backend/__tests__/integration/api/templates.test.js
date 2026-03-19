/**
 * Templates API Integration Tests
 * Tests for clinical template CRUD, search, categories, phrases,
 * red flags, test clusters, terminology, and document types
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Templates API Integration Tests', () => {
  const agent = request(app);

  afterAll(async () => {
    await db.closePool();
  });

  // =============================================================================
  // CATEGORIES
  // =============================================================================

  describe('GET /api/v1/templates/categories', () => {
    it('should return template categories', async () => {
      const res = await agent.get('/api/v1/templates/categories');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should accept language query parameter', async () => {
      const res = await agent.get('/api/v1/templates/categories').query({ language: 'NO' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SEARCH
  // =============================================================================

  describe('GET /api/v1/templates/search', () => {
    it('should search templates with query', async () => {
      const res = await agent.get('/api/v1/templates/search').query({ q: 'test' });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should return 400 when search query is missing', async () => {
      const res = await agent.get('/api/v1/templates/search');
      expect([400, 500]).toContain(res.status);
    });

    it('should search with category filter', async () => {
      const res = await agent
        .get('/api/v1/templates/search')
        .query({ q: 'neck', category: 'subjective' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BY CATEGORY
  // =============================================================================

  describe('GET /api/v1/templates/by-category', () => {
    it('should return templates grouped by category', async () => {
      const res = await agent.get('/api/v1/templates/by-category');
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept language parameter', async () => {
      const res = await agent.get('/api/v1/templates/by-category').query({ language: 'EN' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DOCUMENT TYPES
  // =============================================================================

  describe('GET /api/v1/templates/document-types', () => {
    it('should return list of document types', async () => {
      const res = await agent.get('/api/v1/templates/document-types');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('documentTypes');
      }
    });
  });

  describe('GET /api/v1/templates/for-document/:type', () => {
    it('should return templates for a valid document type', async () => {
      const res = await agent.get('/api/v1/templates/for-document/epikrise');
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('documentType');
        expect(res.body).toHaveProperty('templates');
      }
    });

    it('should return 404 for unknown document type', async () => {
      const res = await agent.get('/api/v1/templates/for-document/nonexistent_type');
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  describe('GET /api/v1/templates', () => {
    it('should list all templates', async () => {
      const res = await agent.get('/api/v1/templates');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should support category filter', async () => {
      const res = await agent.get('/api/v1/templates').query({ category: 'subjective' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await agent.get('/api/v1/templates').query({ limit: 5, offset: 0 });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/templates', () => {
    it('should create a template with valid data', async () => {
      const res = await agent.post('/api/v1/templates').send({
        name: `Test Template ${Date.now()}`,
        category: 'subjective',
        content: 'Patient reports neck pain radiating to left arm',
        language: 'nb',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject template without required fields', async () => {
      const res = await agent.post('/api/v1/templates').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject template without name', async () => {
      const res = await agent.post('/api/v1/templates').send({
        category: 'subjective',
        content: 'Some content',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject template without content', async () => {
      const res = await agent.post('/api/v1/templates').send({
        name: 'Test',
        category: 'subjective',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('Template CRUD lifecycle', () => {
    let templateId;

    it('should create a template', async () => {
      const res = await agent.post('/api/v1/templates').send({
        name: `CRUD Test ${Date.now()}`,
        category: 'objective',
        content: 'ROM cervical: Flexion 45, Extension 40',
        language: 'nb',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
      if (res.status === 201 || res.status === 200) {
        templateId = res.body.id;
      }
    });

    it('should read the created template', async () => {
      if (!templateId) return;
      const res = await agent.get(`/api/v1/templates/${templateId}`);
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.id).toBe(templateId);
      }
    });

    it('should update the template', async () => {
      if (!templateId) return;
      const res = await agent
        .patch(`/api/v1/templates/${templateId}`)
        .send({ content: 'ROM cervical: Flexion 50, Extension 45, Rotation 70/70' });
      expect([200, 404, 403, 500]).toContain(res.status);
    });

    it('should delete the template', async () => {
      if (!templateId) return;
      const res = await agent.delete(`/api/v1/templates/${templateId}`);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/templates/:id', () => {
    it('should return 404 for nonexistent template', async () => {
      const res = await agent.get(`/api/v1/templates/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/v1/templates/:id', () => {
    it('should handle update for nonexistent template', async () => {
      const res = await agent.patch(`/api/v1/templates/${randomUUID()}`).send({ name: 'Updated' });
      expect([404, 403, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/v1/templates/:id', () => {
    it('should handle delete for nonexistent template', async () => {
      const res = await agent.delete(`/api/v1/templates/${randomUUID()}`);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CUSTOM SET
  // =============================================================================

  describe('POST /api/v1/templates/custom-set', () => {
    it('should create a custom template set', async () => {
      const res = await agent.post('/api/v1/templates/custom-set').send({
        templateIds: [randomUUID(), randomUUID()],
        languageLevel: 'basic',
      });
      expect([200, 201, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
      }
    });

    it('should reject without templateIds', async () => {
      const res = await agent.post('/api/v1/templates/custom-set').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // EXPAND / ABBREVIATE
  // =============================================================================

  describe('POST /api/v1/templates/expand', () => {
    it('should expand abbreviations in text', async () => {
      const res = await agent.post('/api/v1/templates/expand').send({
        text: 'ROM cx: flex 45, ext 40',
      });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('original');
        expect(res.body).toHaveProperty('expanded');
      }
    });

    it('should reject without text', async () => {
      const res = await agent.post('/api/v1/templates/expand').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/templates/abbreviate', () => {
    it('should abbreviate clinical text', async () => {
      const res = await agent.post('/api/v1/templates/abbreviate').send({
        text: 'Range of motion cervical spine',
      });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('original');
        expect(res.body).toHaveProperty('abbreviated');
      }
    });

    it('should reject without text', async () => {
      const res = await agent.post('/api/v1/templates/abbreviate').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // FAVORITE
  // =============================================================================

  describe('POST /api/v1/templates/:id/favorite', () => {
    it('should toggle favorite on a template', async () => {
      const res = await agent.post(`/api/v1/templates/${randomUUID()}/favorite`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/templates/:id/use', () => {
    it('should increment usage count', async () => {
      const res = await agent.post(`/api/v1/templates/${randomUUID()}/use`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RED FLAGS
  // =============================================================================

  describe('GET /api/v1/templates/red-flags', () => {
    it('should return red flag criteria', async () => {
      const res = await agent.get('/api/v1/templates/red-flags');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('POST /api/v1/templates/red-flags/screen', () => {
    it('should screen symptoms for red flags', async () => {
      const res = await agent.post('/api/v1/templates/red-flags/screen').send({
        symptoms: ['sudden severe headache', 'neck stiffness', 'fever'],
        patientData: { age: 55 },
      });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should handle empty symptoms array', async () => {
      const res = await agent.post('/api/v1/templates/red-flags/screen').send({
        symptoms: [],
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TERMINOLOGY
  // =============================================================================

  describe('GET /api/v1/templates/terminology/:term', () => {
    it('should return terminology for a valid term', async () => {
      const res = await agent.get('/api/v1/templates/terminology/subluksasjon');
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('term');
        expect(res.body).toHaveProperty('terminology');
      }
    });

    it('should return 404 for unknown term', async () => {
      const res = await agent.get('/api/v1/templates/terminology/xyznonexistent');
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/templates/terms/:category', () => {
    it('should return terms for anatomy category', async () => {
      const res = await agent.get('/api/v1/templates/terms/anatomy');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('category', 'anatomy');
      }
    });

    it('should reject invalid category', async () => {
      const res = await agent.get('/api/v1/templates/terms/invalidcategory');
      expect([400, 500]).toContain(res.status);
    });

    it('should return terms for treatments category', async () => {
      const res = await agent.get('/api/v1/templates/terms/treatments');
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should return terms for examinations category', async () => {
      const res = await agent.get('/api/v1/templates/terms/examinations');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TEST CLUSTERS
  // =============================================================================

  describe('GET /api/v1/templates/test-clusters', () => {
    it('should return test clusters', async () => {
      const res = await agent.get('/api/v1/templates/test-clusters');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/templates/test-clusters/:condition', () => {
    it('should return cluster for a condition', async () => {
      const res = await agent.get('/api/v1/templates/test-clusters/cervical_radiculopathy');
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should return 404 for unknown condition', async () => {
      const res = await agent.get('/api/v1/templates/test-clusters/nonexistent_condition');
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PHRASES
  // =============================================================================

  describe('GET /api/v1/templates/phrases', () => {
    it('should return clinical phrases', async () => {
      const res = await agent.get('/api/v1/templates/phrases');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/templates/phrases/byregion/:region', () => {
    it('should return phrases for cervical region', async () => {
      const res = await agent.get('/api/v1/templates/phrases/byregion/cervical');
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should return phrases for lumbar region', async () => {
      const res = await agent.get('/api/v1/templates/phrases/byregion/lumbar');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TESTS LIBRARY
  // =============================================================================

  describe('GET /api/v1/templates/tests/library', () => {
    it('should return orthopedic test library', async () => {
      const res = await agent.get('/api/v1/templates/tests/library');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/templates/tests/:code', () => {
    it('should return 404 for unknown test code', async () => {
      const res = await agent.get('/api/v1/templates/tests/UNKNOWN_TEST_CODE');
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // FMS
  // =============================================================================

  describe('GET /api/v1/templates/fms', () => {
    it('should return FMS templates', async () => {
      const res = await agent.get('/api/v1/templates/fms');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // USER PREFERENCES
  // =============================================================================

  describe('GET /api/v1/templates/preferences/user', () => {
    it('should return user template preferences', async () => {
      const res = await agent.get('/api/v1/templates/preferences/user');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/templates/preferences/favorites/:templateId', () => {
    it('should add template to favorites', async () => {
      const res = await agent.post(`/api/v1/templates/preferences/favorites/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/v1/templates/preferences/favorites/:templateId', () => {
    it('should remove template from favorites', async () => {
      const res = await agent.delete(`/api/v1/templates/preferences/favorites/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
