/**
 * Unit Tests for AI Learning and Feedback Service
 * Tests feedback recording, retraining thresholds, performance metrics,
 * correction analysis, training data generation, and export.
 */

import { jest } from '@jest/globals';

// ─── Mock dependencies BEFORE importing module under test ────────────────────

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockNotifyByRole = jest.fn();
jest.unstable_mockModule('../../../src/services/notifications.js', () => ({
  notifyByRole: mockNotifyByRole,
  NOTIFICATION_TYPES: {
    AI_RETRAINING_READY: 'AI_RETRAINING_READY',
  },
}));

// ─── Import AFTER mocks are registered ───────────────────────────────────────

const {
  recordFeedback,
  checkRetrainingThreshold,
  analyzeCommonCorrections,
  getPerformanceMetrics,
  getSuggestionsNeedingReview,
  getUserFeedbackPattern,
  generateTrainingDataFromFeedback,
  exportFeedbackForTraining,
  updateDailyMetrics,
} = await import('../../../src/services/aiLearning.js');

const logger = (await import('../../../src/utils/logger.js')).default;

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const FEEDBACK_BASE = {
  encounterId: 'enc-001',
  suggestionType: 'soap_notes',
  originalSuggestion: 'Patient reports lower back pain.',
  userCorrection: 'Patient reports radiating lower back pain to left leg.',
  accepted: true,
  correctionType: 'minor',
  confidenceScore: 0.85,
  feedbackNotes: 'Added radiation detail',
  userId: 'user-001',
  templateId: 'tpl-001',
  contextData: { patientAge: 42, gender: 'male' },
  userRating: 5,
  timeToDecision: 3200,
};

const INSERTED_ROW = {
  id: 'fb-001',
  ...FEEDBACK_BASE,
  created_at: '2026-03-20T10:00:00Z',
};

// =============================================================================
// recordFeedback
// =============================================================================

describe('recordFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts feedback into ai_feedback and returns the inserted row', async () => {
    // INSERT returns the row, checkRetrainingThreshold query returns nothing
    mockQuery
      .mockResolvedValueOnce({ rows: [INSERTED_ROW] }) // INSERT
      .mockResolvedValueOnce({ rows: [] }); // checkRetrainingThreshold

    const result = await recordFeedback(FEEDBACK_BASE);

    expect(result).toEqual(INSERTED_ROW);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    // Verify the INSERT was called with stringified contextData
    const insertCall = mockQuery.mock.calls[0];
    expect(insertCall[0]).toContain('INSERT INTO ai_feedback');
    expect(insertCall[1]).toContain(JSON.stringify(FEEDBACK_BASE.contextData));
  });

  it('passes null for contextData when not provided', async () => {
    const feedbackNoContext = { ...FEEDBACK_BASE, contextData: null };
    mockQuery.mockResolvedValueOnce({ rows: [INSERTED_ROW] }).mockResolvedValueOnce({ rows: [] });

    await recordFeedback(feedbackNoContext);

    const insertParams = mockQuery.mock.calls[0][1];
    // contextData is at index 10 (0-based)
    expect(insertParams[10]).toBeNull();
  });

  it('calls checkRetrainingThreshold with the suggestion type after insert', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [INSERTED_ROW] }) // INSERT
      .mockResolvedValueOnce({ rows: [] }); // threshold check

    await recordFeedback(FEEDBACK_BASE);

    // Second query is the threshold check with suggestion_type filter
    const thresholdCall = mockQuery.mock.calls[1];
    expect(thresholdCall[0]).toContain('ai_feedback');
    expect(thresholdCall[1]).toEqual(['soap_notes']);
  });

  it('throws and logs error when INSERT fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB write failed'));

    await expect(recordFeedback(FEEDBACK_BASE)).rejects.toThrow('DB write failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('recording AI feedback'),
      expect.any(Error)
    );
  });
});

// =============================================================================
// checkRetrainingThreshold
// =============================================================================

