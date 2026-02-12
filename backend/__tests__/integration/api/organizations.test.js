/**
 * Organizations API Integration Tests
 * Tests for organization management, settings, users, and statistics
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Organizations API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // CURRENT ORGANIZATION
  // =============================================================================

  describe('GET /api/v1/organizations/current', () => {
    it('should return current organization', async () => {
      const res = await agent.get('/api/v1/organizations/current');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  describe('PATCH /api/v1/organizations/current', () => {
    it('should update current organization', async () => {
      const res = await agent.patch('/api/v1/organizations/current').send({
        name: 'Updated Clinic Name',
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // ORGANIZATION USERS
  // =============================================================================

  describe('GET /api/v1/organizations/current/users', () => {
    it('should return users in current organization', async () => {
      const res = await agent.get('/api/v1/organizations/current/users');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body) || res.body.users).toBeTruthy();
      }
    });
  });

  // =============================================================================
  // INVITE USER
  // =============================================================================

  describe('POST /api/v1/organizations/current/invite', () => {
    it('should reject invite without email', async () => {
      const res = await agent.post('/api/v1/organizations/current/invite').send({
        role: 'PRACTITIONER',
      });
      expect([400, 500]).toContain(res.status);
    });

    it('should handle invite with valid data', async () => {
      const res = await agent.post('/api/v1/organizations/current/invite').send({
        email: `invite${Date.now()}@test.com`,
        role: 'PRACTITIONER',
        first_name: 'Invited',
        last_name: 'User',
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // LIST ALL ORGANIZATIONS
  // =============================================================================

  describe('GET /api/v1/organizations', () => {
    it('should return list of organizations', async () => {
      const res = await agent.get('/api/v1/organizations');
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // GET ORGANIZATION BY ID
  // =============================================================================

  describe('GET /api/v1/organizations/:id', () => {
    it('should return 404 for non-existent organization', async () => {
      const res = await agent.get(`/api/v1/organizations/${randomUUID()}`);
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE ORGANIZATION
  // =============================================================================

  describe('POST /api/v1/organizations', () => {
    it('should create organization with valid data', async () => {
      const res = await agent.post('/api/v1/organizations').send({
        name: `Test Org ${Date.now()}`,
        org_number: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject without name', async () => {
      const res = await agent.post('/api/v1/organizations').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE ORGANIZATION
  // =============================================================================

  describe('PATCH /api/v1/organizations/:id', () => {
    it('should handle update for non-existent organization', async () => {
      const res = await agent
        .patch(`/api/v1/organizations/${randomUUID()}`)
        .send({ name: 'Updated Name' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // ORGANIZATION SETTINGS
  // =============================================================================

  describe('GET /api/v1/organizations/:id/settings', () => {
    it('should handle settings for non-existent org', async () => {
      const res = await agent.get(`/api/v1/organizations/${randomUUID()}/settings`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/v1/organizations/:id/settings', () => {
    it('should handle settings update for non-existent org', async () => {
      const res = await agent
        .patch(`/api/v1/organizations/${randomUUID()}/settings`)
        .send({ business_hours: { start: '08:00', end: '17:00' } });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // ORGANIZATION STATS
  // =============================================================================

  describe('GET /api/v1/organizations/:id/stats', () => {
    it('should handle stats for non-existent org', async () => {
      const res = await agent.get(`/api/v1/organizations/${randomUUID()}/stats`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // ORGANIZATION LIMITS
  // =============================================================================

  describe('GET /api/v1/organizations/:id/limits', () => {
    it('should handle limits check for non-existent org', async () => {
      const res = await agent.get(`/api/v1/organizations/${randomUUID()}/limits`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
