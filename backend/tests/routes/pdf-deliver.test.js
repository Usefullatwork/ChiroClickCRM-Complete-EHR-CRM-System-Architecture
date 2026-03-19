/**
 * PDF Deliver Route Tests
 * Integration tests for POST /pdf/:type/:id/deliver endpoint
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// ── Mocks ────────────────────────────────────────────────────────────────

const mockDeliverDocument = jest.fn();
const mockLogAudit = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule('../../src/services/documentDelivery.js', () => ({
  deliverDocument: mockDeliverDocument,
}));

jest.unstable_mockModule('../../src/utils/audit.js', () => ({
  logAudit: mockLogAudit,
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock PDF service dependencies so controller import succeeds
jest.unstable_mockModule('../../src/services/pdf.js', () => ({
  default: {},
  generatePatientLetter: jest.fn(),
  generateInvoice: jest.fn(),
  generateExerciseHandout: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/pdfGenerator.js', () => ({
  generateTreatmentSummary: jest.fn(),
  generateReferralLetter: jest.fn(),
  generateSickNote: jest.fn(),
  generateInvoice: jest.fn(),
}));

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => next(),
  requireOrganization: (req, res, next) => next(),
  requireRole: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../src/middleware/validation.js', () => ({
  default: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../src/validators/pdf.validators.js', () => ({
  generateLetterSchema: {},
  generateInvoiceFromMetricSchema: {},
  treatmentSummarySchema: {},
  referralLetterSchema: {},
  sickNoteSchema: {},
  generateInvoiceSchema: {},
}));

// ── Setup ────────────────────────────────────────────────────────────────

let app;
const ORG_ID = 'org-test-1';
const USER_ID = 'user-test-1';
const DOC_TYPE = 'treatment_summary';
const DOC_ID = 'doc-aaaa-bbbb';
const PATIENT_ID = 'pat-cccc-dddd';

beforeAll(async () => {
  const pdfRoutes = await import('../../src/routes/pdf.js');

  app = express();
  app.use(express.json());

  // Inject auth context
  app.use((req, res, next) => {
    req.organizationId = ORG_ID;
    req.user = { id: USER_ID, email: 'test@test.no', role: 'ADMIN' };
    next();
  });

  app.use('/pdf', pdfRoutes.default);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────

describe('POST /pdf/:type/:id/deliver', () => {
  it('should return 400 when patientId is missing', async () => {
    const res = await request(app)
      .post(`/pdf/${DOC_TYPE}/${DOC_ID}/deliver`)
      .send({ method: 'email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('patientId');
  });

  it('should return 400 when method is invalid', async () => {
    const res = await request(app)
      .post(`/pdf/${DOC_TYPE}/${DOC_ID}/deliver`)
      .send({ patientId: PATIENT_ID, method: 'fax' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('method');
  });

  it('should deliver document successfully', async () => {
    const mockResult = {
      portalDocumentId: 'pdoc-1',
      downloadToken: 'token-abc',
      deliveryStatus: { email: true, sms: false },
    };
    mockDeliverDocument.mockResolvedValue(mockResult);

    const res = await request(app)
      .post(`/pdf/${DOC_TYPE}/${DOC_ID}/deliver`)
      .send({ patientId: PATIENT_ID, method: 'email' });

    expect(res.status).toBe(200);
    expect(res.body.portalDocumentId).toBe('pdoc-1');
    expect(res.body.deliveryStatus.email).toBe(true);

    expect(mockDeliverDocument).toHaveBeenCalledTimes(1);
    expect(mockDeliverDocument).toHaveBeenCalledWith(
      ORG_ID,
      DOC_TYPE,
      DOC_ID,
      PATIENT_ID,
      'email',
      { userId: USER_ID }
    );

    // Verify audit log was called
    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    expect(mockLogAudit.mock.calls[0][0].action).toBe('DOCUMENT_DELIVERED');
  });

  it('should return 404 when patient not found', async () => {
    mockDeliverDocument.mockRejectedValue(new Error('Patient not found'));

    const res = await request(app)
      .post(`/pdf/${DOC_TYPE}/${DOC_ID}/deliver`)
      .send({ patientId: PATIENT_ID, method: 'email' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should return 500 for unexpected errors', async () => {
    mockDeliverDocument.mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app)
      .post(`/pdf/${DOC_TYPE}/${DOC_ID}/deliver`)
      .send({ patientId: PATIENT_ID, method: 'email' });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Database connection failed');
  });
});
