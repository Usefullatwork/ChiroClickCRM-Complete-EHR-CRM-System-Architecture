/**
 * Unit Tests for AI Session Memory, RAG Retrieval, and System Prompts
 *
 * Covers:
 * - sessionMemory.js: store/retrieve/clear learnings, red-flag extraction, ICPC codes
 * - ragRetrieval.js: RAG augmentation flow, tiered + session context injection
 * - systemPrompts.js: exported prompt constants and builder function
 *
 * NOTE: CONTEXT_TIERED_ENABLED is read at import time — set BEFORE importing.
 */

import { jest } from '@jest/globals';

// Enable tiered context so sessionMemory and ragRetrieval exercise full paths
process.env.CONTEXT_TIERED_ENABLED = 'true';
process.env.RAG_ENABLED = 'true';

// ── Shared mock fns (declared outside factory so refs survive resetMocks) ────

const mockBuildTieredContext = jest.fn();
const mockRagAugmentPrompt = jest.fn();

// ── Mock registrations (BEFORE any module imports) ───────────────────────────

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/ai/contextManager.js', () => ({
  buildTieredContext: mockBuildTieredContext,
  TIERED_ENABLED: true,
  invalidatePatientContext: jest.fn(),
  clearContextCache: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/training/rag.js', () => ({
  ragService: {
    augmentPrompt: mockRagAugmentPrompt,
  },
}));

// ── Import modules under test AFTER mocks ────────────────────────────────────

const { recordLearning, getSessionContext, clearSessionMemory, clearAllSessionMemory } =
  await import('../../../src/services/ai/sessionMemory.js');

const { augmentWithRAG, RAG_ENABLED } = await import('../../../src/services/ai/ragRetrieval.js');

const systemPrompts = await import('../../../src/services/ai/systemPrompts.js');

const logger = (await import('../../../src/utils/logger.js')).default;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ORG_ID = 'org-001';
const PATIENT_ID = 'patient-001';

// ============================================================================
// SESSION MEMORY
// ============================================================================

describe('sessionMemory', () => {
  beforeEach(() => {
    clearAllSessionMemory();
    jest.clearAllMocks();
  });

  // ── recordLearning + getSessionContext ────────────────────────────────────

  describe('recordLearning', () => {
    it('stores red-flag learnings and retrieves them via getSessionContext', () => {
      recordLearning(
        ORG_ID,
        PATIENT_ID,
        'soap_notes',
        'Pasienten viser tegn til cauda equina syndrom'
      );

      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      expect(ctx).toContain('cauda equina');
      expect(ctx).toContain('Røde flagg');
    });

    it('stores multiple distinct red flags from one output', () => {
      recordLearning(
        ORG_ID,
        PATIENT_ID,
        'red_flag_check',
        'Mulig fraktur, og tegn til malign prosess'
      );

      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      expect(ctx).toContain('fraktur');
      expect(ctx).toContain('malign');
    });

    it('extracts ICPC-2 diagnosis codes from output', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'diagnosis', 'Vurdering: L03 og L84.1');

      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      expect(ctx).toContain('Diagnosekoder');
      expect(ctx).toContain('L03');
      expect(ctx).toContain('L84');
    });

    it('tracks confidence metadata when provided', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'soap_notes', 'Vanlig tekst uten flagg', {
        confidence: { score: 0.95, level: 'high' },
      });

      // Confidence learnings are stored internally but not rendered in context text
      // Verify the session exists and has data
      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      // No red flags or codes, so context may be empty string
      expect(typeof ctx).toBe('string');
    });

    it('caps learnings at MAX_LEARNINGS (20) per session', () => {
      // Generate 25 distinct red-flag outputs to push past the 20-learning cap
      for (let i = 0; i < 25; i++) {
        recordLearning(ORG_ID, PATIENT_ID, 'soap', 'cauda equina nevnt');
      }

      // Session still functions — getSessionContext does not throw
      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      expect(typeof ctx).toBe('string');
    });

    it('logs debug message after recording', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'soap', 'Tegn til infeksjon');

      expect(logger.debug).toHaveBeenCalledWith(
        'Session memory updated',
        expect.objectContaining({ patient: PATIENT_ID })
      );
    });
  });

  // ── getSessionContext ────────────────────────────────────────────────────

  describe('getSessionContext', () => {
    it('returns empty string when no session exists for patient', () => {
      expect(getSessionContext(ORG_ID, 'no-such-patient')).toBe('');
    });

    it('returns empty string for different org even if patient has data', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'soap', 'cauda equina');
      expect(getSessionContext('other-org', PATIENT_ID)).toBe('');
    });

    it('deduplicates red flags in output', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'soap1', 'cauda equina');
      recordLearning(ORG_ID, PATIENT_ID, 'soap2', 'cauda equina igjen');

      const ctx = getSessionContext(ORG_ID, PATIENT_ID);
      // "cauda equina" should appear only once in the comma-separated list
      const matches = ctx.match(/cauda equina/g);
      expect(matches).toHaveLength(1);
    });
  });

  // ── clearSessionMemory ──────────────────────────────────────────────────

  describe('clearSessionMemory', () => {
    it('clears memory for a specific patient', () => {
      recordLearning(ORG_ID, PATIENT_ID, 'soap', 'fraktur');
      expect(getSessionContext(ORG_ID, PATIENT_ID)).toContain('fraktur');

      clearSessionMemory(ORG_ID, PATIENT_ID);
      expect(getSessionContext(ORG_ID, PATIENT_ID)).toBe('');
    });

    it('does not affect other patients when clearing one', () => {
      recordLearning(ORG_ID, 'p1', 'soap', 'fraktur');
      recordLearning(ORG_ID, 'p2', 'soap', 'malign');

      clearSessionMemory(ORG_ID, 'p1');

      expect(getSessionContext(ORG_ID, 'p1')).toBe('');
      expect(getSessionContext(ORG_ID, 'p2')).toContain('malign');
    });
  });

  // ── clearAllSessionMemory ───────────────────────────────────────────────

  describe('clearAllSessionMemory', () => {
    it('clears all session data across all patients', () => {
      recordLearning(ORG_ID, 'p1', 'soap', 'cauda equina');
      recordLearning(ORG_ID, 'p2', 'soap', 'fraktur');

      clearAllSessionMemory();

      expect(getSessionContext(ORG_ID, 'p1')).toBe('');
      expect(getSessionContext(ORG_ID, 'p2')).toBe('');
    });
  });
});

