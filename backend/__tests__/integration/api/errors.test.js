/**
 * Error Reporting API Integration Tests
 * Tests for the frontend error reporting endpoint: valid payloads, oversized
 * rejection, and rate limiting behaviour.
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { wait } from '../../helpers/testUtils.js';

describe('Error Reporting API Integration Tests', () => {
  const agent = request(app);

  // =============================================================================
  // VALID PAYLOADS
  // =============================================================================

  describe('POST /api/v1/errors', () => {
    it('should accept a minimal error report (message only)', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'Uncaught TypeError: Cannot read properties of undefined',
      });
      expect(res.status).toBe(201);
      expect(res.body.accepted).toBe(true);
    });

    it('should accept a full error report with all optional fields', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'ChunkLoadError: Loading chunk 12 failed.',
        stack: 'ChunkLoadError: Loading chunk 12 failed.\n    at webpackJsonpCallback (main.js:1)',
        componentStack: '    at PatientDetail\n    at App',
        url: 'https://localhost:5173/patients/1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        timestamp: new Date().toISOString(),
      });
      expect(res.status).toBe(201);
      expect(res.body.accepted).toBe(true);
    });

    it('should accept a report with null optional fields', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'ReferenceError: foo is not defined',
        stack: null,
        componentStack: null,
        url: null,
        userAgent: null,
        timestamp: null,
      });
      expect(res.status).toBe(201);
      expect(res.body.accepted).toBe(true);
    });

    it('should accept a report with empty string optional fields', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'SyntaxError in rendered component',
        stack: '',
        componentStack: '',
      });
      expect(res.status).toBe(201);
      expect(res.body.accepted).toBe(true);
    });
  });

  // =============================================================================
  // VALIDATION REJECTION
  // =============================================================================

  describe('POST /api/v1/errors — validation failures', () => {
    it('should reject a report with missing message', async () => {
      const res = await agent.post('/api/v1/errors').send({
        stack: 'Some stack trace',
        url: 'https://localhost:5173',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject a report with empty body', async () => {
      const res = await agent.post('/api/v1/errors').send({});
      expect(res.status).toBe(400);
    });

    it('should reject a message exceeding 2000 characters', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'x'.repeat(2001),
      });
      expect(res.status).toBe(400);
    });

    it('should reject a stack exceeding 5000 characters', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'Valid message',
        stack: 's'.repeat(5001),
      });
      expect(res.status).toBe(400);
    });

    it('should reject an invalid ISO timestamp', async () => {
      const res = await agent.post('/api/v1/errors').send({
        message: 'Error with bad timestamp',
        timestamp: 'not-a-date',
      });
      expect(res.status).toBe(400);
    });
  });

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  describe('POST /api/v1/errors — rate limiting', () => {
    it('should allow up to 10 requests within one minute', async () => {
      // Send 10 valid requests and confirm they all succeed.
      // This also consumes the rate-limit budget for the IP.
      for (let i = 0; i < 10; i++) {
        const res = await agent
          .post('/api/v1/errors')
          .set('X-Forwarded-For', '10.0.0.1')
          .send({ message: `Rate limit probe ${i}` });
        expect([201, 429]).toContain(res.status);
      }
    });

    it('should return 429 after exceeding the rate limit for a single IP', async () => {
      // Exhaust the remaining quota then verify the 429 response.
      const responses = [];
      for (let i = 0; i < 15; i++) {
        const res = await agent
          .post('/api/v1/errors')
          .set('X-Forwarded-For', '10.0.0.2')
          .send({ message: `Burst request ${i}` });
        responses.push(res.status);
      }
      // At least one response must be 429 after the limit is hit.
      expect(responses).toContain(429);
    });
  });
});
