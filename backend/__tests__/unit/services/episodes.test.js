/**
 * Unit Tests for Care Episodes Service
 * Tests episode creation, progress tracking, re-eval scheduling,
 * billing modifier lookups, and improvement calculations.
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

// Import after mocking
const episodesService = await import('../../../src/services/episodes.js');

describe('Episodes Service', () => {
  const testOrgId = 'org-001';
  const testEpisodeId = 'episode-abc';
  const testPatientId = 'patient-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('EPISODE_STATUS', () => {
    it('should export the four episode statuses', () => {
      const { EPISODE_STATUS } = episodesService;
      expect(EPISODE_STATUS.ACTIVE).toBe('ACTIVE');
      expect(EPISODE_STATUS.MAINTENANCE).toBe('MAINTENANCE');
      expect(EPISODE_STATUS.DISCHARGED).toBe('DISCHARGED');
      expect(EPISODE_STATUS.INACTIVE).toBe('INACTIVE');
    });
  });

  describe('BODY_REGIONS', () => {
    it('should export the five body regions', () => {
      const { BODY_REGIONS } = episodesService;
      expect(BODY_REGIONS.CERVICAL).toBe('CERVICAL');
      expect(BODY_REGIONS.LUMBAR).toBe('LUMBAR');
      expect(BODY_REGIONS.EXTREMITY).toBe('EXTREMITY');
    });
  });

  // ===========================================================================
  // createEpisode
  // ===========================================================================

  describe('createEpisode', () => {
    it('should insert a new episode and return the created row', async () => {
      const fakeEpisode = {
        id: testEpisodeId,
        organization_id: testOrgId,
        patient_id: testPatientId,
        chief_complaint: 'Lower back pain',
        status: 'ACTIVE',
      };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.createEpisode(testOrgId, {
        patient_id: testPatientId,
        chief_complaint: 'Lower back pain',
        body_region: 'LUMBAR',
        baseline_pain_level: 7,
        baseline_function_score: 40,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/INSERT INTO care_episodes/i);
      expect(params[0]).toBe(testOrgId);
      expect(params[1]).toBe(testPatientId);
      expect(result).toEqual(fakeEpisode);
    });

    it('should default optional fields to null when omitted', async () => {
      const fakeEpisode = { id: testEpisodeId };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      await episodesService.createEpisode(testOrgId, {
        patient_id: testPatientId,
        chief_complaint: 'Neck pain',
      });

      const params = mockQuery.mock.calls[0][1];
      // body_region is $4 (index 3) — should be null when not provided
      expect(params[3]).toBeNull();
    });

    it('should schedule next_reeval_due approximately 30 days from now', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testEpisodeId }] });

      const before = new Date();
      await episodesService.createEpisode(testOrgId, {
        patient_id: testPatientId,
        chief_complaint: 'Shoulder pain',
      });
      const after = new Date();

      const params = mockQuery.mock.calls[0][1];
      // next_reeval_due is the 13th param (index 12)
      const reevalDate = params[12];
      expect(reevalDate).toBeInstanceOf(Date);
      const dayMs = 24 * 60 * 60 * 1000;
      const minExpected = new Date(before.getTime() + 29 * dayMs);
      const maxExpected = new Date(after.getTime() + 31 * dayMs);
      expect(reevalDate.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
      expect(reevalDate.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
    });
  });

  // ===========================================================================
  // getActiveEpisode
  // ===========================================================================

  describe('getActiveEpisode', () => {
    it('should return the most recent active or maintenance episode', async () => {
      const fakeEpisode = { id: testEpisodeId, status: 'ACTIVE', patient_name: 'Ola Nordmann' };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.getActiveEpisode(testOrgId, testPatientId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/status IN \('ACTIVE', 'MAINTENANCE'\)/);
      expect(params).toEqual([testOrgId, testPatientId]);
      expect(result).toEqual(fakeEpisode);
    });

    it('should return null when no active episode exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await episodesService.getActiveEpisode(testOrgId, testPatientId);

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // getEpisodeById
  // ===========================================================================

  describe('getEpisodeById', () => {
    it('should return episode with patient and provider names', async () => {
      const fakeEpisode = {
        id: testEpisodeId,
        patient_name: 'Kari Nordmann',
        mmi_determined_by_name: 'Dr. Hansen',
      };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.getEpisodeById(testOrgId, testEpisodeId);

      expect(result).toEqual(fakeEpisode);
      const params = mockQuery.mock.calls[0][1];
      expect(params).toEqual([testOrgId, testEpisodeId]);
    });

    it('should return null when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await episodesService.getEpisodeById(testOrgId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // getPatientEpisodes
  // ===========================================================================

  describe('getPatientEpisodes', () => {
    it('should return all episodes for a patient ordered by start_date desc', async () => {
      const fakeRows = [
        { id: 'ep-2', start_date: '2026-01-01', visit_count: '5' },
        { id: 'ep-1', start_date: '2025-06-01', visit_count: '12' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await episodesService.getPatientEpisodes(testOrgId, testPatientId);

      expect(result).toEqual(fakeRows);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when patient has no episodes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await episodesService.getPatientEpisodes(testOrgId, testPatientId);

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // updateEpisodeProgress
  // ===========================================================================

  describe('updateEpisodeProgress', () => {
    it('should increment visit counter and update pain level', async () => {
      const fakeEpisode = { id: testEpisodeId, current_pain_level: 5, visits_since_last_reeval: 3 };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.updateEpisodeProgress(testOrgId, testEpisodeId, {
        current_pain_level: 5,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/visits_since_last_reeval = visits_since_last_reeval \+ 1/);
      expect(sql).toMatch(/current_pain_level/);
      expect(result).toEqual(fakeEpisode);
    });

    it('should throw when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        episodesService.updateEpisodeProgress(testOrgId, 'nonexistent', {})
      ).rejects.toThrow('Episode not found');
    });

    it('should append date-stamped clinical notes when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testEpisodeId }] });

      await episodesService.updateEpisodeProgress(testOrgId, testEpisodeId, {
        clinical_notes: 'Patient reports improvement',
      });

      const params = mockQuery.mock.calls[0][1];
      // The last param should be the stamped note
      const stampedNote = params[params.length - 1];
      expect(stampedNote).toMatch(/\[\d{4}-\d{2}-\d{2}\] Patient reports improvement/);
    });

    it('should only update pain level when only pain is provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testEpisodeId }] });

      await episodesService.updateEpisodeProgress(testOrgId, testEpisodeId, {
        current_pain_level: 3,
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/current_pain_level/);
      expect(sql).not.toMatch(/current_function_score/);
    });
  });

  // ===========================================================================
  // performReEvaluation
  // ===========================================================================

  describe('performReEvaluation', () => {
    const reevalData = {
      current_pain_level: 3,
      current_function_score: 20,
      clinical_notes: 'Good progress noted',
    };

    it('should reset visit counter and update reeval dates', async () => {
      const fakeEpisode = { id: testEpisodeId, visits_since_last_reeval: 0 };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.performReEvaluation(
        testOrgId,
        testEpisodeId,
        reevalData
      );

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/visits_since_last_reeval = 0/);
      expect(sql).toMatch(/next_reeval_due = \$5/);
      expect(params[0]).toBe(testEpisodeId);
      expect(params[1]).toBe(testOrgId);
      expect(params[2]).toBe(3); // current_pain_level
      expect(params[3]).toBe(20); // current_function_score
      expect(result).toEqual(fakeEpisode);
    });

    it('should schedule next reeval using default 4 weeks when not specified', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testEpisodeId }] });

      const before = new Date();
      await episodesService.performReEvaluation(testOrgId, testEpisodeId, reevalData);
      const after = new Date();

      const params = mockQuery.mock.calls[0][1];
      const reevalDate = params[4]; // next_reeval_due is $5 (index 4)
      const dayMs = 24 * 60 * 60 * 1000;
      const minExpected = new Date(before.getTime() + 27 * dayMs);
      const maxExpected = new Date(after.getTime() + 29 * dayMs);
      expect(reevalDate.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
      expect(reevalDate.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
    });

    it('should throw when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        episodesService.performReEvaluation(testOrgId, 'nonexistent', reevalData)
      ).rejects.toThrow('Episode not found');
    });

    it('should prefix clinical notes with RE-EVAL date stamp', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testEpisodeId }] });

      await episodesService.performReEvaluation(testOrgId, testEpisodeId, reevalData);

      const params = mockQuery.mock.calls[0][1];
      const note = params[5]; // $6
      expect(note).toMatch(/^\[RE-EVAL \d{4}-\d{2}-\d{2}\]/);
      expect(note).toContain('Good progress noted');
    });
  });

  // ===========================================================================
  // transitionToMaintenance
  // ===========================================================================

  describe('transitionToMaintenance', () => {
    it('should set status to MAINTENANCE with MMI details', async () => {
      const fakeEpisode = { id: testEpisodeId, status: 'MAINTENANCE' };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.transitionToMaintenance(testOrgId, testEpisodeId, {
        mmi_determined_by: 'user-doc-001',
        abn_on_file: true,
        abn_signed_date: '2026-03-01',
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/status = 'MAINTENANCE'/);
      expect(params[2]).toBe('user-doc-001'); // mmi_determined_by
      expect(params[3]).toBe(true); // abn_on_file
      expect(result).toEqual(fakeEpisode);
    });

    it('should throw when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        episodesService.transitionToMaintenance(testOrgId, 'nonexistent', {
          mmi_determined_by: 'user-doc-001',
        })
      ).rejects.toThrow('Episode not found');
    });
  });

  // ===========================================================================
  // recordABN
  // ===========================================================================

  describe('recordABN', () => {
    it('should record ABN signature and return updated episode', async () => {
      const fakeEpisode = { id: testEpisodeId, abn_on_file: true };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.recordABN(testOrgId, testEpisodeId, {
        abn_signed_date: '2026-03-15',
        abn_document_id: 'doc-abn-001',
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/abn_on_file = true/);
      expect(params[2]).toBe('2026-03-15');
      expect(params[3]).toBe('doc-abn-001');
      expect(result).toEqual(fakeEpisode);
    });

    it('should throw when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        episodesService.recordABN(testOrgId, 'nonexistent', { abn_signed_date: '2026-03-15' })
      ).rejects.toThrow('Episode not found');
    });
  });

  // ===========================================================================
  // dischargeEpisode
  // ===========================================================================

  describe('dischargeEpisode', () => {
    it('should set status to DISCHARGED with end_date', async () => {
      const fakeEpisode = { id: testEpisodeId, status: 'DISCHARGED' };
      mockQuery.mockResolvedValueOnce({ rows: [fakeEpisode] });

      const result = await episodesService.dischargeEpisode(testOrgId, testEpisodeId, {
        discharge_notes: 'Goals met, patient independent',
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/status = 'DISCHARGED'/);
      expect(sql).toMatch(/end_date = CURRENT_DATE/);
      expect(params[2]).toBe('Goals met, patient independent');
      expect(result).toEqual(fakeEpisode);
    });

    it('should throw when episode is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(episodesService.dischargeEpisode(testOrgId, 'nonexistent', {})).rejects.toThrow(
        'Episode not found'
      );
    });
  });

  // ===========================================================================
  // getEpisodesNeedingReeval
  // ===========================================================================

  describe('getEpisodesNeedingReeval', () => {
    it('should query the episodes_needing_reeval view', async () => {
      const fakeRows = [{ id: 'ep-1' }, { id: 'ep-2' }];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await episodesService.getEpisodesNeedingReeval(testOrgId);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/FROM episodes_needing_reeval/);
      expect(params).toEqual([testOrgId]);
      expect(result).toEqual(fakeRows);
    });
  });

  // ===========================================================================
  // getBillingModifier
  // ===========================================================================

  describe('getBillingModifier', () => {
    it('should call the determine_billing_modifier DB function and return modifier', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ modifier: 'AT' }] });

      const result = await episodesService.getBillingModifier(testEpisodeId, testPatientId);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/determine_billing_modifier\(\$1, \$2\)/);
      expect(params).toEqual([testEpisodeId, testPatientId]);
      expect(result).toBe('AT');
    });
  });

  // ===========================================================================
  // calculateImprovement (pure function — no DB)
  // ===========================================================================

  describe('calculateImprovement', () => {
    it('should return null when episode is null', () => {
      const result = episodesService.calculateImprovement(null);
      expect(result).toBeNull();
    });

    it('should calculate pain improvement percentage', () => {
      const result = episodesService.calculateImprovement({
        baseline_pain_level: 10,
        current_pain_level: 4,
        baseline_function_score: null,
        current_function_score: null,
      });

      expect(result).toEqual({ type: 'pain', baseline: 10, current: 4, improvement: 60 });
    });

    it('should fall back to function improvement when pain data is missing', () => {
      const result = episodesService.calculateImprovement({
        baseline_pain_level: null,
        current_pain_level: null,
        baseline_function_score: 50,
        current_function_score: 30,
      });

      expect(result).toEqual({ type: 'function', baseline: 50, current: 30, improvement: 40 });
    });

    it('should return null when no baseline data is available', () => {
      const result = episodesService.calculateImprovement({
        baseline_pain_level: null,
        current_pain_level: null,
        baseline_function_score: null,
        current_function_score: null,
      });

      expect(result).toBeNull();
    });

    it('should round improvement to one decimal place', () => {
      const result = episodesService.calculateImprovement({
        baseline_pain_level: 9,
        current_pain_level: 4,
        baseline_function_score: null,
        current_function_score: null,
      });

      // (9-4)/9 * 100 = 55.555... → 55.6
      expect(result.improvement).toBe(55.6);
    });
  });

  // ===========================================================================
  // getEpisodeSummary (integration of multiple calls)
  // ===========================================================================

  describe('getEpisodeSummary', () => {
    it('should return null when episode does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // getEpisodeById returns nothing

      const result = await episodesService.getEpisodeSummary(testOrgId, testEpisodeId);

      expect(result).toBeNull();
    });

    it('should return summary with billing modifier and stats when episode exists', async () => {
      const fakeEpisode = {
        id: testEpisodeId,
        patient_id: testPatientId,
        baseline_pain_level: 8,
        current_pain_level: 4,
        baseline_function_score: null,
        current_function_score: null,
      };
      const fakeStats = {
        total_visits: '10',
        total_claims: '8',
        total_charges: '4000',
        total_paid: '3200',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [fakeEpisode] }) // getEpisodeById
        .mockResolvedValueOnce({ rows: [{ modifier: 'AT' }] }) // getBillingModifier
        .mockResolvedValueOnce({ rows: [fakeStats] }); // stats query

      const result = await episodesService.getEpisodeSummary(testOrgId, testEpisodeId);

      expect(result.id).toBe(testEpisodeId);
      expect(result.billing_modifier).toBe('AT');
      expect(result.improvement).toMatchObject({ type: 'pain', improvement: 50 });
      expect(result.stats).toEqual(fakeStats);
    });
  });
});
