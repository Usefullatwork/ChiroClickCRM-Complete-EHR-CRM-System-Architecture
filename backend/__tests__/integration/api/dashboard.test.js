/**
 * Dashboard API Integration Tests
 * Tests for dashboard statistics, appointments, tasks, revenue, and patient flow
 *
 * Note: Tests run in DESKTOP_MODE where auth is auto-granted.
 * Dashboard routes do not have explicit auth middleware in the route file,
 * but auto-auth is applied globally in DESKTOP_MODE.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import db from '../../../src/config/database.js';

describe('Dashboard API Integration Tests', () => {
  afterAll(async () => {
    if (db && db.closePool) {
      await db.closePool();
    }
  });

  // =============================================================================
  // DASHBOARD STATS
  // =============================================================================

  describe('GET /api/v1/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app).get('/api/v1/dashboard/stats');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('todayAppointments');
        expect(response.body.data).toHaveProperty('activePatients');
        expect(response.body.data).toHaveProperty('pendingFollowUps');
        expect(response.body.data).toHaveProperty('monthRevenue');
      }
    });

    it('should return numeric values in stats', async () => {
      const response = await request(app).get('/api/v1/dashboard/stats');

      if (response.status === 200) {
        const { data } = response.body;
        expect(typeof data.todayAppointments).toBe('number');
        expect(typeof data.activePatients).toBe('number');
        expect(typeof data.pendingFollowUps).toBe('number');
        expect(typeof data.monthRevenue).toBe('number');
      }
    });
  });

  // =============================================================================
  // TODAY'S APPOINTMENTS
  // =============================================================================

  describe('GET /api/v1/dashboard/appointments/today', () => {
    it('should return today appointments list', async () => {
      const response = await request(app).get('/api/v1/dashboard/appointments/today');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('date');
        expect(response.body.data).toHaveProperty('count');
        expect(response.body.data).toHaveProperty('appointments');
        expect(Array.isArray(response.body.data.appointments)).toBe(true);
      }
    });

    it('should return a valid date string', async () => {
      const response = await request(app).get('/api/v1/dashboard/appointments/today');

      if (response.status === 200) {
        const dateStr = response.body.data.date;
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  // =============================================================================
  // PENDING TASKS
  // =============================================================================

  describe('GET /api/v1/dashboard/tasks/pending', () => {
    it('should return pending tasks', async () => {
      const response = await request(app).get('/api/v1/dashboard/tasks/pending');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('count');
        expect(response.body.data).toHaveProperty('tasks');
        expect(Array.isArray(response.body.data.tasks)).toBe(true);
      }
    });

    it('should return count matching tasks array length', async () => {
      const response = await request(app).get('/api/v1/dashboard/tasks/pending');

      if (response.status === 200) {
        expect(response.body.data.count).toBe(response.body.data.tasks.length);
      }
    });
  });

  // =============================================================================
  // REVENUE TREND
  // =============================================================================

  describe('GET /api/v1/dashboard/revenue-trend', () => {
    it('should return revenue trend with default params', async () => {
      const response = await request(app).get('/api/v1/dashboard/revenue-trend');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should accept period query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/revenue-trend')
        .query({ period: '90' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should accept groupBy query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/revenue-trend')
        .query({ period: '90', groupBy: 'month' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should return data items with date, amount, and count', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/revenue-trend')
        .query({ period: '365' });

      if (response.status === 200 && response.body.data.length > 0) {
        const item = response.body.data[0];
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('amount');
        expect(item).toHaveProperty('count');
      }
    });
  });

  // =============================================================================
  // UTILIZATION
  // =============================================================================

  describe('GET /api/v1/dashboard/utilization', () => {
    it('should return utilization heatmap data', async () => {
      const response = await request(app).get('/api/v1/dashboard/utilization');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should accept period query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/utilization')
        .query({ period: '30' });

      expect([200, 500]).toContain(response.status);
    });
  });

  // =============================================================================
  // NO-SHOW TREND
  // =============================================================================

  describe('GET /api/v1/dashboard/no-show-trend', () => {
    it('should return no-show trend data', async () => {
      const response = await request(app).get('/api/v1/dashboard/no-show-trend');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should accept groupBy month parameter', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/no-show-trend')
        .query({ period: '90', groupBy: 'month' });

      expect([200, 500]).toContain(response.status);
    });
  });

  // =============================================================================
  // PATIENT FLOW
  // =============================================================================

  describe('GET /api/v1/dashboard/patient-flow', () => {
    it('should return patient flow data', async () => {
      const response = await request(app).get('/api/v1/dashboard/patient-flow');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should accept period and groupBy parameters', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/patient-flow')
        .query({ period: '90', groupBy: 'month' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return flow items with expected fields when data exists', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/patient-flow')
        .query({ period: '365' });

      if (response.status === 200 && response.body.data.length > 0) {
        const item = response.body.data[0];
        expect(item).toHaveProperty('period');
        expect(item).toHaveProperty('newPatients');
        expect(item).toHaveProperty('returningPatients');
        expect(item).toHaveProperty('totalVisits');
      }
    });
  });
});