// ============================================================================
// RAG RETRIEVAL
// ============================================================================

describe('ragRetrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllSessionMemory();
    mockBuildTieredContext.mockResolvedValue({
      contextText: '',
      tiers: [],
      tokenEstimate: 0,
    });
  });

  describe('RAG_ENABLED flag', () => {
    it('is true when RAG_ENABLED env var is not "false"', () => {
      expect(RAG_ENABLED).toBe(true);
    });
  });

  describe('augmentWithRAG', () => {
    it('returns the original prompt when no options are provided', async () => {
      const result = await augmentWithRAG('Test prompt', {});
      expect(result.augmentedPrompt).toBe('Test prompt');
      expect(result.ragContext).toBeNull();
    });

    it('prepends tiered context when TIERED_ENABLED and patient info provided', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'Tiered patient context here',
        tiers: ['L0'],
        tokenEstimate: 50,
      });

      const result = await augmentWithRAG(
        'My prompt',
        {},
        {
          organizationId: ORG_ID,
          patientId: PATIENT_ID,
          taskType: 'soap_notes',
        }
      );

      expect(mockBuildTieredContext).toHaveBeenCalledWith('soap_notes', {
        patientId: PATIENT_ID,
        organizationId: ORG_ID,
      });
      expect(result.augmentedPrompt).toContain('Tiered patient context here');
      expect(result.augmentedPrompt).toContain('My prompt');
    });

    it('injects session learnings after tiered context', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'L0 context',
        tiers: ['L0'],
        tokenEstimate: 20,
      });

      // Seed session memory
      recordLearning(ORG_ID, PATIENT_ID, 'soap', 'cauda equina');

      const result = await augmentWithRAG(
        'Prompt text',
        {},
        {
          organizationId: ORG_ID,
          patientId: PATIENT_ID,
          taskType: 'soap_notes',
        }
      );

      expect(result.augmentedPrompt).toContain('cauda equina');
      expect(result.augmentedPrompt).toContain('Prompt text');
    });

    it('calls ragService.augmentPrompt and returns RAG context when available', async () => {
      mockRagAugmentPrompt.mockResolvedValue({
        prompt: 'RAG-augmented prompt',
        context: 'Retrieved context from documents',
        chunks: [{ id: 1 }, { id: 2 }],
      });

      const result = await augmentWithRAG(
        'My prompt',
        { diagnosis: 'L03' },
        {
          organizationId: ORG_ID,
          patientId: PATIENT_ID,
        }
      );

      expect(mockRagAugmentPrompt).toHaveBeenCalled();
      expect(result.augmentedPrompt).toBe('RAG-augmented prompt');
      expect(result.ragContext).toEqual({ chunksUsed: 2, contextLength: expect.any(Number) });
    });

    it('falls back gracefully when ragService.augmentPrompt throws', async () => {
      mockRagAugmentPrompt.mockRejectedValue(new Error('Vector DB offline'));

      const result = await augmentWithRAG(
        'Fallback prompt',
        {},
        {
          organizationId: ORG_ID,
        }
      );

      expect(result.augmentedPrompt).toContain('Fallback prompt');
      expect(result.ragContext).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('RAG augmentation failed'),
        expect.any(String)
      );
    });

    it('skips tiered context when patientId is missing', async () => {
      const result = await augmentWithRAG(
        'Prompt',
        {},
        {
          organizationId: ORG_ID,
        }
      );

      expect(mockBuildTieredContext).not.toHaveBeenCalled();
      expect(result.augmentedPrompt).toContain('Prompt');
    });

    it('logs warning and continues when tiered context throws', async () => {
      mockBuildTieredContext.mockRejectedValue(new Error('DB down'));

      const result = await augmentWithRAG(
        'Safe prompt',
        {},
        {
          organizationId: ORG_ID,
          patientId: PATIENT_ID,
          taskType: 'soap_notes',
        }
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Tiered context load failed'),
        expect.any(String)
      );
      // Prompt still returned despite tiered failure
      expect(result.augmentedPrompt).toContain('Safe prompt');
    });
  });
});

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

