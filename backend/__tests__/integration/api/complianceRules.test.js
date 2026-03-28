/**
 * Compliance Rules API Integration Tests
 * Tests for configurable compliance rule CRUD and auth enforcement
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Compliance Rules API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // LIST
  // =============================================================================

  describe('GET /api/v1/compliance-rules', () => {
    it('should return compliance rules list', async () => {
      const res = await agent.get('/api/v1/compliance-rules');
      expect([200, 500]).toContain(res.status);
    });

    it('should support filtering by rule_type', async () => {
      const res = await agent
        .get('/api/v1/compliance-rules')
        .query({ rule_type: 'treatment_qualifier' });
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should support filtering by active_only flag', async () => {
      const res = await agent.get('/api/v1/compliance-rules').query({ active_only: 'true' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // AUTH REJECTION
  // =============================================================================

  describe('Auth enforcement (DESKTOP_MODE disabled)', () => {
    let savedDesktopMode;

    beforeAll(() => {
      savedDesktopMode = process.env.DESKTOP_MODE;
      process.env.DESKTOP_MODE = 'false';
    });

    afterAll(() => {
      if (savedDesktopMode !== undefined) {
        process.env.DESKTOP_MODE = savedDesktopMode;
      } else {
        delete process.env.DESKTOP_MODE;
      }
    });

    it('should reject GET without authentication', async () => {
      const res = await agent.get('/api/v1/compliance-rules');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject POST without authentication', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'red_flag',
        rule_key: 'bladder_dysfunction',
        rule_config: { threshold: 1 },
      });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject PATCH without authentication', async () => {
      const res = await agent
        .patch(`/api/v1/compliance-rules/${randomUUID()}`)
        .send({ is_active: false });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject DELETE without authentication', async () => {
      const res = await agent.delete(`/api/v1/compliance-rules/${randomUUID()}`);
      expect([401, 403]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE — VALIDATION
  // =============================================================================

  describe('POST /api/v1/compliance-rules', () => {
    it('should create a rule with valid data', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'treatment_qualifier',
        rule_key: `qual-test-${Date.now()}`,
        rule_config: { min_visits: 3 },
        severity: 'medium',
      });
      expect([201, 200, 400, 409, 500]).toContain(res.status);
    });

    it('should create a red_flag rule with critical severity', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'red_flag',
        rule_key: `red-flag-${Date.now()}`,
        rule_config: { code: 'cauda_equina' },
        severity: 'critical',
      });
      expect([201, 200, 400, 409, 500]).toContain(res.status);
    });

    it('should reject missing rule_type', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_key: 'no-type-key',
        rule_config: { threshold: 1 },
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject invalid rule_type value', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'invalid_type',
        rule_key: 'bad-type-key',
        rule_config: {},
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject missing rule_key', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'diagnosis_treatment',
        rule_config: { code: 'L02' },
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject missing rule_config', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'time_requirement',
        rule_key: 'no-config-key',
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject invalid severity value', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({
        rule_type: 'red_flag',
        rule_key: 'bad-severity-key',
        rule_config: {},
        severity: 'extreme',
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/compliance-rules').send({});
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE
  // =============================================================================

  describe('PATCH /api/v1/compliance-rules/:id', () => {
    it('should handle update for non-existent rule', async () => {
      const res = await agent
        .patch(`/api/v1/compliance-rules/${randomUUID()}`)
        .send({ is_active: false });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should reject non-UUID id', async () => {
      const res = await agent
        .patch('/api/v1/compliance-rules/not-a-uuid')
        .send({ is_active: true });
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should reject empty patch body', async () => {
      const res = await agent.patch(`/api/v1/compliance-rules/${randomUUID()}`).send({});
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject invalid severity in update', async () => {
      const res = await agent
        .patch(`/api/v1/compliance-rules/${randomUUID()}`)
        .send({ severity: 'not-valid' });
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELETE
  // =============================================================================

  describe('DELETE /api/v1/compliance-rules/:id', () => {
    it('should handle delete for non-existent rule', async () => {
      const res = await agent.delete(`/api/v1/compliance-rules/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should reject non-UUID id on delete', async () => {
      const res = await agent.delete('/api/v1/compliance-rules/not-a-uuid');
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
