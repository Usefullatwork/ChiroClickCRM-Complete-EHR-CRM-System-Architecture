/**
 * Health Check API Tests
 * Simple tests to verify the test infrastructure works
 */

import request from 'supertest';

// Set test environment
process.env.NODE_ENV = 'test';

describe('Health Check API', () => {
  let app;
  let db;

  beforeAll(async () => {
    // Dynamic import to ensure env is set first
    const serverModule = await import('../../../src/server.js');
    app = serverModule.default;
    const dbModule = await import('../../../src/config/database.js');
    db = dbModule.default;
  });

  afterAll(async () => {
    // Close database connections
    if (db && db.closePool) {
      await db.closePool();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect('Content-Type', /json/);

      // Health endpoint returns 200 when healthy, 503 when database is unavailable
      // Both are valid responses - we just verify the structure
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/docs', () => {
    it('should return Swagger documentation', async () => {
      const response = await request(app).get('/api/docs/').expect(200);

      expect(response.text).toContain('swagger');
    });
  });
});
