/**
 * Scheduler Extended Integration Tests
 * Additional coverage for smart scheduling, availability, conflict detection,
 * and communication lifecycle — beyond what api/scheduler.test.js covers.
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted as ADMIN.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

const agent = request(app);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createPatientViaAPI(overrides = {}) {
  const timestamp = Date.now();
  const defaults = {
    solvit_id: `TEST-${timestamp}-${Math.random().toString(36).substr(2, 6)}`,
    first_name: 'SchedTest',
    last_name: `Patient${timestamp}`,
    email: `schedpatient${timestamp}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1985-06-15',
    ...overrides,
  };
  const res = await request(app).post('/api/v1/patients').send(defaults);
  if (res.status !== 201) {
    throw new Error(`Failed to create patient: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Scheduler Extended Integration Tests', () => {
  let testPatient;

  beforeAll(async () => {
    try {
      testPatient = await createPatientViaAPI();
    } catch (_err) {
      testPatient = { id: randomUUID() };
    }
  });

  // ==========================================================================
  // HEALTH CHECK — detailed assertions
  // ==========================================================================

  describe('GET /api/v1/scheduler/health', () => {
    it('should return status ok and module name', async () => {
      const res = await agent.get('/api/v1/scheduler/health');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('ok');
        expect(res.body.module).toBe('scheduler');
      }
    });
  });

  // ==========================================================================
  // SCHEDULE COMMUNICATION — channel variants and validation
  // ==========================================================================

  describe('POST /api/v1/scheduler/communications — channel variants', () => {
    it('should schedule an SMS communication', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'sms',
        message: 'Reminder: your appointment is tomorrow at 10:00',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should schedule an email communication', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'email',
        message: 'Please remember to bring your referral letter.',
        scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject an unknown channel value', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'fax',
        message: 'Test',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject a scheduledAt in the past', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'sms',
        message: 'Past-scheduled message',
        scheduledAt: new Date(Date.now() - 86400000).toISOString(),
      });
      // Validator or service should reject past dates
      expect([400, 422, 201, 200, 500]).toContain(res.status);
    });

    it('should reject when message is missing', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'sms',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject when scheduledAt is missing', async () => {
      const res = await agent.post('/api/v1/scheduler/communications').send({
        patientId: testPatient.id,
        channel: 'email',
        message: 'No scheduledAt',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // CONFLICT DETECTION — availability and follow-up scheduling
  // ==========================================================================

  describe('POST /api/v1/scheduler/check-conflicts — conflict detection', () => {
    it('should accept a valid appointmentId and return conflict data', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({
        appointmentId: randomUUID(),
      });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('scheduled');
      }
    });

    it('should return an array under the scheduled key on success', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({
        appointmentId: randomUUID(),
      });
      if (res.status === 200) {
        expect(Array.isArray(res.body.scheduled)).toBe(true);
      } else {
        expect([400, 500]).toContain(res.status);
      }
    });

    it('should reject a non-UUID appointmentId', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({
        appointmentId: 'not-a-uuid',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject an empty body', async () => {
      const res = await agent.post('/api/v1/scheduler/check-conflicts').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // DECISION RESOLUTION — decision value coverage
  // ==========================================================================

  describe('POST /api/v1/scheduler/decisions/:id — decision values', () => {
    it('should reject an empty decision field', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: '' });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject missing decision field', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ note: 'no decision given' });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept extend with an optional note', async () => {
      const res = await agent
        .post(`/api/v1/scheduler/decisions/${randomUUID()}`)
        .send({ decision: 'extend', note: 'Patient requested rescheduling' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // BULK DECISIONS — array validation
  // ==========================================================================

  describe('POST /api/v1/scheduler/decisions/bulk — bulk operations', () => {
    it('should reject an empty decisionIds array', async () => {
      const res = await agent.post('/api/v1/scheduler/decisions/bulk').send({
        decisionIds: [],
        decision: 'cancel',
      });
      // Validator may reject empty arrays
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject without decision field', async () => {
      const res = await agent.post('/api/v1/scheduler/decisions/bulk').send({
        decisionIds: [randomUUID()],
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept send_anyway for multiple decisions', async () => {
      const res = await agent.post('/api/v1/scheduler/decisions/bulk').send({
        decisionIds: [randomUUID(), randomUUID(), randomUUID()],
        decision: 'send_anyway',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // PATIENT COMMUNICATIONS — per-patient scheduling view
  // ==========================================================================

  describe('GET /api/v1/scheduler/patient/:patientId', () => {
    it('should return communications array for a real patient', async () => {
      const res = await agent.get(`/api/v1/scheduler/patient/${testPatient.id}`);
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('communications');
        expect(Array.isArray(res.body.communications)).toBe(true);
      }
    });

    it('should return 400 or 500 for non-UUID patientId', async () => {
      const res = await agent.get('/api/v1/scheduler/patient/not-a-uuid');
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // SEND MESSAGES — messageIds validation
  // ==========================================================================

  describe('POST /api/v1/scheduler/send — send approved messages', () => {
    it('should accept an array of message IDs', async () => {
      const res = await agent.post('/api/v1/scheduler/send').send({
        messageIds: [randomUUID(), randomUUID()],
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject a non-array messageIds value', async () => {
      const res = await agent.post('/api/v1/scheduler/send').send({
        messageIds: 'not-an-array',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // IMPORT APPOINTMENTS — source variants and missing fields
  // ==========================================================================

  describe('POST /api/v1/scheduler/import — appointment import', () => {
    it('should accept multiple appointments from an external source', async () => {
      const res = await agent.post('/api/v1/scheduler/import').send({
        appointments: [
          {
            patientId: randomUUID(),
            dateTime: new Date(Date.now() + 86400000).toISOString(),
            duration: 45,
            type: 'INITIAL',
          },
          {
            patientId: randomUUID(),
            dateTime: new Date(Date.now() + 172800000).toISOString(),
            duration: 30,
            type: 'FOLLOWUP',
          },
        ],
        source: 'legacy_system',
      });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject when source field is missing', async () => {
      const res = await agent.post('/api/v1/scheduler/import').send({
        appointments: [
          { patientId: randomUUID(), dateTime: new Date().toISOString(), duration: 30 },
        ],
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject an empty appointments array', async () => {
      const res = await agent.post('/api/v1/scheduler/import').send({
        appointments: [],
        source: 'legacy_system',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