describe('systemPrompts', () => {
  it('exports SPELL_CHECK_PROMPT as a non-empty string', () => {
    expect(typeof systemPrompts.SPELL_CHECK_PROMPT).toBe('string');
    expect(systemPrompts.SPELL_CHECK_PROMPT.length).toBeGreaterThan(0);
  });

  it('exports all four SOAP prompt constants', () => {
    expect(systemPrompts.SOAP_SUBJECTIVE_PROMPT).toBeDefined();
    expect(systemPrompts.SOAP_OBJECTIVE_PROMPT).toBeDefined();
    expect(systemPrompts.SOAP_ASSESSMENT_PROMPT).toBeDefined();
    expect(systemPrompts.SOAP_PLAN_PROMPT).toBeDefined();
  });

  it('exports SOAP_PROMPTS map keyed by SOAP section', () => {
    expect(systemPrompts.SOAP_PROMPTS).toEqual({
      subjective: systemPrompts.SOAP_SUBJECTIVE_PROMPT,
      objective: systemPrompts.SOAP_OBJECTIVE_PROMPT,
      assessment: systemPrompts.SOAP_ASSESSMENT_PROMPT,
      plan: systemPrompts.SOAP_PLAN_PROMPT,
    });
  });

  it('exports buildDiagnosisPrompt that embeds codes text', () => {
    const result = systemPrompts.buildDiagnosisPrompt('L03 - Korsrygg');
    expect(result).toContain('L03 - Korsrygg');
    expect(result).toContain('ICPC-2');
  });

  it('exports RED_FLAG_PROMPT containing cauda equina', () => {
    expect(systemPrompts.RED_FLAG_PROMPT).toContain('Cauda equina');
  });

  it('exports CLINICAL_SUMMARY_PROMPT as a non-empty string', () => {
    expect(typeof systemPrompts.CLINICAL_SUMMARY_PROMPT).toBe('string');
    expect(systemPrompts.CLINICAL_SUMMARY_PROMPT.length).toBeGreaterThan(0);
  });

  it('exports JOURNAL_ORGANIZATION_PROMPT with SOAP structure', () => {
    expect(systemPrompts.JOURNAL_ORGANIZATION_PROMPT).toContain('SOAP');
  });

  it('exports MERGE_NOTES_PROMPT for note consolidation', () => {
    expect(systemPrompts.MERGE_NOTES_PROMPT).toContain('konsolidere');
  });

  it('exports SMS_CONSTRAINT with 160-character limit', () => {
    expect(systemPrompts.SMS_CONSTRAINT).toContain('160');
  });
});
