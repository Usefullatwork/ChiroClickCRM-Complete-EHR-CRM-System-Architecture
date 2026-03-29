/**
 * Unit Tests for Report Service & Batch Processor
 * Tests weekly AI digest generation, batch API processing, error handling
 */

import { jest } from '@jest/globals';

// ── Mock database ─────────────────────────────────────────────────────────────
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ── Mock logger ───────────────────────────────────────────────────────────────
const mockLogInfo = jest.fn();
const mockLogWarn = jest.fn();
const mockLogError = jest.fn();

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: (...args) => mockLogInfo(...args),
    warn: (...args) => mockLogWarn(...args),
    error: (...args) => mockLogError(...args),
    debug: jest.fn(),
  },
}));

// ── Mock email service ────────────────────────────────────────────────────────
let sendEmailImpl = () => Promise.resolve({ success: true, messageId: 'digest-msg-1' });

jest.unstable_mockModule('../../../src/services/communication/emailService.js', () => ({
  sendEmail: (...args) => sendEmailImpl(...args),
}));

// ── Mock Anthropic SDK ────────────────────────────────────────────────────────
let mockBatchCreate = jest.fn();
let mockBatchRetrieve = jest.fn();
let mockBatchResults = jest.fn();
let mockBatchCancel = jest.fn();
let mockBatchList = jest.fn();

jest.unstable_mockModule('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    constructor() {
      this.messages = {
        batches: {
          create: mockBatchCreate,
          retrieve: mockBatchRetrieve,
          results: mockBatchResults,
          cancel: mockBatchCancel,
          list: mockBatchList,
        },
      };
    }
  }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

// ── Import modules after all mocks ────────────────────────────────────────────
const { generateWeeklyAIDigest } = await import('../../../src/services/clinical/reportService.js');

