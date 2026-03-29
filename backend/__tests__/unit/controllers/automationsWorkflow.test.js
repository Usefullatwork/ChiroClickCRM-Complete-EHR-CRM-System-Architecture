/**
 * Unit Tests for Automations Workflow Controller
 * Tests trigger/action type listing, stats, processing, and admin-only access
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
const mockAutomationService = {
  TRIGGER_TYPES: {
    PATIENT_CREATED: 'PATIENT_CREATED',
    APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
    BIRTHDAY: 'BIRTHDAY',
  },
  ACTION_TYPES: {
    SEND_SMS: 'SEND_SMS',
    SEND_EMAIL: 'SEND_EMAIL',
    ADD_TAG: 'ADD_TAG',
  },
  processAutomations: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/automations/index.js', () => mockAutomationService);

const mockTriggerService = {
  getTriggerStats: jest.fn(),
  getUpcomingTriggers: jest.fn(),
  processTimeTriggers: jest.fn(),
};

jest.unstable_mockModule(
  '../../../src/services/practice/automationTriggers.js',
  () => mockTriggerService
);

const mockLogAudit = jest.fn().mockResolvedValue(null);
jest.unstable_mockModule('../../../src/utils/audit.js', () => ({
  logAudit: mockLogAudit,
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

let mockDbQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: (...args) => mockDbQuery(...args),
  default: { query: (...args) => mockDbQuery(...args) },
}));

const ctrl = await import('../../../src/controllers/automationsWorkflow.js');

// ---- Helpers ----
const ORG_ID = 'org-001';
const ADMIN_USER = { id: 'user-1', email: 'admin@test.no', role: 'ADMIN' };
const NON_ADMIN_USER = { id: 'user-2', email: 'user@test.no', role: 'PRACTITIONER' };

function makeReq(overrides = {}) {
  return {
    organizationId: ORG_ID,
    user: ADMIN_USER,
    query: {},
    params: {},
    body: {},
    ip: '127.0.0.1',
    get: jest.fn(() => 'test-agent'),
    ...overrides,
  };
}

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

// ---- Tests ----

describe('automationsWorkflow controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbQuery.mockResolvedValue({ rows: [] });
  });

  // ─── getAllExecutions ──────────────────────────────────

  describe('getAllExecutions', () => {
    it('should return paginated executions', async () => {
      mockDbQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'ex-1', workflow_name: 'WF', patient_name: 'Ola N' }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const req = makeReq({ query: { page: '1', limit: '20' } });
      const res = makeRes();

      await ctrl.getAllExecutions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        })
      );
    });

    it('should filter by status when provided', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const req = makeReq({ query: { status: 'COMPLETED' } });
      const res = makeRes();

      await ctrl.getAllExecutions(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should filter by workflowId when provided', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const req = makeReq({ query: { workflowId: 'wf-1' } });
      const res = makeRes();

      await ctrl.getAllExecutions(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDbQuery.mockRejectedValue(new Error('DB error'));
      const req = makeReq();
      const res = makeRes();

      await ctrl.getAllExecutions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getTriggerTypes ──────────────────────────────────

  describe('getTriggerTypes', () => {
    it('should return all trigger types with labels', async () => {
      const req = makeReq();
      const res = makeRes();

      await ctrl.getTriggerTypes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_types: expect.arrayContaining([
            expect.objectContaining({ id: 'PATIENT_CREATED', label: expect.any(String) }),
          ]),
        })
      );
    });

    it('should include Norwegian labels', async () => {
      const req = makeReq();
      const res = makeRes();

      await ctrl.getTriggerTypes(req, res);

      const response = res.json.mock.calls[0][0];
      const patientCreated = response.trigger_types.find((t) => t.id === 'PATIENT_CREATED');
      expect(patientCreated.label_no).toBeTruthy();
    });

    it('should include config_schema for each type', async () => {
      const req = makeReq();
      const res = makeRes();

      await ctrl.getTriggerTypes(req, res);

      const response = res.json.mock.calls[0][0];
      response.trigger_types.forEach((t) => {
        expect(t).toHaveProperty('config_schema');
      });
    });
  });

  // ─── getActionTypes ──────────────────────────────────

  describe('getActionTypes', () => {
    it('should return all action types with labels', async () => {
      const req = makeReq();
      const res = makeRes();

      await ctrl.getActionTypes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          action_types: expect.arrayContaining([expect.objectContaining({ id: 'SEND_SMS' })]),
        })
      );
    });

    it('should include Norwegian labels for actions', async () => {
      const req = makeReq();
      const res = makeRes();

      await ctrl.getActionTypes(req, res);

      const response = res.json.mock.calls[0][0];
      const sendSms = response.action_types.find((a) => a.id === 'SEND_SMS');
      expect(sendSms.label_no).toBeTruthy();
    });
  });

  // ─── getStats ──────────────────────────────────

  describe('getStats', () => {
    it('should return trigger stats and upcoming triggers', async () => {
      mockTriggerService.getTriggerStats.mockResolvedValue({ total: 10, active: 5 });
      mockTriggerService.getUpcomingTriggers.mockResolvedValue([{ id: 't-1' }]);

      const req = makeReq();
      const res = makeRes();

      await ctrl.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_stats: expect.any(Object),
          upcoming_triggers: expect.any(Array),
        })
      );
    });

    it('should return 500 on service error', async () => {
      mockTriggerService.getTriggerStats.mockRejectedValue(new Error('Stats error'));
      const req = makeReq();
      const res = makeRes();

      await ctrl.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── processAutomations ──────────────────────────────

  describe('processAutomations', () => {
    it('should process automations for admin users', async () => {
      mockAutomationService.processAutomations.mockResolvedValue({ success: true });
      const req = makeReq();
      const res = makeRes();

      await ctrl.processAutomations(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const req = makeReq({ user: NON_ADMIN_USER });
      const res = makeRes();

      await ctrl.processAutomations(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on service error', async () => {
      mockAutomationService.processAutomations.mockRejectedValue(new Error('Processing failed'));
      const req = makeReq();
      const res = makeRes();

      await ctrl.processAutomations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── processTimeTriggers ──────────────────────────────

  describe('processTimeTriggers', () => {
    it('should process time triggers for admin users', async () => {
      mockTriggerService.processTimeTriggers.mockResolvedValue({ processed: 3 });
      const req = makeReq();
      const res = makeRes();

      await ctrl.processTimeTriggers(req, res);

      expect(res.json).toHaveBeenCalledWith({ processed: 3 });
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const req = makeReq({ user: NON_ADMIN_USER });
      const res = makeRes();

      await ctrl.processTimeTriggers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on service error', async () => {
      mockTriggerService.processTimeTriggers.mockRejectedValue(new Error('Time trigger error'));
      const req = makeReq();
      const res = makeRes();

      await ctrl.processTimeTriggers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
