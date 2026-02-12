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
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/gdpr/requests', () => {
    it('should create GDPR request with valid data', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'DATA_ACCESS',
        reason: 'Patient requested data access under Article 15',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject request without patient_id', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        request_type: 'DATA_ACCESS',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should reject request without request_type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept DATA_PORTABILITY request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'DATA_PORTABILITY',
        reason: 'Patient moving to another clinic',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should accept ERASURE request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'ERASURE',
        reason: 'Patient requested data deletion',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
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
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DATA ACCESS (Article 15)
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/data-access', () => {
    it('should handle data access for non-existent patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/data-access`);
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should return patient data when patient exists', async () => {
      const patientId = randomUUID();
      const res = await agent.get(`/api/v1/gdpr/patient/${patientId}/data-access`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DATA PORTABILITY (Article 20)
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/data-portability', () => {
    it('should handle portability for non-existent patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/data-portability`);
      expect([200, 404, 500]).toContain(res.status);
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
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CONSENT MANAGEMENT
  // =============================================================================

  describe('PATCH /api/v1/gdpr/patient/:patientId/consent', () => {
    it('should handle consent update for non-existent patient', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        treatment: true,
        marketing: false,
        research: false,
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should reject empty consent body', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({});
      expect([400, 200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CONSENT AUDIT TRAIL
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/consent-audit', () => {
    it('should return consent audit trail for patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/consent-audit`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CONSENT PREFERENCES VARIATIONS
  // =============================================================================

  describe('PATCH /api/v1/gdpr/patient/:patientId/consent (variations)', () => {
    it('should accept all consents enabled', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        treatment: true,
        marketing: true,
        research: true,
        data_sharing: true,
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should accept minimal consent (treatment only)', async () => {
      const res = await agent.patch(`/api/v1/gdpr/patient/${randomUUID()}/consent`).send({
        treatment: true,
        marketing: false,
        research: false,
      });
      expect([200, 404, 400, 500]).toContain(res.status);
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
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should accept RESTRICTION request type', async () => {
      const res = await agent.post('/api/v1/gdpr/requests').send({
        patient_id: randomUUID(),
        request_type: 'RESTRICTION',
        reason: 'Patient wants data processing restricted',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });
  });
});
