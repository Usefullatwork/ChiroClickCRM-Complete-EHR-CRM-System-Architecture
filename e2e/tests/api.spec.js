/**
 * API E2E Tests
 * Tests for API endpoints and responses
 */

import { test, expect } from './fixtures/auth.fixture.js';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

test.describe('Health Check API', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('database');
  });

  test('should return API info', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('endpoints');
  });
});

test.describe('Authentication API', () => {
  test('should reject unauthenticated requests', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/patients`);

    expect(response.status()).toBe(401);
  });

  test('should reject invalid tokens', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/patients`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should login with valid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: {
        email: 'admin@chiroclickcrm.no',
        password: 'admin123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('user');
  });

  test('should reject login with wrong password', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: {
        email: 'admin@chiroclickcrm.no',
        password: 'wrongpassword',
      },
    });

    expect(response.ok()).toBeFalsy();
  });
});

test.describe('Error Responses', () => {
  test('should return 404 for unknown routes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/nonexistent`);

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  test('should return proper error format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/nonexistent`);

    const body = await response.json();
    expect(body.error).toBe('Not Found');
    expect(body).toHaveProperty('path');
  });
});

test.describe('CORS Headers', () => {
  test('should handle preflight requests', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/api/v1/patients`, {
      method: 'OPTIONS',
    });

    expect([200, 204]).toContain(response.status());
  });
});

test.describe('Content-Type Handling', () => {
  test('should accept JSON content', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/patients`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({}),
    });

    // Should process JSON (auth error expected, not content-type error)
    expect(response.status()).not.toBe(415);
  });

  test('should return JSON responses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('API Documentation', () => {
  test('should serve Swagger UI', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api-docs`);

    // Swagger UI serves HTML, may redirect
    expect([200, 301, 302]).toContain(response.status());
  });
});
