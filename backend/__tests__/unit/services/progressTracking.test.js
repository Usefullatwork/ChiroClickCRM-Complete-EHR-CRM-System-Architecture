/**
 * Unit Tests for Progress Tracking & Outcome Scoring Services
 * Tests progress metrics calculation, outcome scores, trend analysis
 */

import { jest } from '@jest/globals';

// Mock database — with resetMocks: true, re-assign in factory
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
const progressService = await import('../../../src/services/clinical/progressTracking.js');
const { scoreODI, scoreNDI, scoreVAS, scoreDASH, scoreNPRS, getScorer, scoreQuestionnaire } =
  await import('../../../src/services/clinical/outcomeScoring.js');

// =============================================================================
// PROGRESS TRACKING SERVICE
// =============================================================================

describe('Progress Tracking Service', () => {
  const orgId = 'org-test-001';
  const patientId = 'patient-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getPatientProgressStats
  // ---------------------------------------------------------------------------

  describe('getPatientProgressStats', () => {
    it('should return comprehensive progress stats with prescriptions', async () => {
      // 1st call: overall stats
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_completions: '25',
            active_days: '14',
            unique_exercises: '5',
            avg_difficulty: '3.2',
            avg_pain: '4.1',
            first_completion: '2026-01-01',
            last_completion: '2026-03-01',
          },
        ],
      });
      // 2nd call: prescription compliance
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            prescription_id: 'rx-1',
            status: 'active',
            start_date: '2026-01-01',
            end_date: '2026-04-01',
            total_prescribed: '8',
            completed_unique: '5',
            total_completions: '25',
          },
        ],
      });
      // 3rd call: current streak
      mockQuery.mockResolvedValueOnce({
        rows: [{ current_streak: '7' }],
      });

      const result = await progressService.getPatientProgressStats(orgId, patientId);

      expect(result.summary.totalCompletions).toBe(25);
      expect(result.summary.activeDays).toBe(14);
      expect(result.summary.uniqueExercises).toBe(5);
      expect(result.summary.currentStreak).toBe(7);
      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].complianceRate).toBe(63); // 5/8 * 100 = 62.5 rounds to 63
    });

    it('should apply date filters when startDate and endDate provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_completions: '10',
            active_days: '5',
            unique_exercises: '3',
            avg_difficulty: '2.5',
            avg_pain: '3.0',
            first_completion: '2026-02-01',
            last_completion: '2026-02-28',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ current_streak: '0' }] });

      const result = await progressService.getPatientProgressStats(orgId, patientId, {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      });

      // First query should have 4 params (org, patient, start, end)
      expect(mockQuery.mock.calls[0][1]).toHaveLength(4);
      expect(result.summary.totalCompletions).toBe(10);
    });

    it('should handle zero completions gracefully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_completions: '0',
            active_days: '0',
            unique_exercises: '0',
            avg_difficulty: null,
            avg_pain: null,
            first_completion: null,
            last_completion: null,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await progressService.getPatientProgressStats(orgId, patientId);

      expect(result.summary.totalCompletions).toBe(0);
      expect(result.summary.activeDays).toBe(0);
      expect(result.summary.currentStreak).toBe(0);
      expect(result.prescriptions).toHaveLength(0);
    });

    it('should throw and log on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(progressService.getPatientProgressStats(orgId, patientId)).rejects.toThrow(
        'DB connection failed'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getWeeklyCompliance
  // ---------------------------------------------------------------------------

  describe('getWeeklyCompliance', () => {
    it('should return weekly compliance data with compliance rates', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            week_start: '2026-03-03',
            completions: '14',
            exercises_done: '5',
            active_days: '5',
            avg_pain: '3.5',
            target: '21',
          },
          {
            week_start: '2026-03-10',
            completions: '7',
            exercises_done: '3',
            active_days: '3',
            avg_pain: '2.8',
            target: '21',
          },
        ],
      });

      const result = await progressService.getWeeklyCompliance(orgId, patientId, 4);

      expect(result).toHaveLength(2);
      expect(result[0].completions).toBe(14);
      expect(result[0].complianceRate).toBe(67); // 14/21 * 100 = 66.67 rounds to 67
      expect(result[1].complianceRate).toBe(33); // 7/21 * 100 = 33.33 rounds to 33
    });

    it('should cap compliance rate at 100%', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            week_start: '2026-03-03',
            completions: '30',
            exercises_done: '5',
            active_days: '7',
            avg_pain: '1.0',
            target: '21',
          },
        ],
      });

      const result = await progressService.getWeeklyCompliance(orgId, patientId);

      expect(result[0].complianceRate).toBe(100); // Math.min(100, 143) = 100
    });

    it('should return 0 compliance rate when target is 0', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            week_start: '2026-03-03',
            completions: '5',
            exercises_done: '2',
            active_days: '2',
            avg_pain: '3.0',
            target: '0',
          },
        ],
      });

      const result = await progressService.getWeeklyCompliance(orgId, patientId);

      expect(result[0].complianceRate).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getDailyProgress
  // ---------------------------------------------------------------------------

  describe('getDailyProgress', () => {
    it('should return daily progress with completion rates', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2026-03-15',
            completions: '3',
            exercises_done: '3',
            total_prescribed: '5',
            avg_pain: '2.5',
            avg_difficulty: '3.0',
            exercise_names: ['Hakeinndragning', 'Planke'],
          },
        ],
      });

      const result = await progressService.getDailyProgress(orgId, patientId, 1);

      expect(result).toHaveLength(1);
      expect(result[0].completions).toBe(3);
      expect(result[0].completionRate).toBe(60); // 3/5 * 100 = 60
      expect(result[0].exerciseNames).toEqual(['Hakeinndragning', 'Planke']);
    });

    it('should handle 0 prescribed returning 0 completion rate', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2026-03-15',
            completions: '2',
            exercises_done: '2',
            total_prescribed: '0',
            avg_pain: null,
            avg_difficulty: null,
            exercise_names: null,
          },
        ],
      });

      const result = await progressService.getDailyProgress(orgId, patientId);

      expect(result[0].completionRate).toBe(0);
      expect(result[0].exerciseNames).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getPainHistory
  // ---------------------------------------------------------------------------

  describe('getPainHistory', () => {
    it('should detect improving pain trend when last week avg drops by >1', async () => {
      // Create 14 data points: first 7 with high pain, last 7 with low pain
      const rows = [];
      for (let i = 0; i < 14; i++) {
        rows.push({
          date: `2026-03-${String(i + 1).padStart(2, '0')}`,
          avg_pain: i < 7 ? '7.0' : '4.0',
          min_pain: i < 7 ? '6' : '3',
          max_pain: i < 7 ? '8' : '5',
          entry_count: '2',
        });
      }

      mockQuery.mockResolvedValueOnce({ rows });

      const result = await progressService.getPainHistory(orgId, patientId);

      expect(result.trend).toBe('improving');
      expect(result.data).toHaveLength(14);
      expect(result.currentAvg).toBe('4.0');
    });

    it('should detect worsening pain trend when last week avg rises by >1', async () => {
      const rows = [];
      for (let i = 0; i < 14; i++) {
        rows.push({
          date: `2026-03-${String(i + 1).padStart(2, '0')}`,
          avg_pain: i < 7 ? '2.0' : '5.0',
          min_pain: i < 7 ? '1' : '4',
          max_pain: i < 7 ? '3' : '6',
          entry_count: '1',
        });
      }

      mockQuery.mockResolvedValueOnce({ rows });

      const result = await progressService.getPainHistory(orgId, patientId);

      expect(result.trend).toBe('worsening');
    });

    it('should report stable trend when difference is within 1 point', async () => {
      const rows = [];
      for (let i = 0; i < 14; i++) {
        rows.push({
          date: `2026-03-${String(i + 1).padStart(2, '0')}`,
          avg_pain: '5.0',
          min_pain: '4',
          max_pain: '6',
          entry_count: '1',
        });
      }

      mockQuery.mockResolvedValueOnce({ rows });

      const result = await progressService.getPainHistory(orgId, patientId);

      expect(result.trend).toBe('stable');
    });

    it('should return stable trend with fewer than 7 data points', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { date: '2026-03-01', avg_pain: '5.0', min_pain: '4', max_pain: '6', entry_count: '1' },
          { date: '2026-03-02', avg_pain: '3.0', min_pain: '2', max_pain: '4', entry_count: '1' },
        ],
      });

      const result = await progressService.getPainHistory(orgId, patientId);

      expect(result.trend).toBe('stable');
      expect(result.data).toHaveLength(2);
    });

    it('should return null currentAvg when no data points exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await progressService.getPainHistory(orgId, patientId);

      expect(result.trend).toBe('stable');
      expect(result.currentAvg).toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getAllPatientsCompliance
  // ---------------------------------------------------------------------------

  describe('getAllPatientsCompliance', () => {
    it('should return patients with compliance status labels', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'p1',
            patient_name: 'Ola Nordmann',
            email: 'ola@test.no',
            phone: '+4712345678',
            total_completions: '30',
            active_days: '20',
            active_days_week: '6',
            last_activity: '2026-03-20',
            recent_avg_pain: '2.5',
            total_prescribed: '5',
            compliance_rate: '86',
          },
          {
            patient_id: 'p2',
            patient_name: 'Kari Hansen',
            email: 'kari@test.no',
            phone: '+4787654321',
            total_completions: '5',
            active_days: '3',
            active_days_week: '1',
            last_activity: '2026-03-15',
            recent_avg_pain: '6.0',
            total_prescribed: '5',
            compliance_rate: '14',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] });

      const result = await progressService.getAllPatientsCompliance(orgId);

      expect(result.patients).toHaveLength(2);
      expect(result.total).toBe(2);
      // 86% -> Excellent/green
      expect(result.patients[0].status.labelEn).toBe('Excellent');
      expect(result.patients[0].status.color).toBe('green');
      // 14% -> Needs follow-up/red
      expect(result.patients[1].status.labelEn).toBe('Needs follow-up');
      expect(result.patients[1].status.color).toBe('red');
    });

    it('should sanitize sort column to prevent SQL injection', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await progressService.getAllPatientsCompliance(orgId, {
        sortBy: 'DROP TABLE patients;--',
        order: 'ASC',
      });

      // Should fall back to safe default 'compliance_rate'
      const sqlUsed = mockQuery.mock.calls[0][0];
      expect(sqlUsed).toContain('compliance_rate');
      expect(sqlUsed).not.toContain('DROP TABLE');
    });
  });

  // ---------------------------------------------------------------------------
  // getClinicComplianceOverview
  // ---------------------------------------------------------------------------

  describe('getClinicComplianceOverview', () => {
    it('should return overview with distribution and weekly trend', async () => {
      // 1st: overall stats
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            active_patients: '20',
            total_completions: '500',
            active_this_week: '15',
            avg_pain_30d: '3.5',
          },
        ],
      });
      // 2nd: distribution
      mockQuery.mockResolvedValueOnce({
        rows: [
          { compliance_level: 'excellent', patient_count: '5' },
          { compliance_level: 'good', patient_count: '8' },
          { compliance_level: 'fair', patient_count: '4' },
          { compliance_level: 'low', patient_count: '2' },
          { compliance_level: 'inactive', patient_count: '1' },
        ],
      });
      // 3rd: weekly trend
      mockQuery.mockResolvedValueOnce({
        rows: [
          { week: '2026-03-03', active_patients: '12', completions: '80' },
          { week: '2026-03-10', active_patients: '15', completions: '105' },
        ],
      });

      const result = await progressService.getClinicComplianceOverview(orgId);

      expect(result.overview.activePatients).toBe(20);
      expect(result.overview.totalCompletions).toBe(500);
      expect(result.overview.activeThisWeek).toBe(15);
      expect(result.overview.avgPain30d).toBe('3.5');
      expect(result.distribution.excellent).toBe(5);
      expect(result.distribution.good).toBe(8);
      expect(result.distribution.inactive).toBe(1);
      expect(result.weeklyTrend).toHaveLength(2);
      expect(result.weeklyTrend[1].completions).toBe(105);
    });
  });

  // ---------------------------------------------------------------------------
  // logPainEntry
  // ---------------------------------------------------------------------------

  describe('logPainEntry', () => {
    it('should log a pain entry for patient with active prescription', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ prescription_id: 'rx-1', exercise_id: 'ex-1' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'prog-1', pain_rating: 5, prescription_id: 'rx-1' }],
      });

      const result = await progressService.logPainEntry(
        orgId,
        patientId,
        5,
        'Litt smerter',
        'portal'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Smerteniva registrert!');
      // Verify INSERT was called with correct params
      expect(mockQuery.mock.calls[1][1]).toEqual([
        'rx-1',
        patientId,
        'ex-1',
        5,
        'Litt smerter',
        'portal',
      ]);
    });

    it('should throw when no active prescription exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(progressService.logPainEntry(orgId, patientId, 5)).rejects.toThrow(
        'Ingen aktiv treningsforskrivning funnet'
      );
    });

    it('should throw when prescription has no exercises', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ prescription_id: 'rx-1', exercise_id: null }],
      });

      await expect(progressService.logPainEntry(orgId, patientId, 5)).rejects.toThrow(
        'Ingen ovelser funnet i treningsforskrivningen'
      );
    });
  });
});

