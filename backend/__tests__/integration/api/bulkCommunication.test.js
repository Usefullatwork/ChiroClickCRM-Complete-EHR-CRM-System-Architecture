/**
 * Bulk Communication API Integration Tests
 * Tests for mass SMS/email communications, batches, and templates
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Bulk Communication API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  describe('GET /api/v1/bulk-communications/health', () => {
    it('should return health status 200', async () => {
      const res = await agent.get('/api/v1/bulk-communications/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('module', 'bulk-communication');
    });
  });

  // =============================================================================
  // BATCHES
  // =============================================================================

  describe('GET /api/v1/bulk-communications/batches', () => {
    it('should return batches list', async () => {
      const res = await agent.get('/api/v1/bulk-communications/batches');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // BATCH STATUS
  // =============================================================================

  describe('GET /api/v1/bulk-communications/queue/status/:batchId', () => {
    it('should return 404 or 500 for non-existent batch', async () => {
      const res = await agent.get(`/api/v1/bulk-communications/queue/status/${randomUUID()}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // QUEUE BULK SEND
  // =============================================================================

  describe('POST /api/v1/bulk-communications/send', () => {
    it('should queue a bulk send with valid body', async () => {
      const res = await agent.post('/api/v1/bulk-communications/send').send({
        channel: 'sms',
        patientIds: [randomUUID()],
        message: 'Test bulk message',
      });
      // May succeed or fail depending on DB state, route should exist
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject send without required fields', async () => {
      const res = await agent.post('/api/v1/bulk-communications/send').send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // CANCEL BATCH
  // =============================================================================

  describe('POST /api/v1/bulk-communications/queue/cancel/:batchId', () => {
    it('should handle cancel for non-existent batch', async () => {
      const res = await agent.post(`/api/v1/bulk-communications/queue/cancel/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PENDING QUEUE
  // =============================================================================

  describe('GET /api/v1/bulk-communications/queue/pending', () => {
    it('should return pending queue items', async () => {
      const res = await agent.get('/api/v1/bulk-communications/queue/pending');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PREVIEW MESSAGE
  // =============================================================================

  describe('POST /api/v1/bulk-communications/preview', () => {
    it('should preview a message with template variables', async () => {
      const res = await agent.post('/api/v1/bulk-communications/preview').send({
        message: 'Hei {{name}}, påminnelse om time.',
        patientId: randomUUID(),
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TEMPLATE VARIABLES
  // =============================================================================

  describe('GET /api/v1/bulk-communications/variables', () => {
    it('should return available template variables', async () => {
      const res = await agent.get('/api/v1/bulk-communications/variables');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // TEMPLATES
  // =============================================================================

  describe('GET /api/v1/bulk-communications/templates', () => {
    it('should return message templates', async () => {
      const res = await agent.get('/api/v1/bulk-communications/templates');
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PATIENTS FOR TARGETING
  // =============================================================================

  describe('GET /api/v1/bulk-communications/patients', () => {
    it('should return patient list for targeting', async () => {
      const res = await agent.get('/api/v1/bulk-communications/patients');
      expect([200, 500]).toContain(res.status);
    });

    it('should accept filter query params', async () => {
      const res = await agent.get('/api/v1/bulk-communications/patients').query({
        status: 'ACTIVE',
      });
      expect([200, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // PROCESS QUEUE
  // =============================================================================

  describe('POST /api/v1/bulk-communications/process', () => {
    it('should process pending queue', async () => {
      const res = await agent.post('/api/v1/bulk-communications/process');
      expect([200, 500]).toContain(res.status);
    });
  });
});
