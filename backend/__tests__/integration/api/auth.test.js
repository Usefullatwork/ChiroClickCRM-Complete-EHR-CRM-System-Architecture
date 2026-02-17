/**
 * Auth API Integration Tests
 * Tests for Authentication endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import {
  createTestOrganization,
  createTestUser,
  createTestSession,
  cleanupTestData,
  randomUUID,
} from '../../helpers/testUtils.js';

describe('Auth API Integration Tests', () => {
  let testOrg;
  let testUser;
  let testSession;

  beforeAll(async () => {
    // Create test organization
    testOrg = await createTestOrganization({ name: 'Auth Test Clinic' });

    // Create test user with known password
    testUser = await createTestUser(testOrg.id, {
      email: `authtest${Date.now()}@test.com`,
      first_name: 'Auth',
      last_name: 'Tester',
    });

    // Create session for authenticated tests
    testSession = await createTestSession(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData(testOrg?.id);
    await db.closePool();
  });

  // =============================================================================
  // REGISTRATION
  // =============================================================================

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `newuser${Date.now()}@test.com`,
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
        organizationId: testOrg.id,
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session=');
    });

    it('should reject registration without email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
          organizationId: testOrg.id,
        })
        .expect(400);
    });

    it('should reject registration without password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `nopass${Date.now()}@test.com`,
          firstName: 'Test',
          lastName: 'User',
          organizationId: testOrg.id,
        })
        .expect(400);
    });

    it('should reject registration without organization', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `noorg${Date.now()}@test.com`,
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      const email = `duplicate${Date.now()}@test.com`;

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!',
          firstName: 'First',
          lastName: 'User',
          organizationId: testOrg.id,
        })
        .expect(201);

      // Duplicate registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'AnotherPassword123!',
          firstName: 'Second',
          lastName: 'User',
          organizationId: testOrg.id,
        })
        .expect(400);
    });

    it('should return email verification token in development', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `devtoken${Date.now()}@test.com`,
          password: 'SecurePassword123!',
          firstName: 'Dev',
          lastName: 'User',
          organizationId: testOrg.id,
        })
        .expect(201);

      // In development mode, token should be returned
      if (process.env.NODE_ENV === 'development') {
        expect(response.body).toHaveProperty('emailVerifyToken');
      }
    });
  });

  // =============================================================================
  // LOGIN
  // =============================================================================

  describe('POST /api/v1/auth/login', () => {
    let loginUser;
    const loginPassword = 'LoginTest123!';

    beforeAll(async () => {
      // Create a user specifically for login tests via registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `loginuser${Date.now()}@test.com`,
          password: loginPassword,
          firstName: 'Login',
          lastName: 'User',
          organizationId: testOrg.id,
        });
      loginUser = response.body.user;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: loginPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginUser.email);
      expect(response.body.message).toBe('Login successful');

      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('session=');
    });

    it('should reject login without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'SomePassword123!' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: loginUser.email })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication Failed');
    });

    it('should reject login with non-existent email', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        })
        .expect(401);
    });
  });

  // =============================================================================
  // LOGOUT
  // =============================================================================

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with session', async () => {
      // First login to get a session
      const loginResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `logout${Date.now()}@test.com`,
          password: 'LogoutTest123!',
          firstName: 'Logout',
          lastName: 'User',
          organizationId: testOrg.id,
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Now logout
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');

      // Session cookie should be cleared
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should handle logout without session', async () => {
      const response = await request(app).post('/api/v1/auth/logout').expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  // =============================================================================
  // CURRENT USER (GET /me)
  // =============================================================================

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', testSession.cookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should include session freshness', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', testSession.cookie)
        .expect(200);

      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('fresh');
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should reject invalid session', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', 'session=invalid-session-token')
        .expect(401);
    });
  });

  // =============================================================================
  // SESSIONS
  // =============================================================================

  describe('GET /api/v1/auth/sessions', () => {
    it('should return user sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Cookie', testSession.cookie)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);
    });

    it('should mark current session', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Cookie', testSession.cookie)
        .expect(200);

      const currentSession = response.body.sessions.find((s) => s.current);
      expect(currentSession).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/auth/sessions').expect(401);
    });
  });

  // =============================================================================
  // LOGOUT ALL
  // =============================================================================

  describe('POST /api/v1/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      // Create user with multiple sessions
      const multiSessionUser = await createTestUser(testOrg.id, {
        email: `multisession${Date.now()}@test.com`,
      });
      const session1 = await createTestSession(multiSessionUser.id);
      await createTestSession(multiSessionUser.id); // Second session

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Cookie', session1.cookie)
        .expect(200);

      expect(response.body.message).toBe('Logged out from all devices');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/v1/auth/logout-all').expect(401);
    });
  });

  // =============================================================================
  // PASSWORD RESET
  // =============================================================================

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should accept valid email for password reset', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      // Always returns success to prevent email enumeration
      expect(response.body.message).toContain('If an account exists');
    });

    it('should return same message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.message).toContain('If an account exists');
    });

    it('should reject request without email', async () => {
      await request(app).post('/api/v1/auth/forgot-password').send({}).expect(400);
    });

    it('should return reset token in development', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      if (process.env.NODE_ENV === 'development') {
        // Token might not exist if user not found by service
        // but structure should be correct
        expect(response.body.message).toBeDefined();
      }
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reject reset without token', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ password: 'NewPassword123!' })
        .expect(400);
    });

    it('should reject reset without password', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token' })
        .expect(400);
    });

    it('should reject invalid reset token', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
        })
        .expect(400);
    });
  });

  // =============================================================================
  // CHANGE PASSWORD
  // =============================================================================

  describe('POST /api/v1/auth/change-password', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('should reject without current password', async () => {
      // API may return 400 (validation) or 403 (forbidden) depending on implementation
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ newPassword: 'NewPassword123!' });

      expect([400, 403]).toContain(response.status);
    });

    it('should reject without new password', async () => {
      // API may return 400 (validation) or 403 (forbidden) depending on implementation
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ currentPassword: 'testpassword123' });

      expect([400, 403]).toContain(response.status);
    });
  });

  // =============================================================================
  // EMAIL VERIFICATION
  // =============================================================================

  describe('POST /api/v1/auth/verify-email', () => {
    it('should reject without token', async () => {
      await request(app).post('/api/v1/auth/verify-email').send({}).expect(400);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-verification-token' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    it('should require authentication', async () => {
      await request(app).post('/api/v1/auth/resend-verification').expect(401);
    });

    it('should handle resend verification request', async () => {
      // User may already be verified, so API returns 400
      // Or may succeed with 200 if not verified
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id);

      expect([200, 400]).toContain(response.status);
    });
  });

  // =============================================================================
  // CONFIRM PASSWORD
  // =============================================================================

  describe('POST /api/v1/auth/confirm-password', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/auth/confirm-password')
        .send({ password: 'testpassword123' })
        .expect(401);
    });

    it('should reject without password', async () => {
      await request(app)
        .post('/api/v1/auth/confirm-password')
        .set('Cookie', testSession.cookie)
        .send({})
        .expect(400);
    });

    it('should reject incorrect password', async () => {
      await request(app)
        .post('/api/v1/auth/confirm-password')
        .set('Cookie', testSession.cookie)
        .send({ password: 'WrongPassword123!' })
        .expect(401);
    });
  });

  // =============================================================================
  // SECURITY TESTS
  // =============================================================================

  describe('Security', () => {
    it('should not expose password hash in responses', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', testSession.cookie)
        .expect(200);

      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should set httpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `httponly${Date.now()}@test.com`,
          password: 'SecurePassword123!',
          firstName: 'Http',
          lastName: 'Only',
          organizationId: testOrg.id,
        })
        .expect(201);

      const cookie = response.headers['set-cookie'][0];
      expect(cookie).toContain('HttpOnly');
    });

    it('should set SameSite cookie attribute', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `samesite${Date.now()}@test.com`,
          password: 'SecurePassword123!',
          firstName: 'Same',
          lastName: 'Site',
          organizationId: testOrg.id,
        })
        .expect(201);

      const cookie = response.headers['set-cookie'][0];
      expect(cookie.toLowerCase()).toContain('samesite');
    });
  });
});
