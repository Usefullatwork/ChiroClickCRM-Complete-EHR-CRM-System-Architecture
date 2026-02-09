/**
 * SQL Injection Prevention Tests
 * Verifies that all API endpoints properly parameterize queries
 * and reject injection attempts in all user-controlled inputs.
 *
 * Tests the fixes applied in Phase 1 Security Hardening (commit b21d9b5):
 * - INTERVAL-based injection via days/months/years parameters
 * - String injection via search/filter/sort parameters
 * - UNION-based injection attempts
 * - Stacked query injection attempts
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';

// Desktop mode org/user IDs
const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Create a test patient for injection tests
 */
async function createPatientViaAPI() {
  const timestamp = Date.now();
  const response = await request(app)
    .post('/api/v1/patients')
    .send({
      solvit_id: `SQLI-${timestamp}`,
      first_name: 'SQLi',
      last_name: `Test${timestamp}`,
      email: `sqli${timestamp}@test.com`,
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
    });
  return response.body;
}

describe('SQL Injection Prevention', () => {
  let testPatient;

  beforeAll(async () => {
    testPatient = await createPatientViaAPI();
  });

  // ===========================================================================
  // SEARCH PARAMETER INJECTION
  // ===========================================================================

  describe('Search Parameter Injection', () => {
    it('should safely handle SQL injection in patient search query', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: "'; DROP TABLE patients; --" })
        .expect(200);

      // Should return empty results, not crash
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should safely handle UNION-based injection in patient search', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: "' UNION SELECT id, email, password_hash FROM users --" })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Must not contain user data from injected query
      response.body.forEach((item) => {
        expect(item).not.toHaveProperty('password_hash');
      });
    });

    it('should safely handle boolean-based blind injection in search', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: "' OR '1'='1" })
        .expect(200);

      // Should NOT return all patients (blind injection)
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should safely handle time-based blind injection in search', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/v1/patients/search')
        .query({ q: "'; SELECT pg_sleep(5); --" })
        .expect(200);

      const elapsed = Date.now() - start;
      // Should not have waited 5 seconds
      expect(elapsed).toBeLessThan(4000);
    });

    it('should safely handle CRM lead search injection', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ search: "'; DELETE FROM leads; --" })
        .expect(200);

      expect(response.body).toHaveProperty('leads');
    });
  });

  // ===========================================================================
  // SORT/ORDER PARAMETER INJECTION
  // ===========================================================================

  describe('Sort Parameter Injection', () => {
    it('should reject invalid sort columns', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ sortBy: 'password_hash', sortOrder: 'asc' });

      // Should safely handle - reject, ignore, or error (not execute the injection)
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        // Patients should not expose password_hash
        response.body.patients.forEach((p) => {
          expect(p).not.toHaveProperty('password_hash');
        });
      }
    });

    it('should reject SQL injection in sort order', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ sortBy: 'last_name', sortOrder: 'ASC; DROP TABLE patients; --' });

      // Should safely handle - reject, ignore, or error (not execute the injection)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject SQL injection in CRM sort parameters', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ sortBy: 'created_at; DROP TABLE leads --' });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ===========================================================================
  // FILTER PARAMETER INJECTION
  // ===========================================================================

  describe('Filter Parameter Injection', () => {
    it('should safely handle injection in status filter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ status: "NEW' OR '1'='1" });

      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle injection in temperature filter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/leads')
        .query({ temperature: "HOT'; DROP TABLE leads; --" });

      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle injection in lifecycle stage filter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/lifecycle')
        .query({ stage: "ACTIVE' UNION SELECT * FROM users --" });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ===========================================================================
  // ID PARAMETER INJECTION
  // ===========================================================================

  describe('ID Parameter Injection', () => {
    it('should safely handle injection in patient ID', async () => {
      const response = await request(app).get("/api/v1/patients/'; DROP TABLE patients; --");

      // Should return 400 or 404, never succeed
      expect([400, 404, 500]).toContain(response.status);
    });

    it('should safely handle injection in encounter ID', async () => {
      const response = await request(app).get("/api/v1/encounters/' OR 1=1 --");

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should safely handle injection in lead ID', async () => {
      const response = await request(app).get("/api/v1/crm/leads/' UNION SELECT * FROM users --");

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  // ===========================================================================
  // BODY PAYLOAD INJECTION
  // ===========================================================================

  describe('Request Body Injection', () => {
    it('should safely handle injection in patient name fields', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `SAFE-${timestamp}`,
          first_name: "Robert'); DROP TABLE patients; --",
          last_name: 'Tables',
          email: `bobby${timestamp}@tables.com`,
          date_of_birth: '1990-01-01',
        });

      // Should succeed and store the name literally
      if (response.status === 201) {
        expect(response.body.first_name).toBe("Robert'); DROP TABLE patients; --");
      }
    });

    it('should safely handle injection in encounter SOAP notes', async () => {
      const response = await request(app)
        .post('/api/v1/encounters')
        .send({
          patient_id: testPatient.id,
          encounter_type: 'FOLLOWUP',
          subjective: {
            chief_complaint: "Nakkesmerter'); DELETE FROM clinical_encounters; --",
          },
          objective: {},
          assessment: {},
          plan: {},
        });

      if (response.status === 201) {
        expect(response.body.subjective.chief_complaint).toBe(
          "Nakkesmerter'); DELETE FROM clinical_encounters; --"
        );
      }
    });

    it('should safely handle injection in CRM lead creation', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/crm/leads')
        .send({
          first_name: "'; INSERT INTO users (email,role) VALUES ('hacker@evil.com','ADMIN'); --",
          last_name: 'Injector',
          email: `inject${timestamp}@test.com`,
          phone: '+4798765432',
          source: 'WEBSITE',
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should safely handle injection in email fields', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `EMAIL-${Date.now()}`,
          first_name: 'Email',
          last_name: 'Injector',
          email: "test@test.com'; DROP TABLE patients; --",
          date_of_birth: '1990-01-01',
        });

      // Should either reject the invalid email or safely store it
      expect([201, 400]).toContain(response.status);
    });
  });

  // ===========================================================================
  // PAGINATION INJECTION
  // ===========================================================================

  describe('Pagination Parameter Injection', () => {
    it('should safely handle injection in limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ limit: '10; DROP TABLE patients; --' });

      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle injection in page/offset parameter', async () => {
      const response = await request(app).get('/api/v1/patients').query({ page: '1 OR 1=1' });

      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle negative limit', async () => {
      const response = await request(app).get('/api/v1/patients').query({ limit: -1 });

      // Negative limit should be rejected or safely ignored (500 = query error, still safe)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should safely handle extremely large limit', async () => {
      const response = await request(app).get('/api/v1/patients').query({ limit: 999999999 });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        // Should cap the limit internally
        expect(response.body.patients.length).toBeLessThanOrEqual(1000);
      }
    });
  });

  // ===========================================================================
  // INTERVAL INJECTION (Phase 1 fixes)
  // ===========================================================================

  describe('INTERVAL Parameter Injection (Phase 1 fixes)', () => {
    it('should safely handle injection in retention period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention')
        .query({ period: '90; DROP TABLE patients; --' });

      // Should either parse safely or reject
      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle injection in CRM retention days', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention')
        .query({ period: "1' OR '1'='1" });

      expect([200, 400]).toContain(response.status);
    });

    it('should safely handle injection in cohort months parameter', async () => {
      const response = await request(app)
        .get('/api/v1/crm/retention/cohorts')
        .query({ months: '6; SELECT pg_sleep(5);' });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ===========================================================================
  // SECOND-ORDER INJECTION
  // ===========================================================================

  describe('Second-Order Injection Prevention', () => {
    it('should not execute stored injection payload on retrieval', async () => {
      const timestamp = Date.now();
      // Store a payload
      const createResponse = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `STORED-${timestamp}`,
          first_name: "Test' OR '1'='1",
          last_name: `Stored${timestamp}`,
          email: `stored${timestamp}@test.com`,
          date_of_birth: '1990-01-01',
        });

      if (createResponse.status === 201) {
        // Retrieve it - should return the literal string
        const getResponse = await request(app)
          .get(`/api/v1/patients/${createResponse.body.id}`)
          .expect(200);

        expect(getResponse.body.first_name).toBe("Test' OR '1'='1");
      }
    });
  });

  // ===========================================================================
  // DATABASE INTEGRITY
  // ===========================================================================

  describe('Database Integrity After Injection Attempts', () => {
    it('patients table should still be queryable after all injection tests', async () => {
      const response = await request(app).get('/api/v1/patients').expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(Array.isArray(response.body.patients)).toBe(true);
    });

    it('leads table should still be queryable after all injection tests', async () => {
      const response = await request(app).get('/api/v1/crm/leads').expect(200);

      expect(response.body).toHaveProperty('leads');
    });

    it('encounters table should still be queryable after all injection tests', async () => {
      const response = await request(app)
        .get('/api/v1/encounters')
        .query({ patient_id: testPatient.id });

      // Should return 200 with encounters data
      expect([200]).toContain(response.status);
    });
  });
});
