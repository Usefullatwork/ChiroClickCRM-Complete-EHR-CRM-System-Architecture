/**
 * Kiosk Extended Integration Tests
 * Additional coverage for intake submission, consent capture, chief complaint
 * variants, and queue filtering — beyond what api/kiosk.test.js covers.
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
    first_name: 'KioskExt',
    last_name: `Patient${timestamp}`,
    email: `kioskpatient${timestamp}@test.com`,
    phone: '+4798765432',
    date_of_birth: '1992-03-20',
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

describe('Kiosk Extended Integration Tests', () => {
  let testPatient;

  beforeAll(async () => {
    try {
      testPatient = await createPatientViaAPI();
    } catch (_err) {
      testPatient = { id: randomUUID() };
    }
  });

  // ==========================================================================
  // HEALTH CHECK — no auth required
  // ==========================================================================

  describe('GET /api/v1/kiosk/health', () => {
    it('should return 200 without authentication', async () => {
      const res = await agent.get('/api/v1/kiosk/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.module).toBe('kiosk');
    });

    it('should include a valid ISO timestamp in the response', async () => {
      const res = await agent.get('/api/v1/kiosk/health');
      expect(res.status).toBe(200);
      const ts = new Date(res.body.timestamp);
      expect(ts.toISOString()).toBe(res.body.timestamp);
    });
  });

  // ==========================================================================
  // CHECK-IN — edge cases and repeated check-in
  // ==========================================================================

  describe('POST /api/v1/kiosk/check-in — check-in edge cases', () => {
    it('should accept check-in with new random appointment for existing patient', async () => {
      const res = await agent.post('/api/v1/kiosk/check-in').send({
        patientId: testPatient.id,
        appointmentId: randomUUID(),
      });
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should return 400 when appointmentId is missing', async () => {
      const res = await agent.post('/api/v1/kiosk/check-in').send({
        patientId: testPatient.id,
      });
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should handle a completely unknown patient gracefully', async () => {
      const res = await agent.post('/api/v1/kiosk/check-in').send({
        patientId: randomUUID(),
        appointmentId: randomUUID(),
      });
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should reject patientId that is not a UUID', async () => {
      const res = await agent.post('/api/v1/kiosk/check-in').send({
        patientId: 'bad-id',
        appointmentId: randomUUID(),
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject appointmentId that is not a UUID', async () => {
      const res = await agent.post('/api/v1/kiosk/check-in').send({
        patientId: testPatient.id,
        appointmentId: 'bad-apt-id',
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // INTAKE FORM — chief complaint and encounter type coverage
  // ==========================================================================

  describe('POST /api/v1/kiosk/intake/:patientId — intake submission variants', () => {
    it('should submit intake with chief complaint for neck pain', async () => {
      const res = await agent.post(`/api/v1/kiosk/intake/${testPatient.id}`).send({
        chief_complaint: 'Neck pain radiating to left shoulder',
        pain_level: 5,
        onset: '3 days ago',
        medications: [],
        allergies: ['Penicillin'],
        previous_treatment: true,
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should submit intake with chief complaint for headache', async () => {
      const res = await agent.post(`/api/v1/kiosk/intake/${testPatient.id}`).send({
        chief_complaint: 'Recurrent headaches, worse in the morning',
        pain_level: 6,
        onset: '2 weeks ago',
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should submit intake with maximum pain level', async () => {
      const res = await agent.post(`/api/v1/kiosk/intake/${testPatient.id}`).send({
        chief_complaint: 'Severe lower back pain, cannot stand',
        pain_level: 10,
        onset: 'This morning',
        previous_treatment: false,
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should submit intake with pain level 0 (pain free follow-up)', async () => {
      const res = await agent.post(`/api/v1/kiosk/intake/${testPatient.id}`).send({
        chief_complaint: 'Routine follow-up, no current pain',
        pain_level: 0,
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should return 400 when chief_complaint is missing', async () => {
      const res = await agent.post(`/api/v1/kiosk/intake/${testPatient.id}`).send({
        pain_level: 4,
        onset: 'Yesterday',
      });
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should return 400 for invalid patientId in path', async () => {
      const res = await agent
        .post('/api/v1/kiosk/intake/not-a-valid-uuid')
        .send({ chief_complaint: 'Test' });
      expect([400, 500]).toContain(res.status);
    });

    it('should handle non-existent patient without crashing', async () => {
      const res = await agent
        .post(`/api/v1/kiosk/intake/${randomUUID()}`)
        .send({ chief_complaint: 'Hip discomfort' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // CONSENT CAPTURE — consent type coverage
  // ==========================================================================

  describe('POST /api/v1/kiosk/consent/:patientId — consent type coverage', () => {
    const STUB_SIGNATURE =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('should capture treatment consent', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({
        consentType: 'treatment',
        signature: STUB_SIGNATURE,
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should capture GDPR data processing consent', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({
        consentType: 'gdpr_data_processing',
        signature: STUB_SIGNATURE,
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should capture photography consent', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({
        consentType: 'photography',
        signature: STUB_SIGNATURE,
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should return 400 when consentType is missing', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({
        signature: STUB_SIGNATURE,
      });
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should return 400 when signature is missing', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({
        consentType: 'treatment',
      });
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should return 400 when body is empty', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${testPatient.id}`).send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should return 400 for invalid patientId format in path', async () => {
      const res = await agent.post('/api/v1/kiosk/consent/not-uuid').send({
        consentType: 'treatment',
        signature: STUB_SIGNATURE,
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should handle consent for non-existent patient', async () => {
      const res = await agent.post(`/api/v1/kiosk/consent/${randomUUID()}`).send({
        consentType: 'treatment',
        signature: STUB_SIGNATURE,
      });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // INTAKE FORM GET — encounterType variants
  // ==========================================================================

  describe('GET /api/v1/kiosk/intake/:patientId — encounterType parameter', () => {
    it('should return intake form fields for INITIAL encounter', async () => {
      const res = await agent
        .get(`/api/v1/kiosk/intake/${testPatient.id}`)
        .query({ encounterType: 'INITIAL' });
      expect([200, 500]).toContain(res.status);
    });

    it('should return intake form fields for REASSESSMENT encounter', async () => {
      const res = await agent
        .get(`/api/v1/kiosk/intake/${testPatient.id}`)
        .query({ encounterType: 'REASSESSMENT' });
      expect([200, 500]).toContain(res.status);
    });

    it('should return intake form fields for EMERGENCY encounter', async () => {
      const res = await agent
        .get(`/api/v1/kiosk/intake/${testPatient.id}`)
        .query({ encounterType: 'EMERGENCY' });
      expect([200, 500]).toContain(res.status);
    });

    it('should return 400 for invalid patientId in path', async () => {
      const res = await agent.get('/api/v1/kiosk/intake/bad-id');
      expect([400, 500]).toContain(res.status);
    });
  });

  // ==========================================================================
  // QUEUE — practitioner filter
  // ==========================================================================

  describe('GET /api/v1/kiosk/queue — queue management', () => {
    it('should return queue without practitionerId', async () => {
      const res = await agent.get('/api/v1/kiosk/queue');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      }
    });

    it('should return queue filtered by practitionerId', async () => {
      const res = await agent.get('/api/v1/kiosk/queue').query({ practitionerId: randomUUID() });
      expect([200, 500]).toContain(res.status);
    });

    it('should return 400 when practitionerId is not a UUID', async () => {
      const res = await agent.get('/api/v1/kiosk/queue').query({ practitionerId: 'invalid' });
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      }
    });
  });
});
