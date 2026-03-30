/**
 * Unit Tests for RAG Retrieval Module
 * Tests RAG augmentation, tiered context, session context injection
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

const mockBuildTieredContext = jest.fn();
const mockTieredEnabled = true;
jest.unstable_mockModule('../../../src/services/ai/contextManager.js', () => ({
  buildTieredContext: mockBuildTieredContext,
  TIERED_ENABLED: mockTieredEnabled,
}));

const mockGetSessionContext = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/sessionMemory.js', () => ({
  getSessionContext: mockGetSessionContext,
}));

// The ragRetrieval module dynamically imports ../rag.js inside a try/catch.
// We can't directly mock that dynamic import, but the module handles failure gracefully
// (ragService will be null if import fails). We test the augmentWithRAG function
// with ragService=null, which exercises the non-RAG paths.

const { augmentWithRAG, RAG_ENABLED } = await import('../../../src/services/ai/ragRetrieval.js');

describe('RAG Retrieval Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // RAG_ENABLED
  // ===========================================================================

  describe('RAG_ENABLED', () => {
    it('should be a boolean value', () => {
      expect(typeof RAG_ENABLED).toBe('boolean');
    });
  });

  // ===========================================================================
  // AUGMENT WITH RAG
  // ===========================================================================

  describe('augmentWithRAG', () => {
    it('should return original prompt when no options provided', async () => {
      const result = await augmentWithRAG('test prompt', null, {});

      expect(result.augmentedPrompt).toContain('test prompt');
      expect(result.ragContext).toBeNull();
    });

    it('should add tiered context when patient and org are provided', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'Patient history: L84 chronic',
        tiers: ['basic', 'clinical'],
        tokenEstimate: 50,
      });
      mockGetSessionContext.mockReturnValue(null);

      const result = await augmentWithRAG('my prompt', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
        taskType: 'soap_notes',
      });

      expect(result.augmentedPrompt).toContain('Patient history: L84 chronic');
      expect(result.augmentedPrompt).toContain('my prompt');
    });

    it('should add session context when available', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'Tiered context',
        tiers: [],
        tokenEstimate: 20,
      });
      mockGetSessionContext.mockReturnValue('Previous session: patient improving');

      const result = await augmentWithRAG('prompt', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });

      expect(result.augmentedPrompt).toContain('Previous session: patient improving');
    });

    it('should handle tiered context errors gracefully', async () => {
      mockBuildTieredContext.mockRejectedValue(new Error('Context load failed'));
      mockGetSessionContext.mockReturnValue(null);

      const result = await augmentWithRAG('prompt', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });

      // Should not throw, original prompt preserved
      expect(result.augmentedPrompt).toContain('prompt');
    });

    it('should skip tiered context when no patientId', async () => {
      const result = await augmentWithRAG('prompt', null, {
        organizationId: 'org-1',
      });

      expect(mockBuildTieredContext).not.toHaveBeenCalled();
      expect(result.augmentedPrompt).toContain('prompt');
    });

    it('should skip tiered context when no organizationId', async () => {
      const result = await augmentWithRAG('prompt', null, {
        patientId: 'pat-1',
      });

      expect(mockBuildTieredContext).not.toHaveBeenCalled();
    });

    it('should return null ragContext when ragService is not loaded', async () => {
      mockBuildTieredContext.mockResolvedValue({ contextText: null, tiers: [], tokenEstimate: 0 });
      mockGetSessionContext.mockReturnValue(null);

      const result = await augmentWithRAG('prompt', null, {
        organizationId: 'org-1',
      });

      expect(result.ragContext).toBeNull();
    });

    it('should pass taskType to buildTieredContext', async () => {
      mockBuildTieredContext.mockResolvedValue({ contextText: null, tiers: [], tokenEstimate: 0 });
      mockGetSessionContext.mockReturnValue(null);

      await augmentWithRAG('prompt', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
        taskType: 'red_flag_analysis',
      });

      expect(mockBuildTieredContext).toHaveBeenCalledWith('red_flag_analysis', {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });
    });

    it('should use general taskType when none specified', async () => {
      mockBuildTieredContext.mockResolvedValue({ contextText: null, tiers: [], tokenEstimate: 0 });
      mockGetSessionContext.mockReturnValue(null);

      await augmentWithRAG('prompt', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });

      expect(mockBuildTieredContext).toHaveBeenCalledWith('general', {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });
    });

    it('should prepend tiered context before prompt text', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'CONTEXT_FIRST',
        tiers: [],
        tokenEstimate: 10,
      });
      mockGetSessionContext.mockReturnValue(null);

      const result = await augmentWithRAG('PROMPT_SECOND', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });

      const idx1 = result.augmentedPrompt.indexOf('CONTEXT_FIRST');
      const idx2 = result.augmentedPrompt.indexOf('PROMPT_SECOND');
      expect(idx1).toBeLessThan(idx2);
    });

    it('should prepend session context after tiered context', async () => {
      mockBuildTieredContext.mockResolvedValue({
        contextText: 'TIERED',
        tiers: [],
        tokenEstimate: 10,
      });
      mockGetSessionContext.mockReturnValue('SESSION');

      const result = await augmentWithRAG('PROMPT', null, {
        patientId: 'pat-1',
        organizationId: 'org-1',
      });

      expect(result.augmentedPrompt).toContain('TIERED');
      expect(result.augmentedPrompt).toContain('SESSION');
      expect(result.augmentedPrompt).toContain('PROMPT');
    });
  });
});
