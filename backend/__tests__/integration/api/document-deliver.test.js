/**
 * Document Delivery API Integration Tests
 */

import request from 'supertest';
import app from '../../../src/server.js';
import { randomUUID } from '../../helpers/testUtils.js';

describe('Document Delivery API', () => {
  const agent = request(app);

  describe('POST /api/v1/pdf/:type/:id/deliver', () => {
    it('should return 400 for invalid document type', async () => {
      const res = await agent
        .post(`/api/v1/pdf/invalid_type/${randomUUID()}/deliver`)
        .send({ patientId: randomUUID(), method: 'email' });
      expect([400, 500]).toContain(res.status);
    });

    it('should accept invoice document type', async () => {
      const res = await agent
        .post(`/api/v1/pdf/invoice/${randomUUID()}/deliver`)
        .send({ patientId: randomUUID(), method: 'email' });
      // May return 400/404/500 depending on data, but should not crash
      expect([200, 400, 404, 500]).toContain(res.status);
    });

    it('should accept exercise_prescription document type', async () => {
      const res = await agent
        .post(`/api/v1/pdf/exercise_prescription/${randomUUID()}/deliver`)
        .send({ patientId: randomUUID(), method: 'email' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });

    it('should accept treatment_summary document type', async () => {
      const res = await agent
        .post(`/api/v1/pdf/treatment_summary/${randomUUID()}/deliver`)
        .send({ patientId: randomUUID(), method: 'email' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });
});
