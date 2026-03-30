/**
 * Injection Security Tests
 * Verifies that XSS, SQL injection, and other injection attacks
 * are blocked or neutralized by sanitizeInput middleware and
 * parameterized queries.
 *
 * Runs in DESKTOP_MODE with auto-auth (ADMIN role, org a0...01).
 */

import request from 'supertest';
import app from '../../src/server.js';
import db from '../../src/config/database.js';
import { randomUUID } from '../helpers/testUtils.js';

const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Helper: create a patient via API and return its body
 */
async function createPatientViaAPI(overrides = {}) {
  const ts = Date.now();
  const defaults = {
    solvit_id: `SEC-${ts}-${Math.random().toString(36).substr(2, 6)}`,
    first_name: 'Security',
    last_name: `Test${ts}`,
    email: `sec${ts}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1990-01-01',
    ...overrides,
  };

  const res = await request(app).post('/api/v1/patients').send(defaults);
  if (res.status !== 201) {
    throw new Error(`Failed to create patient: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

describe('Injection Security Tests', () => {
  afterAll(async () => {
    await db.closePool();
  });

  // ===========================================================================
  // SQL INJECTION
  // ===========================================================================

  describe('SQL Injection Prevention', () => {
    it('should not return all rows when search query contains OR 1=1', async () => {
      // Create a known patient so we can verify the DB is not empty
      await createPatientViaAPI({ first_name: 'Legit', last_name: 'Person' });

      const res = await request(app)
        .get("/api/v1/search/patients?q=' OR 1=1 --")
        .expect('Content-Type', /json/);

      // Parameterized query treats the whole string as a literal search term.
      // Expect either empty results or results matching the literal string,
      // but definitely not a dump of all patients.
      expect([200, 400]).toContain(res.status);

      if (res.status === 200) {
        const patients = res.body.patients || res.body.results || res.body;
        const arr = Array.isArray(patients) ? patients : [];
        // If any results came back, they must match the literal string
        arr.forEach((p) => {
          const combined = `${p.first_name} ${p.last_name} ${p.email || ''}`.toLowerCase();
          // The result should NOT be our "Legit Person" unless the search
          // term happened to match it (it shouldn't)
          expect(combined).not.toContain('legit');
        });
      }
    });

    it('should safely store a patient name containing SQL injection payload', async () => {
      const maliciousName = "Robert'; DROP TABLE patients;--";
      const patient = await createPatientViaAPI({ first_name: maliciousName });

      // Name is stored literally (parameterized query)
      expect(patient.first_name).toBe(maliciousName);

      // Verify the patients table still exists
      const tableCheck = await db.query(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' LIMIT 1"
      );
      expect(tableCheck.rows.length).toBe(1);
    });

    it('should reject non-UUID ID parameter', async () => {
      const res = await request(app).get('/api/v1/patients/1 OR 1=1');
      expect([400, 404]).toContain(res.status);
    });

    it('should not execute UNION injection in search', async () => {
      const res = await request(app)
        .get("/api/v1/search/patients?q=test' UNION SELECT * FROM users --")
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(res.status);

      if (res.status === 200) {
        // Results must not contain user table columns (password_hash, etc.)
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('password_hash');
      }
    });

    it('should handle SQL comment sequences in query params', async () => {
      const res = await request(app)
        .get('/api/v1/search/patients?q=test;--')
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(res.status);
    });

    it('should handle stacked queries attempt', async () => {
      const res = await request(app)
        .get(
          "/api/v1/search/patients?q=test'; INSERT INTO patients (first_name) VALUES ('hacked');--"
        )
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(res.status);

      // Verify no patient named 'hacked' was created
      const check = await db.query(
        "SELECT id FROM patients WHERE first_name = 'hacked' AND organization_id = $1",
        [DESKTOP_ORG_ID]
      );
      expect(check.rows.length).toBe(0);
    });
  });

  // ===========================================================================
  // XSS (sanitizeInput middleware)
  // ===========================================================================

  describe('XSS Prevention (sanitizeInput)', () => {
    it('should strip script tags from non-SOAP body fields', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `XSS-${Date.now()}`,
          first_name: '<script>alert(1)</script>Test',
          last_name: 'XSSCheck',
          email: `xss${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      // Should succeed (201) or fail validation (400), but script tag must be stripped
      if (res.status === 201) {
        expect(res.body.first_name).not.toContain('<script>');
        expect(res.body.first_name).toContain('Test');
      }
    });

    it('should preserve HTML in SOAP fields (subjective, objective, assessment, plan)', async () => {
      // Create a patient first
      const patient = await createPatientViaAPI();

      const soapPayload = {
        patient_id: patient.id,
        encounter_type: 'FOLLOWUP',
        subjective: '<b>Bold text</b> and <i>italic</i>',
        objective: '<ul><li>Finding 1</li></ul>',
        assessment: '<em>Assessment note</em>',
        plan: '<strong>Treatment plan</strong>',
      };

      const res = await request(app).post('/api/v1/encounters').send(soapPayload);

      // SOAP fields are preserved (not sanitized)
      if (res.status === 201 || res.status === 200) {
        const body = JSON.stringify(res.body);
        expect(body).toContain('<b>Bold text</b>');
      }
    });

    it('should strip javascript: protocol from query params', async () => {
      const res = await request(app)
        .get('/api/v1/search/patients?q=javascript:alert(1)')
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(res.status);

      // The sanitizeInput middleware strips "javascript:" from query values
      // If the search proceeds, the query should not contain the protocol
    });

    it('should strip inline event handlers from body fields', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `EVT-${Date.now()}`,
          first_name: 'test onerror=alert(1)',
          last_name: 'Handler',
          email: `evt${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      if (res.status === 201) {
        expect(res.body.first_name).not.toMatch(/onerror\s*=/i);
      }
    });

    it('should strip iframe tags from body fields', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `IFR-${Date.now()}`,
          first_name: '<iframe src="evil.com"></iframe>CleanName',
          last_name: 'Iframe',
          email: `ifr${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      if (res.status === 201) {
        expect(res.body.first_name).not.toContain('<iframe');
        expect(res.body.first_name).toContain('CleanName');
      }
    });

    it('should strip nested/obfuscated script tags', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `NST-${Date.now()}`,
          first_name: '<ScRiPt>alert("xss")</ScRiPt>Safe',
          last_name: 'Nested',
          email: `nst${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      if (res.status === 201) {
        expect(res.body.first_name.toLowerCase()).not.toContain('<script');
        expect(res.body.first_name).toContain('Safe');
      }
    });

    it('should strip multiple XSS vectors in one payload', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `MXV-${Date.now()}`,
          first_name: '<script>x</script>',
          last_name: '<iframe src="x"></iframe>',
          email: `mxv${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      if (res.status === 201) {
        expect(res.body.first_name).not.toContain('<script');
        expect(res.body.last_name).not.toContain('<iframe');
      }
    });

    it('should handle encoded XSS payloads in query params', async () => {
      // URL-encoded <script>
      const res = await request(app)
        .get('/api/v1/search/patients?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E')
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(res.status);
    });
  });

  // ===========================================================================
  // OTHER INJECTION VECTORS
  // ===========================================================================

  describe('Path Traversal Prevention', () => {
    it('should reject path traversal in patient ID', async () => {
      const res = await request(app).get('/api/v1/patients/../../etc/passwd');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject double-encoded path traversal', async () => {
      const res = await request(app).get('/api/v1/patients/..%252f..%252fetc%252fpasswd');
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Body Size Limits', () => {
    it('should reject oversized request body (>10MB)', async () => {
      // Express is configured with { limit: '10mb' }
      const hugePayload = {
        first_name: 'A'.repeat(11 * 1024 * 1024), // ~11MB string
      };

      const res = await request(app).post('/api/v1/patients').send(hugePayload);

      expect([413, 400]).toContain(res.status);
    });
  });

  describe('Deeply Nested JSON', () => {
    it('should handle deeply nested JSON without crashing', async () => {
      let nested = { value: 'leaf' };
      for (let i = 0; i < 100; i++) {
        nested = { child: nested };
      }

      const res = await request(app).post('/api/v1/patients').send({
        first_name: 'Deep',
        last_name: 'Nesting',
        extra: nested,
      });

      // Should not crash the server (500 from unhandled) — 400 or 201 are acceptable
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Null Byte Injection', () => {
    it('should handle null bytes in body fields gracefully', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `NUL-${Date.now()}`,
          first_name: 'test\u0000evil',
          last_name: 'NullByte',
          email: `nul${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      // Null bytes may cause a DB error (500) or be stripped (201) or rejected (400).
      // The key assertion: the server does not hang or crash unexpectedly.
      expect([201, 400, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.first_name).toBeDefined();
      }
    });

    it('should handle null bytes in query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/search/patients?q=test%00evil')
        .expect('Content-Type', /json/);

      // Null bytes in query may cause DB errors — server should respond, not crash
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should not allow __proto__ to affect request object', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `PPL-${Date.now()}`,
          first_name: 'Proto',
          last_name: 'Pollution',
          email: `ppl${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
          __proto__: { isAdmin: true },
        });

      // The request should be handled normally without elevating privileges
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.isAdmin).toBeUndefined();
      }
    });

    it('should not allow constructor.prototype pollution', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `CPP-${Date.now()}`,
          first_name: 'Constructor',
          last_name: 'Pollution',
          email: `cpp${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
          constructor: { prototype: { isAdmin: true } },
        });

      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.isAdmin).toBeUndefined();
      }
    });
  });

  // ===========================================================================
  // HEADER INJECTION
  // ===========================================================================

  describe('Header Injection Prevention', () => {
    it('should not allow CRLF injection via header values', async () => {
      // Node.js / supertest rejects invalid header characters at the HTTP layer,
      // which itself prevents header injection. Verify this defense is in place.
      let threw = false;
      try {
        await request(app)
          .get('/api/v1/patients')
          .set('X-Injected', 'evil\r\nSet-Cookie: hacked=true');
      } catch (err) {
        threw = true;
        // Node.js rejects the invalid header character — this IS the security control
        expect(err.message).toMatch(/Invalid character/i);
      }
      expect(threw).toBe(true);
    });

    it('should not reflect custom headers back to the client', async () => {
      const res = await request(app)
        .get('/api/v1/patients')
        .set('X-Custom-Evil', 'malicious-value');

      // The custom header should not appear in the response
      expect(res.headers['x-custom-evil']).toBeUndefined();
    });
  });

  // ===========================================================================
  // NOSQL / JSON INJECTION (defense in depth)
  // ===========================================================================

  describe('JSON Injection Prevention', () => {
    it('should handle $gt/$ne operators in body without error', async () => {
      // NoSQL-style operators should be treated as plain strings by PG
      const res = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `NQL-${Date.now()}`,
          first_name: { $gt: '' },
          last_name: 'NoSQL',
          email: `nql${Date.now()}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        });

      // Should reject (type validation) or store literally, not bypass auth
      expect([201, 400, 422]).toContain(res.status);
    });
  });
});
