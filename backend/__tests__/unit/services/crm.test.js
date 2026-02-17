/**
 * Unit Tests for CRM Service Submodules
 * Tests leads, lifecycle, retention, campaigns, and waitlist
 */

import { jest } from '@jest/globals';

// Mock database
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

// Import CRM submodules after mocking
const leads = await import('../../../src/services/crm/leads.js');
const lifecycle = await import('../../../src/services/crm/lifecycle.js');
const retention = await import('../../../src/services/crm/retention.js');
const campaigns = await import('../../../src/services/crm/campaigns.js');
const waitlist = await import('../../../src/services/crm/waitlist.js');

describe('CRM Service', () => {
  const clinicId = 'clinic-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // LEADS
  // =============================================================================

  describe('Leads', () => {
    describe('getLeads', () => {
      it('should return paginated leads with defaults', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '3' }] }).mockResolvedValueOnce({
          rows: [
            { id: 'l1', first_name: 'Lead', status: 'NEW' },
            { id: 'l2', first_name: 'Lead2', status: 'CONTACTED' },
            { id: 'l3', first_name: 'Lead3', status: 'QUALIFIED' },
          ],
        });

        const result = await leads.getLeads(clinicId);

        expect(result.leads).toHaveLength(3);
        expect(result.pagination.total).toBe(3);
        expect(mockQuery).toHaveBeenCalledTimes(2);
      });

      it('should filter by status', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'l1', status: 'NEW' }] });

        const result = await leads.getLeads(clinicId, { status: 'NEW' });

        expect(result.leads).toHaveLength(1);
        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('NEW');
      });

      it('should filter by source', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] }).mockResolvedValueOnce({
          rows: [{ id: 'l1' }, { id: 'l2' }],
        });

        const result = await leads.getLeads(clinicId, { source: 'WEBSITE' });

        expect(result.leads).toHaveLength(2);
        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('WEBSITE');
      });

      it('should filter by temperature', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'l1', temperature: 'HOT' }] });

        await leads.getLeads(clinicId, { temperature: 'HOT' });

        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('HOT');
      });

      it('should search by name/email/phone', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'l1' }] });

        await leads.getLeads(clinicId, { search: 'test@email.com' });

        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('%test@email.com%');
      });

      it('should use safe sort column', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '0' }] })
          .mockResolvedValueOnce({ rows: [] });

        await leads.getLeads(clinicId, { sortBy: 'DROP TABLE;--' });

        const dataQuery = mockQuery.mock.calls[1][0];
        expect(dataQuery).toContain('created_at');
        expect(dataQuery).not.toContain('DROP');
      });
    });

    describe('getLeadById', () => {
      it('should return lead with activities', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ id: 'l1', first_name: 'Test', last_name: 'Lead', status: 'NEW' }],
          })
          .mockResolvedValueOnce({
            rows: [{ id: 'a1', activity_type: 'CREATED', description: 'Lead opprettet' }],
          });

        const result = await leads.getLeadById(clinicId, 'l1');

        expect(result).toBeDefined();
        expect(result.id).toBe('l1');
        expect(result.activities).toHaveLength(1);
      });

      it('should return null for non-existent lead', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await leads.getLeadById(clinicId, 'non-existent');

        expect(result).toBeNull();
      });
    });

    describe('createLead', () => {
      it('should create a lead and log activity', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'new-lead',
                first_name: 'New',
                last_name: 'Lead',
                temperature: 'WARM',
              },
            ],
          })
          .mockResolvedValueOnce({ rows: [] }); // Activity insert

        const result = await leads.createLead({
          organization_id: clinicId,
          first_name: 'New',
          last_name: 'Lead',
          email: 'new@lead.com',
          phone: '+4712345678',
          source: 'WEBSITE',
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('new-lead');
        expect(mockQuery).toHaveBeenCalledTimes(2); // INSERT + activity log
      });
    });

    describe('updateLead', () => {
      it('should update allowed fields', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'l1', status: 'CONTACTED', temperature: 'HOT' }],
        });

        const result = await leads.updateLead(clinicId, 'l1', {
          status: 'CONTACTED',
          temperature: 'HOT',
        });

        expect(result).toBeDefined();
        expect(result.status).toBe('CONTACTED');
      });

      it('should return null when no allowed fields provided', async () => {
        const result = await leads.updateLead(clinicId, 'l1', {
          invalid_field: 'value',
        });

        expect(result).toBeNull();
      });

      it('should return null for non-existent lead', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await leads.updateLead(clinicId, 'non-existent', { status: 'LOST' });

        expect(result).toBeNull();
      });
    });

    describe('convertLeadToPatient', () => {
      it('should convert lead to patient', async () => {
        // getLeadById - lead query
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              id: 'l1',
              first_name: 'Lead',
              last_name: 'Test',
              email: 'lead@test.com',
              phone: '+4712345678',
              source: 'WEBSITE',
            },
          ],
        });
        // getLeadById - activities query
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // Create patient
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'new-patient', first_name: 'Lead', last_name: 'Test' }],
        });
        // Update lead status
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // Log activity
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await leads.convertLeadToPatient(clinicId, 'l1', {});

        expect(result.lead).toBeDefined();
        expect(result.patient).toBeDefined();
        expect(result.patient.id).toBe('new-patient');
      });

      it('should throw when lead not found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await expect(leads.convertLeadToPatient(clinicId, 'non-existent', {})).rejects.toThrow(
          'Lead not found'
        );
      });
    });

    describe('getLeadPipelineStats', () => {
      it('should return pipeline statistics', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [
              { status: 'NEW', count: '5', avg_score: '30' },
              { status: 'CONVERTED', count: '3', avg_score: '85' },
            ],
          })
          .mockResolvedValueOnce({
            rows: [{ converted: '3', total: '10' }],
          });

        const result = await leads.getLeadPipelineStats(clinicId);

        expect(result.stages).toHaveLength(2);
        expect(result.conversionRate).toBe('30.0');
        expect(result.totalLeads).toBe(10);
      });

      it('should return 0 conversion rate when no leads', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ converted: '0', total: '0' }] });

        const result = await leads.getLeadPipelineStats(clinicId);

        expect(result.conversionRate).toBe(0);
        expect(result.totalLeads).toBe(0);
      });
    });
  });

  // =============================================================================
  // LIFECYCLE
  // =============================================================================

  describe('Lifecycle', () => {
    describe('getPatientsByLifecycle', () => {
      it('should return patients by lifecycle stage', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] }).mockResolvedValueOnce({
          rows: [
            { id: 'p1', lifecycle_stage: 'ACTIVE' },
            { id: 'p2', lifecycle_stage: 'ACTIVE' },
          ],
        });

        const result = await lifecycle.getPatientsByLifecycle(clinicId, { stage: 'ACTIVE' });

        expect(result.patients).toHaveLength(2);
        expect(result.pagination).toBeDefined();
      });

      it('should return all stages when no stage filter', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '5' }] }).mockResolvedValueOnce({
          rows: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }],
        });

        const result = await lifecycle.getPatientsByLifecycle(clinicId);

        expect(result.patients).toHaveLength(5);
      });
    });

    describe('getLifecycleStats', () => {
      it('should return lifecycle statistics', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { lifecycle_stage: 'ACTIVE', count: '50', avg_engagement: '75' },
            { lifecycle_stage: 'AT_RISK', count: '10', avg_engagement: '30' },
            { lifecycle_stage: 'INACTIVE', count: '5', avg_engagement: '10' },
          ],
        });

        const result = await lifecycle.getLifecycleStats(clinicId);

        expect(result).toBeDefined();
        // Result structure depends on actual implementation
      });
    });
  });

  // =============================================================================
  // RETENTION
  // =============================================================================

  describe('Retention', () => {
    describe('getRetentionDashboard', () => {
      it('should return retention metrics', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [
              {
                retained: '40',
                total_trackable: '50',
                avg_frequency: '14.5',
              },
            ],
          })
          .mockResolvedValueOnce({
            rows: [
              { lifecycle_stage: 'ACTIVE', count: '40' },
              { lifecycle_stage: 'AT_RISK', count: '10' },
            ],
          });

        const result = await retention.getRetentionDashboard(clinicId, '30d');

        expect(result.retentionRate).toBe(80.0);
        expect(result.retainedPatients).toBe(40);
        expect(result.avgVisitFrequency).toBe(14.5);
        expect(result.lifecycleDistribution).toHaveLength(2);
      });

      it('should return 0 retention rate when no trackable patients', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ retained: '0', total_trackable: '0', avg_frequency: null }],
          })
          .mockResolvedValueOnce({ rows: [] });

        const result = await retention.getRetentionDashboard(clinicId);

        expect(result.retentionRate).toBe(0);
        expect(result.avgVisitFrequency).toBe(0);
      });
    });

    describe('getChurnAnalysis', () => {
      it('should return churn analysis data', async () => {
        // First query: churn counts
        mockQuery.mockResolvedValueOnce({
          rows: [{ inactive: '5', lost: '2', at_risk: '8' }],
        });
        // Second query: monthly churn trend
        mockQuery.mockResolvedValueOnce({
          rows: [
            { month: '2026-01-01', count: '3' },
            { month: '2026-02-01', count: '2' },
          ],
        });

        const result = await retention.getChurnAnalysis(clinicId);

        expect(result).toBeDefined();
        expect(result.current).toBeDefined();
        expect(result.current.inactive).toBe('5');
        expect(result.trend).toHaveLength(2);
      });
    });
  });

  // =============================================================================
  // CAMPAIGNS
  // =============================================================================

  describe('Campaigns', () => {
    describe('getCampaigns', () => {
      it('should return paginated campaigns', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] }).mockResolvedValueOnce({
          rows: [
            { id: 'c1', name: 'Recall Campaign', status: 'DRAFT' },
            { id: 'c2', name: 'Welcome Campaign', status: 'ACTIVE' },
          ],
        });

        const result = await campaigns.getCampaigns(clinicId);

        expect(result.campaigns).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
      });

      it('should filter by status', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] }).mockResolvedValueOnce({
          rows: [{ id: 'c1', name: 'Draft Campaign', status: 'DRAFT' }],
        });

        const result = await campaigns.getCampaigns(clinicId, { status: 'DRAFT' });

        expect(result.campaigns).toHaveLength(1);
        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('DRAFT');
      });

      it('should filter by type', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'c1', campaign_type: 'RECALL' }] });

        await campaigns.getCampaigns(clinicId, { type: 'RECALL' });

        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('RECALL');
      });
    });

    describe('getCampaignById', () => {
      it('should return campaign by ID', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'c1', name: 'Test Campaign' }],
        });

        const result = await campaigns.getCampaignById(clinicId, 'c1');

        expect(result).toBeDefined();
      });
    });
  });

  // =============================================================================
  // WAITLIST
  // =============================================================================

  describe('Waitlist', () => {
    describe('getWaitlist', () => {
      it('should return paginated waitlist entries', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] }).mockResolvedValueOnce({
          rows: [
            { id: 'w1', first_name: 'Wait', last_name: 'Patient1', priority: 3 },
            { id: 'w2', first_name: 'Wait', last_name: 'Patient2', priority: 1 },
          ],
        });

        const result = await waitlist.getWaitlist(clinicId);

        expect(result.entries).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
      });

      it('should filter by practitioner', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] }).mockResolvedValueOnce({
          rows: [{ id: 'w1', practitioner_first_name: 'Dr', practitioner_last_name: 'Smith' }],
        });

        const result = await waitlist.getWaitlist(clinicId, { practitionerId: 'prac-1' });

        expect(result.entries).toHaveLength(1);
        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('prac-1');
      });

      it('should handle empty waitlist', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '0' }] })
          .mockResolvedValueOnce({ rows: [] });

        const result = await waitlist.getWaitlist(clinicId);

        expect(result.entries).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });
    });
  });
});
