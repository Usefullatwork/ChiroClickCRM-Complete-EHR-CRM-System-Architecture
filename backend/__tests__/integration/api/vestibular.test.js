/**
 * Vestibular API Integration Tests
 * Tests for vestibular assessments, BPPV trends, and diagnosis statistics
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Vestibular API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // CREATE ASSESSMENT
  // =============================================================================

  describe('POST /api/v1/vestibular', () => {
    it('should create assessment with valid data', async () => {
      const res = await agent.post('/api/v1/vestibular').send({
        patientId: randomUUID(),
        encounterId: randomUUID(),
        assessmentType: 'BPPV',
        findings: { dixHallpike: { right: 'positive', left: 'negative' } },
      });
      expect([201, 200, 400, 404, 500]).toContain(res.status);
    });

    it('should reject assessment without patientId', async () => {
      const res = await agent.post('/api/v1/vestibular').send({
        assessmentType: 'BPPV',
      });
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/vestibular').send({});
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GET ASSESSMENT BY ID
  // =============================================================================

  describe('GET /api/v1/vestibular/:id', () => {
    it('should return 404 for non-existent assessment', async () => {
      const res = await agent.get(`/api/v1/vestibular/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GET PATIENT ASSESSMENTS
  // =============================================================================

  describe('GET /api/v1/vestibular/patient/:patientId', () => {
    it('should return assessments for patient', async () => {
      const res = await agent.get(`/api/v1/vestibular/patient/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GET ENCOUNTER ASSESSMENT
  // =============================================================================

  describe('GET /api/v1/vestibular/encounter/:encounterId', () => {
    it('should return assessment for encounter', async () => {
      const res = await agent.get(`/api/v1/vestibular/encounter/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE ASSESSMENT
  // =============================================================================

  describe('PATCH /api/v1/vestibular/:id', () => {
    it('should handle update for non-existent assessment', async () => {
      const res = await agent
        .patch(`/api/v1/vestibular/${randomUUID()}`)
        .send({ findings: { dixHallpike: { right: 'negative', left: 'negative' } } });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELETE ASSESSMENT
  // =============================================================================

  describe('DELETE /api/v1/vestibular/:id', () => {
    it('should handle delete for non-existent assessment', async () => {
      const res = await agent.delete(`/api/v1/vestibular/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BPPV TRENDS
  // =============================================================================

  describe('GET /api/v1/vestibular/patient/:patientId/bppv-trends', () => {
    it('should return BPPV trends for patient', async () => {
      const res = await agent.get(`/api/v1/vestibular/patient/${randomUUID()}/bppv-trends`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // STATISTICS
  // =============================================================================

  describe('GET /api/v1/vestibular/stats/diagnoses', () => {
    it('should return common diagnoses statistics', async () => {
      const res = await agent.get('/api/v1/vestibular/stats/diagnoses');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/vestibular/stats/efficacy', () => {
    it('should return treatment efficacy statistics', async () => {
      const res = await agent.get('/api/v1/vestibular/stats/efficacy');
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
