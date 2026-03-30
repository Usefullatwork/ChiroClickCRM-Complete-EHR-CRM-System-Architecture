/**
 * Unit Tests for Clinical Vision Service (src/services/clinical/clinicalVision.js)
 * Tests image analysis via Claude vision capabilities
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

const mockReadFileSync = jest.fn();
jest.unstable_mockModule('fs', () => ({
  default: { readFileSync: mockReadFileSync, existsSync: jest.fn() },
  readFileSync: mockReadFileSync,
  existsSync: jest.fn(),
}));

const mockMessagesCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {
      this.messages = { create: mockMessagesCreate };
    }
  },
}));

const { analyzeImage, ANALYSIS_TYPES, SUPPORTED_TYPES } =
  await import('../../../src/services/clinical/clinicalVision.js');

describe('clinicalVision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLAUDE_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  // ===========================================================================
  // Constants
  // ===========================================================================
  describe('ANALYSIS_TYPES', () => {
    it('should define xray, mri, posture, and general types', () => {
      expect(ANALYSIS_TYPES.xray).toBeTruthy();
      expect(ANALYSIS_TYPES.mri).toBeTruthy();
      expect(ANALYSIS_TYPES.posture).toBeTruthy();
      expect(ANALYSIS_TYPES.general).toBeTruthy();
    });
  });

  describe('SUPPORTED_TYPES', () => {
    it('should include common image formats', () => {
      expect(SUPPORTED_TYPES).toContain('image/jpeg');
      expect(SUPPORTED_TYPES).toContain('image/png');
      expect(SUPPORTED_TYPES).toContain('image/webp');
      expect(SUPPORTED_TYPES).toContain('image/gif');
    });
  });

  // ===========================================================================
  // analyzeImage
  // ===========================================================================
  describe('analyzeImage', () => {
    it('should analyze base64 image and return structured result', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyse av bildet viser normal anatomi.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const result = await analyzeImage(
        { base64: 'dGVzdA==', mediaType: 'image/jpeg' },
        { analysisType: 'xray' }
      );

      expect(result.analysis).toContain('normal anatomi');
      expect(result.analysisType).toBe('xray');
      expect(result.disclaimer).toBeTruthy();
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
    });

    it('should read file from filePath when no base64 provided', async () => {
      const buffer = Buffer.from('fake-image-data');
      mockReadFileSync.mockReturnValue(buffer);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Normal funn.' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      });

      const result = await analyzeImage(
        { filePath: '/tmp/test.jpg', mediaType: 'image/jpeg' },
        { analysisType: 'general' }
      );

      expect(mockReadFileSync).toHaveBeenCalledWith('/tmp/test.jpg');
      expect(result.analysis).toBe('Normal funn.');
    });

    it('should throw when image exceeds size limit', async () => {
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
      mockReadFileSync.mockReturnValue(largeBuffer);

      await expect(
        analyzeImage({ filePath: '/tmp/huge.jpg', mediaType: 'image/jpeg' })
      ).rejects.toThrow('20MB limit');
    });

    it('should throw when neither base64 nor filePath provided', async () => {
      await expect(analyzeImage({})).rejects.toThrow('imageData must include base64 or filePath');
    });

    it('should throw for unsupported media type', async () => {
      await expect(analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/tiff' })).rejects.toThrow(
        'Unsupported image type'
      );
    });

    it('should throw when CLAUDE_API_KEY is missing', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' })).rejects.toThrow(
        'CLAUDE_API_KEY'
      );
    });

    it('should include additional context in prompt when provided', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyse.' }],
        usage: {},
      });

      await analyzeImage(
        { base64: 'dGVzdA==', mediaType: 'image/png' },
        { additionalContext: 'Pasient 45 år, kvinne' }
      );

      const callArgs = mockMessagesCreate.mock.calls[0][0];
      const textContent = callArgs.messages[0].content.find((c) => c.type === 'text');
      expect(textContent.text).toContain('Pasient 45 år, kvinne');
    });

    it('should default to general analysis type', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Generell analyse.' }],
        usage: {},
      });

      const result = await analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' });
      expect(result.analysisType).toBe('general');
    });

    it('should use default media type when not specified for base64', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Ok.' }],
        usage: {},
      });

      await analyzeImage({ base64: 'dGVzdA==' });
      const callArgs = mockMessagesCreate.mock.calls[0][0];
      const imgBlock = callArgs.messages[0].content.find((c) => c.type === 'image');
      expect(imgBlock.source.media_type).toBe('image/jpeg');
    });

    it('should return disclaimer in Norwegian', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Funn.' }],
        usage: {},
      });

      const result = await analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' });
      expect(result.disclaimer).toContain('helsepersonell');
    });
  });
});
