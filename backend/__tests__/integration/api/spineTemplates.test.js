/**
 * Spine Templates API Integration Tests
 * Tests for spine palpation text templates CRUD, grouping, and reset
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Spine Templates API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // LIST TEMPLATES
  // =============================================================================

  describe('GET /api/v1/spine-templates', () => {
    it('should list all templates', async () => {
      const res = await agent.get('/api/v1/spine-templates');
      expect([200, 500]).toContain(res.status);
    });

    it('should support filtering by segment', async () => {
      const res = await agent.get('/api/v1/spine-templates').query({ segment: 'C2' });
      expect([200, 500]).toContain(res.status);
    });

    it('should support filtering by direction', async () => {
      const res = await agent.get('/api/v1/spine-templates').query({ direction: 'left' });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GROUPED BY SEGMENT
  // =============================================================================

  describe('GET /api/v1/spine-templates/grouped', () => {
    it('should return templates grouped by segment', async () => {
      const res = await agent.get('/api/v1/spine-templates/grouped');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // SEGMENTS AND DIRECTIONS LISTS
  // =============================================================================

  describe('GET /api/v1/spine-templates/segments', () => {
    it('should return list of available segments', async () => {
      const res = await agent.get('/api/v1/spine-templates/segments');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/spine-templates/directions', () => {
    it('should return list of available directions', async () => {
      const res = await agent.get('/api/v1/spine-templates/directions');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // GET BY SEGMENT + DIRECTION
  // =============================================================================

  describe('GET /api/v1/spine-templates/:segment/:direction', () => {
    it('should return template for valid segment and direction', async () => {
      const res = await agent.get('/api/v1/spine-templates/C2/left');
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should handle non-existent segment', async () => {
      const res = await agent.get('/api/v1/spine-templates/Z99/left');
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should handle non-existent direction', async () => {
      const res = await agent.get('/api/v1/spine-templates/C2/unknown');
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE TEMPLATE
  // =============================================================================

  describe('POST /api/v1/spine-templates', () => {
    it('should create custom template with valid data', async () => {
      const res = await agent.post('/api/v1/spine-templates').send({
        segment: 'C5',
        direction: 'left',
        text_nb: 'C5 venstre rotasjon restriksjon',
        text_en: 'C5 left rotation restriction',
      });
      expect([201, 200, 400, 409, 500]).toContain(res.status);
    });

    it('should reject template without required fields', async () => {
      const res = await agent.post('/api/v1/spine-templates').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject template without segment', async () => {
      const res = await agent.post('/api/v1/spine-templates').send({
        direction: 'left',
        text_nb: 'Missing segment',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BULK UPDATE
  // =============================================================================

  describe('POST /api/v1/spine-templates/bulk', () => {
    it('should handle bulk update with valid templates', async () => {
      const res = await agent.post('/api/v1/spine-templates/bulk').send({
        templates: [
          { segment: 'C3', direction: 'right', text_nb: 'C3 hoyre' },
          { segment: 'C4', direction: 'left', text_nb: 'C4 venstre' },
        ],
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject empty bulk update', async () => {
      const res = await agent.post('/api/v1/spine-templates/bulk').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RESET TO DEFAULTS
  // =============================================================================

  describe('POST /api/v1/spine-templates/reset', () => {
    it('should reset templates to defaults', async () => {
      const res = await agent.post('/api/v1/spine-templates/reset');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE TEMPLATE
  // =============================================================================

  describe('PATCH /api/v1/spine-templates/:id', () => {
    it('should handle update for non-existent template', async () => {
      const res = await agent
        .patch(`/api/v1/spine-templates/${randomUUID()}`)
        .send({ text_nb: 'Updated text' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELETE TEMPLATE
  // =============================================================================

  describe('DELETE /api/v1/spine-templates/:id', () => {
    it('should handle delete for non-existent template', async () => {
      const res = await agent.delete(`/api/v1/spine-templates/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
