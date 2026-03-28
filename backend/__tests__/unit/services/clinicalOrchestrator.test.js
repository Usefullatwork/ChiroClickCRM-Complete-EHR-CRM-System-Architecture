/**
 * Unit Tests for clinicalOrchestrator.js
 *
 * Tests the fan-out/synthesize pipeline:
 * 1. Safety screening (can halt pipeline on CRITICAL risk)
 * 2. Parallel specialized assessments (clinical, differential, letter)
 * 3. Optional synthesis step (when Claude mode is enabled)
 *
 * Also tests the exported parseSafetyResult helper directly.
 */

import { jest } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock AI provider factory — same indirection pattern as tests/services/clinicalOrchestrator.test.js
// mockGenerate is re-created in beforeEach so resetMocks:true doesn't break the queue.
let mockGenerate;
jest.unstable_mockModule('../../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => ({ generate: (...args) => mockGenerate(...args) }),
}));

// Import after mocking
const { orchestrate, parseSafetyResult } =
  await import('../../../src/services/clinicalOrchestrator.js');
const logger = (await import('../../../src/utils/logger.js')).default;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePatient = (overrides = {}) => ({
  name: 'Ola Nordmann',
  age: 45,
  ...overrides,
});

const makeSoap = (overrides = {}) => ({
  subjective: 'Korsryggsmerter i 3 uker',
  objective: 'Begrenset bevegelse i lumbal',
  assessment: 'L4-L5 dysfunksjon',
  plan: 'Manipulasjon + øvelser',
  ...overrides,
});

const mockResult = (text, provider = 'ollama') => ({
  text,
  provider,
  model: 'chiro-no-sft-dpo-v6',
});

// ─── parseSafetyResult (pure function — no mocks needed) ─────────────────────

describe('parseSafetyResult', () => {
  it('returns LOW risk when text contains no risk keywords', () => {
    const result = parseSafetyResult('Ingen røde flagg funnet');
    expect(result.riskLevel).toBe('LOW');
    expect(result.canTreat).toBe(true);
    expect(result.rawText).toBe('Ingen røde flagg funnet');
  });

  it('returns CRITICAL when text contains KRITISK', () => {
    const result = parseSafetyResult('Pasienten har KRITISK tilstand');
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.canTreat).toBe(false);
  });

  it('returns CRITICAL when text contains CRITICAL (English)', () => {
    const result = parseSafetyResult('Risk level: CRITICAL');
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.canTreat).toBe(false);
  });

  it('returns HIGH when text contains HØY', () => {
    const result = parseSafetyResult('Risikonivå: HØY');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.canTreat).toBe(true);
  });

  it('returns HIGH when text contains HIGH (English)', () => {
    const result = parseSafetyResult('Risk level: HIGH');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.canTreat).toBe(true);
  });

  it('returns MODERATE when text contains MODERAT', () => {
    const result = parseSafetyResult('MODERAT risiko');
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.canTreat).toBe(true);
  });

  it('returns MODERATE when text contains MODERATE (English)', () => {
    const result = parseSafetyResult('MODERATE risk detected');
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.canTreat).toBe(true);
  });

  it('always returns flags as an empty array', () => {
    const result = parseSafetyResult('KRITISK — hjerneslag');
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result.flags).toHaveLength(0);
  });
});

// ─── orchestrate — main pipeline ─────────────────────────────────────────────

