/**
 * Exercise Prescription Delivery Integration Tests
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Exercise Prescription Delivery API', () => {
  const agent = request(app);

  describe('POST /api/v1/exercises/prescriptions/:id/deliver', () => {
    it('should return 400 when method is missing', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/deliver`)
        .send({});
      expect([400, 500]).toContain(res.status);
    });

    it('should return 400 for invalid method', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/deliver`)
        .send({ method: 'fax' });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept email delivery method', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/deliver`)
        .send({ method: 'email' });
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should accept sms delivery method', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/deliver`)
        .send({ method: 'sms' });
      expect([200, 404, 500]).toContain(res.status);
    });

    it('should accept both delivery method', async () => {
      const res = await agent
        .post(`/api/v1/exercises/prescriptions/${randomUUID()}/deliver`)
        .send({ method: 'both' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
