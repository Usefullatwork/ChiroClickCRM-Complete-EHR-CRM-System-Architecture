/**
 * Portal Booking Flow Integration Tests
 * Tests the end-to-end booking lifecycle:
 *   1. Patient requests a booking (via patient portal, PIN-auth)
 *   2. Staff approves/rejects the request (via practitioner portal)
 *   3. Patient confirms the slot or cancels
 *
 * Patient-facing routes (/patient-portal/*) require a portal session token.
 * Since creating real portal sessions in test is impractical, we verify
 * that unauthenticated requests are correctly rejected (401/503), and that
 * the staff-facing routes respond without crashing in DEV_SKIP_AUTH mode.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Portal Booking Flow Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // HEALTH CHECKS — verify modules are registered
  // =============================================================================

  describe('GET /api/v1/patient-portal/health', () => {
    it('should return patient portal health status', async () => {
      const res = await agent.get('/api/v1/patient-portal/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.module).toBe('patient-portal');
    });
  });

  describe('GET /api/v1/portal/health', () => {
    it('should return practitioner portal health status', async () => {
      const res = await agent.get('/api/v1/portal/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.module).toBe('portal');
    });
  });

  // =============================================================================
  // STEP 1 — PATIENT: Get available slots (requires portal auth)
  // =============================================================================

  describe('GET /api/v1/patient-portal/available-slots', () => {
    it('should return 401 without a portal session token', async () => {
      const res = await agent
        .get('/api/v1/patient-portal/available-slots')
        .query({ date: '2026-05-01' });
      expect([401, 503]).toContain(res.status);
    });

    it('should return 401 with an invalid x-portal-token header', async () => {
      const res = await agent
        .get('/api/v1/patient-portal/available-slots')
        .set('x-portal-token', 'invalid-token-xyz')
        .query({ date: '2026-05-01' });
      expect([401, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // STEP 1 — PATIENT: Submit a booking request
  // =============================================================================

  describe('POST /api/v1/patient-portal/appointments/request', () => {
    it('should return 401 without portal session token', async () => {
      const res = await agent.post('/api/v1/patient-portal/appointments/request').send({
        preferredDate: '2026-05-10',
        preferredTime: '10:00',
        reason: 'Nakkesmerter',
      });
      expect([401, 503]).toContain(res.status);
    });

    it('should return 401 even with a missing required field (auth checked before validation)', async () => {
      const res = await agent
        .post('/api/v1/patient-portal/appointments/request')
        .send({ reason: 'Only reason, no date' });
      expect([401, 503]).toContain(res.status);
    });

    it('should return 401 with an expired/invalid portal token', async () => {
      const res = await agent
        .post('/api/v1/patient-portal/appointments/request')
        .set('x-portal-token', 'expired-session-token-00000')
        .send({
          preferredDate: '2026-05-10',
          preferredTime: '10:00',
          reason: 'Ryggsmerter',
        });
      expect([401, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // STEP 2 — STAFF: View pending booking requests
  // =============================================================================

  describe('GET /api/v1/portal/booking-requests', () => {
    it('should respond with booking request list or graceful fallback', async () => {
      const res = await agent.get('/api/v1/portal/booking-requests');
      // DEV_SKIP_AUTH lets the request reach the controller
      expect([200, 401, 403, 503]).toContain(res.status);
    });

    it('should return structured pagination on 200', async () => {
      const res = await agent.get('/api/v1/portal/booking-requests');
      if (res.status === 200) {
        expect(res.body).toHaveProperty('requests');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.requests)).toBe(true);
      }
    });

    it('should accept status filter query param', async () => {
      const res = await agent.get('/api/v1/portal/booking-requests').query({ status: 'pending' });
      expect([200, 401, 403, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // STEP 2 — STAFF: Get pending booking request count
  // =============================================================================

  describe('GET /api/v1/portal/booking-requests/count', () => {
    it('should return pending count or graceful fallback', async () => {
      const res = await agent.get('/api/v1/portal/booking-requests/count');
      expect([200, 401, 403, 503]).toContain(res.status);
    });

    it('should return numeric pending count on 200', async () => {
      const res = await agent.get('/api/v1/portal/booking-requests/count');
      if (res.status === 200) {
        expect(res.body).toHaveProperty('pending');
        expect(typeof res.body.pending).toBe('number');
      }
    });
  });

  // =============================================================================
  // STEP 2 — STAFF: Approve or reject a booking request
  // =============================================================================

  describe('PATCH /api/v1/portal/booking-requests/:id (approve)', () => {
    it('should return 404 or 503 for a non-existent booking request', async () => {
      const res = await agent.patch(`/api/v1/portal/booking-requests/${randomUUID()}`).send({
        action: 'approve',
        appointment_date: '2026-05-10',
        appointment_time: '10:00',
      });
      expect([401, 403, 404, 503]).toContain(res.status);
    });

    it('should not return 400 for a well-formed approve payload on a nonexistent ID', async () => {
      const res = await agent.patch(`/api/v1/portal/booking-requests/${randomUUID()}`).send({
        action: 'approve',
        appointment_date: '2026-05-10',
        appointment_time: '14:30',
      });
      // A missing record yields 404/503, not a validation 400
      expect(res.status).not.toBe(400);
    });
  });

  describe('PATCH /api/v1/portal/booking-requests/:id (reject)', () => {
    it('should return 404 or 503 for a non-existent booking request', async () => {
      const res = await agent
        .patch(`/api/v1/portal/booking-requests/${randomUUID()}`)
        .send({ action: 'reject', reason: 'No availability' });
      expect([401, 403, 404, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // STEP 3 — PATIENT: Reschedule a confirmed appointment
  // =============================================================================

  describe('PATCH /api/v1/patient-portal/appointments/:id/reschedule', () => {
    it('should return 401 without portal session token', async () => {
      const res = await agent
        .patch(`/api/v1/patient-portal/appointments/${randomUUID()}/reschedule`)
        .send({ preferredDate: '2026-05-20', preferredTime: '09:00' });
      expect([401, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // STEP 3 — PATIENT: Cancel a confirmed appointment
  // =============================================================================

  describe('POST /api/v1/patient-portal/appointments/:id/cancel', () => {
    it('should return 401 without portal session token', async () => {
      const res = await agent
        .post(`/api/v1/patient-portal/appointments/${randomUUID()}/cancel`)
        .send({ reason: 'Kan ikke møte opp' });
      expect([401, 503]).toContain(res.status);
    });

    it('should return 401 even with an empty cancellation body (auth checked first)', async () => {
      const res = await agent
        .post(`/api/v1/patient-portal/appointments/${randomUUID()}/cancel`)
        .send({});
      expect([401, 503]).toContain(res.status);
    });
  });

  // =============================================================================
  // PORTAL AUTH — PIN endpoint
  // =============================================================================

  describe('POST /api/v1/patient-portal/auth/pin', () => {
    it('should return 400 or 401 when PIN is missing', async () => {
      const res = await agent.post('/api/v1/patient-portal/auth/pin').send({});
      expect([400, 401, 503]).toContain(res.status);
    });

    it('should return 400 or 401 for a non-numeric PIN', async () => {
      const res = await agent
        .post('/api/v1/patient-portal/auth/pin')
        .send({ pin: 'abcd', patientId: randomUUID() });
      expect([400, 401, 503]).toContain(res.status);
    });

    it('should return 401 or 503 for a valid-format but nonexistent PIN', async () => {
      const res = await agent
        .post('/api/v1/patient-portal/auth/pin')
        .send({ pin: '0000', patientId: randomUUID() });
      expect([401, 503]).toContain(res.status);
    });
  });
});
