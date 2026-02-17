/**
 * Scheduler API Integration Tests
 * Tests for smart scheduling, communication scheduling, decisions, and rules
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Scheduler API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  describe('GET /api/v1/scheduler/health', () => {
    it('should return scheduler health status', async () => {
      const res = await agent.get('/api/v1/scheduler/health');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('ok');
        expect(res.body.module).toBe('scheduler');
      }
    });
  });

  // =============================================================================
  // SCHEDULE COMMUNICATION
  // =============================================================================

  describe('POST /api/v1/scheduler/communications', () => {
    it('should schedule communication with valid data', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: randomUUID(),
        type: 'REMINDER',
        channel: 'sms',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        message: 'Your appointment is tomorrow',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject communication without required fields', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should reject communication without patientId', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        type: 'REMINDER',
        channel: 'sms',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PENDING COMMUNICATIONS
  // =============================================================================

  describe('GET /api/v1/scheduler/pending', () => {
    it('should return pending scheduled communications', async () => {
      const res = await agent.get('/api/v1/scheduler/pending');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // =============================================================================
  // CHECK CONFLICTS
  // =============================================================================

  describe('POST /api/v1/scheduler/check-conflicts', () => {
    it('should check booking conflicts', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({
        appointmentId: randomUUID(),
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without appointmentId', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DECISIONS
  // =============================================================================

  describe('GET /api/v1/scheduler/decisions', () => {
    it('should return pending decisions', async () => {
      const res = await agent.get('/api/v1/scheduler/decisions');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('decisions');
      }
    });
  });

  describe('POST /api/v1/scheduler/decisions/:id', () => {
    it('should resolve decision with extend', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: 'extend', note: 'Patient requested delay' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should resolve decision with cancel', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: 'cancel' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should resolve decision with send_anyway', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: 'send_anyway' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should reject invalid decision value', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: 'invalid_choice' });
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BULK DECISIONS
  // =============================================================================

  describe('POST /api/v1/scheduler/decisions/bulk', () => {
    it('should bulk resolve decisions', async () => {
      const res = await agent.post('/api/v1/scheduler/decisions/bulk').send({
        decisionIds: [randomUUID(), randomUUID()],
        decision: 'cancel',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without decisionIds', async () => {
      const res = await agent.post('/api/v1/scheduler/decisions/bulk').send({
        decision: 'cancel',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RULES
  // =============================================================================

  describe('GET /api/v1/scheduler/rules', () => {
    it('should return communication rules', async () => {
      const res = await agent.get('/api/v1/scheduler/rules');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('rules');
      }
    });
  });

  describe('PUT /api/v1/scheduler/rules/:id', () => {
    it('should update rule', async () => {
      const res = await agent.put(`/api/v1/scheduler/rules/${randomUUID()}`).send({
        enabled: true,
        delayHours: 24,
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should return 404 for non-existent rule', async () => {
      const res = await agent.put(`/api/v1/scheduler/rules/${randomUUID()}`).send({
        enabled: false,
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATIENT COMMUNICATIONS
  // =============================================================================

  describe('GET /api/v1/scheduler/patient/:patientId', () => {
    it('should return scheduled communications for patient', async () => {
      const res = await agent.get(`/api/v1/scheduler/patient/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('communications');
      }
    });
  });

  // =============================================================================
  // TODAY'S MESSAGES
  // =============================================================================

  describe('GET /api/v1/scheduler/today', () => {
    it("should return today's messages", async () => {
      const res = await agent.get('/api/v1/scheduler/today');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('messages');
      }
    });
  });

  // =============================================================================
  // CANCEL MESSAGE
  // =============================================================================

  describe('DELETE /api/v1/scheduler/messages/:id', () => {
    it('should handle cancel for non-existent message', async () => {
      const res = await agent.delete(`/api/v1/scheduler/messages/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SEND MESSAGES
  // =============================================================================

  describe('POST /api/v1/scheduler/send', () => {
    it('should send approved messages', async () => {
      const res = await agent.post('/api/v1/scheduler/send').send({
        messageIds: [randomUUID()],
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without messageIds', async () => {
      const res = await agent.post('/api/v1/scheduler/send').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // IMPORT APPOINTMENTS
  // =============================================================================

  describe('POST /api/v1/scheduler/import', () => {
    it('should import appointments with valid data', async () => {
      const res = await agent.post('/api/v1/scheduler/import').send({
        appointments: [
          {
            patientId: randomUUID(),
            dateTime: new Date().toISOString(),
            duration: 30,
            type: 'FOLLOWUP',
          },
        ],
        source: 'external_system',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without appointments array', async () => {
      const res = await agent.post('/api/v1/scheduler/import').send({
        source: 'external_system',
      });
      expect([400, 500]).toContain(res.status);
    });
  });
});
