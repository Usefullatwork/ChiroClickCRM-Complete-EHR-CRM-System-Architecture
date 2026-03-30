/**
 * Unit Tests for CRM Analytics Controller
 * Tests campaigns, workflows, retention, waitlist, overview, and settings
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
const mockCrmService = {
  getCampaigns: jest.fn(),
  getCampaignById: jest.fn(),
  createCampaign: jest.fn(),
  updateCampaign: jest.fn(),
  launchCampaign: jest.fn(),
  getCampaignStats: jest.fn(),
  getWorkflows: jest.fn(),
  getWorkflowById: jest.fn(),
  createWorkflow: jest.fn(),
  updateWorkflow: jest.fn(),
  toggleWorkflowActive: jest.fn(),
  getRetentionDashboard: jest.fn(),
  getChurnAnalysis: jest.fn(),
  getCohortRetention: jest.fn(),
  getWaitlist: jest.fn(),
  addToWaitlist: jest.fn(),
  updateWaitlistEntry: jest.fn(),
  notifyWaitlistPatients: jest.fn(),
  getCRMOverview: jest.fn(),
  getCRMSettings: jest.fn(),
  updateCRMSettings: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/crm/index.js', () => mockCrmService);

const mockLogAudit = jest.fn().mockResolvedValue(null);
jest.unstable_mockModule('../../../src/utils/audit.js', () => ({
  logAudit: mockLogAudit,
}));

const ctrl = await import('../../../src/controllers/crmAnalytics.js');

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

describe('crmAnalytics controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── CAMPAIGNS ──────────────────────────────────

  describe('getCampaigns', () => {
    it('should return campaigns with pagination', async () => {
      mockCrmService.getCampaigns.mockResolvedValue({
        campaigns: [{ id: 'c-1' }],
        pagination: { total: 1 },
      });
      const req = makeReq({ query: { page: '1', status: 'ACTIVE' } });
      const res = makeRes();

      await ctrl.getCampaigns(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ campaigns: expect.any(Array) })
      );
    });
  });

  describe('getCampaign', () => {
    it('should return campaign when found', async () => {
      mockCrmService.getCampaignById.mockResolvedValue({ id: 'c-1', name: 'Test' });
      const req = makeReq({ params: { id: 'c-1' } });
      const res = makeRes();

      await ctrl.getCampaign(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-1' }));
    });

    it('should return 404 when campaign not found', async () => {
      mockCrmService.getCampaignById.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.getCampaign(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createCampaign', () => {
    it('should create campaign and return 201', async () => {
      mockCrmService.createCampaign.mockResolvedValue({ id: 'c-new' });
      const req = makeReq({ body: { name: 'New Campaign', type: 'EMAIL' } });
      const res = makeRes();

      await ctrl.createCampaign(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resourceType: 'CAMPAIGN' })
      );
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign and return result', async () => {
      mockCrmService.updateCampaign.mockResolvedValue({ id: 'c-1', name: 'Updated' });
      const req = makeReq({ params: { id: 'c-1' }, body: { name: 'Updated' } });
      const res = makeRes();

      await ctrl.updateCampaign(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
    });

    it('should return 404 when campaign not found', async () => {
      mockCrmService.updateCampaign.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.updateCampaign(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('launchCampaign', () => {
    it('should launch campaign and log audit', async () => {
      mockCrmService.launchCampaign.mockResolvedValue({ id: 'c-1', status: 'LAUNCHED' });
      const req = makeReq({ params: { id: 'c-1' } });
      const res = makeRes();

      await ctrl.launchCampaign(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'LAUNCHED' }));
      expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'LAUNCH' }));
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      mockCrmService.getCampaignStats.mockResolvedValue({ sent: 100, opened: 50 });
      const req = makeReq({ params: { id: 'c-1' } });
      const res = makeRes();

      await ctrl.getCampaignStats(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sent: 100 }));
    });
  });

  // ─── WORKFLOWS ──────────────────────────────────

  describe('getWorkflows', () => {
    it('should return CRM workflows', async () => {
      mockCrmService.getWorkflows.mockResolvedValue([{ id: 'wf-1' }]);
      const req = makeReq();
      const res = makeRes();

      await ctrl.getWorkflows(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow when found', async () => {
      mockCrmService.getWorkflowById.mockResolvedValue({ id: 'wf-1' });
      const req = makeReq({ params: { id: 'wf-1' } });
      const res = makeRes();

      await ctrl.getWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'wf-1' }));
    });

    it('should return 404 when workflow not found', async () => {
      mockCrmService.getWorkflowById.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.getWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createWorkflow', () => {
    it('should create CRM workflow and return 201', async () => {
      mockCrmService.createWorkflow.mockResolvedValue({ id: 'wf-new' });
      const req = makeReq({ body: { name: 'Onboarding Flow' } });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalled();
    });
  });

  describe('updateWorkflow', () => {
    it('should update CRM workflow', async () => {
      mockCrmService.updateWorkflow.mockResolvedValue({ id: 'wf-1', name: 'Updated' });
      const req = makeReq({ params: { id: 'wf-1' }, body: { name: 'Updated' } });
      const res = makeRes();

      await ctrl.updateWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
    });

    it('should return 404 when workflow not found', async () => {
      mockCrmService.updateWorkflow.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.updateWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('toggleWorkflow', () => {
    it('should toggle workflow active status and log audit', async () => {
      mockCrmService.toggleWorkflowActive.mockResolvedValue({ id: 'wf-1', is_active: false });
      const req = makeReq({ params: { id: 'wf-1' } });
      const res = makeRes();

      await ctrl.toggleWorkflow(req, res);

      expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOGGLE' }));
    });
  });

  // ─── RETENTION ──────────────────────────────────

  describe('getRetentionDashboard', () => {
    it('should return retention dashboard with default period', async () => {
      mockCrmService.getRetentionDashboard.mockResolvedValue({ retention_rate: 0.85 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getRetentionDashboard(req, res);

      expect(mockCrmService.getRetentionDashboard).toHaveBeenCalledWith(ORG_ID, '30d');
    });

    it('should use custom period when provided', async () => {
      mockCrmService.getRetentionDashboard.mockResolvedValue({});
      const req = makeReq({ query: { period: '90d' } });
      const res = makeRes();

      await ctrl.getRetentionDashboard(req, res);

      expect(mockCrmService.getRetentionDashboard).toHaveBeenCalledWith(ORG_ID, '90d');
    });
  });

  describe('getChurnAnalysis', () => {
    it('should return churn analysis', async () => {
      mockCrmService.getChurnAnalysis.mockResolvedValue({ churn_rate: 0.15 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getChurnAnalysis(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ churn_rate: 0.15 }));
    });
  });

  describe('getCohortRetention', () => {
    it('should return cohort retention with default months', async () => {
      mockCrmService.getCohortRetention.mockResolvedValue({ cohorts: [] });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getCohortRetention(req, res);

      expect(mockCrmService.getCohortRetention).toHaveBeenCalledWith(ORG_ID, 6);
    });
  });

  // ─── WAITLIST ──────────────────────────────────

  describe('getWaitlist', () => {
    it('should return waitlist with default options', async () => {
      mockCrmService.getWaitlist.mockResolvedValue({ entries: [] });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getWaitlist(req, res);

      expect(mockCrmService.getWaitlist).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });
  });

  describe('addToWaitlist', () => {
    it('should add to waitlist and return 201', async () => {
      mockCrmService.addToWaitlist.mockResolvedValue({ id: 'wl-1' });
      const req = makeReq({ body: { patient_id: 'p-1' } });
      const res = makeRes();

      await ctrl.addToWaitlist(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resourceType: 'WAITLIST' })
      );
    });
  });

  describe('updateWaitlistEntry', () => {
    it('should update waitlist entry', async () => {
      mockCrmService.updateWaitlistEntry.mockResolvedValue({ id: 'wl-1', status: 'NOTIFIED' });
      const req = makeReq({ params: { id: 'wl-1' }, body: { status: 'NOTIFIED' } });
      const res = makeRes();

      await ctrl.updateWaitlistEntry(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'NOTIFIED' }));
    });

    it('should return 404 when waitlist entry not found', async () => {
      mockCrmService.updateWaitlistEntry.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: {} });
      const res = makeRes();

      await ctrl.updateWaitlistEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('notifyWaitlist', () => {
    it('should notify waitlist patients and log audit', async () => {
      mockCrmService.notifyWaitlistPatients.mockResolvedValue({ notified: 3 });
      const req = makeReq({ body: { slotDate: '2026-04-01', slotTime: '10:00' } });
      const res = makeRes();

      await ctrl.notifyWaitlist(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ notified: 3 }));
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTIFY', resourceType: 'WAITLIST' })
      );
    });
  });

  // ─── OVERVIEW & SETTINGS ──────────────────────────────

  describe('getCRMOverview', () => {
    it('should return CRM overview', async () => {
      mockCrmService.getCRMOverview.mockResolvedValue({ total_leads: 50, total_patients: 200 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getCRMOverview(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total_leads: 50 }));
    });
  });

  describe('getCRMSettings', () => {
    it('should return CRM settings', async () => {
      mockCrmService.getCRMSettings.mockResolvedValue({ auto_assign: true });
      const req = makeReq();
      const res = makeRes();

      await ctrl.getCRMSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ auto_assign: true }));
    });
  });

  describe('updateCRMSettings', () => {
    it('should update settings and log audit', async () => {
      mockCrmService.updateCRMSettings.mockResolvedValue({ auto_assign: false });
      const req = makeReq({ body: { auto_assign: false } });
      const res = makeRes();

      await ctrl.updateCRMSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ auto_assign: false }));
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', resourceType: 'CRM_SETTINGS' })
      );
    });
  });
});
