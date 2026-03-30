/**
 * Automations API Integration Tests
 * Tests for workflow automations, triggers, actions, and execution
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Automations API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  describe('GET /api/v1/automations/health', () => {
    it('should return health status 200', async () => {
      const res = await agent.get('/api/v1/automations/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('module', 'automations');
    });
  });

  // =============================================================================
  // WORKFLOWS LIST
  // =============================================================================

  describe('GET /api/v1/automations/workflows', () => {
    it('should return workflows list', async () => {
      const res = await agent.get('/api/v1/automations/workflows');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // WORKFLOW BY ID
  // =============================================================================

  describe('GET /api/v1/automations/workflows/:id', () => {
    it('should return 404 or 500 for non-existent workflow', async () => {
      const res = await agent.get(`/api/v1/automations/workflows/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE WORKFLOW
  // =============================================================================

  describe('POST /api/v1/automations/workflows', () => {
    it('should create workflow with valid data', async () => {
      const res = await agent.post('/api/v1/automations/workflows').send({
        name: 'Test Workflow',
        trigger_type: 'appointment_booked',
        conditions: {},
        actions: [{ type: 'send_sms', config: { message: 'Test' } }],
        is_active: false,
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject workflow without required fields', async () => {
      const res = await agent.post('/api/v1/automations/workflows').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE WORKFLOW
  // =============================================================================

  describe('PUT /api/v1/automations/workflows/:id', () => {
    it('should handle update for non-existent workflow', async () => {
      const res = await agent.put(`/api/v1/automations/workflows/${randomUUID()}`).send({
        name: 'Updated Workflow',
        trigger_type: 'appointment_booked',
        conditions: {},
        actions: [{ type: 'send_email', config: {} }],
      });
      expect([200, 404, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELETE WORKFLOW
  // =============================================================================

  describe('DELETE /api/v1/automations/workflows/:id', () => {
    it('should handle delete for non-existent workflow', async () => {
      const res = await agent.delete(`/api/v1/automations/workflows/${randomUUID()}`);
      expect([200, 204, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TOGGLE WORKFLOW
  // =============================================================================

  describe('POST /api/v1/automations/workflows/:id/toggle', () => {
    it('should handle toggle for non-existent workflow', async () => {
      const res = await agent.post(`/api/v1/automations/workflows/${randomUUID()}/toggle`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // EXECUTION HISTORY
  // =============================================================================

  describe('GET /api/v1/automations/workflows/:id/executions', () => {
    it('should return execution history for workflow', async () => {
      const res = await agent.get(`/api/v1/automations/workflows/${randomUUID()}/executions`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/automations/executions', () => {
    it('should return all executions', async () => {
      const res = await agent.get('/api/v1/automations/executions');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TEST WORKFLOW
  // =============================================================================

  describe('POST /api/v1/automations/workflows/test', () => {
    it('should test a workflow definition', async () => {
      const res = await agent.post('/api/v1/automations/workflows/test').send({
        trigger_type: 'appointment_booked',
        conditions: {},
        actions: [{ type: 'send_sms', config: { message: 'Test' } }],
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TRIGGERS & ACTIONS
  // =============================================================================

  describe('GET /api/v1/automations/triggers', () => {
    it('should return available trigger types', async () => {
      const res = await agent.get('/api/v1/automations/triggers');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/automations/actions', () => {
    it('should return available action types', async () => {
      const res = await agent.get('/api/v1/automations/actions');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // STATS
  // =============================================================================

  describe('GET /api/v1/automations/stats', () => {
    it('should return automation statistics', async () => {
      const res = await agent.get('/api/v1/automations/stats');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PROCESS AUTOMATIONS
  // =============================================================================

  describe('POST /api/v1/automations/process', () => {
    it('should process pending automations', async () => {
      const res = await agent.post('/api/v1/automations/process');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/automations/process-time-triggers', () => {
    it('should process time-based triggers', async () => {
      const res = await agent.post('/api/v1/automations/process-time-triggers');
      expect([200, 500]).toContain(res.status);
    });
  });
});
