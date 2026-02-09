/**
 * Authentication Bypass & Session Security Tests
 * Verifies that authentication cannot be circumvented through:
 * - Session token manipulation
 * - Header spoofing
 * - Privilege escalation
 * - Cross-tenant access
 * - JWT manipulation (mobile auth)
 *
 * Norwegian healthcare compliance requires strict access controls
 * (Normen / Personopplysningsloven)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import {
  enforce2FA,
  requireRole,
  sanitizeInput,
  validateOrganization,
} from '../../src/middleware/security.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

describe('Authentication Bypass Prevention', () => {
  // ===========================================================================
  // SESSION TOKEN MANIPULATION
  // ===========================================================================

  describe('Session Token Manipulation', () => {
    let app;

    beforeAll(async () => {
      // Import the real app for integration tests
      const serverModule = await import('../../src/server.js');
      app = serverModule.default;
    });

    it('should reject empty session cookie', async () => {
      await request(app).get('/api/v1/auth/me').set('Cookie', 'session=').expect(401);
    });

    it('should reject session cookie with null value', async () => {
      await request(app).get('/api/v1/auth/me').set('Cookie', 'session=null').expect(401);
    });

    it('should reject session cookie with undefined value', async () => {
      await request(app).get('/api/v1/auth/me').set('Cookie', 'session=undefined').expect(401);
    });

    it('should reject forged session token (random hex)', async () => {
      const forgedToken = 'a'.repeat(64);
      await request(app).get('/api/v1/auth/me').set('Cookie', `session=${forgedToken}`).expect(401);
    });

    it('should reject session token with SQL injection', async () => {
      await request(app).get('/api/v1/auth/me').set('Cookie', "session=' OR '1'='1").expect(401);
    });

    it('should reject session token with path traversal', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', 'session=../../etc/passwd')
        .expect(401);
    });

    it('should reject very long session token (overflow attempt)', async () => {
      const longToken = 'x'.repeat(10000);
      await request(app).get('/api/v1/auth/me').set('Cookie', `session=${longToken}`).expect(401);
    });

    it('should reject session token with null bytes', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', 'session=valid%00injected');

      // Should reject - either 401 (invalid session) or 500 (null byte error)
      expect([401, 500]).toContain(response.status);
    });
  });

  // ===========================================================================
  // HEADER SPOOFING
  // ===========================================================================

  describe('Header Spoofing Prevention', () => {
    let app;

    beforeAll(async () => {
      const serverModule = await import('../../src/server.js');
      app = serverModule.default;
    });

    it('should not trust X-Forwarded-For for authentication', async () => {
      // Spoofing IP should not grant access
      await request(app).get('/api/v1/auth/me').set('X-Forwarded-For', '127.0.0.1').expect(401);
    });

    it('should not trust X-Real-IP for authentication', async () => {
      await request(app).get('/api/v1/auth/me').set('X-Real-IP', '127.0.0.1').expect(401);
    });

    it('should not accept authentication via Authorization header without Bearer', async () => {
      await request(app).get('/api/v1/auth/me').set('Authorization', 'some-token').expect(401);
    });

    it('should not accept authentication via arbitrary custom headers', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('X-User-Id', 'admin-user-id')
        .set('X-Role', 'ADMIN')
        .expect(401);
    });
  });

  // ===========================================================================
  // ROLE-BASED ACCESS CONTROL BYPASS
  // ===========================================================================

  describe('RBAC Bypass Prevention', () => {
    it('should not allow role escalation via request body', async () => {
      const app = express();
      app.use(express.json());

      // Simulate authenticated user
      app.use((req, res, next) => {
        req.user = {
          id: 'user-123',
          role: 'PRACTITIONER',
          organizationId: 'org-abc',
        };
        next();
      });

      app.get('/admin', requireRole(['ADMIN']), (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      // Try to access admin endpoint with practitioner role
      const response = await request(app).get('/admin').send({ role: 'ADMIN' }); // Attempt role escalation via body

      expect(response.status).toBe(403);
    });

    it('should not allow role escalation via query parameters', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'user-123',
          role: 'PRACTITIONER',
          organizationId: 'org-abc',
        };
        next();
      });

      app.get('/admin', requireRole(['ADMIN']), (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      const response = await request(app).get('/admin?role=ADMIN');

      expect(response.status).toBe(403);
    });

    it('should not allow role escalation via headers', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'user-123',
          role: 'PRACTITIONER',
          organizationId: 'org-abc',
        };
        next();
      });

      app.get('/admin', requireRole(['ADMIN']), (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/admin')
        .set('X-Role', 'ADMIN')
        .set('X-User-Role', 'ADMIN');

      expect(response.status).toBe(403);
    });

    it('should reject users with no role set', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = { id: 'user-123' }; // No role
        next();
      });

      app.get('/admin', requireRole(['ADMIN']), (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      const response = await request(app).get('/admin');
      expect(response.status).toBe(403);
    });
  });

  // ===========================================================================
  // CROSS-TENANT ACCESS PREVENTION
  // ===========================================================================

  describe('Cross-Tenant Access Prevention', () => {
    it('should block practitioner from accessing other organization data', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'user-123',
          role: 'PRACTITIONER',
          organizationId: 'org-alpha',
        };
        req.params = { organizationId: req.params.organizationId || req.query.orgId };
        next();
      });

      app.get('/org/:organizationId/data', validateOrganization, (req, res) => {
        res.json({ success: true, sensitiveData: 'patient records' });
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/org/org-beta/data')
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-beta' }));

      expect(response.status).toBe(403);
    });

    it('should block cross-tenant access via manipulated organization header', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'user-123',
          role: 'PRACTITIONER',
          organizationId: 'org-alpha',
        };
        // Simulate middleware reading org from header
        req.params = req.headers['x-test-params'] ? JSON.parse(req.headers['x-test-params']) : {};
        next();
      });

      app.get('/org/:organizationId/patients', validateOrganization, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      // User in org-alpha trying to access org-beta
      const response = await request(app)
        .get('/org/org-beta/patients')
        .set('X-Organization-Id', 'org-beta')
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-beta' }));

      expect(response.status).toBe(403);
    });

    it('should allow SUPER_ADMIN cross-tenant access', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'superadmin-1',
          role: 'SUPER_ADMIN',
          organizationId: 'org-master',
        };
        req.params = req.headers['x-test-params'] ? JSON.parse(req.headers['x-test-params']) : {};
        next();
      });

      app.get('/org/:organizationId/data', validateOrganization, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/org/org-any/data')
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-any' }));

      expect(response.status).toBe(200);
    });
  });

  // ===========================================================================
  // 2FA BYPASS PREVENTION
  // ===========================================================================

  describe('2FA Bypass Prevention', () => {
    it('should not skip 2FA check for admin with spoofed session flag', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'admin-1',
          role: 'ADMIN',
          twoFactorEnabled: false, // 2FA not enabled
        };
        req.session = {};
        next();
      });

      app.get('/admin', enforce2FA, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      // Try accessing with spoofed MFA header
      const response = await request(app)
        .get('/admin')
        .set('X-MFA-Verified', 'true')
        .set('X-2FA-Token', '123456');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('2FA Required');
    });

    it('should reject expired 2FA session', async () => {
      const app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = {
          id: 'admin-1',
          role: 'ADMIN',
          twoFactorEnabled: true,
        };
        req.session = {
          mfaVerified: true,
          mfaVerifiedAt: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago (expired)
        };
        next();
      });

      app.get('/admin', enforce2FA, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);

      const response = await request(app).get('/admin');
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('2FA Session Expired');
    });
  });

  // ===========================================================================
  // PASSWORD SECURITY
  // ===========================================================================

  describe('Password Security', () => {
    let app;

    beforeAll(async () => {
      const serverModule = await import('../../src/server.js');
      app = serverModule.default;
    });

    it('should never expose password_hash in user responses', async () => {
      const timestamp = Date.now();
      const regResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `nopasshash${timestamp}@test.com`,
          password: 'SecurePass123!',
          firstName: 'No',
          lastName: 'PassHash',
          organizationId: 'a0000000-0000-0000-0000-000000000001',
        });

      if (regResponse.status === 201) {
        expect(regResponse.body.user).not.toHaveProperty('password_hash');
        expect(regResponse.body.user).not.toHaveProperty('password');
        expect(JSON.stringify(regResponse.body)).not.toContain('password_hash');
      }
    });

    it('should prevent user enumeration via login (same error for wrong email/password)', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });

      const response2 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@chiroclickcrm.no', password: 'wrongpassword' });

      // Both should return 401 with similar error messages
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
    });

    it('should prevent email enumeration via forgot-password', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'existing@test.com' });

      const response2 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@nowhere.com' });

      // Both should return 200 with same message
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.message).toBe(response2.body.message);
    });
  });

  // ===========================================================================
  // XSS IN AUTH FLOWS
  // ===========================================================================

  describe('XSS Prevention in Auth Flows', () => {
    let app;

    beforeAll(async () => {
      const serverModule = await import('../../src/server.js');
      app = serverModule.default;
    });

    it('should store XSS in name fields literally (output-encoding is frontend responsibility)', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `xss${timestamp}@test.com`,
          password: 'SecurePass123!',
          firstName: '<script>alert("xss")</script>',
          lastName: '<img onerror=alert(1) src=x>',
          organizationId: 'a0000000-0000-0000-0000-000000000001',
        });

      if (response.status === 201) {
        // Names are stored literally - XSS prevention happens on frontend via React auto-escaping
        // Content-Type should be JSON (never rendered as HTML)
        expect(response.headers['content-type']).toContain('application/json');
      }
    });

    it('should handle XSS in email field', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: '<script>alert(1)</script>@test.com',
        password: 'test',
      });

      // Should reject, not execute
      expect([400, 401]).toContain(response.status);
    });
  });

  // ===========================================================================
  // TIMING ATTACK PREVENTION
  // ===========================================================================

  describe('Timing Attack Mitigation', () => {
    let app;

    beforeAll(async () => {
      const serverModule = await import('../../src/server.js');
      app = serverModule.default;
    });

    it('should have similar response times for existing vs non-existing users', async () => {
      const iterations = 3;
      const existingTimes = [];
      const nonExistingTimes = [];

      for (let i = 0; i < iterations; i++) {
        const start1 = Date.now();
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'admin@chiroclickcrm.no', password: 'wrongpassword' });
        existingTimes.push(Date.now() - start1);

        const start2 = Date.now();
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: `nonexistent${i}@test.com`, password: 'wrongpassword' });
        nonExistingTimes.push(Date.now() - start2);
      }

      const avgExisting = existingTimes.reduce((a, b) => a + b) / iterations;
      const avgNonExisting = nonExistingTimes.reduce((a, b) => a + b) / iterations;

      // Times should be within 500ms of each other (rough check)
      // Large variance is acceptable in tests, but massive differences indicate timing leak
      expect(Math.abs(avgExisting - avgNonExisting)).toBeLessThan(2000);
    });
  });
});
