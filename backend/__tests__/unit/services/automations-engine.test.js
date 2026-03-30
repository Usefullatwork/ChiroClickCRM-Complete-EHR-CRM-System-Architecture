/**
 * Unit Tests for Automation Engine
 * Tests workflow CRUD, trigger evaluation, condition matching, and action execution pipeline
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock triggers
const mockEvaluateTrigger = jest.fn();
jest.unstable_mockModule('../../../src/services/automations/triggers.js', () => ({
  TRIGGER_TYPES: {
    PATIENT_CREATED: 'PATIENT_CREATED',
    APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
    APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
    APPOINTMENT_MISSED: 'APPOINTMENT_MISSED',
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    ENCOUNTER_CREATED: 'ENCOUNTER_CREATED',
    ENCOUNTER_SIGNED: 'ENCOUNTER_SIGNED',
    DAYS_SINCE_VISIT: 'DAYS_SINCE_VISIT',
    BIRTHDAY: 'BIRTHDAY',
    LIFECYCLE_CHANGE: 'LIFECYCLE_CHANGE',
    CUSTOM: 'CUSTOM',
  },
  evaluateTrigger: mockEvaluateTrigger,
}));

// Mock conditions
const mockEvaluateConditions = jest.fn();
jest.unstable_mockModule('../../../src/services/automations/conditions.js', () => ({
  evaluateConditions: mockEvaluateConditions,
}));

// Mock actions
const mockExecuteAction = jest.fn();
const mockGetActionPreview = jest.fn();
jest.unstable_mockModule('../../../src/services/automations/actions.js', () => ({
  executeAction: mockExecuteAction,
  getActionPreview: mockGetActionPreview,
}));

// Import after mocking
const engine = await import('../../../src/services/automations/engine.js');

// =============================================================================
// FIXTURES
// =============================================================================

const TEST_ORG_ID = 'org-001';
const TEST_WORKFLOW_ID = 'wf-001';
const TEST_PATIENT_ID = 'pat-001';

const makeWorkflow = (overrides = {}) => ({
  id: TEST_WORKFLOW_ID,
  organization_id: TEST_ORG_ID,
  name: 'Test Workflow',
  trigger_type: 'PATIENT_CREATED',
  trigger_config: {},
  conditions: [],
  actions: [],
  is_active: true,
  max_runs_per_patient: 1,
  total_runs: 0,
  successful_runs: 0,
  failed_runs: 0,
  ...overrides,
});

const makePatient = (overrides = {}) => ({
  id: TEST_PATIENT_ID,
  organization_id: TEST_ORG_ID,
  first_name: 'Ola',
  last_name: 'Nordmann',
  email: 'ola@test.no',
  phone: '+4712345678',
  status: 'active',
  lifecycle_stage: 'active',
  total_visits: 5,
  last_visit_date: '2026-01-01',
  tags: [],
  ...overrides,
});

// =============================================================================
// TESTS
// =============================================================================

describe('Automation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getWorkflows
  // ---------------------------------------------------------------------------

  describe('getWorkflows', () => {
    it('should return paginated workflows with stats', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [makeWorkflow(), makeWorkflow({ id: 'wf-002' })] });

      const result = await engine.getWorkflows(TEST_ORG_ID);

      expect(result.workflows).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should apply isActive filter when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [makeWorkflow()] });

      await engine.getWorkflows(TEST_ORG_ID, { isActive: true });

      const firstCall = mockQuery.mock.calls[0];
      expect(firstCall[1]).toContain(true);
    });

    it('should apply triggerType filter when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [makeWorkflow()] });

      await engine.getWorkflows(TEST_ORG_ID, { triggerType: 'PATIENT_CREATED' });

      const firstCall = mockQuery.mock.calls[0];
      expect(firstCall[1]).toContain('PATIENT_CREATED');
    });

    it('should throw and log on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(engine.getWorkflows(TEST_ORG_ID)).rejects.toThrow('DB error');
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkflowById
  // ---------------------------------------------------------------------------

  describe('getWorkflowById', () => {
    it('should return workflow when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeWorkflow()] });

      const result = await engine.getWorkflowById(TEST_ORG_ID, TEST_WORKFLOW_ID);

      expect(result).not.toBeNull();
      expect(result.id).toBe(TEST_WORKFLOW_ID);
    });

    it('should return null when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.getWorkflowById(TEST_ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // createWorkflow
  // ---------------------------------------------------------------------------

  describe('createWorkflow', () => {
    it('should insert and return the created workflow', async () => {
      const created = makeWorkflow({ name: 'New WF' });
      mockQuery.mockResolvedValueOnce({ rows: [created] });

      const result = await engine.createWorkflow(
        TEST_ORG_ID,
        { name: 'New WF', trigger_type: 'PATIENT_CREATED' },
        'user-1'
      );

      expect(result.name).toBe('New WF');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO workflows');
      expect(params[0]).toBe(TEST_ORG_ID);
    });

    it('should default is_active to true and max_runs_per_patient to 1', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeWorkflow()] });

      await engine.createWorkflow(TEST_ORG_ID, { name: 'WF', trigger_type: 'BIRTHDAY' }, 'user-1');

      const params = mockQuery.mock.calls[0][1];
      expect(params[7]).toBe(true); // is_active
      expect(params[8]).toBe(1); // max_runs_per_patient
    });
  });

  // ---------------------------------------------------------------------------
  // updateWorkflow
  // ---------------------------------------------------------------------------

  describe('updateWorkflow', () => {
    it('should update allowed fields and return updated workflow', async () => {
      const updated = makeWorkflow({ name: 'Updated' });
      mockQuery.mockResolvedValueOnce({ rows: [updated] });

      const result = await engine.updateWorkflow(TEST_ORG_ID, TEST_WORKFLOW_ID, {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('should return null when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.updateWorkflow(TEST_ORG_ID, 'nonexistent', { name: 'X' });

      expect(result).toBeNull();
    });

    it('should throw when no valid fields provided', async () => {
      await expect(
        engine.updateWorkflow(TEST_ORG_ID, TEST_WORKFLOW_ID, { unknown_field: 'x' })
      ).rejects.toThrow('No valid fields to update');
    });

    it('should JSON-stringify trigger_config, conditions, and actions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeWorkflow()] });

      await engine.updateWorkflow(TEST_ORG_ID, TEST_WORKFLOW_ID, {
        trigger_config: { key: 'val' },
        conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
        actions: [{ type: 'SEND_SMS' }],
      });

      const params = mockQuery.mock.calls[0][1];
      // params[0]=workflowId, params[1]=orgId, then update values
      const jsonParams = params.slice(2);
      expect(jsonParams.some((p) => p === JSON.stringify({ key: 'val' }))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteWorkflow
  // ---------------------------------------------------------------------------

  describe('deleteWorkflow', () => {
    it('should return true when workflow deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: TEST_WORKFLOW_ID }] });

      const result = await engine.deleteWorkflow(TEST_ORG_ID, TEST_WORKFLOW_ID);

      expect(result).toBe(true);
    });

    it('should return false when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.deleteWorkflow(TEST_ORG_ID, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toggleWorkflow
  // ---------------------------------------------------------------------------

  describe('toggleWorkflow', () => {
    it('should return updated workflow with toggled is_active', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeWorkflow({ is_active: false })] });

      const result = await engine.toggleWorkflow(TEST_ORG_ID, TEST_WORKFLOW_ID);

      expect(result.is_active).toBe(false);
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('is_active = NOT is_active');
    });

    it('should return null when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.toggleWorkflow(TEST_ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // triggerWorkflow — trigger evaluation pipeline
  // ---------------------------------------------------------------------------

  describe('triggerWorkflow', () => {
    it('should return triggered:0 when no matching active workflows', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no workflows

      const result = await engine.triggerWorkflow(TEST_ORG_ID, 'PATIENT_CREATED', {
        patient_id: TEST_PATIENT_ID,
      });

      expect(result).toEqual({ triggered: 0 });
    });

    it('should skip workflow when evaluateTrigger returns false', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [makeWorkflow()] }) // workflows
        .mockResolvedValueOnce({ rows: [makePatient()] }); // patient

      mockEvaluateTrigger.mockReturnValue(false);

      const result = await engine.triggerWorkflow(TEST_ORG_ID, 'PATIENT_CREATED', {
        patient_id: TEST_PATIENT_ID,
      });

      expect(result).toEqual({ triggered: 0 });
      expect(mockEvaluateTrigger).toHaveBeenCalledTimes(1);
    });

    it('should skip workflow when conditions fail', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [makeWorkflow()] })
        .mockResolvedValueOnce({ rows: [makePatient()] });

      mockEvaluateTrigger.mockReturnValue(true);
      mockEvaluateConditions.mockReturnValue(false);

      const result = await engine.triggerWorkflow(TEST_ORG_ID, 'PATIENT_CREATED', {
        patient_id: TEST_PATIENT_ID,
      });

      expect(result).toEqual({ triggered: 0 });
    });

    it('should skip workflow when max_runs_per_patient is reached', async () => {
      const workflow = makeWorkflow({ max_runs_per_patient: 1 });
      mockQuery
        .mockResolvedValueOnce({ rows: [workflow] }) // workflows
        .mockResolvedValueOnce({ rows: [makePatient()] }) // patient
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // execution count

      mockEvaluateTrigger.mockReturnValue(true);
      mockEvaluateConditions.mockReturnValue(true);

      const result = await engine.triggerWorkflow(TEST_ORG_ID, 'PATIENT_CREATED', {
        patient_id: TEST_PATIENT_ID,
      });

      expect(result).toEqual({ triggered: 0 });
    });

    it('should execute workflow and return triggered:1 on success', async () => {
      const workflow = makeWorkflow({ max_runs_per_patient: 1 });
      const patient = makePatient();
      mockQuery
        .mockResolvedValueOnce({ rows: [workflow] }) // workflows
        .mockResolvedValueOnce({ rows: [patient] }) // patient
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // execution count
        .mockResolvedValueOnce({ rows: [{ id: 'exec-1', workflow_id: workflow.id }] }) // INSERT execution
        .mockResolvedValueOnce({ rows: [] }) // UPDATE execution COMPLETED
        .mockResolvedValueOnce({ rows: [] }); // UPDATE workflow stats

      mockEvaluateTrigger.mockReturnValue(true);
      mockEvaluateConditions.mockReturnValue(true);

      const result = await engine.triggerWorkflow(TEST_ORG_ID, 'PATIENT_CREATED', {
        patient_id: TEST_PATIENT_ID,
      });

      expect(result).toEqual({ triggered: 1 });
    });
  });

  // ---------------------------------------------------------------------------
  // executeWorkflow — action execution pipeline
  // ---------------------------------------------------------------------------

  describe('executeWorkflow', () => {
    it('should create execution record and complete it when no actions', async () => {
      const workflow = makeWorkflow({ actions: [] });
      const execution = { id: 'exec-1', workflow_id: workflow.id };

      mockQuery
        .mockResolvedValueOnce({ rows: [execution] }) // INSERT execution
        .mockResolvedValueOnce({ rows: [] }) // UPDATE COMPLETED
        .mockResolvedValueOnce({ rows: [] }); // UPDATE workflow stats

      const result = await engine.executeWorkflow(TEST_ORG_ID, workflow, makePatient(), {});

      expect(result.id).toBe('exec-1');
      const completedCall = mockQuery.mock.calls[1];
      expect(completedCall[0]).toContain("status = 'COMPLETED'");
    });

    it('should execute immediate actions (no delay)', async () => {
      const action = { type: 'SEND_SMS', delay_hours: 0 };
      const workflow = makeWorkflow({ actions: [action] });
      const execution = { id: 'exec-2', workflow_id: workflow.id };

      mockQuery
        .mockResolvedValueOnce({ rows: [execution] }) // INSERT execution
        .mockResolvedValueOnce({ rows: [] }) // UPDATE progress
        .mockResolvedValueOnce({ rows: [] }) // UPDATE COMPLETED
        .mockResolvedValueOnce({ rows: [] }); // UPDATE workflow stats

      mockExecuteAction.mockResolvedValue({ success: true });

      await engine.executeWorkflow(TEST_ORG_ID, workflow, makePatient(), {});

      expect(mockExecuteAction).toHaveBeenCalledWith(
        TEST_ORG_ID,
        action,
        expect.objectContaining({ id: TEST_PATIENT_ID }),
        execution.id
      );
    });

    it('should schedule delayed actions instead of executing immediately', async () => {
      const action = { type: 'SEND_EMAIL', delay_hours: 24 };
      const workflow = makeWorkflow({ actions: [action] });
      const execution = { id: 'exec-3', workflow_id: workflow.id };

      mockQuery
        .mockResolvedValueOnce({ rows: [execution] }) // INSERT execution
        .mockResolvedValueOnce({ rows: [] }) // INSERT scheduled action
        .mockResolvedValueOnce({ rows: [] }) // UPDATE progress
        .mockResolvedValueOnce({ rows: [] }) // UPDATE COMPLETED
        .mockResolvedValueOnce({ rows: [] }); // UPDATE workflow stats

      await engine.executeWorkflow(TEST_ORG_ID, workflow, makePatient(), {});

      // executeAction should NOT have been called (action is delayed)
      expect(mockExecuteAction).not.toHaveBeenCalled();

      // Should have inserted into workflow_scheduled_actions
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('workflow_scheduled_actions');
    });

    it('should mark execution FAILED and update stats when action throws', async () => {
      const action = { type: 'SEND_SMS' };
      const workflow = makeWorkflow({ actions: [action] });
      const execution = { id: 'exec-4', workflow_id: workflow.id };

      mockQuery
        .mockResolvedValueOnce({ rows: [execution] }) // INSERT execution
        .mockResolvedValueOnce({ rows: [] }) // UPDATE FAILED
        .mockResolvedValueOnce({ rows: [] }); // UPDATE workflow stats failed

      mockExecuteAction.mockRejectedValue(new Error('SMS failed'));

      await expect(
        engine.executeWorkflow(TEST_ORG_ID, workflow, makePatient(), {})
      ).rejects.toThrow('SMS failed');

      const failedCall = mockQuery.mock.calls[1];
      expect(failedCall[0]).toContain("status = 'FAILED'");
    });
  });

  // ---------------------------------------------------------------------------
  // testWorkflow
  // ---------------------------------------------------------------------------

  describe('testWorkflow', () => {
    it('should return success:false when test patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.testWorkflow(TEST_ORG_ID, makeWorkflow(), 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test patient not found');
    });

    it('should return patient info, conditions result, and action previews', async () => {
      const patient = makePatient();
      const action = { type: 'SEND_SMS', delay_hours: 0 };
      const workflow = makeWorkflow({ actions: [action] });

      mockQuery.mockResolvedValueOnce({ rows: [patient] });
      mockEvaluateConditions.mockReturnValue(true);
      mockGetActionPreview.mockReturnValue('SMS to +4712345678');

      const result = await engine.testWorkflow(TEST_ORG_ID, workflow, TEST_PATIENT_ID);

      expect(result.success).toBe(true);
      expect(result.conditions_pass).toBe(true);
      expect(result.patient.id).toBe(TEST_PATIENT_ID);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].preview).toBe('SMS to +4712345678');
    });

    it('should return success:false with error message on exception', async () => {
      mockQuery.mockRejectedValueOnce(new Error('unexpected DB error'));

      const result = await engine.testWorkflow(TEST_ORG_ID, makeWorkflow(), TEST_PATIENT_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe('unexpected DB error');
    });
  });

  // ---------------------------------------------------------------------------
  // processAutomations
  // ---------------------------------------------------------------------------

  describe('processAutomations', () => {
    it('should process scheduled actions and return success', async () => {
      // No pending scheduled actions
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.processAutomations(TEST_ORG_ID);

      expect(result).toEqual({ success: true });
    });

    it('should process a pending scheduled action and mark it COMPLETED', async () => {
      const scheduledAction = {
        id: 'sa-1',
        patient_id: TEST_PATIENT_ID,
        organization_id: TEST_ORG_ID,
        execution_id: 'exec-1',
        action_config: { type: 'SEND_SMS' },
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [scheduledAction] }) // fetch pending
        .mockResolvedValueOnce({ rows: [] }) // UPDATE PROCESSING
        .mockResolvedValueOnce({ rows: [makePatient()] }) // fetch patient
        .mockResolvedValueOnce({ rows: [] }); // UPDATE COMPLETED

      mockExecuteAction.mockResolvedValue({ success: true });

      const result = await engine.processAutomations(TEST_ORG_ID);

      expect(result).toEqual({ success: true });
      expect(mockExecuteAction).toHaveBeenCalledTimes(1);

      const completedCall = mockQuery.mock.calls[3];
      expect(completedCall[0]).toContain("status = 'COMPLETED'");
    });

    it('should mark scheduled action FAILED when executeAction throws', async () => {
      const scheduledAction = {
        id: 'sa-2',
        patient_id: TEST_PATIENT_ID,
        organization_id: TEST_ORG_ID,
        execution_id: 'exec-2',
        action_config: { type: 'SEND_EMAIL' },
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [scheduledAction] }) // fetch pending
        .mockResolvedValueOnce({ rows: [] }) // UPDATE PROCESSING
        .mockResolvedValueOnce({ rows: [makePatient()] }) // fetch patient
        .mockResolvedValueOnce({ rows: [] }); // UPDATE FAILED

      mockExecuteAction.mockRejectedValue(new Error('Email failed'));

      const result = await engine.processAutomations(TEST_ORG_ID);

      // Should still return success (per-action errors are caught internally)
      expect(result).toEqual({ success: true });

      const failedCall = mockQuery.mock.calls[3];
      expect(failedCall[0]).toContain("status = 'FAILED'");
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkflowExecutions
  // ---------------------------------------------------------------------------

  describe('getWorkflowExecutions', () => {
    it('should return null when workflow does not belong to organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await engine.getWorkflowExecutions(TEST_ORG_ID, 'wf-other');

      expect(result).toBeNull();
    });

    it('should return paginated executions for valid workflow', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: TEST_WORKFLOW_ID }] }) // ownership check
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // count
        .mockResolvedValueOnce({
          rows: [
            { id: 'exec-1', status: 'COMPLETED' },
            { id: 'exec-2', status: 'FAILED' },
          ],
        });

      const result = await engine.getWorkflowExecutions(TEST_ORG_ID, TEST_WORKFLOW_ID);

      expect(result.executions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
