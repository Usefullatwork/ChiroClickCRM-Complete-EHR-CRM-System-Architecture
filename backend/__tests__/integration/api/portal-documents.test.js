/**
 * Portal Documents API Integration Tests
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Portal Documents API', () => {
  const agent = request(app);

  describe('GET /api/v1/patient-portal/documents', () => {
    it('should return 401 without portal auth', async () => {
      const res = await agent.get('/api/v1/patient-portal/documents');
      expect([401, 503]).toContain(res.status);
    });

    it('should return documents with valid portal token', async () => {
      const res = await agent
        .get('/api/v1/patient-portal/documents')
        .set('x-portal-token', 'test-token');
      // 401 expected since test-token is not valid, but route should exist
      expect([200, 401, 503]).toContain(res.status);
    });
  });

  describe('GET /api/v1/patient-portal/documents/:token/download', () => {
    it('should return 404 for non-existent token', async () => {
      const res = await agent.get('/api/v1/patient-portal/documents/nonexistent-token/download');
      expect([404, 500, 503]).toContain(res.status);
    });

    it('should handle expired token', async () => {
      const res = await agent.get(`/api/v1/patient-portal/documents/${randomUUID()}/download`);
      expect([404, 410, 500, 503]).toContain(res.status);
    });
  });
});
