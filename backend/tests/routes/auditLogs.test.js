/**
 * Audit Logs Route Tests
 * Tests for GET /api/v1/audit-logs (admin-only, GDPR Article 30)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: jest.fn(),
  setTenantContext: jest.fn(),
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock auth middleware
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      id: 'test-user-id',
      email: 'admin@chiroclickehr.no',
      role: 'ADMIN',
      organization_id: 'test-org-id',
    };
    req.organizationId = 'test-org-id';
    next();
  },
  requireRole: (roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  },
}));

const { query } = await import('../../src/config/database.js');

// Dynamic import of express + router after mocks
const express = (await import('express')).default;
const auditLogsRouter = (await import('../../src/routes/auditLogs.js')).default;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/audit-logs', auditLogsRouter);
  return app;
}

// Use supertest
const request = (await import('supertest')).default;

describe('Audit Logs Route', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/v1/audit-logs', () => {
    it('should return paginated audit logs', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '3' }] }).mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            created_at: '2026-03-01',
            user_email: 'admin@chiroclickehr.no',
            user_name: 'Admin User',
            action: 'CREATE',
            resource_type: 'PATIENT',
            resource_id: 'p-1',
          },
          {
            id: '2',
            created_at: '2026-03-01',
            user_email: 'admin@chiroclickehr.no',
            user_name: 'Admin User',
            action: 'UPDATE',
            resource_type: 'PATIENT',
            resource_id: 'p-1',
          },
          {
            id: '3',
            created_at: '2026-03-02',
            user_email: 'admin@chiroclickehr.no',
            user_name: 'Admin User',
            action: 'READ',
            resource_type: 'ENCOUNTER',
            resource_id: 'e-1',
          },
        ],
      });

      const res = await request(app).get('/api/v1/audit-logs');

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(3);
      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);
    });

    it('should apply action filter', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '1' }] }).mockResolvedValueOnce({
        rows: [{ id: '1', action: 'CREATE', resource_type: 'PATIENT' }],
      });

      const res = await request(app).get('/api/v1/audit-logs?action=create');

      expect(res.status).toBe(200);
      // Verify the action filter was passed as uppercase
      const countCall = query.mock.calls[0];
      expect(countCall[0]).toContain('al.action = $1');
      expect(countCall[1]).toContain('CREATE');
    });

    it('should apply date range filters', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }] }).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get(
        '/api/v1/audit-logs?startDate=2026-03-01&endDate=2026-03-02'
      );

      expect(res.status).toBe(200);
      const countCall = query.mock.calls[0];
      expect(countCall[0]).toContain('al.created_at >=');
      expect(countCall[0]).toContain('al.created_at <');
      expect(countCall[1]).toContain('2026-03-01');
      expect(countCall[1]).toContain('2026-03-02');
    });

    it('should apply search filter with ILIKE', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '1' }] }).mockResolvedValueOnce({
        rows: [{ id: '1', user_email: 'admin@chiroclickehr.no' }],
      });

      const res = await request(app).get('/api/v1/audit-logs?search=admin');

      expect(res.status).toBe(200);
      const countCall = query.mock.calls[0];
      expect(countCall[0]).toContain('ILIKE');
      expect(countCall[1]).toContain('%admin%');
    });

    it('should clamp page and limit to valid ranges', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }] }).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/v1/audit-logs?page=-1&limit=999');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(200);
    });

    it('should return 500 on database error', async () => {
      query.mockRejectedValueOnce(new Error('DB connection lost'));

      const res = await request(app).get('/api/v1/audit-logs');

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to fetch');
    });
  });

  describe('GET /api/v1/audit-logs/:id', () => {
    it('should return a single audit log entry', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'abc-123',
            action: 'CREATE',
            resource_type: 'PATIENT',
            user_email: 'admin@chiroclickehr.no',
            user_name: 'Admin User',
          },
        ],
      });

      const res = await request(app).get('/api/v1/audit-logs/abc-123');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('abc-123');
      expect(res.body.action).toBe('CREATE');
    });

    it('should return 404 for non-existent entry', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/v1/audit-logs/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 500 on database error', async () => {
      query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/api/v1/audit-logs/abc-123');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/v1/audit-logs with multiple filters', () => {
    it('should combine action, resourceType, and userRole filters', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }] }).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get(
        '/api/v1/audit-logs?action=create&resourceType=patient&userRole=admin'
      );

      expect(res.status).toBe(200);
      const countCall = query.mock.calls[0];
      expect(countCall[0]).toContain('al.action = $1');
      expect(countCall[0]).toContain('al.resource_type = $2');
      expect(countCall[0]).toContain('al.user_role = $3');
      expect(countCall[1]).toEqual(['CREATE', 'PATIENT', 'ADMIN']);
    });
  });
});
