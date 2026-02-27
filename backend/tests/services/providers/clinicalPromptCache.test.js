/**
 * ClinicalPromptCache Tests
 * Verifies prompt registry, task-type composition, cache_control application, and stats
 */

import { jest } from '@jest/globals';

// Mock database (redFlagEngine.js imports database.js which does top-level PGlite init)
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() },
}));

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { ClinicalPromptCache, default: clinicalPromptCache } =
  await import('../../../src/services/providers/clinicalPromptCache.js');

describe('ClinicalPromptCache', () => {
  describe('constructor', () => {
    it('should initialize with at least 19 default registry keys', () => {
      expect(clinicalPromptCache.registry.size).toBeGreaterThanOrEqual(19);
    });

    it('should initialize task type mappings for at least 14 task types', () => {
      expect(clinicalPromptCache._taskTypeMap.size).toBeGreaterThanOrEqual(14);
    });
  });

  describe('register()', () => {
    let cache;

    beforeEach(() => {
      cache = new ClinicalPromptCache();
    });

    it('should register string content', () => {
      cache.register('test_key', 'Test content string');
      const entry = cache.registry.get('test_key');
      expect(entry.content).toBe('Test content string');
      expect(entry.isFunction).toBe(false);
    });

    it('should register function content', () => {
      const fn = () => 'Dynamic content';
      cache.register('dynamic_key', fn);
      const entry = cache.registry.get('dynamic_key');
      expect(entry.isFunction).toBe(true);
      expect(entry.content).toBe(fn);
    });

    it('should apply default options', () => {
      cache.register('defaults_test', 'Some content');
      const entry = cache.registry.get('defaults_test');
      expect(entry.category).toBe('clinical');
      expect(entry.priority).toBe(10);
      expect(entry.minLength).toBe(100);
    });

    it('should accept custom options', () => {
      cache.register('custom_test', 'Content', {
        category: 'letter',
        priority: 5,
        minLength: 50,
      });
      const entry = cache.registry.get('custom_test');
      expect(entry.category).toBe('letter');
      expect(entry.priority).toBe(5);
      expect(entry.minLength).toBe(50);
    });
  });

  describe('get()', () => {
    it('should return string content for static entries', () => {
      const text = clinicalPromptCache.get('clinical_base');
      expect(text).toContain('klinisk assistent');
      expect(text).toContain('kiropraktorer i Norge');
    });

    it('should call function and return result for dynamic entries', () => {
      const text = clinicalPromptCache.get('icpc2_codes');
      expect(text).toContain('ICPC-2');
      expect(text).toContain('L01');
      expect(text).toContain('L03');
    });

    it('should return null for non-existent keys', () => {
      expect(clinicalPromptCache.get('nonexistent_key')).toBeNull();
    });
  });

  describe('buildCacheableMessages()', () => {
    it('should return correct structure for spell_check', () => {
      const messages = clinicalPromptCache.buildCacheableMessages('spell_check');
      expect(messages).toHaveLength(2);

      // First block: clinical_base with cache_control
      expect(messages[0].type).toBe('text');
      expect(messages[0].text).toContain('klinisk assistent');
      expect(messages[0].cache_control).toEqual({ type: 'ephemeral' });

      // Second block: spell_check with cache_control
      expect(messages[1].text).toContain('stavefeil');
      expect(messages[1].cache_control).toEqual({ type: 'ephemeral' });
    });

    it('should include safety_context and red_flag_rules for red_flag_analysis', () => {
      const messages = clinicalPromptCache.buildCacheableMessages('red_flag_analysis');
      expect(messages).toHaveLength(4);

      const texts = messages.map((m) => m.text);
      expect(texts.some((t) => t.includes('klinisk assistent'))).toBe(true);
      expect(texts.some((t) => t.includes('røde flagg (red flags)'))).toBe(true);
      expect(texts.some((t) => t.includes('Malignitet'))).toBe(true);
      expect(texts.some((t) => t.includes('Røde flagg-kategorier'))).toBe(true);
    });

    it('should include ICPC-2 codes for diagnosis_suggestion', () => {
      const messages = clinicalPromptCache.buildCacheableMessages('diagnosis_suggestion');
      expect(messages).toHaveLength(3);

      const codesBlock = messages.find((m) => m.text.includes('ICPC-2 koder'));
      expect(codesBlock).toBeDefined();
      expect(codesBlock.text).toContain('L01');
      expect(codesBlock.cache_control).toEqual({ type: 'ephemeral' });
    });

    it('should return null for unknown taskType', () => {
      const result = clinicalPromptCache.buildCacheableMessages('unknown_task_type');
      expect(result).toBeNull();
    });

    it('should append customSystemPrompt as last block (cached if >500 chars)', () => {
      const longPrompt = 'A'.repeat(600);
      const messages = clinicalPromptCache.buildCacheableMessages('spell_check', longPrompt);

      const lastBlock = messages[messages.length - 1];
      expect(lastBlock.text).toBe(longPrompt);
      expect(lastBlock.cache_control).toEqual({ type: 'ephemeral' });
    });

    it('should NOT cache customSystemPrompt under 500 chars', () => {
      const shortPrompt = 'Short prompt';
      const messages = clinicalPromptCache.buildCacheableMessages('spell_check', shortPrompt);

      const lastBlock = messages[messages.length - 1];
      expect(lastBlock.text).toBe(shortPrompt);
      expect(lastBlock.cache_control).toBeUndefined();
    });

    it('should compose letter prompts correctly', () => {
      const messages = clinicalPromptCache.buildCacheableMessages('letter_MEDICAL_CERTIFICATE');
      expect(messages).toHaveLength(3);

      const texts = messages.map((m) => m.text);
      expect(texts[0]).toContain('klinisk assistent'); // clinical_base
      expect(texts[1]).toContain('VIKTIGE RETNINGSLINJER'); // letter_base
      expect(texts[2]).toContain('MEDISINSK ERKLÆRING'); // letter_MEDICAL_CERTIFICATE
    });

    it('should fall back to clinical_base when mapping produces no blocks', () => {
      // Create a fresh cache with an empty mapping
      const cache = new ClinicalPromptCache();
      cache._taskTypeMap.set('empty_task', ['nonexistent_key_1', 'nonexistent_key_2']);

      const messages = cache.buildCacheableMessages('empty_task');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toContain('klinisk assistent');
    });
  });

  describe('getStats()', () => {
    it('should return correct key counts and char totals', () => {
      const stats = clinicalPromptCache.getStats();
      expect(stats.registeredKeys).toBeGreaterThanOrEqual(19);
      expect(stats.taskTypeMappings).toBeGreaterThanOrEqual(14);
      expect(stats.totalChars).toBeGreaterThan(1000);
      expect(stats.cacheableChars).toBeGreaterThan(0);
      expect(stats.cacheableChars).toBeLessThanOrEqual(stats.totalChars);
      expect(stats.estimatedCacheableTokens).toBeGreaterThan(0);

      // Check category breakdown
      expect(stats.categories.base).toBeDefined();
      expect(stats.categories.clinical).toBeDefined();
      expect(stats.categories.letter).toBeDefined();
      expect(stats.categories.reference).toBeDefined();
    });

    it('should report savings between 80-90% with per-1000 request costs', () => {
      const stats = clinicalPromptCache.getStats();
      expect(stats.savingsModel.estimatedSavingsPercent).toBeGreaterThanOrEqual(80);
      expect(stats.savingsModel.estimatedSavingsPercent).toBeLessThanOrEqual(90);
      expect(stats.savingsModel.cacheHitRate).toBe(0.95);
      expect(stats.savingsModel.per1000Requests.sonnet).toBeDefined();
      expect(stats.savingsModel.per1000Requests.haiku).toBeDefined();
    });
  });
});
