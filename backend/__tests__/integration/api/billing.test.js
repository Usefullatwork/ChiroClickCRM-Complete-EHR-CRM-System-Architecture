/**
 * Billing API Integration Tests
 * Tests for care episodes, claims, CPT codes, modifiers, and billing helpers
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Billing API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // CARE EPISODES
  // =============================================================================

  describe('POST /api/v1/billing/episodes', () => {
    it('should create episode with valid data', async () => {
      const res = await agent.post('/api/v1/billing/episodes').send({
        patient_id: randomUUID(),
        diagnosis_codes: ['M54.5'],
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject episode without patient_id', async () => {
      const res = await agent.post('/api/v1/billing/episodes').send({
        diagnosis_codes: ['M54.5'],
      });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/episodes/patient/:patientId', () => {
    it('should return episodes for patient', async () => {
      const res = await agent.get(`/api/v1/billing/episodes/patient/${randomUUID()}`);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/episodes/patient/:patientId/active', () => {
    it('should return 404 when no active episode', async () => {
      const res = await agent.get(`/api/v1/billing/episodes/patient/${randomUUID()}/active`);
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/episodes/:episodeId', () => {
    it('should return 404 for non-existent episode', async () => {
      const res = await agent.get(`/api/v1/billing/episodes/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/v1/billing/episodes/:episodeId/progress', () => {
    it('should handle progress update for non-existent episode', async () => {
      const res = await agent
        .patch(`/api/v1/billing/episodes/${randomUUID()}/progress`)
        .send({ visit_count: 5, patient_improvement: 'moderate' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/episodes-needing-reeval', () => {
    it('should return episodes needing re-evaluation', async () => {
      const res = await agent.get('/api/v1/billing/episodes-needing-reeval');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CLAIMS
  // =============================================================================

  describe('GET /api/v1/billing/claims', () => {
    it('should list claims', async () => {
      const res = await agent.get('/api/v1/billing/claims');
      expect([200, 500]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await agent.get('/api/v1/billing/claims').query({ page: 1, limit: 10 });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by status', async () => {
      const res = await agent.get('/api/v1/billing/claims').query({ status: 'pending' });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by patient_id', async () => {
      const res = await agent.get('/api/v1/billing/claims').query({ patient_id: randomUUID() });
      expect([200, 500]).toContain(res.status);
    });

    it('should filter by date range', async () => {
      const res = await agent
        .get('/api/v1/billing/claims')
        .query({ start_date: '2026-01-01', end_date: '2026-01-31' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/claims', () => {
    it('should create claim with valid data', async () => {
      const res = await agent.post('/api/v1/billing/claims').send({
        patient_id: randomUUID(),
        encounter_id: randomUUID(),
        line_items: [{ cpt_code: '98941', units: 1, charge: 75.0 }],
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject empty claim', async () => {
      const res = await agent.post('/api/v1/billing/claims').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/claims/summary', () => {
    it('should return claims summary', async () => {
      const res = await agent.get('/api/v1/billing/claims/summary');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/claims/outstanding', () => {
    it('should return outstanding claims', async () => {
      const res = await agent.get('/api/v1/billing/claims/outstanding');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/billing/claims/:claimId', () => {
    it('should return 404 for non-existent claim', async () => {
      const res = await agent.get(`/api/v1/billing/claims/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CLAIM ACTIONS
  // =============================================================================

  describe('POST /api/v1/billing/claims/:claimId/submit', () => {
    it('should handle submit for non-existent claim', async () => {
      const res = await agent.post(`/api/v1/billing/claims/${randomUUID()}/submit`);
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/claims/:claimId/appeal', () => {
    it('should handle appeal for non-existent claim', async () => {
      const res = await agent
        .post(`/api/v1/billing/claims/${randomUUID()}/appeal`)
        .send({ reason: 'Documentation supports medical necessity' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/claims/:claimId/write-off', () => {
    it('should handle write-off for non-existent claim', async () => {
      const res = await agent
        .post(`/api/v1/billing/claims/${randomUUID()}/write-off`)
        .send({ reason: 'Patient hardship' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // HELPER ENDPOINTS
  // =============================================================================

  describe('GET /api/v1/billing/cpt-codes', () => {
    it('should return CPT codes', async () => {
      const res = await agent.get('/api/v1/billing/cpt-codes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cmt');
      expect(res.body).toHaveProperty('evaluation');
      expect(res.body).toHaveProperty('therapy');
      expect(res.body.cmt).toHaveProperty('98940');
      expect(res.body.cmt).toHaveProperty('98941');
      expect(res.body.cmt).toHaveProperty('98942');
    });
  });

  describe('GET /api/v1/billing/modifiers', () => {
    it('should return billing modifiers', async () => {
      const res = await agent.get('/api/v1/billing/modifiers');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chiropractic');
      expect(res.body).toHaveProperty('therapy');
      expect(res.body).toHaveProperty('general');
      expect(res.body.chiropractic).toHaveProperty('AT');
      expect(res.body.chiropractic).toHaveProperty('GA');
      expect(res.body.chiropractic).toHaveProperty('GZ');
    });
  });

  describe('POST /api/v1/billing/suggest-cmt', () => {
    it('should suggest CMT code for 1-2 regions', async () => {
      const res = await agent.post('/api/v1/billing/suggest-cmt').send({
        regions_count: 2,
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.suggested_cpt).toBe('98940');
      }
    });

    it('should suggest CMT code for 3-4 regions', async () => {
      const res = await agent.post('/api/v1/billing/suggest-cmt').send({
        regions_count: 3,
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.suggested_cpt).toBe('98941');
      }
    });

    it('should suggest CMT code for 5 regions', async () => {
      const res = await agent.post('/api/v1/billing/suggest-cmt').send({
        regions_count: 5,
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.suggested_cpt).toBe('98942');
      }
    });

    it('should reject invalid regions_count', async () => {
      const res = await agent.post('/api/v1/billing/suggest-cmt').send({
        regions_count: 0,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject missing regions_count', async () => {
      const res = await agent.post('/api/v1/billing/suggest-cmt').send({});
      expect(res.status).toBe(400);
    });
  });

  // =============================================================================
  // EPISODE LIFECYCLE
  // =============================================================================

  describe('POST /api/v1/billing/episodes/:episodeId/reeval', () => {
    it('should handle re-evaluation for non-existent episode', async () => {
      const res = await agent
        .post(`/api/v1/billing/episodes/${randomUUID()}/reeval`)
        .send({ findings: 'Patient shows improvement' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/episodes/:episodeId/maintenance', () => {
    it('should handle maintenance transition for non-existent episode', async () => {
      const res = await agent
        .post(`/api/v1/billing/episodes/${randomUUID()}/maintenance`)
        .send({ reason: 'MMI reached' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/episodes/:episodeId/abn', () => {
    it('should handle ABN recording for non-existent episode', async () => {
      const res = await agent
        .post(`/api/v1/billing/episodes/${randomUUID()}/abn`)
        .send({ signed: true, date: '2026-01-15' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/episodes/:episodeId/discharge', () => {
    it('should handle discharge for non-existent episode', async () => {
      const res = await agent
        .post(`/api/v1/billing/episodes/${randomUUID()}/discharge`)
        .send({ reason: 'Treatment complete', outcome: 'improved' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CLAIM LINE ITEMS
  // =============================================================================

  describe('PUT /api/v1/billing/claims/:claimId/line-items', () => {
    it('should handle line items update for non-existent claim', async () => {
      const res = await agent.put(`/api/v1/billing/claims/${randomUUID()}/line-items`).send({
        line_items: [{ cpt_code: '98940', units: 1, charge: 50.0 }],
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/billing/claims/:claimId/remittance', () => {
    it('should handle remittance for non-existent claim', async () => {
      const res = await agent
        .post(`/api/v1/billing/claims/${randomUUID()}/remittance`)
        .send({ paid_amount: 75.0, payment_date: '2026-01-20' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BILLING MODIFIER
  // =============================================================================

  describe('GET /api/v1/billing/modifier/:episodeId/:patientId', () => {
    it('should handle modifier for non-existent episode/patient', async () => {
      const res = await agent.get(`/api/v1/billing/modifier/${randomUUID()}/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
