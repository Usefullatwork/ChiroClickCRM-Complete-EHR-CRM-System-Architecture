/**
 * AI Service Tests
 * Tests for frontend AI service functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  checkOllamaStatus,
  generateText,
  parseIntakeToSubjective,
  CLINICAL_PROMPTS
} from '../services/aiService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getAIConfig', () => {
    it('should return default config when no stored config', () => {
      const config = getAIConfig();

      expect(config.baseUrl).toBe('http://localhost:11434');
      expect(config.model).toBe('llama3.2');
      expect(config.temperature).toBe(0.3);
    });

    it('should merge stored config with defaults', () => {
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({ model: 'custom-model' })
      );

      const config = getAIConfig();

      expect(config.model).toBe('custom-model');
      expect(config.baseUrl).toBe('http://localhost:11434'); // Default preserved
    });
  });

  describe('saveAIConfig', () => {
    it('should save config to localStorage', () => {
      const config = { model: 'test-model', temperature: 0.5 };
      const result = saveAIConfig(config);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('checkOllamaStatus', () => {
    it('should return connected status when Ollama responds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [{ name: 'llama3.2' }] }),
      });

      const result = await checkOllamaStatus();

      expect(result.connected).toBe(true);
      expect(result.models).toHaveLength(1);
    });

    it('should return disconnected status on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkOllamaStatus();

      expect(result.connected).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });

  describe('generateText', () => {
    it('should call Ollama API with correct parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Generated text',
          model: 'llama3.2',
          total_duration: 1000,
        }),
      });

      const result = await generateText('Test prompt');

      expect(result.text).toBe('Generated text');
      expect(result.model).toBe('llama3.2');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(generateText('Test')).rejects.toThrow();
    });
  });

  describe('CLINICAL_PROMPTS', () => {
    it('should have bilingual prompts (EN/NO)', () => {
      expect(CLINICAL_PROMPTS.intakeToSubjective.en).toBeDefined();
      expect(CLINICAL_PROMPTS.intakeToSubjective.no).toBeDefined();
      expect(CLINICAL_PROMPTS.transcriptionToSOAP.en).toBeDefined();
      expect(CLINICAL_PROMPTS.transcriptionToSOAP.no).toBeDefined();
    });

    it('should have clinical system prompt', () => {
      expect(CLINICAL_PROMPTS.clinicalSystem).toContain('clinical');
      expect(CLINICAL_PROMPTS.clinicalSystem).toContain('chiropractic');
    });
  });

  describe('parseIntakeToSubjective', () => {
    it('should generate subjective narrative from intake data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Patient presents with lower back pain rated 7/10.',
        }),
      });

      const intakeData = {
        chiefComplaint: 'Lower back pain',
        painLevel: 7,
        onset: '2 weeks ago',
      };

      const result = await parseIntakeToSubjective(intakeData, 'en');

      expect(result.success).toBe(true);
      expect(result.narrative).toContain('Patient');
    });

    it('should return fallback on AI error', async () => {
      fetch.mockRejectedValueOnce(new Error('AI unavailable'));

      const intakeData = {
        chiefComplaint: 'Neck pain',
        painLevel: 5,
      };

      const result = await parseIntakeToSubjective(intakeData, 'en');

      expect(result.success).toBe(false);
      expect(result.fallback).toBeDefined();
      expect(result.fallback).toContain('Neck pain');
    });
  });
});
