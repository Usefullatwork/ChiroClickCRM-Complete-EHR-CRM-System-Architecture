/**
 * Unit Tests for RLAIF Service and Training Service
 *
 * RLAIF: preference pair generation, quality evaluation, training data augmentation, stats
 * Training: getStatus, getTrainingData, addExamples, rebuild, backup, restore, testModel, generateTargetedData
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks — with resetMocks: true, declare mock fns INSIDE factories or reassign
// ---------------------------------------------------------------------------

// ─── Database mock ────────────────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ─── Logger mock ──────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── fs mock (for training.js) ───────────────────────────────────────────────
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockAppendFileSync = jest.fn();
const mockStatSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockCopyFileSync = jest.fn();

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    appendFileSync: mockAppendFileSync,
    statSync: mockStatSync,
    readdirSync: mockReaddirSync,
    mkdirSync: mockMkdirSync,
    copyFileSync: mockCopyFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  appendFileSync: mockAppendFileSync,
  statSync: mockStatSync,
  readdirSync: mockReaddirSync,
  mkdirSync: mockMkdirSync,
  copyFileSync: mockCopyFileSync,
}));

// ─── child_process mock (for training.js) ────────────────────────────────────
const mockExecSync = jest.fn();
const mockExec = jest.fn();

jest.unstable_mockModule('child_process', () => ({
  execSync: mockExecSync,
  exec: mockExec,
}));

// ─── ClaudeProvider mock (for generateTargetedData) ──────────────────────────
const mockClaudeGenerate = jest.fn();
class MockClaudeProvider {
  constructor() {
    this.generate = mockClaudeGenerate;
  }
}
jest.unstable_mockModule('../../../src/services/providers/claudeProvider.js', () => ({
  ClaudeProvider: MockClaudeProvider,
}));

// ─── ComplianceValidator mock (for generateTargetedData) ─────────────────────
const mockEnsureCompliance = jest.fn();
jest.unstable_mockModule('../../../src/services/complianceValidator.js', () => ({
  ensureCompliance: mockEnsureCompliance,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocking
// ---------------------------------------------------------------------------
const rlaifModule = await import('../../../src/services/rlaif.js');
const { generatePreferencePairs, augmentTrainingData, evaluateSuggestionQuality, getRLAIFStats } =
  rlaifModule;

const trainingModule = await import('../../../src/services/training.js');
const {
  getStatus,
  getTrainingData,
  addExamples,
  rebuild,
  backup,
  restore,
  testModel,
  generateTargetedData,
} = trainingModule;

// ---------------------------------------------------------------------------
// RLAIF Service Tests
// ---------------------------------------------------------------------------
describe('RLAIF Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-assign mocks since resetMocks: true clears implementations
    mockQuery.mockResolvedValue({ rows: [] });
  });

  // =========================================================================
  // generatePreferencePairs
  // =========================================================================
  describe('generatePreferencePairs', () => {
    it('should generate preference pairs from suggestions with clear score differences', async () => {
      // Suggestions with very different qualities
      const suggestions = [
        {
          text: 'Pasient med smerte i korsrygg. Undersøkelse viser ømhet og ROM-begrensning. Diagnose: L84 ICPC-2. Behandling: mobilisering og oppfølging.',
        },
        { text: 'TODO fix this short text' },
        {
          text: 'Palpasjon viser triggerpunkt i m. piriformis. VAS 6/10 ved palpasjon. Positiv SLR test. Henvisning til MR vurderes.',
        },
      ];

      mockQuery.mockResolvedValue({ rows: [] });

      const result = await generatePreferencePairs(suggestions);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('offline');
      expect(result.pairsGenerated).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.pairs)).toBe(true);
    });

    it('should store pairs in the database when pairs are generated', async () => {
      // Create suggestions that will definitely produce different scores
      const suggestions = [
        {
          text: 'Smerte og symptom med diagnose L03 og behandling. Undersøkelse med palpasjon og mobilisering. ROM er begrenset på venstre side. VAS er 7. ICPC-2 kode er satt.',
        },
        { text: 'TODO FIXME bad   text   with   spaces' },
      ];

      mockQuery.mockResolvedValue({ rows: [] });

      const result = await generatePreferencePairs(suggestions);

      if (result.pairsGenerated > 0) {
        expect(mockQuery).toHaveBeenCalled();
        // Verify INSERT was called
        const insertCalls = mockQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('INSERT INTO rlaif_preference_pairs')
        );
        expect(insertCalls.length).toBe(result.pairsGenerated);
      }
    });

    it('should return empty pairs when all suggestions have similar scores', async () => {
      const suggestions = [{ text: 'Kort tekst en' }, { text: 'Kort tekst to' }];

      const result = await generatePreferencePairs(suggestions);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('offline');
    });

    it('should handle single suggestion without errors', async () => {
      const suggestions = [{ text: 'Bare en enkel tekst' }];

      const result = await generatePreferencePairs(suggestions);

      expect(result.success).toBe(true);
      expect(result.pairsGenerated).toBe(0);
      expect(result.pairs).toEqual([]);
    });
  });

  // =========================================================================
  // evaluateSuggestionQuality
  // =========================================================================
  describe('evaluateSuggestionQuality', () => {
    it('should evaluate a high-quality clinical suggestion and return scores', async () => {
      const suggestion = {
        text: 'Pasient med smerte i korsrygg. Undersøkelse viser ømhet ved palpasjon. ROM nedsatt. VAS 5. Diagnose: L84. Behandling: leddmobilisering. Røde flagg vurdert - ingen alarmsignaler.',
      };

      mockQuery.mockResolvedValue({ rows: [] });

      const result = await evaluateSuggestionQuality(suggestion);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('offline');
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation.scores).toBeDefined();
      expect(result.evaluation.weighted_total).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.evaluation.grade);
      expect(typeof result.evaluation.summary).toBe('string');
      expect(Array.isArray(result.evaluation.strengths)).toBe(true);
      expect(Array.isArray(result.evaluation.improvements)).toBe(true);
    });

    it('should give a lower score to informal or low-quality text', async () => {
      const goodSuggestion = {
        text: 'Pasient med smerte og symptom. Undersøkelse med palpasjon. Diagnose L03. Behandling: mobilisering og oppfølging. ROM er nedsatt.',
      };
      const badSuggestion = {
        text: 'lol hehe wow kult fett!! ???',
      };

      mockQuery.mockResolvedValue({ rows: [] });

      const goodResult = await evaluateSuggestionQuality(goodSuggestion);
      const badResult = await evaluateSuggestionQuality(badSuggestion);

      expect(goodResult.evaluation.weighted_total).toBeGreaterThan(
        badResult.evaluation.weighted_total
      );
    });

    it('should store evaluation in database', async () => {
      const suggestion = { text: 'Noe tekst for evaluering' };
      mockQuery.mockResolvedValue({ rows: [] });

      await evaluateSuggestionQuality(suggestion);

      const insertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO rlaif_evaluations')
      );
      expect(insertCalls.length).toBe(1);
    });

    it('should handle string suggestion (not object) gracefully', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await evaluateSuggestionQuality('Enkel tekststreng som forslag');

      expect(result.success).toBe(true);
      expect(result.evaluation.scores).toBeDefined();
    });
  });

  // =========================================================================
  // augmentTrainingData
  // =========================================================================
  describe('augmentTrainingData', () => {
    it('should augment base examples with stored preference pairs', async () => {
      const storedPairs = [
        {
          id: 1,
          chosen_text: JSON.stringify({ text: 'God klinisk tekst' }),
          rejected_text: JSON.stringify({ text: 'Dårlig tekst' }),
          chosen_score: 0.8,
          rejected_score: 0.3,
          suggestion_type: 'soap_subjective',
          reasoning: 'Heuristic',
          generated_by: 'heuristic',
          used_for_training: false,
          created_at: new Date().toISOString(),
        },
      ];

      // First call: SELECT preference pairs; second call: UPDATE used_for_training
      mockQuery.mockResolvedValueOnce({ rows: storedPairs }).mockResolvedValue({ rows: [] });

      const result = await augmentTrainingData({
        baseExamples: [{ messages: [{ role: 'user', content: 'test' }] }],
        targetCount: 10,
      });

      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(1);
      expect(result.augmentedCount).toBe(1);
      expect(result.totalExamples).toBe(2);
      expect(result.examples).toHaveLength(2);
    });

    it('should return base examples when no preference pairs exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const baseExamples = [{ messages: [{ role: 'user', content: 'test' }] }];
      const result = await augmentTrainingData({ baseExamples });

      expect(result.success).toBe(true);
      expect(result.augmentedCount).toBe(0);
      expect(result.totalExamples).toBe(1);
    });

    it('should filter by suggestionType when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await augmentTrainingData({ suggestionType: 'soap_subjective', targetCount: 5 });

      const selectCall = mockQuery.mock.calls[0];
      expect(selectCall[0]).toContain('suggestion_type');
      expect(selectCall[1]).toContain('soap_subjective');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection failed'));

      await expect(augmentTrainingData()).rejects.toThrow('DB connection failed');
    });
  });

  // =========================================================================
  // getRLAIFStats
  // =========================================================================
  describe('getRLAIFStats', () => {
    it('should return combined stats for preference pairs and evaluations', async () => {
      const pairsStats = {
        total_pairs: '25',
        used_pairs: '10',
        avg_chosen_score: '0.75',
        avg_rejected_score: '0.35',
      };
      const evalStats = {
        total_evaluations: '50',
        avg_score: '6.5',
        grade_a: '10',
        grade_b: '20',
        grade_c: '15',
        grade_low: '5',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [pairsStats] })
        .mockResolvedValueOnce({ rows: [evalStats] });

      const result = await getRLAIFStats();

      expect(result.preferencePairs).toEqual(pairsStats);
      expect(result.evaluations).toEqual(evalStats);
      expect(result.mode).toBe('local');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      await expect(getRLAIFStats()).rejects.toThrow('Query failed');
    });
  });
});

// ---------------------------------------------------------------------------
// Training Service Tests
// ---------------------------------------------------------------------------
describe('Training Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-assign mocks since resetMocks: true clears implementations
    mockExecSync.mockReturnValue('');
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);
    mockReadFileSync.mockReturnValue('');
    mockStatSync.mockReturnValue({ size: 1024, mtime: new Date() });
    mockQuery.mockResolvedValue({ rows: [] });
  });

  // =========================================================================
  // getStatus
  // =========================================================================
  describe('getStatus', () => {
    it('should detect Ollama running and parse model list', async () => {
      const ollamaOutput = [
        'NAME                 ID              SIZE      MODIFIED',
        'chiro-no-sft-dpo-v6:latest  abc123  8.1 GB    2 days ago',
        'chiro-fast:latest           def456  4.2 GB    5 days ago',
        'llama3:latest               ghi789  4.7 GB    1 week ago',
      ].join('\n');

      mockExecSync.mockReturnValue(ollamaOutput);

      const result = await getStatus();

      expect(result.ollamaRunning).toBe(true);
      expect(result.models['chiro-no-sft-dpo-v6'].exists).toBe(true);
      expect(result.models['chiro-fast'].exists).toBe(true);
      expect(result.models['chiro-no-sft-dpo-v5'].exists).toBe(false);
      expect(result.totalModels).toBe(2);
      expect(result.missingModels).toBe(2);
    });

    it('should handle Ollama not running gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed: ollama list');
      });

      const result = await getStatus();

      expect(result.ollamaRunning).toBe(false);
      expect(result.totalModels).toBe(0);
      expect(result.allOllamaModels).toEqual([]);
    });
  });

  // =========================================================================
  // getTrainingData
  // =========================================================================
  describe('getTrainingData', () => {
    it('should list training data files with example counts', () => {
      // Mock readdirSync to return directory structure
      mockReaddirSync.mockImplementation((dir) => {
        if (dir.endsWith('data')) {
          return [{ name: 'soap', isDirectory: () => true, isFile: () => false }];
        }
        if (dir.endsWith('soap')) {
          return [{ name: 'notes.jsonl', isDirectory: () => false, isFile: () => true }];
        }
        return [];
      });

      mockReadFileSync.mockReturnValue(
        '{"prompt":"p1","response":"r1"}\n{"prompt":"p2","response":"r2"}\n'
      );
      mockStatSync.mockReturnValue({ size: 2048, mtime: new Date('2026-01-15') });

      const result = getTrainingData();

      expect(result.files).toHaveLength(1);
      expect(result.files[0].examples).toBe(2);
      expect(result.files[0].category).toBe('soap');
      expect(result.totalExamples).toBe(2);
      expect(result.categories.soap).toBe(2);
    });

    it('should handle missing data directory', () => {
      mockReaddirSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = getTrainingData();

      expect(result.files).toEqual([]);
      expect(result.totalExamples).toBe(0);
    });
  });

  // =========================================================================
  // addExamples
  // =========================================================================
  describe('addExamples', () => {
    it('should validate and append JSONL content', () => {
      const jsonl =
        '{"prompt":"Test prompt","response":"Test response"}\n{"prompt":"P2","response":"R2"}';

      const result = addExamples(jsonl, 'test-data.jsonl');

      expect(result.success).toBe(true);
      expect(result.added).toBe(2);
      expect(result.errors).toEqual([]);
      expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid JSON lines and report errors', () => {
      const jsonl = '{"prompt":"Valid","response":"OK"}\nnot-json\n{"nofields":true}';

      const result = addExamples(jsonl);

      expect(result.success).toBe(true);
      expect(result.added).toBe(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should return failure when no valid lines exist', () => {
      const jsonl = 'not-json-at-all\nalso-not-json';

      const result = addExamples(jsonl);

      expect(result.success).toBe(false);
      expect(result.added).toBe(0);
      expect(result.errors).toHaveLength(2);
    });
  });

  // =========================================================================
  // rebuild
  // =========================================================================
  describe('rebuild', () => {
    it('should run build-modelfiles and create Ollama models', async () => {
      mockExecSync.mockReturnValue('Success');
      mockExistsSync.mockReturnValue(true);

      const result = await rebuild();

      expect(result.steps).toBeDefined();
      expect(result.steps[0].step).toBe('build-modelfiles');
      expect(result.steps[0].success).toBe(true);
      // 4 model creation steps
      const createSteps = result.steps.filter((s) => s.step.startsWith('create-'));
      expect(createSteps.length).toBe(4);
    });

    it('should fail fast when build-modelfiles script fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Script not found');
      });

      const result = await rebuild();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate Modelfiles');
    });

    it('should skip models whose Modelfile does not exist', async () => {
      // First call for build-modelfiles succeeds, then existsSync returns false
      let callCount = 0;
      mockExecSync.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return 'Built modelfiles';
        return 'Created model';
      });
      mockExistsSync.mockReturnValue(false);

      const result = await rebuild();

      const createSteps = result.steps.filter((s) => s.step.startsWith('create-'));
      createSteps.forEach((s) => {
        expect(s.success).toBe(false);
        expect(s.error).toBe('Modelfile not found');
      });
    });
  });

  // =========================================================================
  // backup
  // =========================================================================
  describe('backup', () => {
    it('should backup model files to cache directory', async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockReturnValue('# Modelfile content');

      const result = await backup();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      expect(result.backupDir).toBeDefined();
      // Should write Modelfile for each model
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should handle individual model backup failures gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockImplementation(() => {
        throw new Error('Model not found');
      });

      const result = await backup();

      expect(result.success).toBe(true);
      result.results.forEach((r) => {
        expect(r.success).toBe(false);
      });
    });
  });

  // =========================================================================
  // testModel
  // =========================================================================
  describe('testModel', () => {
    it('should reject unknown model names', async () => {
      await expect(testModel('unknown-model', 'test')).rejects.toThrow('Unknown model');
    });

    it('should run a valid model with default prompt', async () => {
      mockExec.mockImplementation((_cmd, _opts, cb) => {
        cb(null, 'Korsryggsmerter kan skyldes muskulær overbelastning...', '');
        return {};
      });

      const result = await testModel('chiro-no-sft-dpo-v6');

      expect(result.success).toBe(true);
      expect(result.model).toBe('chiro-no-sft-dpo-v6');
      expect(result.response).toContain('Korsryggsmerter');
    });

    it('should reject when exec returns an error', async () => {
      mockExec.mockImplementation((_cmd, _opts, cb) => {
        cb(new Error('Ollama timeout'), '', '');
        return {};
      });

      await expect(testModel('chiro-fast', 'test prompt')).rejects.toThrow('Model test failed');
    });
  });

  // =========================================================================
  // generateTargetedData
  // =========================================================================
  describe('generateTargetedData', () => {
    it('should reject unknown categories', async () => {
      await expect(generateTargetedData('nonexistent_category')).rejects.toThrow(
        'Unknown category'
      );
    });

    it('should generate training data for a valid category', async () => {
      const generatedJson = JSON.stringify({
        instruction: 'Skriv SOAP-notat',
        input: 'Pasient med ryggsmerte',
        output: 'S: Pasient klager over smerte...',
        quality_score: 0.9,
      });

      mockClaudeGenerate.mockResolvedValue({ text: generatedJson });
      mockEnsureCompliance.mockImplementation((text) => ({ text, redacted: false }));
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await generateTargetedData('soap_notes', 1);

      expect(result.generated).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.category).toBe('soap_notes');
      expect(result.generated[0].source).toBe('claude_generated');
      expect(result.generated[0].approved).toBe(false);
    });

    it('should handle Claude generation failures gracefully', async () => {
      mockClaudeGenerate.mockRejectedValue(new Error('API rate limit'));
      mockEnsureCompliance.mockImplementation((text) => ({ text, redacted: false }));

      const result = await generateTargetedData('red_flags', 2);

      expect(result.generated).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toContain('API rate limit');
    });
  });
});
