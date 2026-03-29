/**
 * Unit Tests for Automations Core Controller
 * Tests CRUD endpoints, validation, audit logging, and error handling
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
const mockService = {
  getWorkflows: jest.fn(),
  getWorkflowById: jest.fn(),
  createWorkflow: jest.fn(),
  updateWorkflow: jest.fn(),
  deleteWorkflow: jest.fn(),
  toggleWorkflow: jest.fn(),
  getWorkflowExecutions: jest.fn(),
  testWorkflow: jest.fn(),
  TRIGGER_TYPES: {
    PATIENT_CREATED: 'PATIENT_CREATED',
    APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
    APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  },
  ACTION_TYPES: {
    SEND_SMS: 'SEND_SMS',
    SEND_EMAIL: 'SEND_EMAIL',
    CREATE_FOLLOW_UP: 'CREATE_FOLLOW_UP',
  },
};

jest.unstable_mockModule('../../../src/services/automations/index.js', () => mockService);

const mockLogAudit = jest.fn().mockResolvedValue(null);
jest.unstable_mockModule('../../../src/utils/audit.js', () => ({
  logAudit: mockLogAudit,
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const ctrl = await import('../../../src/controllers/automationsCore.js');

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
    get: jest.fn(() => 'test-agent'),
    ...overrides,
  };
}

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

// ---- Tests ----

describe('automationsCore controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getWorkflows ──────────────────────────────────

  describe('getWorkflows', () => {
    it('should return workflows with pagination', async () => {
      const mockResult = { workflows: [{ id: 'wf-1' }], pagination: { page: 1, total: 1 } };
      mockService.getWorkflows.mockResolvedValue(mockResult);

      const req = makeReq({ query: { page: '1', limit: '20' } });
      const res = makeRes();

      await ctrl.getWorkflows(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should parse isActive=true query parameter', async () => {
      mockService.getWorkflows.mockResolvedValue({ workflows: [] });
      const req = makeReq({ query: { isActive: 'true' } });
      const res = makeRes();

      await ctrl.getWorkflows(req, res);

      expect(mockService.getWorkflows).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ isActive: true })
      );
    });

    it('should parse isActive=false query parameter', async () => {
      mockService.getWorkflows.mockResolvedValue({ workflows: [] });
      const req = makeReq({ query: { isActive: 'false' } });
      const res = makeRes();

      await ctrl.getWorkflows(req, res);

      expect(mockService.getWorkflows).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ isActive: false })
      );
    });

    it('should return 500 on service error', async () => {
      mockService.getWorkflows.mockRejectedValue(new Error('DB error'));
      const req = makeReq();
      const res = makeRes();

      await ctrl.getWorkflows(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getWorkflowById ──────────────────────────────────

  describe('getWorkflowById', () => {
    it('should return workflow when found', async () => {
      const wf = { id: 'wf-1', name: 'Test' };
      mockService.getWorkflowById.mockResolvedValue(wf);
      const req = makeReq({ params: { id: 'wf-1' } });
      const res = makeRes();

      await ctrl.getWorkflowById(req, res);

      expect(res.json).toHaveBeenCalledWith(wf);
    });

    it('should return 404 when workflow not found', async () => {
      mockService.getWorkflowById.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'nonexistent' } });
      const res = makeRes();

      await ctrl.getWorkflowById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── createWorkflow ──────────────────────────────────

  describe('createWorkflow', () => {
    it('should create workflow and return 201', async () => {
      const wfData = { name: 'New WF', trigger_type: 'PATIENT_CREATED' };
      mockService.createWorkflow.mockResolvedValue({ id: 'wf-new', ...wfData });
      const req = makeReq({ body: wfData });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const req = makeReq({ body: { trigger_type: 'PATIENT_CREATED' } });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('name') })
      );
    });

    it('should return 400 when trigger_type is missing', async () => {
      const req = makeReq({ body: { name: 'Test' } });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid trigger type', async () => {
      const req = makeReq({ body: { name: 'Test', trigger_type: 'INVALID_TYPE' } });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ valid_types: expect.any(Array) })
      );
    });

    it('should return 400 for invalid action type', async () => {
      const req = makeReq({
        body: {
          name: 'Test',
          trigger_type: 'PATIENT_CREATED',
          actions: [{ type: 'INVALID_ACTION' }],
        },
      });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should log audit entry on successful creation', async () => {
      mockService.createWorkflow.mockResolvedValue({ id: 'wf-1' });
      const req = makeReq({ body: { name: 'WF', trigger_type: 'PATIENT_CREATED' } });
      const res = makeRes();

      await ctrl.createWorkflow(req, res);

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          resourceType: 'WORKFLOW',
          organizationId: ORG_ID,
        })
      );
    });
  });

  // ─── updateWorkflow ──────────────────────────────────

  describe('updateWorkflow', () => {
    it('should update workflow and return result', async () => {
      mockService.updateWorkflow.mockResolvedValue({ id: 'wf-1', name: 'Updated' });
      const req = makeReq({ params: { id: 'wf-1' }, body: { name: 'Updated' } });
      const res = makeRes();

      await ctrl.updateWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('should return 404 when workflow not found', async () => {
      mockService.updateWorkflow.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' }, body: { name: 'Test' } });
      const res = makeRes();

      await ctrl.updateWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should validate trigger_type on update', async () => {
      const req = makeReq({ params: { id: 'wf-1' }, body: { trigger_type: 'BAD' } });
      const res = makeRes();

      await ctrl.updateWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── deleteWorkflow ──────────────────────────────────

  describe('deleteWorkflow', () => {
    it('should delete workflow and return success', async () => {
      mockService.deleteWorkflow.mockResolvedValue(true);
      const req = makeReq({ params: { id: 'wf-1' } });
      const res = makeRes();

      await ctrl.deleteWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('should return 404 when workflow not found', async () => {
      mockService.deleteWorkflow.mockResolvedValue(false);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.deleteWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── toggleWorkflow ──────────────────────────────────

  describe('toggleWorkflow', () => {
    it('should toggle workflow active status', async () => {
      mockService.toggleWorkflow.mockResolvedValue({ id: 'wf-1', is_active: false });
      const req = makeReq({ params: { id: 'wf-1' } });
      const res = makeRes();

      await ctrl.toggleWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('should return 404 when workflow not found', async () => {
      mockService.toggleWorkflow.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.toggleWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── getWorkflowExecutions ──────────────────────────────

  describe('getWorkflowExecutions', () => {
    it('should return execution history', async () => {
      const mockResult = { executions: [{ id: 'ex-1' }], pagination: { total: 1 } };
      mockService.getWorkflowExecutions.mockResolvedValue(mockResult);
      const req = makeReq({ params: { id: 'wf-1' }, query: { page: '1' } });
      const res = makeRes();

      await ctrl.getWorkflowExecutions(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 404 when workflow not found', async () => {
      mockService.getWorkflowExecutions.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'fake' } });
      const res = makeRes();

      await ctrl.getWorkflowExecutions(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── testWorkflow ──────────────────────────────────

  describe('testWorkflow', () => {
    it('should test workflow and return result', async () => {
      mockService.testWorkflow.mockResolvedValue({ success: true, conditions_pass: true });
      const req = makeReq({ body: { workflow: { name: 'Test' }, patient_id: 'p-1' } });
      const res = makeRes();

      await ctrl.testWorkflow(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when workflow config is missing', async () => {
      const req = makeReq({ body: { patient_id: 'p-1' } });
      const res = makeRes();

      await ctrl.testWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when patient_id is missing', async () => {
      const req = makeReq({ body: { workflow: { name: 'Test' } } });
      const res = makeRes();

      await ctrl.testWorkflow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
