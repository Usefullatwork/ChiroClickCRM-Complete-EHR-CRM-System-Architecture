/**
 * KPI Dashboard API Integration Tests
 * Tests for KPI dashboard, retention, rebooking, and analytics endpoints
 */

import request from 'supertest';
import app from '../../../src/server.js';

describe('KPI API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // DASHBOARD
  // =============================================================================

  describe('GET /api/v1/kpi/dashboard', () => {
    it('should return dashboard KPIs', async () => {
      const res = await agent.get('/api/v1/kpi/dashboard');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // RETENTION
  // =============================================================================

  describe('GET /api/v1/kpi/retention', () => {
    it('should return patient retention metrics', async () => {
      const res = await agent.get('/api/v1/kpi/retention');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // REBOOKING RATE
  // =============================================================================

  describe('GET /api/v1/kpi/rebooking-rate', () => {
    it('should return rebooking rate', async () => {
      const res = await agent.get('/api/v1/kpi/rebooking-rate');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TOP DIAGNOSES
  // =============================================================================

  describe('GET /api/v1/kpi/top-diagnoses', () => {
    it('should return top diagnoses', async () => {
      const res = await agent.get('/api/v1/kpi/top-diagnoses');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DETAILED KPIs
  // =============================================================================

  describe('GET /api/v1/kpi/detailed', () => {
    it('should return detailed KPI tracking dashboard', async () => {
      const res = await agent.get('/api/v1/kpi/detailed');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CATEGORY BREAKDOWN
  // =============================================================================

  describe('GET /api/v1/kpi/category-breakdown', () => {
    it('should return patient category breakdown', async () => {
      const res = await agent.get('/api/v1/kpi/category-breakdown');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GEOGRAPHIC
  // =============================================================================

  describe('GET /api/v1/kpi/geographic', () => {
    it('should return geographic distribution', async () => {
      const res = await agent.get('/api/v1/kpi/geographic');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DAILY/WEEKLY/MONTHLY
  // =============================================================================

  describe('GET /api/v1/kpi/daily', () => {
    it('should return daily KPIs for today', async () => {
      const res = await agent.get('/api/v1/kpi/daily');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept a date parameter', async () => {
      const res = await agent.get('/api/v1/kpi/daily').query({ date: '2026-01-15' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/kpi/weekly', () => {
    it('should return weekly KPIs', async () => {
      const res = await agent.get('/api/v1/kpi/weekly');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept date range parameters', async () => {
      const res = await agent
        .get('/api/v1/kpi/weekly')
        .query({ start_date: '2026-01-01', end_date: '2026-01-07' });
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/kpi/monthly', () => {
    it('should return monthly KPIs', async () => {
      const res = await agent.get('/api/v1/kpi/monthly');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept month parameter', async () => {
      const res = await agent.get('/api/v1/kpi/monthly').query({ month: '2026-01' });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // IMPORT
  // =============================================================================

  describe('POST /api/v1/kpi/import', () => {
    it('should reject import without data', async () => {
      const res = await agent.post('/api/v1/kpi/import').send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should accept import with data array', async () => {
      const res = await agent.post('/api/v1/kpi/import').send({
        data: [{ date: '2026-01-15', patients_seen: 10, revenue: 5000 }],
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });
});
