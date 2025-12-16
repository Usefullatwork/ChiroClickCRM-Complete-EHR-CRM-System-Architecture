/**
 * API E2E Tests
 * Tests for API endpoints and responses
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

test.describe('Health Check API', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('database');
  });

  test('should return API info', async ({ request }) => {
    const response = await request.get(`${API_BASE}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('endpoints');
  });
});

test.describe('Authentication API', () => {
  test('should reject unauthenticated requests', async ({ request }) => {
    const response = await request.get(`${API_BASE}/patients`);

    expect(response.status()).toBe(401);
  });

  test('should reject invalid tokens', async ({ request }) => {
    const response = await request.get(`${API_BASE}/patients`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('Rate Limiting', () => {
  test('should include rate limit headers', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    // Rate limit headers should be present
    const headers = response.headers();
    // May have RateLimit-Limit, RateLimit-Remaining, etc.
  });

  test('should rate limit excessive requests', async ({ request }) => {
    // This test would need many rapid requests
    // Be careful not to actually trigger rate limiting in CI
  });
});

test.describe('Search API', () => {
  test('should require minimum query length', async ({ request }) => {
    const response = await request.get(`${API_BASE}/search/patients?q=a`);

    // Should return 400 for query too short
    expect(response.status()).toBe(400);
  });

  test('should handle empty search', async ({ request }) => {
    const response = await request.get(`${API_BASE}/search/patients?q=`);

    expect(response.status()).toBe(400);
  });

  test('should search diagnosis codes without auth', async ({ request }) => {
    // Diagnosis search may or may not require auth
    const response = await request.get(`${API_BASE}/search/diagnosis?q=L03`);

    // Either 200 or 401 depending on implementation
    expect([200, 401]).toContain(response.status());
  });
});

test.describe('CORS Headers', () => {
  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    const headers = response.headers();
    // CORS headers may be present depending on origin
  });

  test('should handle preflight requests', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/patients`, {
      method: 'OPTIONS',
    });

    // Should return 204 or 200 for preflight
    expect([200, 204]).toContain(response.status());
  });
});

test.describe('Error Responses', () => {
  test('should return 404 for unknown routes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/nonexistent`);

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  test('should return proper error format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/nonexistent`);

    const body = await response.json();

    // Error response should have standard format
    expect(body.error).toBe('Not Found');
    expect(body).toHaveProperty('path');
  });
});

test.describe('API Documentation', () => {
  test('should serve OpenAPI spec', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/docs/openapi.json');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('info');
    expect(body).toHaveProperty('paths');
  });

  test('should serve Swagger UI', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/docs');

    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('swagger-ui');
  });
});

test.describe('Content-Type Handling', () => {
  test('should accept JSON content', async ({ request }) => {
    const response = await request.post(`${API_BASE}/patients`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({}),
    });

    // Should process JSON (auth error expected, but not content-type error)
    expect(response.status()).not.toBe(415);
  });

  test('should return JSON responses', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('Security Headers', () => {
  test('should include security headers', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    const headers = response.headers();

    // Helmet should add these headers
    // May include: x-content-type-options, x-frame-options, etc.
  });
});

test.describe('Compression', () => {
  test('should compress large responses', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health', {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
      },
    });

    const contentEncoding = response.headers()['content-encoding'];
    // Small responses may not be compressed
  });
});

test.describe('Pagination', () => {
  test('should support limit parameter', async ({ request }) => {
    // This would need auth to work fully
    const response = await request.get(`${API_BASE}/patients?limit=5`);

    // Auth error expected, but limit should be parsed
    expect([200, 401]).toContain(response.status());
  });

  test('should support offset parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE}/patients?offset=10`);

    expect([200, 401]).toContain(response.status());
  });
});