describe('checkRetrainingThreshold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when threshold is not reached', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await checkRetrainingThreshold('soap_notes');

    expect(result).toEqual([]);
  });

  it('returns rows and triggers notification when threshold is reached', async () => {
    const thresholdRow = {
      suggestion_type: 'soap_notes',
      feedback_count: 55,
      rejection_count: 22,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [thresholdRow] }) // threshold query
      .mockResolvedValueOnce({ rows: [] }) // system_alerts INSERT
      .mockResolvedValueOnce({ rows: [{ id: 'org-001' }] }); // organizations query

    mockNotifyByRole.mockResolvedValueOnce(undefined);

    const result = await checkRetrainingThreshold('soap_notes');

    expect(result).toEqual([thresholdRow]);
    expect(logger.info).toHaveBeenCalled();
    // System alert was persisted
    const alertCall = mockQuery.mock.calls[1];
    expect(alertCall[0]).toContain('system_alerts');
  });

  it('filters by suggestionType when provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await checkRetrainingThreshold('diagnosis_codes');

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('suggestion_type = $1');
    expect(queryCall[1]).toEqual(['diagnosis_codes']);
  });

  it('queries all types when suggestionType is null', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await checkRetrainingThreshold(null);

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[1]).toEqual([]);
  });
});

// =============================================================================
// analyzeCommonCorrections
// =============================================================================

describe('analyzeCommonCorrections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correction patterns from the database', async () => {
    const correctionRows = [
      {
        suggestion_type: 'soap_notes',
        correction_type: 'minor',
        correction_count: 12,
        avg_confidence_when_corrected: 0.72,
        examples: [{ original: 'test', corrected: 'fixed', confidence: 0.7 }],
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: correctionRows });

    const result = await analyzeCommonCorrections({
      suggestionType: 'soap_notes',
      days: 14,
      minOccurrences: 5,
    });

    expect(result).toEqual(correctionRows);
    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[1]).toContain('soap_notes');
    expect(queryCall[1]).toContain(14);
    expect(queryCall[1]).toContain(5);
  });

  it('uses default options when none provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await analyzeCommonCorrections();

    const queryCall = mockQuery.mock.calls[0];
    // defaults: days=30, minOccurrences=3, no suggestionType
    expect(queryCall[1]).toEqual([30, 3]);
  });
});

// =============================================================================
// getPerformanceMetrics
// =============================================================================

describe('getPerformanceMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns metrics grouped by day by default', async () => {
    const metricRows = [
      {
        period: '2026-03-20',
        suggestion_type: 'soap_notes',
        total_suggestions: 100,
        acceptance_rate: 85.5,
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: metricRows });

    const result = await getPerformanceMetrics();

    expect(result).toEqual(metricRows);
    const queryStr = mockQuery.mock.calls[0][0];
    expect(queryStr).toContain('DATE(created_at)');
  });

  it('groups by week when specified', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getPerformanceMetrics({ groupBy: 'week' });

    const queryStr = mockQuery.mock.calls[0][0];
    expect(queryStr).toContain("DATE_TRUNC('week'");
  });

  it('groups by month when specified', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getPerformanceMetrics({ groupBy: 'month' });

    const queryStr = mockQuery.mock.calls[0][0];
    expect(queryStr).toContain("DATE_TRUNC('month'");
  });

  it('applies all filter conditions (type, startDate, endDate)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getPerformanceMetrics({
      suggestionType: 'diagnosis_codes',
      startDate: '2026-01-01',
      endDate: '2026-03-01',
    });

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('suggestion_type = $1');
    expect(queryCall[0]).toContain('created_at >= $2');
    expect(queryCall[0]).toContain('created_at <= $3');
    expect(queryCall[1]).toEqual(['diagnosis_codes', '2026-01-01', '2026-03-01']);
  });

  it('omits WHERE clause when no filters provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getPerformanceMetrics({});

    const queryStr = mockQuery.mock.calls[0][0];
    expect(queryStr).not.toContain('WHERE');
    expect(mockQuery.mock.calls[0][1]).toEqual([]);
  });
});

// =============================================================================
// getSuggestionsNeedingReview
// =============================================================================

