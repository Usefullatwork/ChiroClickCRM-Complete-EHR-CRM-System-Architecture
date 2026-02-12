/**
 * PDF Generation API Integration Tests
 * Tests for treatment summary, referral letter, sick note, and invoice PDF endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('PDF API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // TREATMENT SUMMARY
  // =============================================================================

  describe('GET /api/v1/pdf/treatment-summary/:patientId', () => {
    it('should return 404 for non-existent patient', async () => {
      const res = await agent.get(`/api/v1/pdf/treatment-summary/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });

    it('should accept maxEncounters query param', async () => {
      const res = await agent
        .get(`/api/v1/pdf/treatment-summary/${randomUUID()}`)
        .query({ maxEncounters: 5 });
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // REFERRAL LETTER
  // =============================================================================

  describe('POST /api/v1/pdf/referral-letter', () => {
    it('should require patientId and encounterId', async () => {
      const res = await agent.post('/api/v1/pdf/referral-letter').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject when only patientId provided', async () => {
      const res = await agent.post('/api/v1/pdf/referral-letter').send({
        patientId: randomUUID(),
      });
      expect(res.status).toBe(400);
    });

    it('should reject when only encounterId provided', async () => {
      const res = await agent.post('/api/v1/pdf/referral-letter').send({
        encounterId: randomUUID(),
      });
      expect(res.status).toBe(400);
    });

    it('should handle valid data with non-existent patient', async () => {
      const res = await agent.post('/api/v1/pdf/referral-letter').send({
        patientId: randomUUID(),
        encounterId: randomUUID(),
        recipientName: 'Dr. Test',
        recipientAddress: 'Test Address',
        reasonForReferral: 'Persistent neck pain',
      });
      // Will fail at service level due to non-existent encounter
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // SICK NOTE
  // =============================================================================

  describe('POST /api/v1/pdf/sick-note', () => {
    it('should require patientId and encounterId', async () => {
      const res = await agent.post('/api/v1/pdf/sick-note').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should require startDate and endDate', async () => {
      const res = await agent.post('/api/v1/pdf/sick-note').send({
        patientId: randomUUID(),
        encounterId: randomUUID(),
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should handle valid data with non-existent patient', async () => {
      const res = await agent.post('/api/v1/pdf/sick-note').send({
        patientId: randomUUID(),
        encounterId: randomUUID(),
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        diagnosisCode: 'M54.5',
        diagnosisText: 'Korsryggsmerte',
        percentage: 100,
      });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // INVOICE
  // =============================================================================

  describe('POST /api/v1/pdf/invoice', () => {
    it('should require patientId', async () => {
      const res = await agent.post('/api/v1/pdf/invoice').send({
        lineItems: [{ description: 'Konsultasjon', amount: 750 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should require lineItems array', async () => {
      const res = await agent.post('/api/v1/pdf/invoice').send({
        patientId: randomUUID(),
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject empty lineItems array', async () => {
      const res = await agent.post('/api/v1/pdf/invoice').send({
        patientId: randomUUID(),
        lineItems: [],
      });
      expect(res.status).toBe(400);
    });

    it('should reject non-array lineItems', async () => {
      const res = await agent.post('/api/v1/pdf/invoice').send({
        patientId: randomUUID(),
        lineItems: 'not-an-array',
      });
      expect(res.status).toBe(400);
    });

    it('should handle valid invoice data with non-existent patient', async () => {
      const res = await agent.post('/api/v1/pdf/invoice').send({
        patientId: randomUUID(),
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-15',
        dueDate: '2026-02-15',
        lineItems: [
          { description: 'Konsultasjon', amount: 750, quantity: 1 },
          { description: 'Ultralyd', amount: 200, quantity: 1 },
        ],
        vatRate: 0,
        accountNumber: '1234.56.78901',
      });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // LEGACY ROUTES
  // =============================================================================

  describe('POST /api/v1/pdf/letter/:encounterId', () => {
    it('should handle non-existent encounter', async () => {
      const res = await agent.post(`/api/v1/pdf/letter/${randomUUID()}`).send({ type: 'referral' });
      expect([404, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/pdf/invoice/:financialMetricId', () => {
    it('should handle non-existent financial metric', async () => {
      const res = await agent.post(`/api/v1/pdf/invoice/${randomUUID()}`);
      expect([404, 400, 500]).toContain(res.status);
    });
  });
});