describe('orchestrate', () => {
  const originalClaudeMode = process.env.CLAUDE_FALLBACK_MODE;

  beforeEach(() => {
    mockGenerate = jest.fn();
    delete process.env.CLAUDE_FALLBACK_MODE;
  });

  afterAll(() => {
    process.env.CLAUDE_FALLBACK_MODE = originalClaudeMode;
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns halted=false and clinical/differential text on normal LOW-risk input', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('Risikonivå: LAV'))
      .mockResolvedValueOnce(mockResult('Klinisk sammendrag…'))
      .mockResolvedValueOnce(mockResult('Differensialdiagnose…'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.halted).toBe(false);
    expect(result.clinical).toBe('Klinisk sammendrag…');
    expect(result.differential).toBe('Differensialdiagnose…');
    expect(result.synthesis).toBeNull();
  });

  it('includes totalTime as a non-negative number in the response', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(typeof result.totalTime).toBe('number');
    expect(result.totalTime).toBeGreaterThanOrEqual(0);
  });

  it('includes steps array with safety, clinical and differential entries', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), makeSoap());

    const stepNames = result.steps.map((s) => s.step);
    expect(stepNames).toContain('safety');
    expect(stepNames).toContain('clinical');
    expect(stepNames).toContain('differential');
  });

  // ─── CRITICAL halt ─────────────────────────────────────────────────────────

  it('halts pipeline immediately when safety returns CRITICAL risk', async () => {
    mockGenerate.mockResolvedValueOnce(mockResult('KRITISK risiko — mulig slag'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.halted).toBe(true);
    expect(result.haltReason).toMatch(/Kritisk risiko identifisert/);
    expect(result.safety.riskLevel).toBe('CRITICAL');
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('includes safety and steps in halted result but omits clinical/differential', async () => {
    mockGenerate.mockResolvedValueOnce(mockResult('CRITICAL'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.halted).toBe(true);
    expect(result.clinical).toBeUndefined();
    expect(result.differential).toBeUndefined();
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].step).toBe('safety');
  });

  // ─── Options: includeDifferential / includeLetterDraft ────────────────────

  it('skips differential when includeDifferential=false', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'));

    const result = await orchestrate(makePatient(), makeSoap(), { includeDifferential: false });

    expect(result.differential).toBeUndefined();
    expect(result.clinical).toBe('klinisk');
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('includes letter draft when includeLetterDraft=true', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('differensialdiagnose'))
      .mockResolvedValueOnce(mockResult('Kjære kollega, …'));

    const result = await orchestrate(makePatient(), makeSoap(), { includeLetterDraft: true });

    expect(result.letter).toBe('Kjære kollega, …');
    expect(mockGenerate).toHaveBeenCalledTimes(4);
  });

  // ─── Synthesis step ────────────────────────────────────────────────────────

  it('runs synthesis when CLAUDE_FALLBACK_MODE is not disabled and multiple results exist', async () => {
    process.env.CLAUDE_FALLBACK_MODE = 'fallback';

    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV', 'ollama'))
      .mockResolvedValueOnce(mockResult('klinisk', 'ollama'))
      .mockResolvedValueOnce(mockResult('diff', 'ollama'))
      .mockResolvedValueOnce(mockResult('Syntetisert oppsummering', 'claude'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.synthesis).toBe('Syntetisert oppsummering');
    const synthesisStep = result.steps.find((s) => s.step === 'synthesis');
    expect(synthesisStep).toBeDefined();
    expect(synthesisStep.status).toBe('completed');
  });

  it('skips synthesis when CLAUDE_FALLBACK_MODE is disabled', async () => {
    process.env.CLAUDE_FALLBACK_MODE = 'disabled';

    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.synthesis).toBeNull();
    const synthesisStep = result.steps.find((s) => s.step === 'synthesis');
    expect(synthesisStep).toBeUndefined();
  });

  it('skips synthesis when only one assessment result exists', async () => {
    process.env.CLAUDE_FALLBACK_MODE = 'fallback';

    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'));

    const result = await orchestrate(makePatient(), makeSoap(), { includeDifferential: false });

    expect(result.synthesis).toBeNull();
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  it('uses UNKNOWN risk and continues pipeline when safety screening throws', async () => {
    mockGenerate
      .mockRejectedValueOnce(new Error('Ollama offline'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.halted).toBe(false);
    expect(result.safety.riskLevel).toBe('UNKNOWN');
    expect(result.safety.canTreat).toBe(true);
    expect(result.safety.error).toBe('Ollama offline');
    expect(logger.error).toHaveBeenCalled();
  });

  it('records safety step as error when screening throws', async () => {
    mockGenerate
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), makeSoap());

    const safetyStep = result.steps.find((s) => s.step === 'safety');
    expect(safetyStep.status).toBe('error');
    expect(safetyStep.error).toBe('timeout');
  });

  it('records synthesis step as error and returns null synthesis when synthesis throws', async () => {
    process.env.CLAUDE_FALLBACK_MODE = 'fallback';

    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'))
      .mockRejectedValueOnce(new Error('Claude unavailable'));

    const result = await orchestrate(makePatient(), makeSoap());

    expect(result.synthesis).toBeNull();
    const synthesisStep = result.steps.find((s) => s.step === 'synthesis');
    expect(synthesisStep.status).toBe('error');
    expect(logger.warn).toHaveBeenCalled();
  });

  // ─── Patient data edge cases ───────────────────────────────────────────────

  it('works correctly when patient has no age field', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate({ name: 'Anonym' }, makeSoap());

    expect(result.halted).toBe(false);
    expect(result.clinical).toBe('klinisk');
  });

  it('works correctly when SOAP fields are empty strings', async () => {
    mockGenerate
      .mockResolvedValueOnce(mockResult('LAV'))
      .mockResolvedValueOnce(mockResult('klinisk'))
      .mockResolvedValueOnce(mockResult('diff'));

    const result = await orchestrate(makePatient(), {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    });

    expect(result.halted).toBe(false);
    expect(result.clinical).toBe('klinisk');
  });
});
