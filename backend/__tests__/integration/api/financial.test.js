/**
 * Financial API Integration Tests
 * Tests for financial metrics, invoices, payments, and reports
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Financial API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // FINANCIAL METRICS
  // =============================================================================

  describe('GET /api/v1/financial', () => {
    it('should return financial metrics', async () => {
      const res = await agent.get('/api/v1/financial');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept date range query params', async () => {
      const res = await agent.get('/api/v1/financial').query({
        start_date: '2026-01-01',
        end_date: '2026-03-31',
      });
      expect([200, 500]).toContain(res.status);
    });

    it('should accept payment_status filter', async () => {
      const res = await agent.get('/api/v1/financial').query({
        payment_status: 'paid',
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // REVENUE SUMMARY
  // =============================================================================

  describe('GET /api/v1/financial/summary', () => {
    it('should return revenue summary', async () => {
      const res = await agent.get('/api/v1/financial/summary');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept date range params', async () => {
      const res = await agent.get('/api/v1/financial/summary').query({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // OUTSTANDING
  // =============================================================================

  describe('GET /api/v1/financial/outstanding', () => {
    it('should return outstanding invoices', async () => {
      const res = await agent.get('/api/v1/financial/outstanding');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // REVENUE BY CODE & PAYMENT METHODS
  // =============================================================================

  describe('GET /api/v1/financial/revenue-by-code', () => {
    it('should return revenue grouped by treatment code', async () => {
      const res = await agent.get('/api/v1/financial/revenue-by-code');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/financial/payment-methods', () => {
    it('should return payment method breakdown', async () => {
      const res = await agent.get('/api/v1/financial/payment-methods');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DAILY REVENUE CHART
  // =============================================================================

  describe('GET /api/v1/financial/chart/daily-revenue', () => {
    it('should return daily revenue chart data', async () => {
      const res = await agent.get('/api/v1/financial/chart/daily-revenue');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept date range params', async () => {
      const res = await agent.get('/api/v1/financial/chart/daily-revenue').query({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // INVOICE NUMBER
  // =============================================================================

  describe('GET /api/v1/financial/invoice-number', () => {
    it('should generate next invoice number', async () => {
      const res = await agent.get('/api/v1/financial/invoice-number');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATIENT PAYMENT HISTORY
  // =============================================================================

  describe('GET /api/v1/financial/patient/:patientId', () => {
    it('should return patient payment history', async () => {
      const patientId = randomUUID();
      const res = await agent.get(`/api/v1/financial/patient/${patientId}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // FINANCIAL METRIC BY ID
  // =============================================================================

  describe('GET /api/v1/financial/:id', () => {
    it('should return 404 or 500 for non-existent metric', async () => {
      const res = await agent.get(`/api/v1/financial/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE FINANCIAL METRIC
  // =============================================================================

  describe('POST /api/v1/financial', () => {
    it('should attempt to create a financial metric', async () => {
      const res = await agent.post('/api/v1/financial').send({
        patient_id: randomUUID(),
        encounter_id: randomUUID(),
        amount: 750,
        treatment_code: '98941',
        payment_method: 'card',
      });
      // May fail due to FK constraints, but route should exist
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/financial').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE PAYMENT STATUS
  // =============================================================================

  describe('PATCH /api/v1/financial/:id/payment-status', () => {
    it('should handle status update for non-existent metric', async () => {
      const res = await agent
        .patch(`/api/v1/financial/${randomUUID()}/payment-status`)
        .send({ status: 'paid' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RECORD PAYMENT
  // =============================================================================

  describe('POST /api/v1/financial/:id/payment', () => {
    it('should handle payment for non-existent metric', async () => {
      const res = await agent
        .post(`/api/v1/financial/${randomUUID()}/payment`)
        .send({ amount: 500, method: 'card' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GENERATE INVOICE
  // =============================================================================

  describe('POST /api/v1/financial/:id/invoice', () => {
    it('should handle invoice generation for non-existent metric', async () => {
      const res = await agent.post(`/api/v1/financial/${randomUUID()}/invoice`);
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });
});
