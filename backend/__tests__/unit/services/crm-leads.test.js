/**
 * Unit Tests for CRM Leads & Lifecycle Services
 * Covers lead CRUD, pipeline stats, conversion, lifecycle stage transitions,
 * referrals, surveys, NPS, and communication logging
 */

import { jest } from '@jest/globals';

// Mock database — declare mockQuery at module level so tests can configure it
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

const leads = await import('../../../src/services/crm/leads.js');
const lifecycle = await import('../../../src/services/crm/lifecycle.js');

describe('CRM Leads & Lifecycle Services', () => {
  const clinicId = 'clinic-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // LEADS SERVICE
  // ===========================================================================

  describe('Leads Service', () => {
    describe('createLead', () => {
      it('should create a lead with WARM temperature and log activity', async () => {
        const newLead = {
          id: 'lead-new',
          first_name: 'Ola',
          last_name: 'Nordmann',
          email: 'ola@test.no',
          temperature: 'WARM',
        };
        mockQuery.mockResolvedValueOnce({ rows: [newLead] }).mockResolvedValueOnce({ rows: [] }); // activity log

        const result = await leads.createLead({
          organization_id: clinicId,
          first_name: 'Ola',
          last_name: 'Nordmann',
          email: 'ola@test.no',
          phone: '+4799887766',
          source: 'PHONE',
        });

        expect(result.id).toBe('lead-new');
        expect(result.temperature).toBe('WARM');
        // Verify INSERT was called with correct params
        expect(mockQuery).toHaveBeenCalledTimes(2);
        const insertCall = mockQuery.mock.calls[0];
        expect(insertCall[0]).toContain('INSERT INTO leads');
        // Verify activity log was created
        const activityCall = mockQuery.mock.calls[1];
        expect(activityCall[0]).toContain('lead_activities');
        expect(activityCall[0]).toContain('CREATED');
      });
    });

    describe('updateLead', () => {
      it('should update status and temperature fields', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'lead-1', status: 'QUALIFIED', temperature: 'HOT' }],
        });

        const result = await leads.updateLead(clinicId, 'lead-1', {
          status: 'QUALIFIED',
          temperature: 'HOT',
        });

        expect(result.status).toBe('QUALIFIED');
        expect(result.temperature).toBe('HOT');
        const sql = mockQuery.mock.calls[0][0];
        expect(sql).toContain('UPDATE leads SET');
        expect(sql).toContain('updated_at = CURRENT_TIMESTAMP');
      });

      it('should return null when only disallowed fields are provided', async () => {
        const result = await leads.updateLead(clinicId, 'lead-1', {
          hacked_field: 'drop table',
          organization_id: 'evil',
        });

        expect(result).toBeNull();
        expect(mockQuery).not.toHaveBeenCalled();
      });

      it('should return null when lead does not exist', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await leads.updateLead(clinicId, 'ghost', {
          status: 'CONTACTED',
        });

        expect(result).toBeNull();
      });
    });

    describe('convertLeadToPatient (qualify flow)', () => {
      it('should create patient from lead data and mark lead CONVERTED', async () => {
        // getLeadById: lead query
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              id: 'lead-1',
              first_name: 'Kari',
              last_name: 'Hansen',
              email: 'kari@test.no',
              phone: '+4711223344',
              source: 'WEBSITE',
            },
          ],
        });
        // getLeadById: activities query
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // INSERT patient
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'patient-1', first_name: 'Kari', last_name: 'Hansen' }],
        });
        // UPDATE lead status to CONVERTED
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // INSERT activity log
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await leads.convertLeadToPatient(clinicId, 'lead-1', {});

        expect(result.patient.id).toBe('patient-1');
        expect(result.lead.first_name).toBe('Kari');
        // Verify patient was created with lead data
        const patientInsert = mockQuery.mock.calls[2];
        expect(patientInsert[0]).toContain('INSERT INTO patients');
        expect(patientInsert[1]).toContain('Kari');
        // Verify lead was marked CONVERTED
        const updateCall = mockQuery.mock.calls[3];
        expect(updateCall[0]).toContain("status = 'CONVERTED'");
      });

      it('should throw when lead does not exist', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await expect(leads.convertLeadToPatient(clinicId, 'missing', {})).rejects.toThrow(
          'Lead not found'
        );
      });
    });

    describe('getLeadPipelineStats', () => {
      it('should calculate conversion rate from pipeline data', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [
              { status: 'NEW', count: '10', avg_score: '20' },
              { status: 'QUALIFIED', count: '5', avg_score: '60' },
              { status: 'CONVERTED', count: '3', avg_score: '90' },
            ],
          })
          .mockResolvedValueOnce({
            rows: [{ converted: '3', total: '18' }],
          });

        const result = await leads.getLeadPipelineStats(clinicId);

        expect(result.stages).toHaveLength(3);
        expect(result.totalLeads).toBe(18);
        // 3/18 * 100 = 16.7
        expect(result.conversionRate).toBe('16.7');
      });
    });

    describe('getLeads — search and sort safety', () => {
      it('should add ILIKE search filter on name/email/phone', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'l1' }] });

        await leads.getLeads(clinicId, { search: 'ola' });

        const countSql = mockQuery.mock.calls[0][0];
        expect(countSql).toContain('ILIKE');
        expect(mockQuery.mock.calls[0][1]).toContain('%ola%');
      });

      it('should reject invalid sortBy and fallback to created_at', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '0' }] })
          .mockResolvedValueOnce({ rows: [] });

        await leads.getLeads(clinicId, { sortBy: 'bobby; DROP TABLE--' });

        const dataSql = mockQuery.mock.calls[1][0];
        expect(dataSql).toContain('ORDER BY created_at');
        expect(dataSql).not.toContain('DROP');
      });
    });
  });

  // ===========================================================================
  // LIFECYCLE SERVICE
  // ===========================================================================

  describe('Lifecycle Service', () => {
    describe('updatePatientLifecycle — stage transitions', () => {
      it('should update lifecycle stage for a patient', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'p1', lifecycle_stage: 'AT_RISK', engagement_score: 25 }],
        });

        const result = await lifecycle.updatePatientLifecycle(clinicId, 'p1', {
          stage: 'AT_RISK',
          engagementScore: 25,
        });

        expect(result.lifecycle_stage).toBe('AT_RISK');
        expect(result.engagement_score).toBe(25);
        const sql = mockQuery.mock.calls[0][0];
        expect(sql).toContain('UPDATE patients SET');
        expect(sql).toContain('lifecycle_stage');
        expect(sql).toContain('engagement_score');
      });

      it('should update tags as JSON', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'p2', tags: '["VIP","chronic"]' }],
        });

        const result = await lifecycle.updatePatientLifecycle(clinicId, 'p2', {
          tags: ['VIP', 'chronic'],
        });

        expect(result).toBeDefined();
        // Verify JSON.stringify was applied to tags param
        const params = mockQuery.mock.calls[0][1];
        expect(params).toContain(JSON.stringify(['VIP', 'chronic']));
      });

      it('should return null when no valid fields provided', async () => {
        const result = await lifecycle.updatePatientLifecycle(clinicId, 'p1', {});

        expect(result).toBeNull();
        expect(mockQuery).not.toHaveBeenCalled();
      });
    });

    describe('getLifecycleStats', () => {
      it('should return grouped lifecycle statistics', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { lifecycle_stage: 'ACTIVE', count: '45', avg_engagement: '80', avg_revenue: '3500' },
            { lifecycle_stage: 'AT_RISK', count: '12', avg_engagement: '30', avg_revenue: '1200' },
            { lifecycle_stage: 'INACTIVE', count: '8', avg_engagement: '5', avg_revenue: '400' },
          ],
        });

        const result = await lifecycle.getLifecycleStats(clinicId);

        expect(result).toHaveLength(3);
        expect(result[0].lifecycle_stage).toBe('ACTIVE');
        expect(result[0].count).toBe('45');
      });
    });

    describe('createReferral', () => {
      it('should create referral and increment referrer count', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ id: 'ref-1', referrer_name: 'Ola', referred_name: 'Kari', status: 'PENDING' }],
          })
          .mockResolvedValueOnce({ rows: [] }); // UPDATE referral_count

        const result = await lifecycle.createReferral({
          organization_id: clinicId,
          referrer_patient_id: 'p1',
          referrer_name: 'Ola',
          referrer_email: 'ola@test.no',
          referred_name: 'Kari',
          referred_email: 'kari@test.no',
        });

        expect(result.id).toBe('ref-1');
        expect(mockQuery).toHaveBeenCalledTimes(2);
        // Verify referral_count was incremented
        const updateCall = mockQuery.mock.calls[1];
        expect(updateCall[0]).toContain('referral_count = referral_count + 1');
      });

      it('should not update referral count when no referrer_patient_id', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'ref-2', referrer_name: 'External', status: 'PENDING' }],
        });

        await lifecycle.createReferral({
          organization_id: clinicId,
          referrer_name: 'External',
          referred_name: 'Someone',
        });

        // Only the INSERT, no UPDATE
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateReferral', () => {
      it('should set converted_at timestamp when status is CONVERTED', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'ref-1', status: 'CONVERTED' }],
        });

        const result = await lifecycle.updateReferral(clinicId, 'ref-1', {
          status: 'CONVERTED',
        });

        expect(result.status).toBe('CONVERTED');
        const sql = mockQuery.mock.calls[0][0];
        expect(sql).toContain('converted_at = CURRENT_TIMESTAMP');
      });

      it('should set reward_issued_at when reward_issued is true', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'ref-1', reward_issued: true }],
        });

        await lifecycle.updateReferral(clinicId, 'ref-1', {
          reward_issued: true,
        });

        const sql = mockQuery.mock.calls[0][0];
        expect(sql).toContain('reward_issued_at = CURRENT_TIMESTAMP');
      });
    });

    describe('getNPSStats', () => {
      it('should calculate NPS from promoters and detractors', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              promoters: '7',
              passives: '2',
              detractors: '1',
              total: '10',
              avg_score: '8.5',
            },
          ],
        });

        const result = await lifecycle.getNPSStats(clinicId, '30d');

        // NPS = (7/10 - 1/10) * 100 = 60
        expect(result.nps).toBe(60);
        expect(result.promoters).toBe(7);
        expect(result.detractors).toBe(1);
        expect(result.total).toBe(10);
        expect(result.avgScore).toBe(8.5);
      });
    });

    describe('logCommunication', () => {
      it('should log communication and update patient last_contact_date', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ id: 'comm-1', channel: 'SMS', direction: 'OUTBOUND', status: 'SENT' }],
          })
          .mockResolvedValueOnce({ rows: [] }); // UPDATE patients

        const result = await lifecycle.logCommunication({
          organization_id: clinicId,
          patient_id: 'p1',
          channel: 'SMS',
          direction: 'OUTBOUND',
          subject: 'Appointment reminder',
          message: 'Your appointment is tomorrow',
        });

        expect(result.id).toBe('comm-1');
        expect(mockQuery).toHaveBeenCalledTimes(2);
        const updateCall = mockQuery.mock.calls[1];
        expect(updateCall[0]).toContain('last_contact_date');
      });

      it('should not update patient when no patient_id provided', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'comm-2', channel: 'EMAIL', status: 'SENT' }],
        });

        await lifecycle.logCommunication({
          organization_id: clinicId,
          lead_id: 'lead-1',
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          message: 'Follow-up email',
        });

        // Only INSERT, no patient UPDATE
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });
    });
  });
});
