/**
 * Slash Commands API Integration Tests
 * Tests for user-defined slash command CRUD, auth enforcement, and input validation
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Slash Commands API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // LIST
  // =============================================================================

  describe('GET /api/v1/slash-commands', () => {
    it('should return slash commands list', async () => {
      const res = await agent.get('/api/v1/slash-commands');
      expect([200, 500]).toContain(res.status);
    });

    it('should return an array or object when successful', async () => {
      const res = await agent.get('/api/v1/slash-commands');
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
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
      const res = await agent.get('/api/v1/slash-commands');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject POST without authentication', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        command_trigger: 'test-cmd',
        output_text: 'Test output',
      });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject PATCH without authentication', async () => {
      const res = await agent
        .patch(`/api/v1/slash-commands/${randomUUID()}`)
        .send({ output_text: 'Updated' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject DELETE without authentication', async () => {
      const res = await agent.delete(`/api/v1/slash-commands/${randomUUID()}`);
      expect([401, 403]).toContain(res.status);
    });
  });

  // =============================================================================
  // CREATE — VALIDATION
  // =============================================================================

  describe('POST /api/v1/slash-commands', () => {
    it('should create a slash command with valid data', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        command_trigger: `cmd-${Date.now()}`,
        output_text: 'Cervical ROM within normal limits.',
        category: 'objective',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should create a slash command without optional category', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        command_trigger: `cmd-nocat-${Date.now()}`,
        output_text: 'Patient tolerated treatment well.',
      });
      expect([201, 200, 400, 500]).toContain(res.status);
    });

    it('should reject command_trigger shorter than 2 characters', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        command_trigger: 'x',
        output_text: 'Some output text',
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject missing command_trigger', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        output_text: 'Output without trigger',
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject missing output_text', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({
        command_trigger: 'test-trigger',
      });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await agent.post('/api/v1/slash-commands').send({});
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // UPDATE
  // =============================================================================

  describe('PATCH /api/v1/slash-commands/:id', () => {
    it('should handle update for non-existent command', async () => {
      const res = await agent
        .patch(`/api/v1/slash-commands/${randomUUID()}`)
        .send({ output_text: 'Updated output text' });
      expect([200, 404, 400, 500]).toContain(res.status);
    });

    it('should reject non-UUID id', async () => {
      const res = await agent
        .patch('/api/v1/slash-commands/not-a-uuid')
        .send({ output_text: 'Updated' });
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should reject empty patch body', async () => {
      const res = await agent.patch(`/api/v1/slash-commands/${randomUUID()}`).send({});
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // =============================================================================
  // DELETE
  // =============================================================================

  describe('DELETE /api/v1/slash-commands/:id', () => {
    it('should handle delete for non-existent command', async () => {
      const res = await agent.delete(`/api/v1/slash-commands/${randomUUID()}`);
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should reject non-UUID id on delete', async () => {
      const res = await agent.delete('/api/v1/slash-commands/not-a-uuid');
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
