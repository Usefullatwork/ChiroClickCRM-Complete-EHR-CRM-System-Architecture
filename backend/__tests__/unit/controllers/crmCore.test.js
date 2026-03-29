/**
 * Unit Tests for CRM Core Controller
 * Tests leads, lifecycle, referrals, surveys, and communications endpoints
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
const mockCrmService = {
  getLeads: jest.fn(),
  getLeadById: jest.fn(),
  createLead: jest.fn(),
  updateLead: jest.fn(),
  convertLeadToPatient: jest.fn(),
  getLeadPipelineStats: jest.fn(),
  getPatientsByLifecycle: jest.fn(),
  getLifecycleStats: jest.fn(),
  updatePatientLifecycle: jest.fn(),
  getReferrals: jest.fn(),
  createReferral: jest.fn(),
  updateReferral: jest.fn(),
  getReferralStats: jest.fn(),
  getSurveys: jest.fn(),
  createSurvey: jest.fn(),
  getSurveyResponses: jest.fn(),
  getNPSStats: jest.fn(),
  getCommunicationHistory: jest.fn(),
  logCommunication: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/crm/index.js', () => mockCrmService);

const mockLogAudit = jest.fn().mockResolvedValue(null);
jest.unstable_mockModule('../../../src/utils/audit.js', () => ({
  logAudit: mockLogAudit,
}));

const ctrl = await import('../../../src/controllers/crmCore.js');

// ---- Helpers ----
const ORG_ID = 'org-001';
const USER = { id: 'user-1', email: 'admin@test.no', role: 'ADMIN' };

function makeReq(overrides = {}) {
  return {
    organizationId: ORG_ID,
    user: USER,
    query: {},
    params: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  };
}

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

// ---- Tests ----

describe('crmCore controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── LEADS ──────────────────────────────────

  describe('getLeads', () => {
    it('should return leads with pagination options', async () => {
      mockCrmService.getLeads.mockResolvedValue({
        leads: [{ id: 'l-1' }],
        pagination: { total: 1 },
      });
      const req = makeReq({ query: { page: '1', limit: '20', status: 'NEW' } });
      const res = makeRes();

      await ctrl.getLeads(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ leads: expect.any(Array) }));
      expect(mockCrmService.getLeads).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ status: 'NEW' })
      );
    });

    it('should default page to 1 and limit to 20', async () => {
      mockCrmService.getLeads.mockResolvedValue({ leads: [] });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getLeads(req, res);

      expect(mockCrmService.getLeads).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('getLead', () => {
    it('should return lead when found', async () => {
      mockCrmService.getLeadById.mockResolvedValue({ id: 'l-1', name: 'Test Lead' });
      const req = makeReq({ params: { id: 'l-1' } });
      const res = makeRes();

      await ctrl.getLead(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'l-1' }));
    });

    it('should return 404 when lead not found', async () => {
      mockCrmService.getLeadById.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.getLead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createLead', () => {
    it('should create lead, audit log, and return 201', async () => {
      mockCrmService.createLead.mockResolvedValue({ id: 'l-new' });
      const req = makeReq({ body: { first_name: 'Ny', last_name: 'Pasient' } });
      const res = makeRes();

      await ctrl.createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resourceType: 'LEAD' })
      );
    });
  });

  describe('updateLead', () => {
    it('should update lead and return result', async () => {
      mockCrmService.updateLead.mockResolvedValue({ id: 'l-1', status: 'CONTACTED' });
      const req = makeReq({ params: { id: 'l-1' }, body: { status: 'CONTACTED' } });
      const res = makeRes();

      await ctrl.updateLead(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'CONTACTED' }));
    });

    it('should return 404 when lead not found', async () => {
      mockCrmService.updateLead.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.updateLead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('convertLead', () => {
    it('should convert lead to patient', async () => {
      mockCrmService.convertLeadToPatient.mockResolvedValue({ patient_id: 'p-1' });
      const req = makeReq({ params: { id: 'l-1' }, body: {} });
      const res = makeRes();

      await ctrl.convertLead(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ patient_id: 'p-1' }));
      expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'CONVERT' }));
    });

    it('should return 404 when lead not found for conversion', async () => {
      mockCrmService.convertLeadToPatient.mockRejectedValue(new Error('Lead not found'));
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.convertLead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should propagate non-404 errors', async () => {
      mockCrmService.convertLeadToPatient.mockRejectedValue(new Error('DB crash'));
      const req = makeReq({ params: { id: 'l-1' }, body: {} });
      const res = makeRes();

      await expect(ctrl.convertLead(req, res)).rejects.toThrow('DB crash');
    });
  });

  describe('getLeadPipeline', () => {
    it('should return pipeline stats', async () => {
      mockCrmService.getLeadPipelineStats.mockResolvedValue({ NEW: 5, CONTACTED: 3 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getLeadPipeline(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ NEW: 5 }));
    });
  });

  // ─── LIFECYCLE ──────────────────────────────────

  describe('getPatientsByLifecycle', () => {
    it('should return patients by lifecycle stage', async () => {
      mockCrmService.getPatientsByLifecycle.mockResolvedValue({ patients: [] });
      const req = makeReq({ query: { stage: 'ACTIVE' } });
      const res = makeRes();

      await ctrl.getPatientsByLifecycle(req, res);

      expect(mockCrmService.getPatientsByLifecycle).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ stage: 'ACTIVE' })
      );
    });
  });

  describe('getLifecycleStats', () => {
    it('should return lifecycle statistics', async () => {
      mockCrmService.getLifecycleStats.mockResolvedValue({ ACTIVE: 100, AT_RISK: 20 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getLifecycleStats(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ACTIVE: 100 }));
    });
  });

  describe('updatePatientLifecycle', () => {
    it('should update lifecycle and log audit', async () => {
      mockCrmService.updatePatientLifecycle.mockResolvedValue({ success: true });
      const req = makeReq({ params: { patientId: 'p-1' }, body: { stage: 'AT_RISK' } });
      const res = makeRes();

      await ctrl.updatePatientLifecycle(req, res);

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ resourceType: 'PATIENT_LIFECYCLE' })
      );
    });
  });

  // ─── REFERRALS ──────────────────────────────────

  describe('getReferrals', () => {
    it('should return referrals with pagination', async () => {
      mockCrmService.getReferrals.mockResolvedValue({ referrals: [] });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getReferrals(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createReferral', () => {
    it('should create referral and return 201', async () => {
      mockCrmService.createReferral.mockResolvedValue({ id: 'ref-1' });
      const req = makeReq({ body: { patient_id: 'p-1', referred_by: 'p-2' } });
      const res = makeRes();

      await ctrl.createReferral(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resourceType: 'REFERRAL' })
      );
    });
  });

  describe('updateReferral', () => {
    it('should update referral and return result', async () => {
      mockCrmService.updateReferral.mockResolvedValue({ id: 'ref-1', status: 'COMPLETED' });
      const req = makeReq({ params: { id: 'ref-1' }, body: { status: 'COMPLETED' } });
      const res = makeRes();

      await ctrl.updateReferral(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
    });

    it('should return 404 when referral not found', async () => {
      mockCrmService.updateReferral.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.updateReferral(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── SURVEYS ──────────────────────────────────

  describe('getSurveys', () => {
    it('should return surveys', async () => {
      mockCrmService.getSurveys.mockResolvedValue([{ id: 's-1' }]);
      const req = makeReq();
      const res = makeRes();

      await ctrl.getSurveys(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('createSurvey', () => {
    it('should create survey and return 201', async () => {
      mockCrmService.createSurvey.mockResolvedValue({ id: 's-new' });
      const req = makeReq({ body: { title: 'NPS Survey' } });
      const res = makeRes();

      await ctrl.createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getNPSStats', () => {
    it('should return NPS stats with default period', async () => {
      mockCrmService.getNPSStats.mockResolvedValue({ score: 72 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getNPSStats(req, res);

      expect(mockCrmService.getNPSStats).toHaveBeenCalledWith(ORG_ID, '30d');
    });
  });

  // ─── COMMUNICATIONS ──────────────────────────────────

  describe('getCommunications', () => {
    it('should return communication history', async () => {
      mockCrmService.getCommunicationHistory.mockResolvedValue({ communications: [] });
      const req = makeReq({ query: { patientId: 'p-1' } });
      const res = makeRes();

      await ctrl.getCommunications(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('logCommunication', () => {
    it('should log communication and return 201', async () => {
      mockCrmService.logCommunication.mockResolvedValue({ id: 'comm-1' });
      const req = makeReq({ body: { patient_id: 'p-1', channel: 'SMS', direction: 'OUTBOUND' } });
      const res = makeRes();

      await ctrl.logCommunication(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
