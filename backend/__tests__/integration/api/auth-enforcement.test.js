/**
 * Auth Enforcement Integration Tests [CRITICAL C4]
 *
 * Verifies that ALL patient-data routes reject unauthenticated and
 * cross-organization requests. This test suite temporarily disables
 * DESKTOP_MODE so that requireAuth behaves as it does in production.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import {
  createTestOrganization,
  createTestUser,
  createTestSession,
  cleanupTestData,
} from '../../helpers/testUtils.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = '/api/v1';

// IDs that will never exist in the database — used to generate cross-org
// attempts without needing real data behind each route.
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Auth Enforcement Integration Tests [C4]', () => {
  // Saved env values so we can restore them exactly after the suite.
  let savedDesktopMode;
  let savedNodeEnv;
  let savedDevBypassSecret;

  // Two separate organizations + sessions for cross-org tests.
  let orgA;
  let orgB;
  let userA;
  let userB;
  let sessionA; // belongs to orgA
  let sessionB; // belongs to orgB

  // ---------------------------------------------------------------------------
  // Setup / Teardown
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    // Persist current values so we can restore them in afterAll.
    savedDesktopMode = process.env.DESKTOP_MODE;
    savedNodeEnv = process.env.NODE_ENV;
    savedDevBypassSecret = process.env.DEV_BYPASS_SECRET;

    // Disable DESKTOP_MODE so requireAuth enforces sessions properly.
    // Also clear DEV_BYPASS_SECRET so the dev-header shortcut is unavailable.
    process.env.DESKTOP_MODE = 'false';
    process.env.NODE_ENV = 'test';
    delete process.env.DEV_BYPASS_SECRET;

    // Create two isolated organizations to prove cross-org isolation.
    orgA = await createTestOrganization({ name: 'Auth Test Org A' });
    orgB = await createTestOrganization({ name: 'Auth Test Org B' });

    userA = await createTestUser(orgA.id, { email: `userA${Date.now()}@test.com` });
    userB = await createTestUser(orgB.id, { email: `userB${Date.now()}@test.com` });

    sessionA = await createTestSession(userA.id);
    sessionB = await createTestSession(userB.id);
  });

  afterAll(async () => {
    // Restore env to exactly what it was before this suite ran.
    if (savedDesktopMode !== undefined) {
      process.env.DESKTOP_MODE = savedDesktopMode;
    } else {
      delete process.env.DESKTOP_MODE;
    }

    if (savedNodeEnv !== undefined) {
      process.env.NODE_ENV = savedNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (savedDevBypassSecret !== undefined) {
      process.env.DEV_BYPASS_SECRET = savedDevBypassSecret;
    }

    await cleanupTestData(orgA?.id);
    await cleanupTestData(orgB?.id);
  });

  // ---------------------------------------------------------------------------
  // Helper: assert 401 for an unauthenticated request
  // ---------------------------------------------------------------------------

  async function expectUnauthenticated(method, path, body = null) {
    let req = request(app)[method](path);
    if (body) {
      req = req.send(body).set('Content-Type', 'application/json');
    }
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    return res;
  }

  // ---------------------------------------------------------------------------
  // Helper: assert 403 for a cross-org request (authenticated as org A,
  // targeting org B's data via the X-Organization-Id header).
  // ---------------------------------------------------------------------------

  async function expectCrossOrgForbidden(method, path, body = null) {
    let req = request(app)
      [method](path)
      .set('Cookie', sessionA.cookie)
      .set('X-Organization-Id', orgB.id); // org mismatch → 403
    if (body) {
      req = req.send(body).set('Content-Type', 'application/json');
    }
    const res = await req;
    expect([403, 401]).toContain(res.status);
    return res;
  }

  // ===========================================================================
  // 1. GET /api/v1/patients — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/patients', () => {
    it('should return 401 without any credentials', async () => {
      const res = await expectUnauthenticated('get', `${API}/patients`);
      expect(res.status).toBe(401);
    });

    it('should return 401 with an invalid session cookie', async () => {
      const res = await request(app)
        .get(`${API}/patients`)
        .set('Cookie', 'session=totally-fake-session-id');
      expect(res.status).toBe(401);
    });

    it('should return 401 with a malformed Bearer token', async () => {
      const res = await request(app)
        .get(`${API}/patients`)
        .set('Authorization', 'Bearer not-a-real-api-key');
      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // 2. GET /api/v1/encounters — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/encounters', () => {
    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('get', `${API}/encounters`);
    });

    it('should return 401 with an invalid session cookie', async () => {
      const res = await request(app)
        .get(`${API}/encounters`)
        .set('Cookie', 'session=invalid-encounter-session');
      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // 3. GET /api/v1/appointments — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/appointments', () => {
    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('get', `${API}/appointments`);
    });

    it('should return 401 with an expired/garbage session cookie', async () => {
      const res = await request(app)
        .get(`${API}/appointments`)
        .set('Cookie', 'session=aaaa0000bbbb1111cccc2222dddd3333');
      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // 4. GET /api/v1/billing/invoices — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/billing/invoices', () => {
    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('get', `${API}/billing/invoices`);
    });

    it('should return 401 with an invalid Bearer token', async () => {
      const res = await request(app)
        .get(`${API}/billing/invoices`)
        .set('Authorization', 'Bearer cck_fakeprefixXXXXXXXXXXXXXXXXXXXX');
      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // 5. GET /api/v1/gdpr/requests — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/gdpr/requests', () => {
    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('get', `${API}/gdpr/requests`);
    });

    it('should not leak GDPR data in the 401 response body', async () => {
      const res = await request(app).get(`${API}/gdpr/requests`);
      expect(res.status).toBe(401);
      // Body must not contain patient or request identifiers
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/patient_id/);
    });
  });

  // ===========================================================================
  // 6. GET /api/v1/communications — unauthenticated
  // ===========================================================================

  describe('GET /api/v1/communications', () => {
    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('get', `${API}/communications`);
    });

    it('should return 401 even with an Authorization header that is not Bearer', async () => {
      const res = await request(app)
        .get(`${API}/communications`)
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // 7. POST /api/v1/patients — unauthenticated
  // ===========================================================================

  describe('POST /api/v1/patients', () => {
    const newPatientBody = {
      first_name: 'Unauthorized',
      last_name: 'Attempt',
      email: `unauth${Date.now()}@test.com`,
      date_of_birth: '1990-01-01',
      phone: '+4712345678',
    };

    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('post', `${API}/patients`, newPatientBody);
    });

    it('should NOT create patient data when unauthenticated', async () => {
      const res = await request(app)
        .post(`${API}/patients`)
        .send(newPatientBody)
        .set('Content-Type', 'application/json');
      // Must be 401 — no record should be created
      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('id');
    });
  });

  // ===========================================================================
  // 8. POST /api/v1/encounters — unauthenticated
  // ===========================================================================

  describe('POST /api/v1/encounters', () => {
    const newEncounterBody = {
      patient_id: NONEXISTENT_ID,
      encounter_type: 'INITIAL',
      chief_complaint: 'Test complaint',
    };

    it('should return 401 without any credentials', async () => {
      await expectUnauthenticated('post', `${API}/encounters`, newEncounterBody);
    });

    it('should NOT create encounter data when unauthenticated', async () => {
      const res = await request(app)
        .post(`${API}/encounters`)
        .send(newEncounterBody)
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('id');
    });
  });

  // ===========================================================================
  // 9. Cross-organization rejection (403)
  //    Authenticated as orgA; attempt to access orgB resources.
  // ===========================================================================

  describe('Cross-organization access rejection', () => {
    it('should reject GET /api/v1/patients when org header does not match user org', async () => {
      await expectCrossOrgForbidden('get', `${API}/patients`);
    });

    it('should reject GET /api/v1/encounters when org header does not match user org', async () => {
      await expectCrossOrgForbidden('get', `${API}/encounters`);
    });

    it('should reject GET /api/v1/billing/invoices when org header does not match user org', async () => {
      await expectCrossOrgForbidden('get', `${API}/billing/invoices`);
    });

    it('should reject POST /api/v1/patients for a different organization', async () => {
      await expectCrossOrgForbidden('post', `${API}/patients`, {
        first_name: 'Cross',
        last_name: 'Org',
        email: `crossorg${Date.now()}@test.com`,
        date_of_birth: '1990-01-01',
      });
    });

    it('should reject GET /api/v1/gdpr/requests for a different organization', async () => {
      await expectCrossOrgForbidden('get', `${API}/gdpr/requests`);
    });
  });

  // ===========================================================================
  // 10. Error response shape — 401 responses must be well-formed
  // ===========================================================================

  describe('401 response shape', () => {
    it('GET /api/v1/patients — 401 response includes error field', async () => {
      const res = await request(app).get(`${API}/patients`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('GET /api/v1/encounters — 401 response includes message field', async () => {
      const res = await request(app).get(`${API}/encounters`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    it('POST /api/v1/patients — 401 response does not expose stack trace', async () => {
      const res = await request(app)
        .post(`${API}/patients`)
        .send({ first_name: 'Test', last_name: 'User' })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(401);
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/stack/i);
      expect(body).not.toMatch(/at Object\./);
    });

    it('GET /api/v1/gdpr/requests — 401 response Content-Type is JSON', async () => {
      const res = await request(app).get(`${API}/gdpr/requests`);
      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
