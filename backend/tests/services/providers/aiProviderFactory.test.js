/**
 * AI Provider Factory Tests
 * Verifies factory creation, fallback chain behavior, and mode switching
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

// Mock circuit breaker
jest.unstable_mockModule(
  '../../../src/infrastructure/resilience/CircuitBreakerRegistry.js',
  () => ({
    default: {
      getBreaker: () => ({
        requestTimeout: 35000,
        execute: (fn) => fn(),
      }),
    },
  })
);

// Mock axios (for OllamaProvider)
jest.unstable_mockModule('axios', () => ({
  default: { post: jest.fn(), get: jest.fn() },
}));

// Mock Anthropic SDK
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn(), stream: jest.fn() },
  })),
}));

// Mock budget tracker — re-setup in beforeEach due to resetMocks: true
const mockBudgetTracker = {
  canSpend: jest.fn(),
  recordUsage: jest.fn(),
  getStatus: jest.fn(),
};
jest.unstable_mockModule('../../../src/services/providers/budgetTracker.js', () => ({
  default: mockBudgetTracker,
}));

// Store original env
const originalEnv = { ...process.env };

describe('AI Provider Factory', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    // Re-setup mock implementations after clearAllMocks (resetMocks: true also clears them)
    mockBudgetTracker.canSpend.mockReturnValue({ allowed: true });
    mockBudgetTracker.recordUsage.mockResolvedValue(0.001);
    mockBudgetTracker.getStatus.mockReturnValue({
      daily: { spent: 0, budget: 10, remaining: 10, percentUsed: 0 },
      monthly: { spent: 0, budget: 200, remaining: 200, percentUsed: 0 },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function importFactory() {
    // Dynamic import to re-evaluate env vars
    const mod = await import('../../../src/services/providers/aiProviderFactory.js');
    mod._resetProvider();
    return mod;
  }

  describe('createAIProvider()', () => {
    it('should create OllamaProvider when mode is disabled', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'disabled';
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('ollama');
    });

    it('should default to Ollama when no mode is set', async () => {
      delete process.env.CLAUDE_FALLBACK_MODE;
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('ollama');
    });

    it('should create FallbackProvider with Ollama primary in fallback mode', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'fallback';
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('ollama+claude');
      expect(provider.primary.name).toBe('ollama');
      expect(provider.secondary.name).toBe('claude');
    });

    it('should create FallbackProvider with Claude primary in preferred mode', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'preferred';
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('claude+ollama');
      expect(provider.primary.name).toBe('claude');
      expect(provider.secondary.name).toBe('ollama');
    });

    it('should create ClaudeProvider when mode is claude_only', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'claude_only';
      process.env.CLAUDE_API_KEY = 'test-key';
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('claude');
    });

    it('should default to Ollama for unknown modes', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'unknown_mode';
      const { createAIProvider } = await importFactory();
      const provider = createAIProvider();
      expect(provider.name).toBe('ollama');
    });
  });

  describe('FallbackProvider', () => {
    it('should use primary provider when it succeeds', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = {
        name: 'mock-primary',
        generate: jest
          .fn()
          .mockResolvedValue({ text: 'primary result', provider: 'mock-primary', usage: {} }),
      };
      const secondary = {
        name: 'mock-secondary',
        generate: jest.fn(),
      };

      const fallback = new FallbackProvider(primary, secondary);
      const result = await fallback.generate('prompt', null, {});

      expect(result.text).toBe('primary result');
      expect(secondary.generate).not.toHaveBeenCalled();
    });

    it('should fall back to secondary when primary fails', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = {
        name: 'mock-primary',
        generate: jest.fn().mockRejectedValue(new Error('primary down')),
      };
      const secondary = {
        name: 'mock-secondary',
        generate: jest
          .fn()
          .mockResolvedValue({ text: 'secondary result', provider: 'mock-secondary', usage: {} }),
      };

      const fallback = new FallbackProvider(primary, secondary);
      const result = await fallback.generate('prompt', null, {});

      expect(result.text).toBe('secondary result');
    });

    it('should throw primary error when both providers fail', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = {
        name: 'mock-primary',
        generate: jest.fn().mockRejectedValue(new Error('primary down')),
      };
      const secondary = {
        name: 'mock-secondary',
        generate: jest.fn().mockRejectedValue(new Error('secondary down')),
      };

      const fallback = new FallbackProvider(primary, secondary);
      await expect(fallback.generate('prompt', null, {})).rejects.toThrow('primary down');
    });

    it('should throw when no secondary and primary fails', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = {
        name: 'mock-primary',
        generate: jest.fn().mockRejectedValue(new Error('down')),
      };

      const fallback = new FallbackProvider(primary, null);
      await expect(fallback.generate('prompt', null, {})).rejects.toThrow('down');
    });

    it('should report available if either provider is available', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = { name: 'p', isAvailable: jest.fn().mockResolvedValue(false) };
      const secondary = { name: 's', isAvailable: jest.fn().mockResolvedValue(true) };

      const fallback = new FallbackProvider(primary, secondary);
      expect(await fallback.isAvailable()).toBe(true);
    });

    it('should report unavailable if both providers are down', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = { name: 'p', isAvailable: jest.fn().mockResolvedValue(false) };
      const secondary = { name: 's', isAvailable: jest.fn().mockResolvedValue(false) };

      const fallback = new FallbackProvider(primary, secondary);
      expect(await fallback.isAvailable()).toBe(false);
    });

    it('should include budget status in getStatus()', async () => {
      const { FallbackProvider } = await importFactory();

      const primary = {
        name: 'p',
        getStatus: jest.fn().mockResolvedValue({ provider: 'p', available: true }),
      };
      const secondary = {
        name: 's',
        getStatus: jest.fn().mockResolvedValue({ provider: 's', available: true }),
      };

      const fallback = new FallbackProvider(primary, secondary);
      const status = await fallback.getStatus();

      expect(status.primary).toBeDefined();
      expect(status.secondary).toBeDefined();
      expect(status.budget).toBeDefined();
      expect(status.budget.daily).toBeDefined();
      expect(status.budget.monthly).toBeDefined();
    });
  });

  describe('getAIProvider() singleton', () => {
    it('should return the same provider instance on repeated calls', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'disabled';
      const { getAIProvider, _resetProvider } = await importFactory();
      _resetProvider();

      const p1 = getAIProvider();
      const p2 = getAIProvider();
      expect(p1).toBe(p2);
    });
  });
});
