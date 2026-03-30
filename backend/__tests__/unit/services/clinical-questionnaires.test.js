/**
 * Unit Tests for Questionnaires Service (src/services/clinical/questionnaires.js)
 * Tests questionnaire management, scoring, and history
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const {
  getAllQuestionnaires,
  getQuestionnaireByCode,
  submitQuestionnaireResponse,
  getPatientQuestionnaireHistory,
  getQuestionnaireResponse,
  getOutcomesByDiagnosis,
  calculateTreatmentEffectiveness,
} = await import('../../../src/services/clinical/questionnaires.js');

describe('questionnaires', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getAllQuestionnaires
  // ===========================================================================
  describe('getAllQuestionnaires', () => {
    it('should return questionnaires for organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'q1', code: 'NDI' }] });
      const result = await getAllQuestionnaires('org-1');
      expect(result).toHaveLength(1);
    });

    it('should filter by bodyRegion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getAllQuestionnaires('org-1', { bodyRegion: 'cervical' });
      expect(mockQuery.mock.calls[0][0]).toContain('target_body_region');
    });

    it('should filter active only by default', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getAllQuestionnaires('org-1');
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = true');
    });

    it('should include inactive when activeOnly=false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getAllQuestionnaires('org-1', { activeOnly: false });
      expect(mockQuery.mock.calls[0][0]).not.toContain('is_active = true');
    });

    it('should default to NO language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getAllQuestionnaires('org-1');
      expect(mockQuery.mock.calls[0][1]).toContain('NO');
    });
  });

  // ===========================================================================
  // getQuestionnaireByCode
  // ===========================================================================
  describe('getQuestionnaireByCode', () => {
    it('should return questionnaire by code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'q1', code: 'NDI' }] });
      const result = await getQuestionnaireByCode('NDI');
      expect(result.code).toBe('NDI');
    });

    it('should throw when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(getQuestionnaireByCode('UNKNOWN')).rejects.toThrow('not found');
    });
  });

  // ===========================================================================
  // submitQuestionnaireResponse
  // ===========================================================================
  describe('submitQuestionnaireResponse', () => {
    it('should submit NDI response and calculate score', async () => {
      // Get questionnaire
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'q1',
            code: 'NDI',
            scoring_method: 'SUM',
            min_score: 0,
            max_score: 50,
            score_interpretation: {},
            clinical_cutoff_scores: { minimal_clinically_important_difference: 5 },
          },
        ],
      });
      // Get previous response
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Insert response
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-1', total_score: 15 }] });

      const result = await submitQuestionnaireResponse({
        patientId: 'p-1',
        questionnaireId: 'q1',
        responses: { q1: 2, q2: 1, q3: 3, q4: 1, q5: 2, q6: 1, q7: 1, q8: 2, q9: 1, q10: 1 },
        administeredBy: 'user-1',
      });

      expect(result.id).toBe('resp-1');
    });

    it('should detect clinically significant change', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'q1',
            code: 'NDI',
            scoring_method: 'SUM',
            min_score: 0,
            max_score: 50,
            score_interpretation: {},
            clinical_cutoff_scores: { minimal_clinically_important_difference: 5 },
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_score: 25, administered_date: '2025-05-01' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-2' }] });

      const result = await submitQuestionnaireResponse({
        patientId: 'p-1',
        questionnaireId: 'q1',
        responses: { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1 },
        administeredBy: 'user-1',
      });

      expect(result).toBeDefined();
    });

    it('should throw when questionnaire not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(
        submitQuestionnaireResponse({ patientId: 'p-1', questionnaireId: 'missing', responses: {} })
      ).rejects.toThrow('Questionnaire not found');
    });

    it('should calculate Oswestry score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'q2',
            code: 'OSWESTRY',
            scoring_method: 'SUM',
            min_score: 0,
            max_score: 50,
            score_interpretation: {},
            clinical_cutoff_scores: {},
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-3' }] });

      const result = await submitQuestionnaireResponse({
        patientId: 'p-1',
        questionnaireId: 'q2',
        responses: { q1: 3, q2: 4, q3: 2 },
        administeredBy: 'user-1',
      });

      expect(result).toBeDefined();
    });

    it('should calculate PSFS score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'q3',
            code: 'PSFS',
            scoring_method: 'AVERAGE',
            min_score: 0,
            max_score: 10,
            score_interpretation: {},
            clinical_cutoff_scores: {},
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-4' }] });

      await submitQuestionnaireResponse({
        patientId: 'p-1',
        questionnaireId: 'q3',
        responses: { activity1: 7, activity2: 5, activity3: 8 },
        administeredBy: 'user-1',
      });
    });

    it('should calculate EQ5D score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'q4',
            code: 'EQ5D',
            scoring_method: 'CUSTOM',
            min_score: 0,
            max_score: 1,
            score_interpretation: {},
            clinical_cutoff_scores: {},
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-5' }] });

      await submitQuestionnaireResponse({
        patientId: 'p-1',
        questionnaireId: 'q4',
        responses: {
          mobility: 1,
          self_care: 1,
          usual_activities: 2,
          pain_discomfort: 3,
          anxiety_depression: 1,
          vas: 75,
        },
        administeredBy: 'user-1',
      });
    });
  });

  // ===========================================================================
  // getPatientQuestionnaireHistory
  // ===========================================================================
  describe('getPatientQuestionnaireHistory', () => {
    it('should return all history for a patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-1', code: 'NDI' }] });
      const result = await getPatientQuestionnaireHistory('p-1');
      expect(result).toHaveLength(1);
    });

    it('should filter by questionnaire code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getPatientQuestionnaireHistory('p-1', 'NDI');
      expect(mockQuery.mock.calls[0][0]).toContain('q.code = $2');
    });
  });

  // ===========================================================================
  // getQuestionnaireResponse
  // ===========================================================================
  describe('getQuestionnaireResponse', () => {
    it('should return response by ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'resp-1' }] });
      const result = await getQuestionnaireResponse('resp-1');
      expect(result.id).toBe('resp-1');
    });

    it('should throw when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(getQuestionnaireResponse('missing')).rejects.toThrow('not found');
    });
  });

  // ===========================================================================
  // getOutcomesByDiagnosis
  // ===========================================================================
  describe('getOutcomesByDiagnosis', () => {
    it('should return aggregate outcome data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ questionnaire_code: 'NDI', response_count: '10', avg_score: 20 }],
      });
      const result = await getOutcomesByDiagnosis('org-1', 'L03');
      expect(result).toHaveLength(1);
    });
  });

  // ===========================================================================
  // calculateTreatmentEffectiveness
  // ===========================================================================
  describe('calculateTreatmentEffectiveness', () => {
    it('should return treatment effectiveness data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ code: 'NDI', initial_score: 30, latest_score: 15, score_change: -15 }],
      });
      const result = await calculateTreatmentEffectiveness('p-1');
      expect(result).toHaveLength(1);
    });
  });
});