// batchProcessor requires CLAUDE_API_KEY at getClient() time, not import time
const batchProcessorModule = await import('../../../src/services/practice/batchProcessor.js');
const {
  createBatch,
  getBatchStatus,
  getBatchResults,
  cancelBatch,
  listBatches,
  scoreTrainingData,
  batchDailySummaries,
} = batchProcessorModule;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Report Service — generateWeeklyAIDigest', () => {
  const savedEnv = {};

  beforeEach(() => {
    jest.clearAllMocks();
    sendEmailImpl = () => Promise.resolve({ success: true, messageId: 'digest-msg-1' });
    mockQuery.mockReset();
    // Save and set env
    savedEnv.ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = 'admin@test.no';
  });

  afterEach(() => {
    // Restore env
    if (savedEnv.ADMIN_EMAIL === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = savedEnv.ADMIN_EMAIL;
    }
  });

  it('should return stats and html when all queries succeed', async () => {
    // Mock suggestions query
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '42',
            approved: '30',
            modified: '5',
            rejected: '3',
            pending: '4',
            avg_confidence: '0.875',
            avg_latency_ms: '320',
            red_flags: '2',
          },
        ],
      })
      // Mock task types query
      .mockResolvedValueOnce({
        rows: [
          { suggestion_type: 'SOAP_NOTE', count: '20', approved: '18' },
          { suggestion_type: 'DIAGNOSIS', count: '15', approved: '10' },
        ],
      })
      // Mock cost query
      .mockResolvedValueOnce({
        rows: [
          {
            provider: 'claude',
            requests: '50',
            total_cost: '1.2500',
            input_tokens: '50000',
            output_tokens: '15000',
            avg_duration_ms: '1200',
          },
        ],
      });

    const result = await generateWeeklyAIDigest();

    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('html');
    expect(result.stats.totalSuggestions).toBe(42);
    expect(result.stats.approved).toBe(30);
    expect(result.stats.modified).toBe(5);
    expect(result.stats.rejected).toBe(3);
    expect(result.stats.pending).toBe(4);
    expect(result.stats.avgConfidence).toBe(0.875);
    expect(result.stats.avgLatencyMs).toBe(320);
    expect(result.stats.redFlagsDetected).toBe(2);
  });

  it('should calculate acceptance rate as (approved+modified)/reviewed * 100', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '10',
            approved: '6',
            modified: '2',
            rejected: '2',
            pending: '0',
            avg_confidence: '0.9',
            avg_latency_ms: '200',
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateWeeklyAIDigest();

    // reviewed = 6 + 2 + 2 = 10, accepted = 6 + 2 = 8, rate = 80%
    expect(result.stats.acceptanceRate).toBe(80);
  });

  it('should set acceptanceRate to 0 when no reviews exist', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '5',
            approved: '0',
            modified: '0',
            rejected: '0',
            pending: '5',
            avg_confidence: '0.7',
            avg_latency_ms: '150',
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateWeeklyAIDigest();

    expect(result.stats.acceptanceRate).toBe(0);
  });

  it('should populate topTaskTypes from the task type query', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '0',
            approved: '0',
            modified: '0',
            rejected: '0',
            pending: '0',
            avg_confidence: null,
            avg_latency_ms: null,
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { suggestion_type: 'RED_FLAG', count: '8', approved: '7' },
          { suggestion_type: 'EXERCISE', count: '3', approved: '2' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateWeeklyAIDigest();

    expect(result.stats.topTaskTypes).toHaveLength(2);
    expect(result.stats.topTaskTypes[0]).toEqual({ type: 'RED_FLAG', count: 8, approved: 7 });
    expect(result.stats.topTaskTypes[1]).toEqual({ type: 'EXERCISE', count: 3, approved: 2 });
  });

  it('should aggregate cost summary with total across providers', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '0',
            approved: '0',
            modified: '0',
            rejected: '0',
            pending: '0',
            avg_confidence: null,
            avg_latency_ms: null,
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            provider: 'claude',
            requests: '30',
            total_cost: '0.9000',
            input_tokens: '30000',
            output_tokens: '10000',
            avg_duration_ms: '1500',
          },
          {
            provider: 'ollama',
            requests: '100',
            total_cost: '0.0000',
            input_tokens: '80000',
            output_tokens: '20000',
            avg_duration_ms: '400',
          },
        ],
      });

    const result = await generateWeeklyAIDigest();

    expect(result.stats.costSummary.byProvider).toHaveLength(2);
    expect(result.stats.costSummary.totalUsd).toBeCloseTo(0.9);
    expect(result.stats.costSummary.byProvider[0].provider).toBe('claude');
    expect(result.stats.costSummary.byProvider[1].requests).toBe(100);
  });

  it('should send email when ADMIN_EMAIL is set', async () => {
    let emailArgs;
    sendEmailImpl = (args) => {
      emailArgs = args;
      return Promise.resolve({ success: true });
    };

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '1',
            approved: '1',
            modified: '0',
            rejected: '0',
            pending: '0',
            avg_confidence: '0.9',
            avg_latency_ms: '100',
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await generateWeeklyAIDigest();

    expect(emailArgs).toBeDefined();
    expect(emailArgs.to).toBe('admin@test.no');
    expect(emailArgs.subject).toContain('AI-rapport');
    expect(emailArgs.html).toContain('Ukentlig AI-analyserapport');
  });

  it('should log report when no ADMIN_EMAIL is configured', async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.SMTP_FROM_EMAIL;

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '0',
            approved: '0',
            modified: '0',
            rejected: '0',
            pending: '0',
            avg_confidence: null,
            avg_latency_ms: null,
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateWeeklyAIDigest();

    expect(result.stats).toBeDefined();
    expect(result.html).toBeDefined();
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('No ADMIN_EMAIL configured'),
      expect.any(Object)
    );
  });

  it('should gracefully handle database query failures', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockRejectedValueOnce(new Error('table not found'))
      .mockRejectedValueOnce(new Error('timeout'));

    const result = await generateWeeklyAIDigest();

    // Should still return default stats without crashing
    expect(result.stats.totalSuggestions).toBe(0);
    expect(result.stats.topTaskTypes).toEqual([]);
    expect(result.stats.costSummary.totalUsd).toBe(0);
    expect(mockLogWarn).toHaveBeenCalledTimes(3);
  });

  it('should fall back to logging when email send fails', async () => {
    sendEmailImpl = () => Promise.reject(new Error('SMTP not configured'));

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '5',
            approved: '3',
            modified: '1',
            rejected: '1',
            pending: '0',
            avg_confidence: '0.8',
            avg_latency_ms: '250',
            red_flags: '0',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateWeeklyAIDigest();

    expect(result.stats).toBeDefined();
    expect(result.html).toBeDefined();
    expect(mockLogWarn).toHaveBeenCalledWith(
      expect.stringContaining('Could not send digest email')
    );
  });

  it('should generate valid HTML with Norwegian labels', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '10',
            approved: '7',
            modified: '2',
            rejected: '1',
            pending: '0',
            avg_confidence: '0.92',
            avg_latency_ms: '180',
            red_flags: '1',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ suggestion_type: 'SOAP_NOTE', count: '10', approved: '7' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            provider: 'claude',
            requests: '10',
            total_cost: '0.5000',
            input_tokens: '10000',
            output_tokens: '5000',
            avg_duration_ms: '1000',
          },
        ],
      });

    const result = await generateWeeklyAIDigest();

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('lang="nb"');
    expect(result.html).toContain('Sammendrag');
    expect(result.html).toContain('Tilbakemeldinger');
    expect(result.html).toContain('Godkjent');
    expect(result.html).toContain('Topp oppgavetyper');
    expect(result.html).toContain('Kostnader');
  });
});

