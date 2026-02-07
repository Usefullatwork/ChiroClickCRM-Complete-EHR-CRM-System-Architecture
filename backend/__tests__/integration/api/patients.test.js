/**
 * Patients API Integration Tests
 * Comprehensive tests for Patient management endpoints
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted.
 * Uses the desktop org ID for all patient operations.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';
import { randomUUID } from '../../helpers/testUtils.js';

// Desktop mode org ID (from auth middleware)
const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Create a test patient in the desktop org via API
 */
async function createPatientViaAPI(overrides = {}) {
  const timestamp = Date.now();
  const defaults = {
    solvit_id: `TEST-${timestamp}-${Math.random().toString(36).substr(2, 6)}`,
    first_name: 'Test',
    last_name: `Patient${timestamp}`,
    email: `patient${timestamp}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1990-01-01',
    ...overrides,
  };

  const response = await request(app).post('/api/v1/patients').send(defaults);

  if (response.status !== 201) {
    throw new Error(
      `Failed to create patient: ${response.status} ${JSON.stringify(response.body)}`
    );
  }

  return response.body;
}

describe('Patients API Integration Tests', () => {
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
        date_of_birth: '1990-01-01',
      };

      const response = await request(app).post('/api/v1/patients').send(patientData).expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');
    });

    // In desktop mode, auth is auto-granted, so 401 is not possible
    it('should auto-authenticate in desktop mode', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .send({ first_name: 'Test', last_name: 'Patient' });

      // Desktop mode auto-authenticates, so we get 400 (validation) not 401
      // Missing required fields like date_of_birth cause 400
      expect([201, 400]).toContain(response.status);
    });

    it('should require first and last name', async () => {
      await request(app).post('/api/v1/patients').send({ email: 'test@example.com' }).expect(400);
    });

    it('should set default status to ACTIVE', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/patients')
        .send({
          solvit_id: `LIFECYCLE-${timestamp}`,
          first_name: 'Lifecycle',
          last_name: 'Test',
          email: `lifecycle${timestamp}@test.com`,
          date_of_birth: '1985-06-15',
        })
        .expect(201);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  // =============================================================================
  // GET PATIENT BY ID
  // =============================================================================

  describe('GET /api/v1/patients/:id', () => {
    let getTestPatient;

    beforeAll(async () => {
      getTestPatient = await createPatientViaAPI({
        first_name: 'GetTest',
        last_name: 'Patient',
      });
    });

    it('should retrieve patient by ID', async () => {
      const response = await request(app).get(`/api/v1/patients/${getTestPatient.id}`).expect(200);

      expect(response.body.id).toBe(getTestPatient.id);
      expect(response.body.first_name).toBe('GetTest');
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app).get(`/api/v1/patients/${randomUUID()}`).expect(404);
    });
  });

  // =============================================================================
  // LIST PATIENTS WITH PAGINATION
  // =============================================================================

  describe('GET /api/v1/patients', () => {
    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        await createPatientViaAPI({
          first_name: `Paginated${i}`,
          last_name: 'TestPatient',
        });
      }
    });

    it('should return paginated patient list', async () => {
      const response = await request(app).get('/api/v1/patients').expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.patients)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app).get('/api/v1/patients').query({ limit: 3 }).expect(200);

      expect(response.body.patients.length).toBeLessThanOrEqual(3);
    });

    it('should include total count in pagination', async () => {
      const response = await request(app).get('/api/v1/patients').expect(200);

      expect(response.body.pagination).toHaveProperty('total');
      expect(typeof response.body.pagination.total).toBe('number');
    });
  });

  // =============================================================================
  // SEARCH PATIENTS
  // =============================================================================

  describe('GET /api/v1/patients/search', () => {
    beforeAll(async () => {
      await createPatientViaAPI({
        first_name: 'Searchable',
        last_name: 'UniqueSearchName',
      });
    });

    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'UniqueSearchName' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'NonExistentName123xyz' })
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'Patient', limit: 5 })
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
      updateTestPatient = await createPatientViaAPI({
        first_name: 'UpdateTest',
        last_name: 'Patient',
      });
    });

    it('should update patient information', async () => {
      const updates = {
        phone: '+4798765432',
        email: `newemail${Date.now()}@example.com`,
      };

      const response = await request(app)
        .patch(`/api/v1/patients/${updateTestPatient.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.phone).toBe(updates.phone);
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app)
        .patch(`/api/v1/patients/${randomUUID()}`)
        .send({ phone: '+4711111111' })
        .expect(404);
    });
  });

  // =============================================================================
  // DELETE/ANONYMIZE PATIENT (GDPR)
  // =============================================================================

  describe('DELETE /api/v1/patients/:id', () => {
    it('should soft delete patient', async () => {
      const deletablePatient = await createPatientViaAPI({
        first_name: 'ToDelete',
        last_name: 'Patient',
      });

      await request(app).delete(`/api/v1/patients/${deletablePatient.id}`).expect(200);

      // Record should still exist (soft delete)
      const result = await db.query('SELECT id FROM patients WHERE id = $1', [deletablePatient.id]);

      expect(result.rows.length).toBe(1);
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
