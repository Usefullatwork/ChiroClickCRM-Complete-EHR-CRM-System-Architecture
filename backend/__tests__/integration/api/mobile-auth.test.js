/**
 * Mobile Auth Route Integration Tests
 * Tests that all six mobile auth endpoints respond correctly to valid and
 * invalid inputs. These are public endpoints (no Bearer token required).
 *
 * Endpoints under test:
 *   POST /api/v1/mobile/auth/send-otp
 *   POST /api/v1/mobile/auth/verify-otp
 *   POST /api/v1/mobile/auth/google
 *   POST /api/v1/mobile/auth/apple
 *   POST /api/v1/mobile/auth/refresh
 *   POST /api/v1/mobile/auth/logout
 */

import request from 'supertest';
import app from '../../../src/server.js';

const BASE = '/api/v1/mobile';

describe('Mobile Auth Routes', () => {
  const agent = request(app);

  // ===========================================================================
  // POST /mobile/auth/send-otp
  // ===========================================================================

  describe('POST /mobile/auth/send-otp', () => {
    it('should return 400 when phoneNumber is missing', async () => {
      const res = await agent.post(`${BASE}/auth/send-otp`).send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when body is empty', async () => {
      const res = await agent
        .post(`${BASE}/auth/send-otp`)
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(400);
    });

    it('should attempt OTP delivery and return 200 or 400 with valid phone', async () => {
      // With no real SMS provider configured, the service will either succeed
      // (mock mode) or return a 400 with an error message. Both are acceptable.
      const res = await agent.post(`${BASE}/auth/send-otp`).send({ phoneNumber: '+4791234567' });
      expect([200, 400]).toContain(res.status);
    });
  });

  // ===========================================================================
  // POST /mobile/auth/verify-otp
  // ===========================================================================

  describe('POST /mobile/auth/verify-otp', () => {
    it('should return 400 when phoneNumber is missing', async () => {
      const res = await agent.post(`${BASE}/auth/verify-otp`).send({ code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when code is missing', async () => {
      const res = await agent.post(`${BASE}/auth/verify-otp`).send({ phoneNumber: '+4791234567' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when both fields are missing', async () => {
      const res = await agent.post(`${BASE}/auth/verify-otp`).send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for an invalid or expired OTP code', async () => {
      // A code of all-zeros against a non-existent OTP session should fail
      const res = await agent
        .post(`${BASE}/auth/verify-otp`)
        .send({ phoneNumber: '+4791234567', code: '000000' });
      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // POST /mobile/auth/google
  // ===========================================================================

  describe('POST /mobile/auth/google', () => {
    it('should return 400 when idToken is missing', async () => {
      const res = await agent.post(`${BASE}/auth/google`).send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 for an invalid Google idToken', async () => {
      const res = await agent
        .post(`${BASE}/auth/google`)
        .send({ idToken: 'not-a-real-google-token' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ===========================================================================
  // POST /mobile/auth/apple
  // ===========================================================================

  describe('POST /mobile/auth/apple', () => {
    it('should return 400 when identityToken is missing', async () => {
      const res = await agent.post(`${BASE}/auth/apple`).send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 for an invalid Apple identityToken', async () => {
      const res = await agent
        .post(`${BASE}/auth/apple`)
        .send({ identityToken: 'not-a-real-apple-token' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ===========================================================================
  // POST /mobile/auth/refresh
  // ===========================================================================

  describe('POST /mobile/auth/refresh', () => {
    it('should return 400 when refreshToken is missing', async () => {
      const res = await agent.post(`${BASE}/auth/refresh`).send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 for an invalid or revoked refresh token', async () => {
      const res = await agent
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: 'invalid.refresh.token' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ===========================================================================
  // POST /mobile/auth/logout
  // ===========================================================================

  describe('POST /mobile/auth/logout', () => {
    it('should always return 200 with success:true — no token provided', async () => {
      const res = await agent.post(`${BASE}/auth/logout`).send({});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 200 with success:true — invalid token provided', async () => {
      // Even if revokeToken fails, logout always returns success
      const res = await agent
        .post(`${BASE}/auth/logout`)
        .send({ refreshToken: 'a-token-that-may-not-exist' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 200 with success:true — no body sent', async () => {
      const res = await agent.post(`${BASE}/auth/logout`).set('Content-Type', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
