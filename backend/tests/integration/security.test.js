/**
 * Integration Tests for Security Middleware
 * Tests CSRF protection, 2FA enforcement, rate limiting, etc.
 */

import request from 'supertest';
import express from 'express';
import session from 'express-session';
import {
  csrfProtection,
  sendCsrfToken,
  enforce2FA,
  requireRole,
  strictRateLimit,
  moderateRateLimit,
  sanitizeInput,
  validateOrganization
} from '../../src/middleware/security.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

// Mock cache (in-memory in desktop mode, Redis in SaaS mode)
jest.mock('../../src/config/redis.js', () => ({
  rateLimit: {
    check: jest.fn().mockResolvedValue({
      allowed: true,
      limit: 5,
      current: 1,
      resetIn: 900
    })
  }
}));

describe('Security Middleware Integration Tests', () => {

  describe('CSRF Protection', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret-key-32-characters-min',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false } // Test mode
      }));

      // Skip CSRF for GET to /csrf-token
      app.get('/csrf-token', sendCsrfToken, (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
      });

      app.use(csrfProtection);
      app.use(sendCsrfToken);

      app.post('/protected', (req, res) => {
        res.json({ success: true });
      });

      app.use(errorHandler);
    });

    test('should reject POST without CSRF token', async () => {
      const response = await request(app)
        .post('/protected')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF');
    });

    test('should accept POST with valid CSRF token', async () => {
      // First, get CSRF token
      const tokenResponse = await request(app)
        .get('/csrf-token');

      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Then, use it in POST
      const response = await request(app)
        .post('/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject POST with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/protected')
        .set('X-CSRF-Token', 'invalid-token')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
    });
  });

  describe('2FA Enforcement', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Mock authentication middleware
      app.use((req, res, next) => {
        req.user = req.headers['x-test-user'] ? JSON.parse(req.headers['x-test-user']) : null;
        req.session = {};
        next();
      });

      app.use('/admin', enforce2FA, (req, res) => {
        res.json({ success: true });
      });

      app.use(errorHandler);
    });

    test('should allow access for non-admin users without 2FA', async () => {
      const user = {
        id: 'user-123',
        role: 'PRACTITIONER',
        twoFactorEnabled: false
      };

      const response = await request(app)
        .get('/admin/settings')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block admin users without 2FA enabled', async () => {
      const user = {
        id: 'admin-123',
        role: 'ADMIN',
        twoFactorEnabled: false
      };

      const response = await request(app)
        .get('/admin/settings')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('2FA Required');
      expect(response.body.action).toBe('ENABLE_2FA');
      expect(response.body.setupUrl).toBe('/settings/security/2fa');
    });

    test('should block admin users with 2FA but not verified in session', async () => {
      const user = {
        id: 'admin-123',
        role: 'ADMIN',
        twoFactorEnabled: true
      };

      const response = await request(app)
        .get('/admin/settings')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('2FA Verification Required');
      expect(response.body.action).toBe('VERIFY_2FA');
    });

    test('should allow admin users with 2FA and valid session', async () => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = JSON.parse(req.headers['x-test-user']);
        req.session = {
          mfaVerified: true,
          mfaVerifiedAt: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
        };
        next();
      });

      app.use('/admin', enforce2FA, (req, res) => {
        res.json({ success: true });
      });

      const user = {
        id: 'admin-123',
        role: 'ADMIN',
        twoFactorEnabled: true
      };

      const response = await request(app)
        .get('/admin/settings')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block admin with expired 2FA session (>12 hours)', async () => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = JSON.parse(req.headers['x-test-user']);
        req.session = {
          mfaVerified: true,
          mfaVerifiedAt: Date.now() - (13 * 60 * 60 * 1000) // 13 hours ago
        };
        next();
      });

      app.use('/admin', enforce2FA, (req, res) => {
        res.json({ success: true });
      });

      app.use(errorHandler);

      const user = {
        id: 'admin-123',
        role: 'SUPER_ADMIN',
        twoFactorEnabled: true
      };

      const response = await request(app)
        .get('/admin/settings')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('2FA Session Expired');
    });
  });

  describe('Role-Based Access Control', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = req.headers['x-test-user'] ? JSON.parse(req.headers['x-test-user']) : null;
        next();
      });

      app.get('/admin-only',
        requireRole(['ADMIN', 'SUPER_ADMIN']),
        (req, res) => res.json({ success: true })
      );

      app.get('/practitioner-only',
        requireRole(['PRACTITIONER']),
        (req, res) => res.json({ success: true })
      );

      app.use(errorHandler);
    });

    test('should allow admin to access admin-only endpoint', async () => {
      const user = { id: '1', role: 'ADMIN' };

      const response = await request(app)
        .get('/admin-only')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block practitioner from admin-only endpoint', async () => {
      const user = { id: '1', role: 'PRACTITIONER' };

      const response = await request(app)
        .get('/admin-only')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('ADMIN');
      expect(response.body.message).toContain('SUPER_ADMIN');
    });

    test('should block unauthenticated user', async () => {
      const response = await request(app)
        .get('/admin-only');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    let app;
    const mockRateLimit = require('../../src/config/redis.js').rateLimit;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = { id: 'user-123' };
        req.ip = '127.0.0.1';
        next();
      });

      app.post('/strict', strictRateLimit, (req, res) => {
        res.json({ success: true });
      });

      app.get('/moderate', moderateRateLimit, (req, res) => {
        res.json({ success: true });
      });

      app.use(errorHandler);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should allow request when under strict rate limit', async () => {
      mockRateLimit.check.mockResolvedValueOnce({
        allowed: true,
        limit: 5,
        current: 1,
        resetIn: 900
      });

      const response = await request(app)
        .post('/strict')
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBe('4');
    });

    test('should block request when strict rate limit exceeded', async () => {
      mockRateLimit.check.mockResolvedValueOnce({
        allowed: false,
        limit: 5,
        current: 6,
        resetIn: 300
      });

      const response = await request(app)
        .post('/strict')
        .send({ data: 'test' });

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Rate Limit Exceeded');
      expect(response.body.retryAfter).toBe(300);
    });

    test('should use user ID for rate limit key', async () => {
      mockRateLimit.check.mockResolvedValueOnce({
        allowed: true,
        limit: 5,
        current: 1,
        resetIn: 900
      });

      await request(app)
        .post('/strict')
        .send({ data: 'test' });

      expect(mockRateLimit.check).toHaveBeenCalledWith(
        'user-123',
        expect.stringContaining('strict:/strict'),
        5,
        900
      );
    });

    test('should use IP if user not authenticated', async () => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.ip = '192.168.1.100';
        next();
      });

      app.post('/strict', strictRateLimit, (req, res) => {
        res.json({ success: true });
      });

      mockRateLimit.check.mockResolvedValueOnce({
        allowed: true,
        limit: 5,
        current: 1,
        resetIn: 900
      });

      await request(app)
        .post('/strict')
        .send({ data: 'test' });

      expect(mockRateLimit.check).toHaveBeenCalledWith(
        '192.168.1.100',
        expect.any(String),
        5,
        900
      );
    });
  });

  describe('Input Sanitization', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(sanitizeInput);

      app.post('/test', (req, res) => {
        res.json({
          query: req.query,
          body: req.body
        });
      });
    });

    test('should remove script tags from query params', async () => {
      const response = await request(app)
        .post('/test?search=<script>alert("xss")</script>test')
        .send({});

      expect(response.body.query.search).not.toContain('<script>');
      expect(response.body.query.search).toBe('test');
    });

    test('should remove script tags from body', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: '<script>alert("xss")</script>John'
        });

      expect(response.body.body.name).not.toContain('<script>');
      expect(response.body.body.name).toBe('John');
    });

    test('should remove iframe tags', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          comment: '<iframe src="evil.com"></iframe>Safe content'
        });

      expect(response.body.body.comment).not.toContain('<iframe>');
      expect(response.body.body.comment).toBe('Safe content');
    });

    test('should remove javascript: protocol', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          link: 'javascript:alert("xss")'
        });

      expect(response.body.body.link).not.toContain('javascript:');
    });

    test('should remove inline event handlers', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          html: '<div onclick="alert(\'xss\')">Click me</div>'
        });

      expect(response.body.body.html).not.toContain('onclick=');
      expect(response.body.body.html).toContain('Click me');
    });

    test('should preserve clinical content fields', async () => {
      const clinicalNote = '<p>Patient has <b>severe</b> pain</p>';

      const response = await request(app)
        .post('/test')
        .send({
          subjective: clinicalNote,
          objective: clinicalNote,
          assessment: clinicalNote,
          plan: clinicalNote,
          notes: clinicalNote
        });

      // Clinical fields should preserve HTML
      expect(response.body.body.subjective).toBe(clinicalNote);
      expect(response.body.body.objective).toBe(clinicalNote);
      expect(response.body.body.assessment).toBe(clinicalNote);
      expect(response.body.body.plan).toBe(clinicalNote);
      expect(response.body.body.notes).toBe(clinicalNote);
    });

    test('should handle Norwegian characters', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Åse Øvrebø Ærlighet'
        });

      expect(response.body.body.name).toBe('Åse Øvrebø Ærlighet');
    });
  });

  describe('Organization Isolation (Multi-tenant)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      app.use((req, res, next) => {
        req.user = req.headers['x-test-user'] ? JSON.parse(req.headers['x-test-user']) : null;
        req.params = req.headers['x-test-params'] ? JSON.parse(req.headers['x-test-params']) : {};
        next();
      });

      app.get('/org/:organizationId/patients',
        validateOrganization,
        (req, res) => res.json({ success: true })
      );

      app.use(errorHandler);
    });

    test('should allow access to own organization', async () => {
      const user = {
        id: 'user-123',
        role: 'PRACTITIONER',
        organizationId: 'org-abc'
      };

      const response = await request(app)
        .get('/org/org-abc/patients')
        .set('X-Test-User', JSON.stringify(user))
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-abc' }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block access to different organization', async () => {
      const user = {
        id: 'user-123',
        role: 'PRACTITIONER',
        organizationId: 'org-abc'
      };

      const response = await request(app)
        .get('/org/org-xyz/patients')
        .set('X-Test-User', JSON.stringify(user))
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-xyz' }));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('do not have access to this organization');
    });

    test('should allow super admin to access any organization', async () => {
      const user = {
        id: 'admin-123',
        role: 'SUPER_ADMIN',
        organizationId: 'org-abc'
      };

      const response = await request(app)
        .get('/org/org-xyz/patients')
        .set('X-Test-User', JSON.stringify(user))
        .set('X-Test-Params', JSON.stringify({ organizationId: 'org-xyz' }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 400 if no organization ID provided', async () => {
      const user = {
        id: 'user-123',
        role: 'PRACTITIONER',
        organizationId: 'org-abc'
      };

      const response = await request(app)
        .get('/org//patients')
        .set('X-Test-User', JSON.stringify(user));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Organization ID required');
    });
  });
});
