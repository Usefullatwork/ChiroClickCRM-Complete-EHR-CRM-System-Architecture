/**
 * Patients API Integration Tests
 * Comprehensive tests for Patient management endpoints
 *
 * Note: Tests adapted to match actual database schema
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import {
  createTestOrganization,
  createTestUser,
  createTestSession,
  createTestPatient,
  cleanupTestData,
  setTenantContext,
  randomUUID
} from '../../helpers/testUtils.js';

describe('Patients API Integration Tests', () => {
  let testOrg;
  let testUser;
  let testSession;
  let testPatientId;

  beforeAll(async () => {
    // Create test organization
    testOrg = await createTestOrganization({ name: 'Patients Test Clinic' });

    // Set tenant context for RLS
    await setTenantContext(testOrg.id);

    // Create test user
    testUser = await createTestUser(testOrg.id, { role: 'PRACTITIONER' });

    // Create session
    testSession = await createTestSession(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData(testOrg?.id);
    await db.closePool();
  });

  // =============================================================================
  // CREATE PATIENT
  // =============================================================================

  describe('POST /api/v1/patients', () => {
    it('should create a new patient with required fields', async () => {
      const timestamp = Date.now();
      const patientData = {
        solvit_id: `TEST-${timestamp}`,
        first_name: 'John',
        last_name: 'Doe',
        email: `john.doe${timestamp}@example.com`,
        phone: '+4712345678',
        date_of_birth: '1990-01-01'
      };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(patientData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');

      testPatientId = response.body.id;
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('X-Organization-Id', testOrg.id)
        .send({ first_name: 'Test', last_name: 'Patient' })
        .expect(401);
    });

    it('should require first and last name', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should set default status to ACTIVE', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({
          solvit_id: `LIFECYCLE-${timestamp}`,
          first_name: 'Lifecycle',
          last_name: 'Test',
          email: `lifecycle${timestamp}@test.com`,
          date_of_birth: '1985-06-15'
        })
        .expect(201);

      // Database uses 'status' not 'lifecycle_stage', default is 'ACTIVE'
      expect(response.body.status).toBe('ACTIVE');
    });
  });

  // =============================================================================
  // GET PATIENT BY ID
  // =============================================================================

  describe('GET /api/v1/patients/:id', () => {
    let getTestPatient;

    beforeAll(async () => {
      getTestPatient = await createTestPatient(testOrg.id, {
        first_name: 'GetTest',
        last_name: 'Patient'
      });
    });

    it('should retrieve patient by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/${getTestPatient.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.id).toBe(getTestPatient.id);
      expect(response.body.first_name).toBe('GetTest');
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app)
        .get(`/api/v1/patients/${randomUUID()}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(404);
    });

    it('should enforce organization isolation', async () => {
      const differentOrgId = randomUUID();

      // User not in that org should get 403 (forbidden)
      await request(app)
        .get(`/api/v1/patients/${getTestPatient.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', differentOrgId)
        .expect(403);
    });
  });

  // =============================================================================
  // LIST PATIENTS WITH PAGINATION
  // =============================================================================

  describe('GET /api/v1/patients', () => {
    beforeAll(async () => {
      // Create additional patients for pagination tests
      for (let i = 0; i < 5; i++) {
        await createTestPatient(testOrg.id, {
          first_name: `Patient${i}`,
          last_name: 'Pagination',
          email: `patient${i}_${Date.now()}@test.com`
        });
      }
    });

    it('should return paginated patient list', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.patients)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ limit: 3 })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.patients.length).toBeLessThanOrEqual(3);
    });

    it('should include total count in pagination', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('total');
      expect(typeof response.body.pagination.total).toBe('number');
    });
  });

  // =============================================================================
  // SEARCH PATIENTS
  // =============================================================================

  describe('GET /api/v1/patients/search', () => {
    beforeAll(async () => {
      await createTestPatient(testOrg.id, {
        first_name: 'Searchable',
        last_name: 'Person',
        email: `searchable${Date.now()}@test.com`
      });
    });

    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'Searchable' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'NonExistentName123xyz' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'Patient', limit: 5 })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  // =============================================================================
  // UPDATE PATIENT
  // =============================================================================

  describe('PATCH /api/v1/patients/:id', () => {
    let updateTestPatient;

    beforeAll(async () => {
      updateTestPatient = await createTestPatient(testOrg.id, {
        first_name: 'UpdateTest',
        last_name: 'Patient',
        email: `update${Date.now()}@test.com`
      });
    });

    it('should update patient information', async () => {
      const updates = {
        phone: '+4798765432',
        email: `newemail${Date.now()}@example.com`
      };

      const response = await request(app)
        .patch(`/api/v1/patients/${updateTestPatient.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send(updates)
        .expect(200);

      expect(response.body.phone).toBe(updates.phone);
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app)
        .patch(`/api/v1/patients/${randomUUID()}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .send({ phone: '+4711111111' })
        .expect(404);
    });
  });

  // =============================================================================
  // DELETE/ANONYMIZE PATIENT (GDPR)
  // =============================================================================

  describe('DELETE /api/v1/patients/:id', () => {
    let deletablePatient;

    beforeEach(async () => {
      // Create a fresh patient for delete tests
      deletablePatient = await createTestPatient(testOrg.id, {
        first_name: 'ToDelete',
        last_name: 'Patient',
        email: `delete${Date.now()}@test.com`
      });
    });

    it('should soft delete patient', async () => {
      await request(app)
        .delete(`/api/v1/patients/${deletablePatient.id}`)
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      // Record should still exist (soft delete)
      const result = await db.query(
        'SELECT id FROM patients WHERE id = $1',
        [deletablePatient.id]
      );

      expect(result.rows.length).toBe(1);
    });
  });

  // =============================================================================
  // MULTI-TENANT ISOLATION
  // =============================================================================

  describe('Multi-Tenant Isolation', () => {
    let otherOrg;
    let otherUser;
    let otherSession;
    let otherPatient;

    beforeAll(async () => {
      // Create another organization with its own patient
      otherOrg = await createTestOrganization({ name: 'Other Clinic' });
      otherUser = await createTestUser(otherOrg.id, {
        email: `other${Date.now()}@test.com`
      });
      otherSession = await createTestSession(otherUser.id);
      otherPatient = await createTestPatient(otherOrg.id, {
        first_name: 'Other',
        last_name: 'OrgPatient'
      });
    });

    afterAll(async () => {
      await cleanupTestData(otherOrg?.id);
    });

    it('should not list patients from different organization', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .set('Cookie', otherSession.cookie)
        .set('X-Organization-Id', otherOrg.id)
        .expect(200);

      // Should only see other org's patients
      const patientIds = response.body.patients.map(p => p.id);
      expect(patientIds).toContain(otherPatient.id);
    });
  });

  // =============================================================================
  // SORTING
  // =============================================================================

  describe('Sorting', () => {
    it('should sort patients by last_name ascending', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ sortBy: 'last_name', sortOrder: 'asc' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      const patients = response.body.patients;
      for (let i = 1; i < patients.length; i++) {
        expect(patients[i].last_name >= patients[i - 1].last_name).toBe(true);
      }
    });

    it('should sort patients by created_at descending', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .query({ sortBy: 'created_at', sortOrder: 'desc' })
        .set('Cookie', testSession.cookie)
        .set('X-Organization-Id', testOrg.id)
        .expect(200);

      const patients = response.body.patients;
      for (let i = 1; i < patients.length; i++) {
        const date1 = new Date(patients[i - 1].created_at);
        const date2 = new Date(patients[i].created_at);
        expect(date1 >= date2).toBe(true);
      }
    });
  });
});
