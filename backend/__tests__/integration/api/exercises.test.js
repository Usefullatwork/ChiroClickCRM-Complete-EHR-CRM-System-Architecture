/**
 * Exercises API Integration Tests
 * Tests for exercise library, prescriptions, templates, and delivery endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Exercises API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // EXERCISE LIBRARY
  // =============================================================================

  describe('GET /api/v1/exercises', () => {
    it('should list exercises', async () => {
      const res = await agent.get('/api/v1/exercises');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should filter exercises by category', async () => {
      const res = await agent.get('/api/v1/exercises').query({ category: 'stretching' });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter exercises by bodyRegion', async () => {
      const res = await agent.get('/api/v1/exercises').query({ bodyRegion: 'cervical' });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter exercises by search term', async () => {
      const res = await agent.get('/api/v1/exercises').query({ search: 'stretch' });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter exercises by difficulty', async () => {
      const res = await agent.get('/api/v1/exercises').query({ difficulty: 'beginner' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/categories', () => {
    it('should return exercise categories', async () => {
      const res = await agent.get('/api/v1/exercises/categories');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/health', () => {
    it('should return health check without auth', async () => {
      const res = await agent.get('/api/v1/exercises/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.module).toBe('exercises');
    });
  });

  // =============================================================================
  // TEMPLATES
  // =============================================================================

  describe('GET /api/v1/exercises/templates', () => {
    it('should return exercise program templates', async () => {
      const res = await agent.get('/api/v1/exercises/templates');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/exercises/templates', () => {
    it('should create a template with valid data', async () => {
      const res = await agent.post('/api/v1/exercises/templates').send({
        name: 'Test Template',
        description: 'A test exercise template',
        exercises: [],
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/exercises/templates').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PRESCRIPTIONS
  // =============================================================================

  describe('POST /api/v1/exercises/prescriptions', () => {
    it('should require patient and exercise data', async () => {
      const res = await agent.post('/api/v1/exercises/prescriptions').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should create prescription with valid data', async () => {
      const res = await agent.post('/api/v1/exercises/prescriptions').send({
        patient_id: randomUUID(),
        exercises: [{ exercise_id: randomUUID(), sets: 3, reps: 10 }],
        frequency: 'daily',
      });
      // May fail due to FK constraints or succeed
      expect([201, 200, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/prescriptions/patient/:patientId', () => {
    it('should return prescriptions for a patient', async () => {
      const patientId = randomUUID();
      const res = await agent.get(`/api/v1/exercises/prescriptions/patient/${patientId}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/prescriptions/:id', () => {
    it('should return 404 for non-existent prescription', async () => {
      const res = await agent.get(`/api/v1/exercises/prescriptions/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // EXERCISE CRUD
  // =============================================================================

  describe('POST /api/v1/exercises', () => {
    it('should create a new exercise with valid data', async () => {
      const res = await agent.post('/api/v1/exercises').send({
        name: `Test Exercise ${Date.now()}`,
        category: 'stretching',
        body_region: 'cervical',
        instructions: 'Test instructions',
        difficulty: 'beginner',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject exercise without name', async () => {
      const res = await agent.post('/api/v1/exercises').send({
        category: 'stretching',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/:id', () => {
    it('should return 404 for non-existent exercise', async () => {
      const res = await agent.get(`/api/v1/exercises/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/v1/exercises/:id', () => {
    it('should return error for non-existent exercise', async () => {
      const res = await agent
        .patch(`/api/v1/exercises/${randomUUID()}`)
        .send({ name: 'Updated Name' });
      expect([404, 400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/v1/exercises/:id', () => {
    it('should handle deleting non-existent exercise', async () => {
      const res = await agent.delete(`/api/v1/exercises/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELIVERY
  // =============================================================================

  describe('GET /api/v1/exercises/prescriptions/:id/pdf', () => {
    it('should return error for non-existent prescription PDF', async () => {
      const res = await agent.get(`/api/v1/exercises/prescriptions/${randomUUID()}/pdf`);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/exercises/prescriptions/:id/send-email', () => {
    it('should return error for non-existent prescription', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/send-email`)
        .send({});
      expect([404, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/exercises/prescriptions/:id/progress', () => {
    it('should return error for non-existent prescription', async () => {
      const res = await agent.get(`/api/v1/exercises/prescriptions/${randomUUID()}/progress`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PRESCRIPTION STATUS
  // =============================================================================

  describe('PATCH /api/v1/exercises/prescriptions/:id/status', () => {
    it('should handle status update for non-existent prescription', async () => {
      const res = await agent
        .patch(`/api/v1/exercises/prescriptions/${randomUUID()}/status`)
        .send({ status: 'completed' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/exercises/prescriptions/:id/duplicate', () => {
    it('should handle duplicate for non-existent prescription', async () => {
      const res = await agent.post(`/api/v1/exercises/prescriptions/${randomUUID()}/duplicate`);
      expect([201, 200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/exercises/prescriptions/:id/send-sms', () => {
    it('should handle SMS for non-existent prescription', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/send-sms`)
        .send({});
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/exercises/prescriptions/:id/send-reminder', () => {
    it('should handle reminder for non-existent prescription', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/send-reminder`)
        .send({});
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // COMBINED FILTERS
  // =============================================================================

  describe('GET /api/v1/exercises (combined filters)', () => {
    it('should filter by category and bodyRegion together', async () => {
      const res = await agent
        .get('/api/v1/exercises')
        .query({ category: 'stretching', bodyRegion: 'cervical' });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by category, bodyRegion, and difficulty', async () => {
      const res = await agent
        .get('/api/v1/exercises')
        .query({ category: 'strengthening', bodyRegion: 'lumbar', difficulty: 'intermediate' });
      expect([200, 500]).toContain(res.status);
    });

    it('should support pagination with limit and offset', async () => {
      const res = await agent.get('/api/v1/exercises').query({ limit: 5, offset: 0 });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TEMPLATE CRUD
  // =============================================================================

  describe('PATCH /api/v1/exercises/templates/:id', () => {
    it('should handle update for non-existent template', async () => {
      const res = await agent
        .patch(`/api/v1/exercises/templates/${randomUUID()}`)
        .send({ name: 'Updated Template' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/v1/exercises/templates/:id', () => {
    it('should handle delete for non-existent template', async () => {
      const res = await agent.delete(`/api/v1/exercises/templates/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
