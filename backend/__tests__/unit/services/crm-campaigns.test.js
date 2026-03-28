/**
 * Unit Tests for CRM Campaigns Service
 * Tests campaign CRUD, launch, stats, and workflow CRUD/toggle
 */

import { jest } from '@jest/globals';

// Mock database — declare mockQuery outside so tests can configure it
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
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

// Import after mocking
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  launchCampaign,
  getCampaignStats,
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  toggleWorkflowActive,
} = await import('../../../src/services/crm/campaigns.js');

describe('CRM Campaigns Service', () => {
  const clinicId = 'clinic-001';

  beforeEach(() => {
    mockQuery.mockReset();
  });

  // ===========================================================================
  // CAMPAIGNS — getCampaigns
  // ===========================================================================

  describe('getCampaigns', () => {
    it('should return paginated campaigns with default options', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '5' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'c1', name: 'Recall', status: 'DRAFT' },
          { id: 'c2', name: 'Welcome', status: 'RUNNING' },
        ],
      });

      const result = await getCampaigns(clinicId);

      expect(result.campaigns).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
      });
      expect(mockQuery).toHaveBeenCalledTimes(2);
      // Count query receives clinicId as first param
      expect(mockQuery.mock.calls[0][1][0]).toBe(clinicId);
    });

    it('should filter campaigns by status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'c1', status: 'DRAFT' }] });

      const result = await getCampaigns(clinicId, { status: 'DRAFT' });

      expect(result.campaigns).toHaveLength(1);
      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('DRAFT');
    });

    it('should filter campaigns by type', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'c1', campaign_type: 'RECALL' },
          { id: 'c2', campaign_type: 'RECALL' },
        ],
      });

      await getCampaigns(clinicId, { type: 'RECALL' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('RECALL');
    });

    it('should filter by both status and type', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'c1' }] });

      await getCampaigns(clinicId, { status: 'RUNNING', type: 'EMAIL' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('RUNNING');
      expect(countParams).toContain('EMAIL');
    });

    it('should paginate correctly with custom page and limit', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'c1' }] });

      const result = await getCampaigns(clinicId, { page: 3, limit: 10 });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      // Data query params should include limit=10, offset=20
      const dataParams = mockQuery.mock.calls[1][1];
      expect(dataParams).toContain(10); // limit
      expect(dataParams).toContain(20); // offset = (3-1)*10
    });
  });

  // ===========================================================================
  // CAMPAIGNS — getCampaignById
  // ===========================================================================

  describe('getCampaignById', () => {
    it('should return a campaign when found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', name: 'Test Campaign', status: 'DRAFT' }],
      });

      const result = await getCampaignById(clinicId, 'c1');

      expect(result).toEqual({ id: 'c1', name: 'Test Campaign', status: 'DRAFT' });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM campaigns WHERE organization_id = $1 AND id = $2'),
        [clinicId, 'c1']
      );
    });

    it('should return null when campaign not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getCampaignById(clinicId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // CAMPAIGNS — createCampaign
  // ===========================================================================

  describe('createCampaign', () => {
    it('should create a campaign with all fields', async () => {
      const campaignData = {
        organization_id: clinicId,
        name: 'New Recall',
        description: 'Recall inactive patients',
        campaign_type: 'RECALL',
        channels: ['SMS', 'EMAIL'],
        sms_template: 'Hi {{name}}, book now!',
        email_subject: 'Time for a checkup',
        email_template: '<p>Hello</p>',
        target_segment: { lifecycle_stage: 'INACTIVE' },
        scheduled_at: '2026-04-01T10:00:00Z',
        created_by: 'user-001',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'new-campaign', ...campaignData, status: 'DRAFT' }],
      });

      const result = await createCampaign(campaignData);

      expect(result).toBeDefined();
      expect(result.id).toBe('new-campaign');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      // Verify channels and target_segment are JSON-stringified
      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams).toContain(JSON.stringify(['SMS', 'EMAIL']));
      expect(insertParams).toContain(JSON.stringify({ lifecycle_stage: 'INACTIVE' }));
    });

    it('should default channels to ["SMS"] when not provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'camp-1', name: 'Minimal', status: 'DRAFT' }],
      });

      await createCampaign({
        organization_id: clinicId,
        name: 'Minimal',
        campaign_type: 'GENERAL',
      });

      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams).toContain(JSON.stringify(['SMS']));
    });

    it('should default target_segment to {} when not provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'camp-2', name: 'No Segment' }],
      });

      await createCampaign({
        organization_id: clinicId,
        name: 'No Segment',
        campaign_type: 'GENERAL',
      });

      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams).toContain(JSON.stringify({}));
    });
  });

  // ===========================================================================
  // CAMPAIGNS — updateCampaign
  // ===========================================================================

  describe('updateCampaign', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', name: 'Updated Name', status: 'DRAFT' }],
      });

      const result = await updateCampaign(clinicId, 'c1', {
        name: 'Updated Name',
        status: 'SCHEDULED',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('name = $3');
      expect(sql).toContain('updated_at = CURRENT_TIMESTAMP');
    });

    it('should return null when no allowed fields provided', async () => {
      const result = await updateCampaign(clinicId, 'c1', {
        invalid_field: 'ignored',
      });

      expect(result).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should JSON-stringify object values', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', channels: '["EMAIL"]' }],
      });

      await updateCampaign(clinicId, 'c1', {
        channels: ['EMAIL'],
        target_segment: { age_range: '30-50' },
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(JSON.stringify(['EMAIL']));
      expect(params).toContain(JSON.stringify({ age_range: '30-50' }));
    });

    it('should return undefined when campaign not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await updateCampaign(clinicId, 'non-existent', { name: 'X' });

      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // CAMPAIGNS — launchCampaign
  // ===========================================================================

  describe('launchCampaign', () => {
    it('should launch a DRAFT campaign', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', status: 'RUNNING', started_at: '2026-03-27T12:00:00Z' }],
      });

      const result = await launchCampaign(clinicId, 'c1');

      expect(result).toBeDefined();
      expect(result.status).toBe('RUNNING');
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain("status = 'RUNNING'");
      expect(sql).toContain("status IN ('DRAFT', 'SCHEDULED')");
    });

    it('should return undefined when campaign is not in launchable state', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await launchCampaign(clinicId, 'already-running');

      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // CAMPAIGNS — getCampaignStats
  // ===========================================================================

  describe('getCampaignStats', () => {
    it('should return campaign with recipient stats', async () => {
      // First call: getCampaignById
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', name: 'Active Campaign', status: 'RUNNING' }],
      });
      // Second call: recipient stats
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '100',
            sent: '95',
            delivered: '90',
            opened: '60',
            clicked: '20',
            converted: '10',
            bounced: '5',
          },
        ],
      });

      const result = await getCampaignStats(clinicId, 'c1');

      expect(result).toBeDefined();
      expect(result.campaign.id).toBe('c1');
      expect(result.stats.total).toBe('100');
      expect(result.stats.opened).toBe('60');
      expect(result.stats.bounced).toBe('5');
    });

    it('should return null when campaign not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getCampaignStats(clinicId, 'non-existent');

      expect(result).toBeNull();
      // Should not query recipients if campaign doesn't exist
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // WORKFLOWS — getWorkflows
  // ===========================================================================

  describe('getWorkflows', () => {
    it('should return workflows with execution counts', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'w1', name: 'Welcome Flow', total_executions: '10', successful_executions: '8' },
          { id: 'w2', name: 'Follow-up', total_executions: '5', successful_executions: '5' },
        ],
      });

      const result = await getWorkflows(clinicId);

      expect(result).toHaveLength(2);
      expect(result[0].total_executions).toBe('10');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN workflow_executions'),
        [clinicId]
      );
    });

    it('should return empty array when no workflows exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getWorkflows(clinicId);

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // WORKFLOWS — getWorkflowById
  // ===========================================================================

  describe('getWorkflowById', () => {
    it('should return a workflow when found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'w1', name: 'Welcome Flow', is_active: true }],
      });

      const result = await getWorkflowById(clinicId, 'w1');

      expect(result).toEqual({ id: 'w1', name: 'Welcome Flow', is_active: true });
    });

    it('should return null when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getWorkflowById(clinicId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // WORKFLOWS — createWorkflow
  // ===========================================================================

  describe('createWorkflow', () => {
    it('should create a workflow with all fields', async () => {
      const workflowData = {
        organization_id: clinicId,
        name: 'Post-Visit Follow-up',
        description: 'Send follow-up after appointment',
        trigger_type: 'APPOINTMENT_COMPLETED',
        trigger_config: { delay_hours: 24 },
        actions: [{ type: 'SEND_SMS', template: 'followup' }],
        conditions: [{ field: 'visit_count', operator: 'gte', value: 1 }],
        max_runs_per_patient: 3,
        created_by: 'user-001',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'new-wf', ...workflowData, is_active: false }],
      });

      const result = await createWorkflow(workflowData);

      expect(result).toBeDefined();
      expect(result.id).toBe('new-wf');
      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(JSON.stringify({ delay_hours: 24 }));
      expect(params).toContain(JSON.stringify([{ type: 'SEND_SMS', template: 'followup' }]));
      expect(params).toContain(3); // max_runs_per_patient
    });

    it('should default optional fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'wf-minimal', name: 'Minimal' }],
      });

      await createWorkflow({
        organization_id: clinicId,
        name: 'Minimal',
        trigger_type: 'MANUAL',
        created_by: 'user-001',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(JSON.stringify({})); // trigger_config default
      expect(params).toContain(JSON.stringify([])); // actions default
      expect(params).toContain(JSON.stringify([])); // conditions default
      expect(params).toContain(1); // max_runs_per_patient default
    });
  });

  // ===========================================================================
  // WORKFLOWS — updateWorkflow
  // ===========================================================================

  describe('updateWorkflow', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'w1', name: 'Updated Workflow', description: 'New desc' }],
      });

      const result = await updateWorkflow(clinicId, 'w1', {
        name: 'Updated Workflow',
        description: 'New desc',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Workflow');
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('updated_at = CURRENT_TIMESTAMP');
    });

    it('should return null when no allowed fields provided', async () => {
      const result = await updateWorkflow(clinicId, 'w1', {
        not_allowed: 'value',
      });

      expect(result).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should JSON-stringify object values in workflow update', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'w1', actions: '[{"type":"SEND_EMAIL"}]' }],
      });

      await updateWorkflow(clinicId, 'w1', {
        actions: [{ type: 'SEND_EMAIL' }],
        trigger_config: { event: 'BOOKING' },
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(JSON.stringify([{ type: 'SEND_EMAIL' }]));
      expect(params).toContain(JSON.stringify({ event: 'BOOKING' }));
    });
  });

  // ===========================================================================
  // WORKFLOWS — toggleWorkflowActive
  // ===========================================================================

  describe('toggleWorkflowActive', () => {
    it('should toggle workflow active status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'w1', is_active: true }],
      });

      const result = await toggleWorkflowActive(clinicId, 'w1');

      expect(result).toBeDefined();
      expect(result.is_active).toBe(true);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('is_active = NOT is_active');
    });

    it('should return undefined when workflow not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await toggleWorkflowActive(clinicId, 'non-existent');

      expect(result).toBeUndefined();
    });
  });
});