// =============================================================================
// OUTCOME SCORING SERVICE
// =============================================================================

describe('Outcome Scoring Service', () => {
  // ---------------------------------------------------------------------------
  // ODI Scoring
  // ---------------------------------------------------------------------------

  describe('scoreODI', () => {
    it('should score ODI with all 10 sections answered', () => {
      const answers = [0, 1, 2, 3, 4, 5, 2, 1, 3, 2]; // sum=23, max=50
      const result = scoreODI(answers);

      expect(result.score).toBe(23);
      expect(result.maxScore).toBe(50);
      expect(result.percentage).toBe(46);
      expect(result.severity).toBe('Severe disability');
    });

    it('should handle partial answers (skipped sections)', () => {
      const answers = [1, 2, null, null, 3, 1, null, 2, null, 1]; // 6 valid, sum=10, max=30
      const result = scoreODI(answers);

      expect(result.score).toBe(10);
      expect(result.maxScore).toBe(30);
      expect(result.percentage).toBe(33.33);
      expect(result.severity).toBe('Moderate disability');
    });

    it('should classify minimal disability (0-20%)', () => {
      const result = scoreODI([0, 0, 0, 1, 0, 0, 0, 0, 0, 0]); // 1/50 = 2%
      expect(result.severity).toBe('Minimal disability');
    });

    it('should throw on non-array input', () => {
      expect(() => scoreODI('not-array')).toThrow('ODI answers must be an array');
    });

    it('should throw on empty valid answers', () => {
      expect(() => scoreODI([null, null, null])).toThrow(
        'At least one ODI section must be answered'
      );
    });

    it('should throw on out-of-range answer', () => {
      expect(() => scoreODI([0, 6, 2])).toThrow('Each ODI answer must be an integer 0-5');
    });
  });

  // ---------------------------------------------------------------------------
  // NDI Scoring
  // ---------------------------------------------------------------------------

  describe('scoreNDI', () => {
    it('should score NDI and classify by absolute score', () => {
      const answers = [2, 3, 2, 2, 3, 2, 3, 2, 2, 3]; // sum=24
      const result = scoreNDI(answers);

      expect(result.score).toBe(24);
      expect(result.severity).toBe('Moderate disability');
    });

    it('should classify no disability (score 0-4)', () => {
      const result = scoreNDI([0, 0, 0, 1, 0, 0, 0, 0, 0, 0]); // sum=1
      expect(result.severity).toBe('No disability');
    });

    it('should classify complete disability (score 35+)', () => {
      const result = scoreNDI([4, 4, 4, 4, 4, 4, 4, 3, 4, 4]); // sum=39
      expect(result.severity).toBe('Complete disability');
    });
  });

  // ---------------------------------------------------------------------------
  // VAS Scoring
  // ---------------------------------------------------------------------------

  describe('scoreVAS', () => {
    it('should score VAS from 0-100mm scale', () => {
      const result = scoreVAS(45);
      expect(result.score).toBe(45);
      expect(result.maxScore).toBe(100);
      expect(result.severity).toBe('Moderate pain');
    });

    it('should classify no pain at 0', () => {
      expect(scoreVAS(0).severity).toBe('No pain');
    });

    it('should classify mild pain (1-30)', () => {
      expect(scoreVAS(25).severity).toBe('Mild pain');
    });

    it('should classify severe pain (61-100)', () => {
      expect(scoreVAS(80).severity).toBe('Severe pain');
    });

    it('should throw on out-of-range value', () => {
      expect(() => scoreVAS(101)).toThrow('VAS value must be a number 0-100');
      expect(() => scoreVAS(-1)).toThrow('VAS value must be a number 0-100');
    });
  });

  // ---------------------------------------------------------------------------
  // DASH Scoring
  // ---------------------------------------------------------------------------

  describe('scoreDASH', () => {
    it('should compute DASH score with formula ((sum/n) - 1) * 25', () => {
      // 30 items all scored 3: ((90/30) - 1) * 25 = 50
      const answers = Array(30).fill(3);
      const result = scoreDASH(answers);

      expect(result.score).toBe(50);
      expect(result.maxScore).toBe(100);
      expect(result.severity).toBe('Moderate difficulty');
    });

    it('should allow minimum 27 answered items', () => {
      const answers = [...Array(27).fill(2), null, null, null];
      const result = scoreDASH(answers);

      // ((54/27) - 1) * 25 = 25
      expect(result.score).toBe(25);
      expect(result.severity).toBe('Mild difficulty');
    });

    it('should throw when fewer than 27 items answered', () => {
      const answers = [...Array(26).fill(2), null, null, null, null];
      expect(() => scoreDASH(answers)).toThrow('DASH requires at least 27 of 30 items answered');
    });

    it('should throw on answer outside 1-5 range', () => {
      const answers = Array(30).fill(0);
      expect(() => scoreDASH(answers)).toThrow('Each DASH answer must be an integer 1-5');
    });
  });

  // ---------------------------------------------------------------------------
  // NPRS Scoring
  // ---------------------------------------------------------------------------

  describe('scoreNPRS', () => {
    it('should score NPRS on 0-10 scale', () => {
      const result = scoreNPRS(7);
      expect(result.score).toBe(7);
      expect(result.maxScore).toBe(10);
      expect(result.percentage).toBe(70);
      expect(result.severity).toBe('Severe pain');
    });

    it('should classify no pain at 0', () => {
      expect(scoreNPRS(0).severity).toBe('No pain');
    });

    it('should classify mild pain (1-3)', () => {
      expect(scoreNPRS(2).severity).toBe('Mild pain');
    });

    it('should classify moderate pain (4-6)', () => {
      expect(scoreNPRS(5).severity).toBe('Moderate pain');
    });

    it('should throw on non-integer', () => {
      expect(() => scoreNPRS(3.5)).toThrow('NPRS value must be an integer 0-10');
    });
  });

  // ---------------------------------------------------------------------------
  // getScorer / scoreQuestionnaire
  // ---------------------------------------------------------------------------

  describe('getScorer', () => {
    it('should return the correct scorer for each type', () => {
      expect(getScorer('ODI')).toBe(scoreODI);
      expect(getScorer('NDI')).toBe(scoreNDI);
      expect(getScorer('VAS')).toBe(scoreVAS);
      expect(getScorer('DASH')).toBe(scoreDASH);
      expect(getScorer('NPRS')).toBe(scoreNPRS);
    });

    it('should throw on unknown questionnaire type', () => {
      expect(() => getScorer('UNKNOWN')).toThrow('Unknown questionnaire type: UNKNOWN');
    });
  });

  describe('scoreQuestionnaire', () => {
    it('should score VAS from object with value property', () => {
      const result = scoreQuestionnaire('VAS', { value: 50 });
      expect(result.score).toBe(50);
      expect(result.severity).toBe('Moderate pain');
    });

    it('should score NPRS from raw number', () => {
      const result = scoreQuestionnaire('NPRS', 3);
      expect(result.score).toBe(3);
      expect(result.severity).toBe('Mild pain');
    });

    it('should score ODI from array answers', () => {
      const result = scoreQuestionnaire('ODI', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(result.score).toBe(0);
      expect(result.severity).toBe('Minimal disability');
    });
  });
});
