/**
 * Audit Logs API Integration Tests
 * Tests for audit log listing and single-entry lookup.
 *
 * The /api/v1/audit-logs route IS mounted in server.js and requires ADMIN role.
 * In DESKTOP_MODE the user is auto-authenticated as ADMIN, so all list/get
 * requests should succeed.
 *
 * There is no dedicated /export sub-route — GET /audit-logs/export hits the
 * GET /:id handler with id="export" which returns 404 (entry not found).
 *
 * The GDPR consent audit trail lives at /api/v1/gdpr/patient/:patientId/consent-audit.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Audit Logs API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // AUDIT LOGS LIST
  // =============================================================================

  describe('GET /api/v1/audit-logs', () => {
    it('should return paginated audit logs', async () => {
      const res = await agent.get('/api/v1/audit-logs');
      expect(res.status).toBe(200);
    });

    it('should handle action filter param', async () => {
      const res = await agent.get('/api/v1/audit-logs').query({ action: 'LOGIN' });
      expect(res.status).toBe(200);
    });

    it('should handle date range filter', async () => {
      const res = await agent.get('/api/v1/audit-logs').query({
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      });
      expect(res.status).toBe(200);
    });

    it('should handle pagination params', async () => {
      const res = await agent.get('/api/v1/audit-logs').query({
        page: 1,
        limit: 20,
      });
      expect(res.status).toBe(200);
    });
  });

  // =============================================================================
  // AUDIT LOG SINGLE ENTRY
  // =============================================================================

  describe('GET /api/v1/audit-logs/:id', () => {
    it('should return 404 for non-existent audit log entry', async () => {
      const res = await agent.get(`/api/v1/audit-logs/${randomUUID()}`);
      expect(res.status).toBe(404);
    });
  });

  // =============================================================================
  // GDPR CONSENT AUDIT (route: /gdpr/patient/:patientId/consent-audit)
  // =============================================================================

  describe('GET /api/v1/gdpr/patient/:patientId/consent-audit', () => {
    it('should return consent audit trail for a patient', async () => {
      const res = await agent.get(`/api/v1/gdpr/patient/${randomUUID()}/consent-audit`);
      expect(res.status).toBe(200);
    });
  });
});
