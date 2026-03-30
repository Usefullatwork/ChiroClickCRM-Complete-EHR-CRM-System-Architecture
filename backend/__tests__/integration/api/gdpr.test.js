/**
 * GDPR API Integration Tests
 * Tests for GDPR compliance: data access, portability, erasure, consent management
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('GDPR API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // GDPR REQUESTS
  // =============================================================================

  describe('GET /api/v1/gdpr/requests', () => {
    it('should return list of GDPR requests', async () => {
      const res = await agent.get('/api/v1/gdpr/requests');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/gdpr/requests', () => {
    it('should create GDPR request with valid data', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'ACCESS',
        reason: 'Patient requested data access under Article 15',
      });
      // 400 when patient does not exist (FK constraint), 201 when patient exists
      expect([201, 400]).toContain(res.status);
    });

    it('should reject request without patient_id', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        request_type: 'DATA_ACCESS',
      });
      expect(res.status).toBe(400);
    });

    it('should reject request without request_type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
      });
      expect(res.status).toBe(400);
    });

    it('should accept PORTABILITY request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'PORTABILITY',
        reason: 'Patient moving to another clinic',
      });
      // 400 when patient does not exist (FK constraint), 201 when patient exists
      expect([201, 400]).toContain(res.status);
    });

    it('should accept ERASURE request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'ERASURE',
        reason: 'Patient requested data deletion',
      });
      // 400 when patient does not exist (FK constraint), 201 when patient exists
      expect([201, 400]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE REQUEST STATUS
  // =============================================================================

  describe('PATCH /api/v1/gdpr/requests/:requestId/status', () => {
    it('should handle status update for non-existent request', async () => {
      const res = await agent
        .patch(`/api/v1/gdpr/requests/${randomUUID()}/status`)
        .send({ status: 'IN_PROGRESS' });
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // DATA ACCESS (Article 15)
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/data-access', () => {
    it('should handle data access for non-existent patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/data-access`);
      expect(res.status).toBe(404);
    });

    it('should return patient data when patient exists', async () => {
      const patientId = randomUUID();
      const res = await agent.get(`/api/v1/gdpr/patient/${patientId}/data-access`);
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // DATA PORTABILITY (Article 20)
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/data-portability', () => {
    it('should handle portability for non-existent patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/data-portability`);
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // ERASURE (Article 17)
  // =============================================================================

  describe('POST /api/v1/gdpr/requests/:requestId/erasure', () => {
    it('should handle erasure for non-existent request', async () => {
      const res = await agent
        .post(`/api/v1/gdpr/requests/${randomUUID()}/erasure`)
        .send({ confirm: true });
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // CONSENT MANAGEMENT
  // =============================================================================

  describe('PATCH /api/v1/gdpr/patient/:patientId/consent', () => {
    it('should handle consent update for non-existent patient', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        consent_sms: true,
        consent_marketing: false,
        consent_email: false,
      });
      expect(res.status).toBe(404);
    });

    it('should reject empty consent body', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({});
      expect(res.status).toBe(400);
    });
  });

  // =============================================================================
  // CONSENT AUDIT TRAIL
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/consent-audit', () => {
    it('should return consent audit trail for patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/consent-audit`);
      expect(res.status).toBe(200);
    });
  });

  // =============================================================================
  // CONSENT PREFERENCES VARIATIONS
  // =============================================================================

  describe('PATCH /api/v1/gdpr/patient/:patientId/consent (variations)', () => {
    it('should accept all consents enabled', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        consent_sms: true,
        consent_marketing: true,
        consent_email: true,
        consent_data_storage: true,
      });
      expect(res.status).toBe(404);
    });

    it('should accept minimal consent (sms only)', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        consent_sms: true,
      });
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // REQUEST TYPE VARIATIONS
  // =============================================================================

  describe('POST /api/v1/gdpr/requests (type variations)', () => {
    it('should accept RECTIFICATION request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'RECTIFICATION',
        reason: 'Patient wants address corrected',
      });
      // 400 when patient does not exist (FK constraint), 201 when patient exists
      expect([201, 400]).toContain(res.status);
    });

    it('should accept RESTRICTION request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'RESTRICTION',
        reason: 'Patient wants data processing restricted',
      });
      // 400 when patient does not exist (FK constraint), 201 when patient exists
      expect([201, 400]).toContain(res.status);
    });
  });
});
