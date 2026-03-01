/**
 * Setup API Integration Tests
 * Tests for first-run setup wizard endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';

const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

describe('Setup API Integration Tests', () => {
  // Save original org settings so we can restore after tests
  let originalSettings;

  beforeAll(async () => {
    try {
      const result = await db.query('SELECT settings FROM organizations WHERE id = $1', [
        DESKTOP_ORG_ID,
      ]);
      originalSettings = result.rows[0]?.settings || {};
    } catch {
      originalSettings = {};
    }
  });

  afterAll(async () => {
    // Restore original settings
    try {
      await db.query(`UPDATE organizations SET settings = $1::jsonb WHERE id = $2`, [
        JSON.stringify(originalSettings),
        DESKTOP_ORG_ID,
      ]);
    } catch {
      // OK if cleanup fails
    }
    await db.closePool();
  });

  beforeEach(async () => {
    // Reset setup_complete to false before each test
    try {
      await db.query(
        `UPDATE organizations
         SET settings = COALESCE(settings, '{}'::jsonb) - 'setup_complete'
         WHERE id = $1`,
        [DESKTOP_ORG_ID]
      );
    } catch {
      // Table might not exist in test env
    }
  });

  // ===========================================================================
  // GET /setup-status
  // ===========================================================================

  describe('GET /api/v1/auth/setup-status', () => {
    it('should return needsSetup: true before setup', async () => {
      const response = await request(app).get('/api/v1/auth/setup-status').expect(200);

      expect(response.body).toHaveProperty('needsSetup');
      expect(response.body.needsSetup).toBe(true);
    });

    it('should return needsSetup: false after setup is complete', async () => {
      // Mark setup as complete
      await db.query(
        `UPDATE organizations
         SET settings = COALESCE(settings, '{}'::jsonb) || '{"setup_complete": "true"}'::jsonb
         WHERE id = $1`,
        [DESKTOP_ORG_ID]
      );

      const response = await request(app).get('/api/v1/auth/setup-status').expect(200);

      expect(response.body.needsSetup).toBe(false);
    });
  });

  // ===========================================================================
  // POST /setup
  // ===========================================================================

  describe('POST /api/v1/auth/setup', () => {
    it('should complete setup with valid data', async () => {
      const setupData = {
        clinicName: 'Test Klinikk',
        clinicAddress: 'Testveien 1',
        clinicPhone: '+47 12345678',
        orgNumber: '123456789',
        userName: 'Test Bruker',
        userEmail: `setup${Date.now()}@test.com`,
        userPassword: 'SecurePassword123!',
        installAI: true,
      };

      const response = await request(app).post('/api/v1/auth/setup').send(setupData).expect(200);

      expect(response.body.message).toBe('Setup completed successfully');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user.role).toBe('ADMIN');

      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session=');
    });

    it('should return 403 when setup is already complete', async () => {
      // Mark setup as complete first
      await db.query(
        `UPDATE organizations
         SET settings = COALESCE(settings, '{}'::jsonb) || '{"setup_complete": "true"}'::jsonb
         WHERE id = $1`,
        [DESKTOP_ORG_ID]
      );

      const response = await request(app)
        .post('/api/v1/auth/setup')
        .send({
          clinicName: 'Another Clinic',
          userName: 'Another User',
          userEmail: 'another@test.com',
          userPassword: 'SecurePassword123!',
        })
        .expect(403);

      expect(response.body.error).toBe('Setup Already Complete');
    });

    it('should return 400 with missing required fields', async () => {
      // Missing clinicName
      const response = await request(app)
        .post('/api/v1/auth/setup')
        .send({
          userName: 'Test User',
          userEmail: 'test@test.com',
          userPassword: 'SecurePassword123!',
        })
        .expect(400);

      expect(response.body.error).toBe('Setup Failed');
    });

    it('should return 400 with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/setup')
        .send({
          clinicName: 'Test Klinikk',
          userName: 'Test User',
          userEmail: 'test@test.com',
          userPassword: '123',
        })
        .expect(400);

      expect(response.body.message).toMatch(/password/i);
    });
  });

  // ===========================================================================
  // POST /skip-setup
  // ===========================================================================

  describe('POST /api/v1/auth/skip-setup', () => {
    it('should mark setup complete without changing data', async () => {
      const response = await request(app).post('/api/v1/auth/skip-setup').expect(200);

      expect(response.body.message).toBe('Setup skipped');

      // Verify setup is now marked complete
      const statusRes = await request(app).get('/api/v1/auth/setup-status').expect(200);

      expect(statusRes.body.needsSetup).toBe(false);
    });

    it('should return 403 when setup is already complete', async () => {
      // Mark setup as complete first
      await db.query(
        `UPDATE organizations
         SET settings = COALESCE(settings, '{}'::jsonb) || '{"setup_complete": "true"}'::jsonb
         WHERE id = $1`,
        [DESKTOP_ORG_ID]
      );

      const response = await request(app).post('/api/v1/auth/skip-setup').expect(403);

      expect(response.body.error).toBe('Setup Already Complete');
    });
  });
});
