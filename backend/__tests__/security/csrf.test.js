/**
 * CSRF Protection Security Tests
 * Tests the Double Submit Cookie CSRF middleware directly.
 *
 * CONTEXT: CSRF is SKIPPED in desktop/test mode (server.js line 79-83),
 * so we mount the middleware on a minimal Express app to test it in isolation.
 */

import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { csrfProtection as customCsrfProtection } from '../../src/middleware/csrf.js';

/**
 * Create a minimal Express app with CSRF middleware mounted.
 * Each test suite gets a fresh app to avoid state leakage.
 */
function createCsrfApp(options = {}) {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  const csrf = customCsrfProtection(options);
  testApp.use(csrf);

  testApp.get('/test', (req, res) => {
    res.json({ token: req.csrfToken ? req.csrfToken() : null });
  });

  testApp.post('/test', (req, res) => {
    res.json({ ok: true, token: req.csrfToken ? req.csrfToken() : null });
  });

  testApp.put('/test', (req, res) => {
    res.json({ ok: true });
  });

  testApp.delete('/test', (req, res) => {
    res.json({ ok: true });
  });

  // Error handler to catch unexpected errors
  testApp.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });

  return testApp;
}

describe('CSRF Protection Security Tests', () => {
  let csrfApp;

  beforeAll(() => {
    csrfApp = createCsrfApp();
  });

  // ===========================================================================
  // GET REQUESTS — Token generation
  // ===========================================================================

  describe('GET requests and token generation', () => {
    it('should set XSRF-TOKEN cookie on GET request', async () => {
      const response = await request(csrfApp).get('/test').expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));
      expect(xsrfCookie).toBeDefined();
    });

    it('should return a token in the response body', async () => {
      const response = await request(csrfApp).get('/test').expect(200);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should bypass CSRF check for GET requests', async () => {
      // GET should always succeed even without any CSRF tokens
      const response = await request(csrfApp).get('/test').expect(200);

      expect(response.body).toHaveProperty('token');
    });
  });

  // ===========================================================================
  // HEAD / OPTIONS — Safe methods bypass
  // ===========================================================================

  describe('Safe methods bypass CSRF', () => {
    it('should bypass CSRF check for HEAD requests', async () => {
      const response = await request(csrfApp).head('/test');

      // HEAD should succeed without CSRF token
      expect(response.status).toBe(200);
    });

    it('should bypass CSRF check for OPTIONS requests', async () => {
      const response = await request(csrfApp).options('/test');

      // OPTIONS should succeed without CSRF token
      // Express may return 200 or 204 depending on configuration
      expect([200, 204]).toContain(response.status);
    });
  });

  // ===========================================================================
  // POST WITHOUT TOKEN — Must fail
  // ===========================================================================

  describe('POST without CSRF token', () => {
    it('should return 403 when POST has no CSRF token', async () => {
      const response = await request(csrfApp).post('/test').send({ data: 'test' }).expect(403);

      expect(response.body.error).toBe('CSRFError');
      expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should return 403 when POST has no CSRF cookie', async () => {
      // Send header but no cookie
      const response = await request(csrfApp)
        .post('/test')
        .set('X-XSRF-TOKEN', 'some-token-value')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should return 403 when POST has cookie but no header token', async () => {
      // First get a token via GET
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];

      // Send cookie but no X-XSRF-TOKEN header
      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  // ===========================================================================
  // MISMATCHED TOKENS — Must fail
  // ===========================================================================

  describe('Mismatched CSRF tokens', () => {
    it('should return 403 when header token does not match cookie', async () => {
      // Get a valid cookie token via GET
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      // Create a same-length but different token (flip first char)
      // timingSafeEqual requires equal buffer lengths
      const wrongToken = (token[0] === 'a' ? 'b' : 'a') + token.slice(1);

      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', wrongToken)
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should return 403 when token is partially correct', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      // Modify one character of the valid token
      const tamperedToken = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');

      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', tamperedToken)
        .send({ data: 'test' });

      expect(response.status).toBe(403);
    });
  });

  // ===========================================================================
  // VALID TOKEN — Must succeed
  // ===========================================================================

  describe('Valid CSRF token', () => {
    it('should allow POST with matching cookie and header token', async () => {
      // Step 1: GET to obtain token
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      // Step 2: POST with valid token
      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', token)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.ok).toBe(true);
    });

    it('should allow PUT with matching cookie and header token', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      const response = await request(csrfApp)
        .put('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', token)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.ok).toBe(true);
    });

    it('should allow DELETE with matching cookie and header token', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      const response = await request(csrfApp)
        .delete('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', token)
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });

  // ===========================================================================
  // TOKEN ROTATION
  // ===========================================================================

  describe('Token rotation', () => {
    it('should issue a new token after a successful POST', async () => {
      // GET initial token
      const getResponse = await request(csrfApp).get('/test');
      const initialCookies = getResponse.headers['set-cookie'];
      const initialToken = getResponse.body.token;

      // POST with valid token — response should contain a NEW token
      const postResponse = await request(csrfApp)
        .post('/test')
        .set('Cookie', initialCookies)
        .set('X-XSRF-TOKEN', initialToken)
        .send({})
        .expect(200);

      const newToken = postResponse.body.token;
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(initialToken);
    });

    it('should set a new cookie after successful POST', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      const postResponse = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', token)
        .send({});

      // New XSRF-TOKEN cookie should be set
      const newCookies = postResponse.headers['set-cookie'];
      expect(newCookies).toBeDefined();

      const newXsrfCookie = newCookies.find((c) => c.startsWith('XSRF-TOKEN='));
      expect(newXsrfCookie).toBeDefined();
    });
  });

  // ===========================================================================
  // EMPTY / MISSING TOKENS — Edge cases
  // ===========================================================================

  describe('Empty and edge-case tokens', () => {
    it('should return 403 when header token is empty string', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];

      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .set('X-XSRF-TOKEN', '')
        .send({})
        .expect(403);

      expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should return 403 when both cookie and header are empty', async () => {
      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', 'XSRF-TOKEN=')
        .set('X-XSRF-TOKEN', '')
        .send({})
        .expect(403);

      expect(response.body.error).toBe('CSRFError');
    });
  });

  // ===========================================================================
  // IGNORED PATHS — Webhook bypass
  // ===========================================================================

  describe('Ignored paths', () => {
    it('should bypass CSRF for configured ignored paths', () => {
      const appWithIgnored = createCsrfApp({
        ignorePaths: ['/webhook'],
      });

      // Add a webhook route
      appWithIgnored.post('/webhook', (req, res) => {
        res.json({ received: true });
      });

      return request(appWithIgnored)
        .post('/webhook')
        .send({ event: 'test' })
        .expect(200)
        .then((response) => {
          expect(response.body.received).toBe(true);
        });
    });
  });

  // ===========================================================================
  // COOKIE OPTIONS
  // ===========================================================================

  describe('Cookie security attributes', () => {
    it('should set CSRF cookie as non-httpOnly (JS must read it)', async () => {
      const response = await request(csrfApp).get('/test');
      const cookies = response.headers['set-cookie'];
      const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));

      // CSRF cookie must NOT be httpOnly so JavaScript can read it
      // If HttpOnly is not in the cookie string, it means httpOnly: false
      expect(xsrfCookie).toBeDefined();
      expect(xsrfCookie).not.toContain('HttpOnly');
    });

    it('should set SameSite=Strict on CSRF cookie', async () => {
      const response = await request(csrfApp).get('/test');
      const cookies = response.headers['set-cookie'];
      const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));

      expect(xsrfCookie.toLowerCase()).toContain('samesite=strict');
    });

    it('should set path=/ on CSRF cookie', async () => {
      const response = await request(csrfApp).get('/test');
      const cookies = response.headers['set-cookie'];
      const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));

      expect(xsrfCookie).toContain('Path=/');
    });
  });

  // ===========================================================================
  // BODY _csrf FALLBACK
  // ===========================================================================

  describe('Body _csrf field fallback', () => {
    it('should accept CSRF token from request body _csrf field', async () => {
      const getResponse = await request(csrfApp).get('/test');
      const cookies = getResponse.headers['set-cookie'];
      const token = getResponse.body.token;

      // Send token via body instead of header
      const response = await request(csrfApp)
        .post('/test')
        .set('Cookie', cookies)
        .send({ _csrf: token, data: 'test' })
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });
});
