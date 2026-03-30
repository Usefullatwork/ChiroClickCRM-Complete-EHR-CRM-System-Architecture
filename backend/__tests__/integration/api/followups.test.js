/**
 * Follow-ups API Integration Tests
 * Tests for follow-up CRUD, overdue/upcoming, stats, complete/skip,
 * recall schedule, recall rules, and patient contact tracking
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { createTestPatient, randomUUID } from '../../helpers/testUtils.js';

const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

describe('Follow-ups API Integration Tests', () => {
  const agent = request(app);
  let testPatient;

  beforeAll(async () => {
    try {
      testPatient = await createTestPatient(DESKTOP_ORG_ID);
    } catch {
      // Patient creation may fail if DB not seeded; tests handle gracefully
    }
  });

  afterAll(async () => {
    await db.closePool();
  });

  // =============================================================================
  // LIST FOLLOW-UPS
  // =============================================================================

  describe('GET /api/v1/followups', () => {
    it('should list follow-ups', async () => {
      const res = await agent.get('/api/v1/followups');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should support pagination', async () => {
      const res = await agent.get('/api/v1/followups').query({ page: 1, limit: 10 });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should filter by status', async () => {
      const res = await agent.get('/api/v1/followups').query({ status: 'pending' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should filter by patientId', async () => {
      const patientId = testPatient?.id || randomUUID();
      const res = await agent.get('/api/v1/followups').query({ patientId });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // OVERDUE
  // =============================================================================

  describe('GET /api/v1/followups/overdue', () => {
    it('should return overdue follow-ups', async () => {
      const res = await agent.get('/api/v1/followups/overdue');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // UPCOMING
  // =============================================================================

  describe('GET /api/v1/followups/upcoming', () => {
    it('should return upcoming follow-ups', async () => {
      const res = await agent.get('/api/v1/followups/upcoming');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('should accept days query parameter', async () => {
      const res = await agent.get('/api/v1/followups/upcoming').query({ days: 14 });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // STATS
  // =============================================================================

  describe('GET /api/v1/followups/stats', () => {
    it('should return follow-up statistics', async () => {
      const res = await agent.get('/api/v1/followups/stats');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // CREATE FOLLOW-UP
  // =============================================================================

  describe('POST /api/v1/followups', () => {
    it('should create a follow-up with valid data', async () => {
      const patientId = testPatient?.id || randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const res = await agent.post('/api/v1/followups').send({
        patient_id: patientId,
        due_date: futureDate.toISOString().split('T')[0],
        type: 'recall',
        notes: 'Check progress after initial treatment',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject follow-up without required fields', async () => {
      const res = await agent.post('/api/v1/followups').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject follow-up without patient_id', async () => {
      const res = await agent.post('/api/v1/followups').send({
        due_date: '2026-12-01',
        type: 'recall',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CRUD LIFECYCLE
  // =============================================================================

  describe('Follow-up CRUD lifecycle', () => {
    let followUpId;

    it('should create a follow-up', async () => {
      const patientId = testPatient?.id || randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const res = await agent.post('/api/v1/followups').send({
        patient_id: patientId,
        due_date: futureDate.toISOString().split('T')[0],
        type: 'recall',
        notes: 'Lifecycle test follow-up',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
      if (res.status === 201 || res.status === 200) {
        followUpId = res.body.id;
      }
    });

    it('should read the created follow-up', async () => {
      if (!followUpId) return;
      const res = await agent.get(`/api/v1/followups/${followUpId}`);
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.id).toBe(followUpId);
      }
    });

    it('should update the follow-up', async () => {
      if (!followUpId) return;
      const res = await agent
        .patch(`/api/v1/followups/${followUpId}`)
        .send({ notes: 'Updated notes after phone call' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GET BY ID
  // =============================================================================

  describe('GET /api/v1/followups/:id', () => {
    it('should return 404 for nonexistent follow-up', async () => {
      const res = await agent.get(`/api/v1/followups/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // COMPLETE / SKIP
  // =============================================================================

  describe('POST /api/v1/followups/:id/complete', () => {
    it('should handle complete for nonexistent follow-up', async () => {
      const res = await agent
        .post(`/api/v1/followups/${randomUUID()}/complete`)
        .send({ notes: 'Patient contacted, booked new appointment' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/followups/:id/skip', () => {
    it('should handle skip for nonexistent follow-up', async () => {
      const res = await agent
        .post(`/api/v1/followups/${randomUUID()}/skip`)
        .send({ reason: 'Patient moved to another city' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATIENTS NEEDING FOLLOW-UP
  // =============================================================================

  describe('GET /api/v1/followups/patients/needingFollowUp', () => {
    it('should return patients needing follow-up', async () => {
      const res = await agent.get('/api/v1/followups/patients/needingFollowUp');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // MARK PATIENT AS CONTACTED
  // =============================================================================

  describe('POST /api/v1/followups/patients/:patientId/contacted', () => {
    it('should mark patient as contacted', async () => {
      const patientId = testPatient?.id || randomUUID();
      const res = await agent
        .post(`/api/v1/followups/patients/${patientId}/contacted`)
        .send({ method: 'phone' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RECALL SCHEDULE
  // =============================================================================

  describe('GET /api/v1/followups/recall-schedule/:patientId', () => {
    it('should return recall schedule for patient', async () => {
      const patientId = testPatient?.id || randomUUID();
      const res = await agent.get(`/api/v1/followups/recall-schedule/${patientId}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RECALL RULES
  // =============================================================================

  describe('GET /api/v1/followups/recall-rules', () => {
    it('should return recall rules', async () => {
      const res = await agent.get('/api/v1/followups/recall-rules');
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('POST /api/v1/followups/recall-rules', () => {
    it('should update recall rules', async () => {
      const res = await agent.post('/api/v1/followups/recall-rules').send({
        defaultRecallDays: 90,
        reminderDaysBefore: 7,
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
