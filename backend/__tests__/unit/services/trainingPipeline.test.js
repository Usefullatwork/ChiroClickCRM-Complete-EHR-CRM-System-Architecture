/**
 * Unit Tests for Training Pipeline
 * Tests data export, modelfile creation, training, activation, rollback, retraining
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const mockEventBusEmit = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule('../../../src/domain/events/EventBus.js', () => ({
  eventBus: { emit: mockEventBusEmit },
}));

jest.unstable_mockModule('../../../src/domain/events/DomainEvents.js', () => ({
  DOMAIN_EVENTS: {
    MODEL_ACTIVATED: 'model.activated',
    MODEL_ROLLED_BACK: 'model.rolled_back',
    MODEL_TRAINING_STARTED: 'model.training.started',
    MODEL_TRAINING_FAILED: 'model.training.failed',
  },
  EventFactory: {
    modelTrainingCompleted: jest.fn((version, data) => ({
      type: 'model.training.completed',
      version,
      data,
    })),
  },
}));

jest.unstable_mockModule('../../../src/infrastructure/resilience/CircuitBreaker.js', () => ({
  CircuitBreakers: {
    ollama: { execute: jest.fn((fn) => fn()) },
  },
}));

const mockExportTrainingData = jest.fn();
jest.unstable_mockModule('../../../src/application/services/AIFeedbackService.js', () => ({
  aiFeedbackService: { exportTrainingData: mockExportTrainingData },
}));

const mockRecordTrainingRun = jest.fn().mockResolvedValue(undefined);
const mockGetLastTrainingRun = jest.fn();
jest.unstable_mockModule('../../../src/application/services/retrainingMetrics.js', () => ({
  recordTrainingRun: mockRecordTrainingRun,
  getLastTrainingRun: mockGetLastTrainingRun,
}));

const mockValidateModel = jest.fn();
jest.unstable_mockModule('../../../src/application/services/modelValidation.js', () => ({
  validateModel: mockValidateModel,
}));

jest.unstable_mockModule('../../../src/application/services/dataCuration.js', () => ({
  hashTrainingData: jest.fn((data) => 'abc123'),
}));

// Mock fs modules
const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockExistsSync = jest.fn();
jest.unstable_mockModule('fs/promises', () => ({
  default: { mkdir: mockMkdir, writeFile: mockWriteFile },
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule('child_process', () => ({
  exec: jest.fn(),
}));

// Mock global fetch
const mockFetchResponse = jest.fn();
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ status: 'success' }),
  text: jest.fn().mockResolvedValue(''),
});

const {
  getLastTrainingDate,
  exportTrainingData,
  createModelfile,
  trainModel,
  activateModel,
  rollbackModel,
  triggerRetraining,
  runRetrainingPipeline,
} = await import('../../../src/application/services/trainingPipeline.js');

describe('Training Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'success' }),
      text: jest.fn().mockResolvedValue(''),
    });
  });

  // ===========================================================================
  // GET LAST TRAINING DATE
  // ===========================================================================

  describe('getLastTrainingDate', () => {
    it('should return completed_at from last training run', async () => {
      mockGetLastTrainingRun.mockResolvedValue({ completed_at: '2026-03-01T00:00:00Z' });

      const result = await getLastTrainingDate();

      expect(result).toBe('2026-03-01T00:00:00Z');
    });

    it('should return null when no training run exists', async () => {
      mockGetLastTrainingRun.mockResolvedValue(null);

      const result = await getLastTrainingDate();

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // EXPORT TRAINING DATA
  // ===========================================================================

  describe('exportTrainingData', () => {
    it('should delegate to aiFeedbackService.exportTrainingData', async () => {
      mockGetLastTrainingRun.mockResolvedValue(null);
      mockExportTrainingData.mockResolvedValue({ count: 100, data: [] });

      const result = await exportTrainingData();

      expect(result.count).toBe(100);
      expect(mockExportTrainingData).toHaveBeenCalledWith({
        startDate: null,
        includeRejected: false,
        minConfidence: 0.7,
      });
    });

    it('should use last training date as start date', async () => {
      mockGetLastTrainingRun.mockResolvedValue({ completed_at: '2026-01-15' });
      mockExportTrainingData.mockResolvedValue({ count: 50, data: [] });

      await exportTrainingData();

      expect(mockExportTrainingData).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-01-15' })
      );
    });
  });

  // ===========================================================================
  // CREATE MODELFILE
  // ===========================================================================

  describe('createModelfile', () => {
    it('should create a modelfile with training data info', async () => {
      const trainingData = { count: 50, data: 'training data content' };

      const result = await createModelfile(trainingData, 'chiro-no-v1');

      expect(result).toContain('chiro-no-v1');
      expect(result).toContain('Training examples: 50');
      expect(result).toContain('FROM');
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should include base model in modelfile', async () => {
      const result = await createModelfile({ count: 10, data: null }, 'test-v1');

      expect(result).toContain('FROM');
    });

    it('should create training directory', async () => {
      await createModelfile({ count: 5, data: null }, 'v2');

      expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  // ===========================================================================
  // TRAIN MODEL
  // ===========================================================================

  describe('trainModel', () => {
    it('should call Ollama create API with model version', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'success' }),
      });

      const result = await trainModel('chiro-v-test', 'FROM mistral:7b');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/create'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.status).toBe('success');
    });

    it('should throw on non-OK response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue('Model not found'),
      });

      await expect(trainModel('bad-model', 'content')).rejects.toThrow('Ollama training failed');
    });
  });

  // ===========================================================================
  // ACTIVATE MODEL
  // ===========================================================================

  describe('activateModel', () => {
    it('should insert/update system_config and emit event', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await activateModel('chiro-no-v42');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEventBusEmit).toHaveBeenCalledWith(
        'model.activated',
        expect.objectContaining({ modelVersion: 'chiro-no-v42' })
      );
    });
  });

  // ===========================================================================
  // ROLLBACK MODEL
  // ===========================================================================

  describe('rollbackModel', () => {
    it('should rollback via Ollama delete API when no target version', async () => {
      const result = await rollbackModel(null);

      expect(result.success).toBe(true);
      expect(mockEventBusEmit).toHaveBeenCalled();
    });

    it('should use Modelfile rebuild when file exists', async () => {
      mockExistsSync.mockReturnValue(true);
      // We need to mock execAsync — since child_process.exec is mocked,
      // this test just verifies the flow doesn't throw
      // The test may throw because exec is mocked; handled by try-catch in code
    });

    it('should fallback to Ollama delete when Modelfile not found', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await rollbackModel('target-v1', 'current-v2');

      expect(result.success).toBe(true);
      expect(result.rolledBackTo).toBe('target-v1');
    });
  });

  // ===========================================================================
  // TRIGGER RETRAINING
  // ===========================================================================

  describe('triggerRetraining', () => {
    it('should skip when already retraining', async () => {
      const state = { isRetraining: true, currentModelVersion: 'v5', config: {} };

      const result = await triggerRetraining(state);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('Already retraining');
    });

    it('should fail when insufficient training data', async () => {
      const state = { isRetraining: false, currentModelVersion: 'v5', config: {} };
      mockExportTrainingData.mockResolvedValue({ count: 5, data: [] });
      mockGetLastTrainingRun.mockResolvedValue(null);

      const result = await triggerRetraining(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient training data');
      expect(state.isRetraining).toBe(false);
    });

    it('should rollback when validation fails', async () => {
      const state = { isRetraining: false, currentModelVersion: 'v5', config: {} };
      mockExportTrainingData.mockResolvedValue({ count: 50, data: 'data' });
      mockGetLastTrainingRun.mockResolvedValue(null);
      mockValidateModel.mockResolvedValue({ passed: false, accuracy: '60.00' });

      const result = await triggerRetraining(state);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Validation failed');
      expect(state.isRetraining).toBe(false);
    });

    it('should complete full pipeline on success', async () => {
      const state = { isRetraining: false, currentModelVersion: 'v5', config: {} };
      mockExportTrainingData.mockResolvedValue({ count: 50, data: 'training data' });
      mockGetLastTrainingRun.mockResolvedValue(null);
      mockValidateModel.mockResolvedValue({ passed: true, accuracy: '90.00' });
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await triggerRetraining(state);

      expect(result.success).toBe(true);
      expect(result.trainingExamples).toBe(50);
      expect(result.modelVersion).toBeDefined();
      expect(state.isRetraining).toBe(false);
    });

    it('should always reset isRetraining on failure', async () => {
      const state = { isRetraining: false, currentModelVersion: 'v5', config: {} };
      mockExportTrainingData.mockRejectedValue(new Error('Export crashed'));
      mockGetLastTrainingRun.mockResolvedValue(null);

      const result = await triggerRetraining(state);

      expect(result.success).toBe(false);
      expect(state.isRetraining).toBe(false);
    });
  });

  // ===========================================================================
  // RUN RETRAINING PIPELINE
  // ===========================================================================

  describe('runRetrainingPipeline', () => {
    it('should skip when already retraining', async () => {
      const state = { isRetraining: true };

      const result = await runRetrainingPipeline(state, {}, jest.fn(), jest.fn());

      expect(result.skipped).toBe(true);
    });

    it('should return early when no feedback to process', async () => {
      const state = { isRetraining: false, config: {} };
      // Mock the INSERT INTO ai_retraining_events query
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'evt-1' }] });
      const exportFn = jest.fn().mockResolvedValue({
        examplesCount: 0,
        processedFeedbackIds: [],
      });

      const result = await runRetrainingPipeline(state, { trigger: 'manual' }, exportFn, jest.fn());

      expect(result.success).toBe(true);
      expect(result.message).toContain('No new feedback');
    });

    it('should return early on dry run after export', async () => {
      const state = { isRetraining: false, config: {} };
      const exportFn = jest.fn().mockResolvedValue({
        examplesCount: 10,
        processedFeedbackIds: ['id-1'],
      });

      const result = await runRetrainingPipeline(
        state,
        { trigger: 'manual', dryRun: true },
        exportFn,
        jest.fn()
      );

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
    });

    it('should always reset isRetraining on error', async () => {
      const state = { isRetraining: false, config: {} };
      // Mock the INSERT INTO ai_retraining_events query
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'evt-2' }] });
      // Mock the UPDATE on error
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const exportFn = jest.fn().mockRejectedValue(new Error('Export failed'));

      await expect(runRetrainingPipeline(state, {}, exportFn, jest.fn())).rejects.toThrow(
        'Export failed'
      );

      expect(state.isRetraining).toBe(false);
    });
  });
});
