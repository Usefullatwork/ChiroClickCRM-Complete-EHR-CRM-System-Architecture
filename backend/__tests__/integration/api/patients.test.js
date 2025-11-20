import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';

describe('Patients API Integration Tests', () => {
  let testOrgId;
  let testPatientId;
  let authToken;

  beforeAll(async () => {
    // Setup test organization
    const orgResult = await db.query(
      `INSERT INTO organizations (name, org_number, subscription_tier, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Test Clinic', '123456789', 'PRO', true]
    );
    testOrgId = orgResult.rows[0].id;

    // Mock auth token (in real tests, use Clerk test tokens)
    authToken = 'test_auth_token';
  });

  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    await db.pool.end();
  });

  describe('POST /api/v1/patients', () => {
    it('should create a new patient', async () => {
      const patientData = {
        first_name: 'John',
        last_name: 'Doe',
        fodselsnummer: '01010199999',
        email: 'john.doe@example.com',
        phone: '+4712345678',
        address: {
          street: 'Test Street 1',
          city: 'Oslo',
          postal_code: '0123'
        }
      };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .send(patientData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');
      expect(response.body.fodselsnummer).toBeUndefined(); // Should not return encrypted data
      expect(response.body.fodselsnummer_masked).toBe('010101*****');

      testPatientId = response.body.id;
    });

    it('should reject patient with invalid fødselsnummer', async () => {
      const invalidPatient = {
        first_name: 'Jane',
        last_name: 'Doe',
        fodselsnummer: 'invalid'
      };

      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .send(invalidPatient)
        .expect(400);
    });

    it('should require authentication', async () => {
      const patientData = {
        first_name: 'Test',
        last_name: 'Patient'
      };

      await request(app)
        .post('/api/v1/patients')
        .set('X-Organization-Id', testOrgId)
        .send(patientData)
        .expect(401);
    });

    it('should require organization ID', async () => {
      const patientData = {
        first_name: 'Test',
        last_name: 'Patient'
      };

      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData)
        .expect(400);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('should retrieve patient by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(200);

      expect(response.body.id).toBe(testPatientId);
      expect(response.body.first_name).toBe('John');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174099';

      await request(app)
        .get(`/api/v1/patients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(404);
    });

    it('should enforce organization isolation', async () => {
      const differentOrgId = '123e4567-e89b-12d3-a456-426614174098';

      await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', differentOrgId)
        .expect(404);
    });
  });

  describe('GET /api/v1/patients/search', () => {
    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'John' })
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].first_name).toContain('John');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/v1/patients/search')
        .query({ q: 'NonExistentName123' })
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /api/v1/patients/:id', () => {
    it('should update patient information', async () => {
      const updates = {
        phone: '+4798765432',
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .send(updates)
        .expect(200);

      expect(response.body.phone).toBe(updates.phone);
      expect(response.body.email).toBe(updates.email);
    });

    it('should not allow updating fødselsnummer', async () => {
      const maliciousUpdate = {
        fodselsnummer: '99999999999'
      };

      await request(app)
        .patch(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .send(maliciousUpdate)
        .expect(400);
    });
  });

  describe('GET /api/v1/patients/statistics', () => {
    it('should return patient statistics', async () => {
      const response = await request(app)
        .get('/api/v1/patients/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(200);

      expect(response.body).toHaveProperty('total_patients');
      expect(response.body).toHaveProperty('new_this_month');
      expect(response.body).toHaveProperty('active_patients');
    });
  });

  describe('DELETE /api/v1/patients/:id', () => {
    it('should anonymize (soft delete) patient', async () => {
      await request(app)
        .delete(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-Id', testOrgId)
        .expect(200);

      // Verify patient is anonymized
      const result = await db.query(
        'SELECT first_name, last_name, email FROM patients WHERE id = $1',
        [testPatientId]
      );

      expect(result.rows[0].first_name).toBe('[DELETED]');
      expect(result.rows[0].last_name).toBe('[DELETED]');
      expect(result.rows[0].email).toBeNull();
    });
  });
});
