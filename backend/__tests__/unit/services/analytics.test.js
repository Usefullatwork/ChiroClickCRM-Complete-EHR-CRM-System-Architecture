/**
 * Unit Tests for Analytics Service
 * Tests revenue analytics, patient metrics, appointment stats,
 * exercise compliance, time-range filtering, dashboard aggregation, and CSV export
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

// Import after mocking
const {
  getPatientStats,
  getAppointmentStats,
  getRevenueStats,
  getTopExercises,
  getExerciseCompliance,
  getPatientVolumeTrends,
  getDashboardAnalytics,
  exportAnalyticsCSV,
} = await import('../../../src/services/practice/analytics.js');

describe('Analytics Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // GET PATIENT STATS
  // ===========================================================================

  describe('getPatientStats', () => {
    it('should return patient statistics with month-over-month change', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_patients: '150' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '20' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '15' }] })
        .mockResolvedValueOnce({ rows: [{ active_patients: '80' }] });

      const result = await getPatientStats(testOrgId);

      expect(result.totalPatients).toBe(150);
      expect(result.newPatientsThisMonth).toBe(20);
      expect(result.newPatientsLastMonth).toBe(15);
      expect(result.activePatients).toBe(80);
      expect(result.changePercent).toBe(33); // ((20-15)/15)*100 = 33.33 -> 33
      expect(mockQuery).toHaveBeenCalledTimes(4);
    });

    it('should return 0 changePercent when last month had no new patients', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_patients: '50' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '10' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_patients: '30' }] });

      const result = await getPatientStats(testOrgId);

      expect(result.changePercent).toBe(0);
      expect(result.newPatientsThisMonth).toBe(10);
      expect(result.newPatientsLastMonth).toBe(0);
    });

    it('should handle empty result rows with defaults', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] });

      const result = await getPatientStats(testOrgId);

      expect(result.totalPatients).toBe(0);
      expect(result.newPatientsThisMonth).toBe(0);
      expect(result.newPatientsLastMonth).toBe(0);
      expect(result.activePatients).toBe(0);
      expect(result.changePercent).toBe(0);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(getPatientStats(testOrgId)).rejects.toThrow('DB connection failed');
    });

    it('should pass organization_id to all queries', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_patients: '0' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '0' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_patients: '0' }] });

      await getPatientStats(testOrgId);

      for (let i = 0; i < 4; i++) {
        expect(mockQuery.mock.calls[i][1][0]).toBe(testOrgId);
      }
    });
  });

  // ===========================================================================
  // GET APPOINTMENT STATS
  // ===========================================================================

  describe('getAppointmentStats', () => {
    it('should return comprehensive appointment statistics', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ completed: '45' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '12', confirmed: '5', completed: '3', pending: '4' }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '30', completed: '20', cancelled: '3', no_show: '2' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'apt-1',
              start_time: '2026-03-27T10:00:00Z',
              duration_minutes: 30,
              appointment_type: 'INITIAL',
              status: 'CONFIRMED',
              first_name: 'Ola',
              last_name: 'Nordmann',
              phone: '+4712345678',
            },
          ],
        });

      const result = await getAppointmentStats(testOrgId);

      expect(result.completedThisMonth).toBe(45);
      expect(result.today.total).toBe(12);
      expect(result.today.confirmed).toBe(5);
      expect(result.today.completed).toBe(3);
      expect(result.today.pending).toBe(4);
      expect(result.thisWeek.total).toBe(30);
      expect(result.thisWeek.completed).toBe(20);
      expect(result.thisWeek.cancelled).toBe(3);
      expect(result.thisWeek.noShow).toBe(2);
      expect(result.upcomingToday).toHaveLength(1);
      expect(result.upcomingToday[0].patientName).toBe('Ola Nordmann');
      expect(result.upcomingToday[0].patientPhone).toBe('+4712345678');
      expect(result.upcomingToday[0].appointmentType).toBe('INITIAL');
    });

    it('should handle zero appointments gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getAppointmentStats(testOrgId);

      expect(result.completedThisMonth).toBe(0);
      expect(result.today.total).toBe(0);
      expect(result.thisWeek.total).toBe(0);
      expect(result.upcomingToday).toEqual([]);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query timeout'));

      await expect(getAppointmentStats(testOrgId)).rejects.toThrow('Query timeout');
    });
  });

  // ===========================================================================
  // GET REVENUE STATS
  // ===========================================================================

  describe('getRevenueStats', () => {
    it('should return revenue stats with month-over-month comparison', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '50000.00',
              patient_revenue: '30000.00',
              insurance_revenue: '20000.00',
              transaction_count: '75',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total_revenue: '40000.00' }],
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2026-03-25', revenue: '2000.00' },
            { date: '2026-03-26', revenue: '3000.00' },
          ],
        });

      const result = await getRevenueStats(testOrgId);

      expect(result.thisMonth.totalRevenue).toBe(50000);
      expect(result.thisMonth.patientRevenue).toBe(30000);
      expect(result.thisMonth.insuranceRevenue).toBe(20000);
      expect(result.thisMonth.transactionCount).toBe(75);
      expect(result.lastMonth.totalRevenue).toBe(40000);
      expect(result.changePercent).toBe(25); // ((50000-40000)/40000)*100 = 25
      expect(result.dailyRevenue).toHaveLength(2);
      expect(result.dailyRevenue[0].date).toBe('2026-03-25');
      expect(result.dailyRevenue[0].revenue).toBe(2000);
    });

    it('should accept custom date range parameters', async () => {
      const startDate = '2026-01-01T00:00:00Z';
      const endDate = '2026-01-31T23:59:59Z';

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '10000',
              patient_revenue: '6000',
              insurance_revenue: '4000',
              transaction_count: '20',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_revenue: '8000' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getRevenueStats(testOrgId, startDate, endDate);

      // First query should use the custom date range
      expect(mockQuery.mock.calls[0][1]).toContain(startDate);
      expect(mockQuery.mock.calls[0][1]).toContain(endDate);
      expect(result.thisMonth.totalRevenue).toBe(10000);
    });

    it('should return 0 changePercent when last month revenue was zero', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '5000',
              patient_revenue: '3000',
              insurance_revenue: '2000',
              transaction_count: '10',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_revenue: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getRevenueStats(testOrgId);

      expect(result.changePercent).toBe(0);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Revenue query failed'));

      await expect(getRevenueStats(testOrgId)).rejects.toThrow('Revenue query failed');
    });
  });

  // ===========================================================================
  // GET TOP EXERCISES
  // ===========================================================================

  describe('getTopExercises', () => {
    it('should return top prescribed exercises', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'ex-1',
            name_no: 'Planken',
            name_en: 'Plank',
            category: 'Core',
            subcategory: 'Stability',
            body_region: 'Trunk',
            prescription_count: '50',
            patient_count: '30',
          },
          {
            id: 'ex-2',
            name_no: 'Kneboying',
            name_en: 'Squat',
            category: 'Strength',
            subcategory: 'Lower body',
            body_region: 'Legs',
            prescription_count: '35',
            patient_count: '25',
          },
        ],
      });

      const result = await getTopExercises(testOrgId);

      expect(result).toHaveLength(2);
      expect(result[0].nameNo).toBe('Planken');
      expect(result[0].nameEn).toBe('Plank');
      expect(result[0].prescriptionCount).toBe(50);
      expect(result[0].patientCount).toBe(30);
      expect(result[1].category).toBe('Strength');
    });

    it('should pass custom limit to query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getTopExercises(testOrgId, 5);

      expect(mockQuery.mock.calls[0][1][1]).toBe(5);
    });

    it('should return empty array on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table does not exist'));

      const result = await getTopExercises(testOrgId);

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // GET EXERCISE COMPLIANCE
  // ===========================================================================

  describe('getExerciseCompliance', () => {
    it('should return compliance statistics with weekly trend', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_prescriptions: '100',
              completed: '60',
              active: '25',
              paused: '10',
              cancelled: '5',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_completion_rate: '72.5' }],
        })
        .mockResolvedValueOnce({
          rows: [
            { week: '2026-03-10', total: '15', completed: '10', avg_rate: '68.3' },
            { week: '2026-03-17', total: '18', completed: '13', avg_rate: '75.1' },
          ],
        });

      const result = await getExerciseCompliance(testOrgId);

      expect(result.totalPrescriptions).toBe(100);
      expect(result.completed).toBe(60);
      expect(result.active).toBe(25);
      expect(result.paused).toBe(10);
      expect(result.cancelled).toBe(5);
      expect(result.completionRate).toBe(60); // (60/100)*100
      expect(result.avgProgressRate).toBe(73); // Math.round(72.5)
      expect(result.weeklyTrend).toHaveLength(2);
      expect(result.weeklyTrend[0].total).toBe(15);
      expect(result.weeklyTrend[0].avgRate).toBe(68);
    });

    it('should return default values on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table does not exist'));

      const result = await getExerciseCompliance(testOrgId);

      expect(result.totalPrescriptions).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.weeklyTrend).toEqual([]);
    });
  });

  // ===========================================================================
  // GET PATIENT VOLUME TRENDS
  // ===========================================================================

  describe('getPatientVolumeTrends', () => {
    it('should return monthly volume trends', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { month: '2026-01-01', total_visits: '120', unique_patients: '80' },
          { month: '2026-02-01', total_visits: '135', unique_patients: '90' },
          { month: '2026-03-01', total_visits: '110', unique_patients: '75' },
        ],
      });

      const result = await getPatientVolumeTrends(testOrgId);

      expect(result).toHaveLength(3);
      expect(result[0].month).toBe('2026-01-01');
      expect(result[0].totalVisits).toBe(120);
      expect(result[0].uniquePatients).toBe(80);
      expect(result[2].totalVisits).toBe(110);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Trend query failed'));

      await expect(getPatientVolumeTrends(testOrgId)).rejects.toThrow('Trend query failed');
    });
  });

  // ===========================================================================
  // GET DASHBOARD ANALYTICS
  // ===========================================================================

  describe('getDashboardAnalytics', () => {
    it('should aggregate all analytics into dashboard object', async () => {
      // Promise.all fires 6 sub-functions concurrently; query order is
      // non-deterministic, so use a generic default that satisfies all SQL paths.
      const defaultRow = {
        total_patients: '0',
        new_patients: '0',
        active_patients: '0',
        completed: '0',
        total: '0',
        confirmed: '0',
        pending: '0',
        cancelled: '0',
        no_show: '0',
        total_revenue: '0',
        patient_revenue: '0',
        insurance_revenue: '0',
        transaction_count: '0',
        total_prescriptions: '0',
        active: '0',
        paused: '0',
        avg_completion_rate: '0',
        total_visits: '0',
        unique_patients: '0',
      };
      mockQuery.mockResolvedValue({ rows: [defaultRow] });

      const result = await getDashboardAnalytics(testOrgId);

      expect(result).toHaveProperty('patients');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('exercises');
      expect(result).toHaveProperty('trends');
      expect(result.patients).toHaveProperty('totalPatients');
      expect(result.patients).toHaveProperty('newPatientsThisMonth');
      expect(result.appointments).toHaveProperty('completedThisMonth');
      expect(result.appointments).toHaveProperty('today');
      expect(result.appointments).toHaveProperty('thisWeek');
      expect(result.appointments).toHaveProperty('upcomingToday');
      expect(result.revenue).toHaveProperty('thisMonth');
      expect(result.revenue).toHaveProperty('lastMonth');
      expect(result.revenue).toHaveProperty('dailyRevenue');
      expect(result.exercises).toHaveProperty('topPrescribed');
      expect(result.exercises).toHaveProperty('compliance');
      expect(result.trends).toHaveProperty('patientVolume');
      // Verify all 6 sub-services were called (16 queries total)
      expect(mockQuery.mock.calls.length).toBeGreaterThanOrEqual(16);
    });
  });

  // ===========================================================================
  // EXPORT ANALYTICS CSV
  // ===========================================================================

  describe('exportAnalyticsCSV', () => {
    it('should export patient stats as CSV', async () => {
      // getPatientStats: 4 queries
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_patients: '100' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '10' }] })
        .mockResolvedValueOnce({ rows: [{ new_patients: '8' }] })
        .mockResolvedValueOnce({ rows: [{ active_patients: '50' }] });

      const csv = await exportAnalyticsCSV(testOrgId, 'patients');

      expect(csv).toContain('Metrikk,Verdi');
      expect(csv).toContain('"Totalt antall pasienter"');
      expect(csv).toContain('"100"');
      expect(csv).toContain('"Aktive pasienter"');
    });

    it('should export revenue as CSV with daily data', async () => {
      // getRevenueStats: 3 queries
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '20000',
              patient_revenue: '12000',
              insurance_revenue: '8000',
              transaction_count: '30',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_revenue: '18000' }] })
        .mockResolvedValueOnce({
          rows: [
            { date: '2026-03-25', revenue: '1500' },
            { date: '2026-03-26', revenue: '2500' },
          ],
        });

      const csv = await exportAnalyticsCSV(testOrgId, 'revenue');

      expect(csv).toContain('Dato,Inntekt (NOK)');
      expect(csv).toContain('"2026-03-25"');
      expect(csv).toContain('"1500"');
    });

    it('should export appointment stats as CSV', async () => {
      // getAppointmentStats: 4 queries
      mockQuery
        .mockResolvedValueOnce({ rows: [{ completed: '25' }] })
        .mockResolvedValueOnce({
          rows: [{ total: '8', confirmed: '3', completed: '2', pending: '3' }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '22', completed: '18', cancelled: '2', no_show: '1' }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const csv = await exportAnalyticsCSV(testOrgId, 'appointments');

      expect(csv).toContain('Metrikk,Verdi');
      expect(csv).toContain('"Fullforte denne maneden"');
      expect(csv).toContain('"25"');
    });

    it('should export exercise data as CSV', async () => {
      // getTopExercises: 1 query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'ex-1',
            name_no: 'Planken',
            name_en: 'Plank',
            category: 'Core',
            subcategory: 'Stability',
            body_region: 'Trunk',
            prescription_count: '40',
            patient_count: '25',
          },
        ],
      });

      const csv = await exportAnalyticsCSV(testOrgId, 'exercises');

      expect(csv).toContain('Ovelse,Kategori,Antall foreskrivninger,Antall pasienter');
      expect(csv).toContain('"Planken"');
      expect(csv).toContain('"Core"');
      expect(csv).toContain('"40"');
    });

    it('should export compliance stats as CSV', async () => {
      // getExerciseCompliance: 3 queries
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_prescriptions: '80',
              completed: '50',
              active: '15',
              paused: '10',
              cancelled: '5',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ avg_completion_rate: '70.0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const csv = await exportAnalyticsCSV(testOrgId, 'compliance');

      expect(csv).toContain('Metrikk,Verdi');
      expect(csv).toContain('"Totalt foreskrivninger"');
      expect(csv).toContain('"80"');
      expect(csv).toContain('"Fullforingsrate (%)"');
    });

    it('should throw error for unknown export type', async () => {
      await expect(exportAnalyticsCSV(testOrgId, 'unknown')).rejects.toThrow(
        'Unknown export type: unknown'
      );
    });
  });
});