describe('Batch Processor', () => {
  const savedApiKey = process.env.CLAUDE_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLAUDE_API_KEY = 'test-api-key-12345';
    mockBatchCreate.mockReset();
    mockBatchRetrieve.mockReset();
    mockBatchResults.mockReset();
    mockBatchCancel.mockReset();
    mockBatchList.mockReset();
  });

  afterEach(() => {
    if (savedApiKey === undefined) {
      delete process.env.CLAUDE_API_KEY;
    } else {
      process.env.CLAUDE_API_KEY = savedApiKey;
    }
  });

  // ─── createBatch ──────────────────────────────────────────────────────────

  describe('createBatch', () => {
    it('should create a batch with mapped request params', async () => {
      mockBatchCreate.mockResolvedValue({
        id: 'batch_001',
        status: 'in_progress',
        request_counts: { total: 2 },
      });

      const requests = [
        {
          customId: 'req-1',
          maxTokens: 512,
          system: 'You are helpful',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        {
          customId: 'req-2',
          model: 'claude-haiku-4-5',
          maxTokens: 256,
          system: 'Score this',
          messages: [{ role: 'user', content: 'Test' }],
        },
      ];

      const result = await createBatch(requests);

      expect(result.id).toBe('batch_001');
      expect(mockBatchCreate).toHaveBeenCalledWith({
        requests: expect.arrayContaining([
          expect.objectContaining({
            custom_id: 'req-1',
            params: expect.objectContaining({
              model: 'claude-sonnet-4-6',
              max_tokens: 512,
            }),
          }),
          expect.objectContaining({
            custom_id: 'req-2',
            params: expect.objectContaining({
              model: 'claude-haiku-4-5',
              max_tokens: 256,
            }),
          }),
        ]),
      });
    });

    it('should use default model and maxTokens when not specified', async () => {
      mockBatchCreate.mockResolvedValue({ id: 'batch_002', status: 'in_progress' });

      await createBatch([
        { customId: 'req-default', system: 'Test', messages: [{ role: 'user', content: 'Hi' }] },
      ]);

      expect(mockBatchCreate).toHaveBeenCalledWith({
        requests: [
          expect.objectContaining({
            params: expect.objectContaining({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
            }),
          }),
        ],
      });
    });

    it('should throw when CLAUDE_API_KEY is not set', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(createBatch([{ customId: 'x', messages: [] }])).rejects.toThrow(
        'Batch processing requires CLAUDE_API_KEY'
      );
    });
  });

  // ─── getBatchStatus ───────────────────────────────────────────────────────

  describe('getBatchStatus', () => {
    it('should retrieve batch status by id', async () => {
      mockBatchRetrieve.mockResolvedValue({ id: 'batch_003', status: 'ended' });

      const result = await getBatchStatus('batch_003');

      expect(result.status).toBe('ended');
      expect(mockBatchRetrieve).toHaveBeenCalledWith('batch_003');
    });
  });

  // ─── getBatchResults ──────────────────────────────────────────────────────

  describe('getBatchResults', () => {
    it('should collect all results from async iterator', async () => {
      const mockResults = [
        {
          custom_id: 'req-1',
          result: { type: 'succeeded', message: { content: [{ text: 'Result 1' }] } },
        },
        {
          custom_id: 'req-2',
          result: { type: 'succeeded', message: { content: [{ text: 'Result 2' }] } },
        },
      ];

      mockBatchResults.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          for (const r of mockResults) yield r;
        },
      });

      const results = await getBatchResults('batch_004');

      expect(results).toHaveLength(2);
      expect(results[0].custom_id).toBe('req-1');
      expect(results[1].custom_id).toBe('req-2');
    });
  });

  // ─── cancelBatch ──────────────────────────────────────────────────────────

  describe('cancelBatch', () => {
    it('should cancel a batch by id', async () => {
      mockBatchCancel.mockResolvedValue({ id: 'batch_005', status: 'canceling' });

      const result = await cancelBatch('batch_005');

      expect(result.status).toBe('canceling');
      expect(mockBatchCancel).toHaveBeenCalledWith('batch_005');
    });
  });

  // ─── listBatches ──────────────────────────────────────────────────────────

  describe('listBatches', () => {
    it('should collect batches from async iterator', async () => {
      const mockBatches = [
        { id: 'batch_a', status: 'ended' },
        { id: 'batch_b', status: 'in_progress' },
      ];

      mockBatchList.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          for (const b of mockBatches) yield b;
        },
      });

      const result = await listBatches({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('batch_a');
    });
  });

  // ─── scoreTrainingData ────────────────────────────────────────────────────

  describe('scoreTrainingData', () => {
    it('should create a batch with haiku model for scoring', async () => {
      mockBatchCreate.mockResolvedValue({ id: 'batch_score_1', status: 'in_progress' });

      const examples = [
        { input: 'Patient with low back pain', output: 'L03 Symptomer/plager korsrygg' },
        { input: 'Headache after trauma', output: 'N01 Hodepine' },
      ];

      const result = await scoreTrainingData(examples);

      expect(result.id).toBe('batch_score_1');
      const callArg = mockBatchCreate.mock.calls[0][0];
      expect(callArg.requests).toHaveLength(2);
      expect(callArg.requests[0].custom_id).toBe('training-score-0');
      expect(callArg.requests[0].params.model).toBe('claude-haiku-4-5');
      expect(callArg.requests[0].params.max_tokens).toBe(256);
      expect(callArg.requests[0].params.system).toContain('Score the following');
    });
  });

  // ─── batchDailySummaries ──────────────────────────────────────────────────

  describe('batchDailySummaries', () => {
    it('should create batch requests from encounters with SOAP fields', async () => {
      mockBatchCreate.mockResolvedValue({ id: 'batch_summary_1', status: 'in_progress' });

      const encounters = [
        {
          id: 'enc-1',
          subjective: 'Ryggsmerter',
          objective: 'Redusert ROM',
          assessment: 'L03',
          plan: 'Manipulasjon',
        },
        {
          id: 'enc-2',
          subjective: 'Nakkesmerter',
          objective: 'Spent muskulatur',
          assessment: 'L83',
          plan: 'Mobilisering',
        },
      ];

      const result = await batchDailySummaries(encounters);

      expect(result.id).toBe('batch_summary_1');
      const callArg = mockBatchCreate.mock.calls[0][0];
      expect(callArg.requests).toHaveLength(2);
      expect(callArg.requests[0].custom_id).toBe('summary-enc-1');
      expect(callArg.requests[0].params.model).toBe('claude-sonnet-4-6');
      expect(callArg.requests[0].params.messages[0].content).toContain('Ryggsmerter');
      expect(callArg.requests[0].params.messages[0].content).toContain('Redusert ROM');
    });

    it('should handle encounters with missing SOAP fields', async () => {
      mockBatchCreate.mockResolvedValue({ id: 'batch_summary_2', status: 'in_progress' });

      const encounters = [{ id: 'enc-3' }];

      await batchDailySummaries(encounters);

      const callArg = mockBatchCreate.mock.calls[0][0];
      const content = callArg.requests[0].params.messages[0].content;
      expect(content).toContain('Subjektivt:');
      expect(content).toContain('Objektivt:');
      // Missing fields should be empty, not "undefined"
      expect(content).not.toContain('undefined');
    });
  });
});
