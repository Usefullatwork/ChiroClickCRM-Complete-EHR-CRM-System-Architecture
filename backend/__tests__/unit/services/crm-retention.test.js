/**
 * Unit Tests for CRM Retention & Waitlist Services
 * Tests retention dashboard, churn analysis, cohort retention,
 * waitlist CRUD, notifications, CRM overview, and settings
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

// Mock lifecycle dependency (waitlist.js imports getNPSStats from lifecycle.js)
const mockGetNPSStats = jest.fn();
jest.unstable_mockModule('../../../src/services/crm/lifecycle.js', () => ({
  getNPSStats: mockGetNPSStats,
  getPatientsByLifecycle: jest.fn(),
  getLifecycleStats: jest.fn(),
  getPatientEngagementScore: jest.fn(),
  updateLifecycleStage: jest.fn(),
  recordNPSSurvey: jest.fn(),
  getReferrals: jest.fn(),
  createReferral: jest.fn(),
  updateReferral: jest.fn(),
}));

// Import modules under test after mocking
const retention = await import('../../../src/services/crm/retention.js');
const waitlist = await import('../../../src/services/crm/waitlist.js');

describe('CRM Retention & Waitlist Services', () => {
  const clinicId = 'clinic-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // RETENTION
  // ===========================================================================

  describe('Retention', () => {
    describe('getRetentionDashboard', () => {
      it('should compute retention rate from retained/trackable patients', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ retained: '30', total_trackable: '60', avg_frequency: '21.0' }],
          })
          .mockResolvedValueOnce({
            rows: [
              { lifecycle_stage: 'ACTIVE', count: '45' },
              { lifecycle_stage: 'AT_RISK', count: '15' },
            ],
          });

        const result = await retention.getRetentionDashboard(clinicId, '30d');

        expect(result.retentionRate).toBe(50.0);
        expect(result.retainedPatients).toBe(30);
        expect(result.avgVisitFrequency).toBe(21.0);
        expect(result.lifecycleDistribution).toHaveLength(2);
        expect(mockQuery).toHaveBeenCalledTimes(2);
      });

      it('should cap retention rate at 100%', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ retained: '55', total_trackable: '50', avg_frequency: '10' }],
          })
          .mockResolvedValueOnce({ rows: [] });

        const result = await retention.getRetentionDashboard(clinicId, '30d');

        expect(result.retentionRate).toBe(100.0);
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
        expect(result.retainedPatients).toBe(0);
      });

      it('should default to 30 days when period is invalid', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ retained: '10', total_trackable: '20', avg_frequency: '7' }],
          })
          .mockResolvedValueOnce({ rows: [] });

        await retention.getRetentionDashboard(clinicId, 'invalid');

        const metricsCall = mockQuery.mock.calls[0];
        expect(metricsCall[1]).toEqual([clinicId, 30]);
      });

      it('should parse numeric period string correctly', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ retained: '5', total_trackable: '10', avg_frequency: '14' }],
          })
          .mockResolvedValueOnce({ rows: [] });

        await retention.getRetentionDashboard(clinicId, '90d');

        const metricsCall = mockQuery.mock.calls[0];
        expect(metricsCall[1]).toEqual([clinicId, 90]);
      });
    });

    describe('getChurnAnalysis', () => {
      it('should return churn counts and monthly trend', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ inactive: '12', lost: '5', at_risk: '20' }],
          })
          .mockResolvedValueOnce({
            rows: [
              { month: '2026-01-01', count: '4' },
              { month: '2026-02-01', count: '6' },
              { month: '2026-03-01', count: '3' },
            ],
          });

        const result = await retention.getChurnAnalysis(clinicId);

        expect(result.current.inactive).toBe('12');
        expect(result.current.lost).toBe('5');
        expect(result.current.at_risk).toBe('20');
        expect(result.trend).toHaveLength(3);
        expect(mockQuery).toHaveBeenCalledTimes(2);
      });

      it('should handle zero churn', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [{ inactive: '0', lost: '0', at_risk: '0' }],
          })
          .mockResolvedValueOnce({ rows: [] });

        const result = await retention.getChurnAnalysis(clinicId);

        expect(result.current.inactive).toBe('0');
        expect(result.current.lost).toBe('0');
        expect(result.trend).toHaveLength(0);
      });

      it('should pass clinicId to both queries', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ inactive: '0', lost: '0', at_risk: '0' }] })
          .mockResolvedValueOnce({ rows: [] });

        await retention.getChurnAnalysis(clinicId);

        expect(mockQuery.mock.calls[0][1]).toEqual([clinicId]);
        expect(mockQuery.mock.calls[1][1]).toEqual([clinicId]);
      });
    });

    describe('getCohortRetention', () => {
      it('should compute retention rate per cohort', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { cohort_month: '2026-01-01', cohort_size: 20, still_active: 15 },
            { cohort_month: '2026-02-01', cohort_size: 10, still_active: 8 },
          ],
        });

        const result = await retention.getCohortRetention(clinicId, 6);

        expect(result).toHaveLength(2);
        expect(result[0].retention_rate).toBe('75.0');
        expect(result[1].retention_rate).toBe('80.0');
      });

      it('should return 0 retention rate for empty cohort', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ cohort_month: '2026-01-01', cohort_size: 0, still_active: 0 }],
        });

        const result = await retention.getCohortRetention(clinicId, 3);

        expect(result[0].retention_rate).toBe(0);
      });

      it('should default to 6 months', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await retention.getCohortRetention(clinicId);

        const call = mockQuery.mock.calls[0];
        expect(call[1]).toEqual([clinicId, 6]);
      });

      it('should preserve original row fields alongside retention_rate', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ cohort_month: '2026-03-01', cohort_size: 25, still_active: 20 }],
        });

        const result = await retention.getCohortRetention(clinicId, 1);

        expect(result[0].cohort_month).toBe('2026-03-01');
        expect(result[0].cohort_size).toBe(25);
        expect(result[0].still_active).toBe(20);
        expect(result[0].retention_rate).toBe('80.0');
      });
    });
  });

  // ===========================================================================
  // WAITLIST
  // ===========================================================================

  describe('Waitlist', () => {
    describe('getWaitlist', () => {
      it('should return paginated waitlist entries with defaults', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '5' }] }).mockResolvedValueOnce({
          rows: [
            { id: 'w1', patient_id: 'p1', priority: 'HIGH' },
            { id: 'w2', patient_id: 'p2', priority: 'NORMAL' },
          ],
        });

        const result = await waitlist.getWaitlist(clinicId);

        expect(result.entries).toHaveLength(2);
        expect(result.pagination.total).toBe(5);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(20);
        expect(result.pagination.totalPages).toBe(1);
      });

      it('should filter by practitioner', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] }).mockResolvedValueOnce({
          rows: [{ id: 'w1', preferred_practitioner_id: 'prac-1' }],
        });

        const result = await waitlist.getWaitlist(clinicId, { practitionerId: 'prac-1' });

        expect(result.entries).toHaveLength(1);
        const countCall = mockQuery.mock.calls[0];
        expect(countCall[1]).toContain('prac-1');
      });

      it('should handle custom pagination', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '50' }] })
          .mockResolvedValueOnce({ rows: [] });

        const result = await waitlist.getWaitlist(clinicId, { page: 3, limit: 10 });

        expect(result.pagination.page).toBe(3);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.totalPages).toBe(5);
        // Verify offset: (3-1)*10 = 20
        const dataCall = mockQuery.mock.calls[1];
        expect(dataCall[1]).toContain(20);
      });

      it('should handle empty waitlist', async () => {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ total: '0' }] })
          .mockResolvedValueOnce({ rows: [] });

        const result = await waitlist.getWaitlist(clinicId);

        expect(result.entries).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
      });
    });

    describe('addToWaitlist', () => {
      it('should insert a waitlist entry with all fields', async () => {
        const entry = {
          organization_id: clinicId,
          patient_id: 'p1',
          preferred_practitioner_id: 'prac-1',
          preferred_days: ['MONDAY', 'WEDNESDAY'],
          preferred_time_start: '09:00',
          preferred_time_end: '12:00',
          service_type: 'INITIAL',
          duration_minutes: 45,
          priority: 'HIGH',
          notes: 'Urgent',
          expires_at: '2026-04-01',
        };

        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'w-new', ...entry }],
        });

        const result = await waitlist.addToWaitlist(entry);

        expect(result.id).toBe('w-new');
        const call = mockQuery.mock.calls[0];
        expect(call[1]).toContain(clinicId);
        expect(call[1]).toContain('p1');
        expect(call[1]).toContain(JSON.stringify(['MONDAY', 'WEDNESDAY']));
        expect(call[1]).toContain(45);
        expect(call[1]).toContain('HIGH');
      });

      it('should default duration to 30 and priority to NORMAL', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'w-default', patient_id: 'p2' }],
        });

        await waitlist.addToWaitlist({
          organization_id: clinicId,
          patient_id: 'p2',
        });

        const call = mockQuery.mock.calls[0];
        // duration_minutes default = 30
        expect(call[1]).toContain(30);
        // priority default = 'NORMAL'
        expect(call[1]).toContain('NORMAL');
      });

      it('should stringify empty preferred_days as empty array', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'w-empty-days' }],
        });

        await waitlist.addToWaitlist({
          organization_id: clinicId,
          patient_id: 'p3',
        });

        const call = mockQuery.mock.calls[0];
        expect(call[1]).toContain(JSON.stringify([]));
      });
    });

    describe('updateWaitlistEntry', () => {
      it('should update allowed fields', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'w1', status: 'NOTIFIED', priority: 'HIGH' }],
        });

        const result = await waitlist.updateWaitlistEntry(clinicId, 'w1', {
          status: 'NOTIFIED',
          priority: 'HIGH',
        });

        expect(result).toBeDefined();
        expect(result.status).toBe('NOTIFIED');
        expect(result.priority).toBe('HIGH');
      });

      it('should return null when no allowed fields provided', async () => {
        const result = await waitlist.updateWaitlistEntry(clinicId, 'w1', {
          invalid_field: 'value',
          another_bad: 123,
        });

        expect(result).toBeNull();
        expect(mockQuery).not.toHaveBeenCalled();
      });

      it('should JSON.stringify object values', async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'w1', preferred_days: ['TUESDAY'] }],
        });

        await waitlist.updateWaitlistEntry(clinicId, 'w1', {
          preferred_days: ['TUESDAY', 'THURSDAY'],
        });

        const call = mockQuery.mock.calls[0];
        expect(call[1]).toContain(JSON.stringify(['TUESDAY', 'THURSDAY']));
      });

      it('should return undefined when entry not found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await waitlist.updateWaitlistEntry(clinicId, 'non-existent', {
          status: 'CANCELLED',
        });

        expect(result).toBeUndefined();
      });
    });

    describe('notifyWaitlistPatients', () => {
      it('should find and notify matching patients', async () => {
        mockQuery
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'w1',
                patient_id: 'p1',
                first_name: 'Ola',
                last_name: 'Nordmann',
                phone: '+4712345678',
                email: 'ola@test.no',
              },
              {
                id: 'w2',
                patient_id: 'p2',
                first_name: 'Kari',
                last_name: 'Hansen',
                phone: '+4787654321',
                email: 'kari@test.no',
              },
            ],
          })
          .mockResolvedValueOnce({ rowCount: 2 }); // UPDATE notification count

        const result = await waitlist.notifyWaitlistPatients(clinicId, {
          _slotDate: '2026-04-01',
          _slotTime: '10:00',
          practitionerId: 'prac-1',
        });

        expect(result.notified).toBe(2);
        expect(result.patients).toHaveLength(2);
        expect(result.patients[0].name).toBe('Ola Nordmann');
        expect(result.patients[1].email).toBe('kari@test.no');
      });

      it('should skip update when no matching entries found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const result = await waitlist.notifyWaitlistPatients(clinicId, {
          _slotDate: '2026-04-01',
          _slotTime: '10:00',
        });

        expect(result.notified).toBe(0);
        expect(result.patients).toHaveLength(0);
        // Only the SELECT query, no UPDATE
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });

      it('should filter by practitioner when provided', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await waitlist.notifyWaitlistPatients(clinicId, {
          practitionerId: 'prac-5',
        });

        const selectCall = mockQuery.mock.calls[0];
        expect(selectCall[1]).toContain('prac-5');
        expect(selectCall[0]).toContain('preferred_practitioner_id');
      });
    });
  });

  // ===========================================================================
  // CRM OVERVIEW
  // ===========================================================================

  describe('CRM Overview', () => {
    describe('getCRMOverview', () => {
      it('should aggregate data from parallel queries', async () => {
        mockGetNPSStats.mockResolvedValueOnce({ nps: 72 });
        mockQuery
          .mockResolvedValueOnce({ rows: [{ new_leads: '8' }] })
          .mockResolvedValueOnce({
            rows: [
              { lifecycle_stage: 'ACTIVE', count: '100' },
              { lifecycle_stage: 'AT_RISK', count: '15' },
            ],
          })
          .mockResolvedValueOnce({ rows: [{ pending: '3' }] })
          .mockResolvedValueOnce({ rows: [{ count: '7' }] });

        const result = await waitlist.getCRMOverview(clinicId);

        expect(result.newLeads).toBe(8);
        expect(result.activePatients).toBe(100);
        expect(result.atRiskPatients).toBe(15);
        expect(result.pendingReferrals).toBe(3);
        expect(result.avgNPS).toBe(72);
        expect(result.waitlistCount).toBe(7);
      });

      it('should gracefully handle query failures with fallbacks', async () => {
        // All queries fail
        mockGetNPSStats.mockRejectedValueOnce(new Error('NPS table missing'));
        mockQuery
          .mockRejectedValueOnce(new Error('leads table missing'))
          .mockRejectedValueOnce(new Error('patients table missing'))
          .mockRejectedValueOnce(new Error('referrals table missing'))
          .mockRejectedValueOnce(new Error('waitlist table missing'));

        const result = await waitlist.getCRMOverview(clinicId);

        expect(result.newLeads).toBe(0);
        expect(result.activePatients).toBe(0);
        expect(result.atRiskPatients).toBe(0);
        expect(result.pendingReferrals).toBe(0);
        expect(result.avgNPS).toBe(0);
        expect(result.waitlistCount).toBe(0);
      });
    });
  });

  // ===========================================================================
  // CRM SETTINGS
  // ===========================================================================

  describe('CRM Settings', () => {
    describe('getCRMSettings', () => {
      it('should return default settings', async () => {
        const result = await waitlist.getCRMSettings(clinicId);

        expect(result.checkInFrequencyDays).toBe(30);
        expect(result.atRiskThresholdDays).toBe(42);
        expect(result.inactiveThresholdDays).toBe(90);
        expect(result.lostThresholdDays).toBe(180);
        expect(result.autoSendSurveys).toBe(true);
        expect(result.enableReferralProgram).toBe(true);
        expect(result.enableWaitlist).toBe(true);
        expect(result.maxWaitlistNotifications).toBe(3);
        expect(result.defaultReferralReward).toEqual({
          type: 'DISCOUNT',
          amount: 20,
          description: '20% rabatt',
        });
      });
    });

    describe('updateCRMSettings', () => {
      it('should return the provided settings', async () => {
        const newSettings = {
          checkInFrequencyDays: 14,
          autoSendSurveys: false,
        };

        const result = await waitlist.updateCRMSettings(clinicId, newSettings);

        expect(result).toEqual(newSettings);
      });
    });
  });
});