describe('getSuggestionsNeedingReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns suggestions with low confidence or high rejection rate', async () => {
    const reviewRows = [
      {
        suggestion_type: 'diagnosis_codes',
        occurrence_count: 30,
        avg_confidence: 0.55,
        rejection_rate: 48.5,
        suggestion_samples: ['Sample A', 'Sample B'],
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: reviewRows });

    const result = await getSuggestionsNeedingReview(10);

    expect(result).toEqual(reviewRows);
    expect(mockQuery.mock.calls[0][1]).toEqual([10]);
  });

  it('uses default limit of 20', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getSuggestionsNeedingReview();

    expect(mockQuery.mock.calls[0][1]).toEqual([20]);
  });
});

// =============================================================================
// getUserFeedbackPattern
// =============================================================================

describe('getUserFeedbackPattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns feedback patterns for a specific user', async () => {
    const patternRows = [
      {
        suggestion_type: 'soap_notes',
        total_interactions: 50,
        accepted: 40,
        rejected: 10,
        avg_rating: 4.2,
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: patternRows });

    const result = await getUserFeedbackPattern('user-001');

    expect(result).toEqual(patternRows);
    expect(mockQuery.mock.calls[0][1]).toEqual(['user-001']);
  });
});

// =============================================================================
// generateTrainingDataFromFeedback
// =============================================================================

describe('generateTrainingDataFromFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns high-rated corrections with practitioner info', async () => {
    const trainingRows = [
      {
        suggestion_type: 'soap_notes',
        improved_text: 'Better clinical text here',
        context_data: { patientAge: 55 },
        user_rating: 5,
        practitioner_id: 'user-001',
        practitioner_name: 'Dr. Smith',
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: trainingRows });

    const result = await generateTrainingDataFromFeedback({ minRating: 4, days: 60, limit: 50 });

    expect(result).toEqual(trainingRows);
    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[1]).toEqual([60, 4, 50]);
  });

  it('uses defaults when no options provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await generateTrainingDataFromFeedback();

    // defaults: days=90, minRating=4, limit=100
    expect(mockQuery.mock.calls[0][1]).toEqual([90, 4, 100]);
  });
});

// =============================================================================
// exportFeedbackForTraining
// =============================================================================

describe('exportFeedbackForTraining', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleRows = [
    {
      type: 'soap_notes',
      input: 'Original text',
      output: 'Corrected text',
      confidence: 0.8,
      accepted: true,
      correction_type: 'minor',
      context: null,
      rating: 5,
    },
    {
      type: 'soap_notes',
      input: 'Another input',
      output: 'Another output',
      confidence: 0.9,
      accepted: true,
      correction_type: 'minor',
      context: null,
      rating: 4,
    },
  ];

  it('returns JSONL format by default', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleRows });

    const result = await exportFeedbackForTraining();

    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual(sampleRows[0]);
    expect(JSON.parse(lines[1])).toEqual(sampleRows[1]);
  });

  it('returns CSV format when requested', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleRows });

    const result = await exportFeedbackForTraining({ format: 'csv' });

    const lines = result.split('\n');
    // First line is headers
    expect(lines[0]).toBe('type,input,output,confidence,accepted,correction_type,context,rating');
    expect(lines).toHaveLength(3); // header + 2 data rows
  });

  it('returns raw JSON array when format is json', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleRows });

    const result = await exportFeedbackForTraining({ format: 'json' });

    expect(result).toEqual(sampleRows);
  });

  it('applies suggestionType filter when provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await exportFeedbackForTraining({ suggestionType: 'diagnosis_codes' });

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('suggestion_type = $3');
    expect(queryCall[1]).toContain('diagnosis_codes');
  });
});

// =============================================================================
// updateDailyMetrics
// =============================================================================

describe('updateDailyMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the database function with the given date', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const date = new Date('2026-03-20');

    await updateDailyMetrics(date);

    expect(mockQuery).toHaveBeenCalledWith('SELECT update_daily_ai_metrics($1)', [date]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2026-03-20'));
  });

  it('throws and logs error when DB function fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Function not found'));

    await expect(updateDailyMetrics(new Date())).rejects.toThrow('Function not found');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('updating daily AI metrics'),
      expect.any(Error)
    );
  });
});
