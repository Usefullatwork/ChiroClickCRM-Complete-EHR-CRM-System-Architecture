/**
 * API Integration Tests
 * Tests for API endpoints using supertest
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';

// Mock modules before importing app
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  getClient: jest.fn(),
  transaction: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  default: {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    getClient: jest.fn(),
    transaction: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/utils/keyRotation.js', () => ({
  scheduleKeyRotation: jest.fn(),
  createKeyRotationTable: jest.fn().mockResolvedValue(true),
  default: {
    scheduleKeyRotation: jest.fn(),
    createKeyRotationTable: jest.fn().mockResolvedValue(true),
  },
}));

// Auth is now local session-based (no Clerk)
// The auth middleware checks req.cookies.session and validates via sessions table
// For tests, we mock the database to return a valid user

// Set environment variables
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars__!';
process.env.PORT = '3001';

describe('API Integration Tests', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = await import('../../src/config/database.js');
    const serverModule = await import('../../src/server.js');
    app = serverModule.default;
  });

  afterAll(async () => {
    // Clean up
  });

  describe('Health Check', () => {
    it('GET /health should return healthy status', async () => {
      db.healthCheck.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('GET /health should return unhealthy when database is down', async () => {
      db.healthCheck.mockResolvedValue(false);

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toBe('disconnected');
    });
  });

  describe('API Root', () => {
    it('GET /api/v1 should return API information', async () => {
      const response = await request(app).get('/api/v1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('ChiroClickCRM API');
      expect(response.body.version).toBe('v1');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('Patients API', () => {
    beforeAll(() => {
      // Mock user in database
      db.query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT') && sql.includes('users') && sql.includes('WHERE')) {
          return Promise.resolve({
            rows: [{
              id: 'test-user-id',
              organization_id: 'test-org-id',
              role: 'PRACTITIONER',
              is_active: true,
            }],
          });
        }
        if (sql.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '0' }] });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
    });

    it('GET /api/v1/patients should require organization header', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Organization');
    });

    it('GET /api/v1/patients should return patients list', async () => {
      db.query.mockImplementation((sql) => {
        if (sql.includes('SELECT * FROM users')) {
          return Promise.resolve({
            rows: [{
              id: 'test-user-id',
              organization_id: 'test-org-id',
              role: 'PRACTITIONER',
              is_active: true,
            }],
          });
        }
        if (sql.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        if (sql.includes('SELECT') && sql.includes('patients')) {
          return Promise.resolve({
            rows: [
              { id: '1', first_name: 'John', last_name: 'Doe' },
              { id: '2', first_name: 'Jane', last_name: 'Smith' },
            ],
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', 'Bearer test-token')
        .set('X-Organization-Id', 'test-org-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('patients');
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      const response = await request(app).get('/api/v1');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});
