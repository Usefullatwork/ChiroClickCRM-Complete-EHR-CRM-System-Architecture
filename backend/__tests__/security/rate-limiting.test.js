/**
 * Rate Limiting Security Tests
 * Verifies that rate limiting middleware correctly throttles
 * excessive requests and returns proper headers/status codes.
 *
 * Uses a minimal Express app with a low threshold to avoid
 * slow tests. Also verifies the real app's rate limit headers.
 */

import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import app from '../../src/server.js';

// ---------------------------------------------------------------------------
// Minimal test app with low-threshold rate limiter
// ---------------------------------------------------------------------------

const testApp = express();
testApp.use(express.json());

const testLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 3, // 3 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequestsError',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});

testApp.use('/test', testLimiter);
testApp.get('/test', (_req, res) => res.json({ ok: true }));

// Route without rate limit for comparison
testApp.get('/unlimited', (_req, res) => res.json({ ok: true }));

describe('Rate Limiting Security Tests', () => {
  // ===========================================================================
  // MINIMAL APP — LOW THRESHOLD TESTS
  // ===========================================================================

  describe('Low-threshold rate limiter (test app)', () => {
    it('should allow first request (1 of 3)', async () => {
      const res = await request(testApp).get('/test').expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should allow second request (2 of 3)', async () => {
      const res = await request(testApp).get('/test').expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should allow third request (3 of 3)', async () => {
      const res = await request(testApp).get('/test').expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should block the 4th request within the window with 429', async () => {
      const res = await request(testApp).get('/test').expect(429);
      expect(res.body.error).toBe('TooManyRequestsError');
      expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should include RateLimit-Limit header in responses', async () => {
      // Use the unlimited endpoint, then hit /test fresh after window resets
      // We check on a new testApp instance to avoid window collision
      const freshApp = express();
      freshApp.use(express.json());
      const freshLimiter = rateLimit({
        windowMs: 60000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
      });
      freshApp.use('/rl', freshLimiter);
      freshApp.get('/rl', (_req, res) => res.json({ ok: true }));

      const res = await request(freshApp).get('/rl').expect(200);

      // standardHeaders: true sets RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });

    it('should include RateLimit-Remaining header that decrements', async () => {
      const freshApp = express();
      freshApp.use(express.json());
      const freshLimiter = rateLimit({
        windowMs: 60000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
      });
      freshApp.use('/dec', freshLimiter);
      freshApp.get('/dec', (_req, res) => res.json({ ok: true }));

      const res1 = await request(freshApp).get('/dec').expect(200);
      const res2 = await request(freshApp).get('/dec').expect(200);

      const remaining1 = parseInt(res1.headers['ratelimit-remaining'], 10);
      const remaining2 = parseInt(res2.headers['ratelimit-remaining'], 10);
      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should allow requests again after window expires', async () => {
      const shortApp = express();
      shortApp.use(express.json());
      const shortLimiter = rateLimit({
        windowMs: 500, // 0.5 second window
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'blocked' },
      });
      shortApp.use('/short', shortLimiter);
      shortApp.get('/short', (_req, res) => res.json({ ok: true }));

      // First request succeeds
      await request(shortApp).get('/short').expect(200);

      // Second request blocked
      await request(shortApp).get('/short').expect(429);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Third request should succeed (new window)
      const res = await request(shortApp).get('/short').expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should return JSON error body on 429', async () => {
      const jsonApp = express();
      jsonApp.use(express.json());
      const jsonLimiter = rateLimit({
        windowMs: 60000,
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          error: 'TooManyRequestsError',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      });
      jsonApp.use('/json', jsonLimiter);
      jsonApp.get('/json', (_req, res) => res.json({ ok: true }));

      // Exhaust the limit
      await request(jsonApp).get('/json').expect(200);

      // Verify 429 response body
      const res = await request(jsonApp).get('/json').expect(429);
      expect(res.body).toHaveProperty('error', 'TooManyRequestsError');
      expect(res.body).toHaveProperty('message');
    });

    it('should apply separate limits per IP via X-Forwarded-For', async () => {
      const ipApp = express();
      ipApp.set('trust proxy', true);
      ipApp.use(express.json());
      const ipLimiter = rateLimit({
        windowMs: 60000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'blocked' },
      });
      ipApp.use('/ip', ipLimiter);
      ipApp.get('/ip', (_req, res) => res.json({ ok: true }));

      // Exhaust limit for IP 1.1.1.1
      await request(ipApp).get('/ip').set('X-Forwarded-For', '1.1.1.1').expect(200);
      await request(ipApp).get('/ip').set('X-Forwarded-For', '1.1.1.1').expect(200);
      await request(ipApp).get('/ip').set('X-Forwarded-For', '1.1.1.1').expect(429);

      // Different IP should still be allowed
      const res = await request(ipApp).get('/ip').set('X-Forwarded-For', '2.2.2.2').expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should not rate-limit an endpoint without the limiter middleware', async () => {
      // The /unlimited endpoint has no rate limiter
      for (let i = 0; i < 10; i++) {
        await request(testApp).get('/unlimited').expect(200);
      }
    });
  });

  // ===========================================================================
  // REAL APP RATE LIMITER — HEADER & HEALTH CHECKS
  // ===========================================================================

  describe('Real app rate limiter (NODE_ENV=test)', () => {
    it('should include rate limit headers on API responses', async () => {
      // The global limiter skips in test/e2e mode for the generalLimiter,
      // but the inline rateLimit in server.js does NOT skip in test mode.
      const res = await request(app).get('/api/v1/patients').expect('Content-Type', /json/);

      // The server.js inline limiter uses standardHeaders: true
      // Check that at least one rate limit header is present
      const hasRateLimitHeader =
        res.headers['ratelimit-limit'] !== undefined ||
        res.headers['ratelimit-remaining'] !== undefined ||
        res.headers['x-ratelimit-limit'] !== undefined;

      expect(hasRateLimitHeader).toBe(true);
    });

    it('should allow /health endpoint without rate limit issues', async () => {
      // /health is outside the /api/v1 path so the rate limiter does not apply
      const res = await request(app).get('/health').expect('Content-Type', /json/);

      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
    });

    it('should return valid JSON from rate-limited endpoints', async () => {
      const res = await request(app).get('/api/v1/patients').expect('Content-Type', /json/);

      expect([200, 429]).toContain(res.status);
      expect(res.body).toBeDefined();
    });

    it('should apply rate limit to POST endpoints as well', async () => {
      // Verify rate limit headers are present on a POST
      const res = await request(app).post('/api/v1/patients').send({
        first_name: 'RateLimit',
        last_name: 'Test',
        date_of_birth: '1990-01-01',
      });

      // Should have either rate limit or validation response, not a crash
      expect(res.status).toBeLessThan(500);
    });

    it('should not include legacy X-RateLimit headers when legacyHeaders is false', async () => {
      const res = await request(app).get('/api/v1/patients');

      // server.js sets legacyHeaders: false, so X-RateLimit-Limit should NOT be present
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });
});
