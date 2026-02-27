/**
 * Clinical Vision Service Tests
 * Tests for Claude vision-based clinical image analysis
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Stable mock functions
const mockCreate = jest.fn();
const mockReadFileSync = jest.fn();

// Mock @anthropic-ai/sdk
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

// Mock fs
jest.unstable_mockModule('fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
  },
  readFileSync: mockReadFileSync,
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Clinical Vision Service', () => {
  let analyzeImage, ANALYSIS_TYPES, SUPPORTED_TYPES;

  beforeEach(async () => {
    process.env.CLAUDE_API_KEY = 'test-api-key';
    mockCreate.mockReset();
    mockReadFileSync.mockReset();

    const mod = await import('../../src/services/clinicalVision.js');
    analyzeImage = mod.analyzeImage;
    ANALYSIS_TYPES = mod.ANALYSIS_TYPES;
    SUPPORTED_TYPES = mod.SUPPORTED_TYPES;
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  describe('Constants', () => {
    it('should support jpeg, png, webp, gif', () => {
      expect(SUPPORTED_TYPES).toContain('image/jpeg');
      expect(SUPPORTED_TYPES).toContain('image/png');
      expect(SUPPORTED_TYPES).toContain('image/webp');
      expect(SUPPORTED_TYPES).toContain('image/gif');
    });

    it('should have analysis types for xray, mri, posture, general', () => {
      expect(ANALYSIS_TYPES).toHaveProperty('xray');
      expect(ANALYSIS_TYPES).toHaveProperty('mri');
      expect(ANALYSIS_TYPES).toHaveProperty('posture');
      expect(ANALYSIS_TYPES).toHaveProperty('general');
    });
  });

  describe('analyzeImage', () => {
    it('should analyze base64 image and return structured result', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Rontgenbildet viser normal cervical lordose. Ingen frakturer.',
          },
        ],
        usage: { input_tokens: 500, output_tokens: 150 },
      });

      const result = await analyzeImage(
        { base64: 'dGVzdA==', mediaType: 'image/jpeg' },
        { analysisType: 'xray' }
      );

      expect(result.analysis).toContain('normal cervical lordose');
      expect(result.analysisType).toBe('xray');
      expect(result.disclaimer).toContain('kvalifisert helsepersonell');
      expect(result.usage.inputTokens).toBe(500);
      expect(result.usage.outputTokens).toBe(150);
    });

    it('should send image with correct content structure', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Analysis result' }],
        usage: {},
      });

      await analyzeImage({ base64: 'aW1hZ2U=', mediaType: 'image/png' }, { analysisType: 'mri' });

      const call = mockCreate.mock.calls[0][0];
      const message = call.messages[0];
      expect(message.content).toHaveLength(2);
      expect(message.content[0].type).toBe('image');
      expect(message.content[0].source.type).toBe('base64');
      expect(message.content[0].source.media_type).toBe('image/png');
      expect(message.content[0].source.data).toBe('aW1hZ2U=');
      expect(message.content[1].type).toBe('text');
    });

    it('should read image from file path', async () => {
      const fakeBuffer = Buffer.from('fake-image-data');
      mockReadFileSync.mockReturnValue(fakeBuffer);
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'File analysis result' }],
        usage: {},
      });

      const result = await analyzeImage(
        { filePath: '/path/to/xray.jpg', mediaType: 'image/jpeg' },
        { analysisType: 'xray' }
      );

      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/xray.jpg');
      expect(result.analysis).toBe('File analysis result');
    });

    it('should throw for oversized images', async () => {
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
      mockReadFileSync.mockReturnValue(largeBuffer);

      await expect(
        analyzeImage({ filePath: '/path/to/large.jpg' }, { analysisType: 'xray' })
      ).rejects.toThrow('Image exceeds 20MB limit');
    });

    it('should throw for unsupported media type', async () => {
      await expect(analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/tiff' })).rejects.toThrow(
        'Unsupported image type: image/tiff'
      );
    });

    it('should throw if neither base64 nor filePath provided', async () => {
      await expect(analyzeImage({})).rejects.toThrow('imageData must include base64 or filePath');
    });

    it('should throw if CLAUDE_API_KEY is not set', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(analyzeImage({ base64: 'dGVzdA==' })).rejects.toThrow(
        'Clinical vision requires CLAUDE_API_KEY'
      );
    });

    it('should default to image/jpeg if mediaType not specified for base64', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeImage({ base64: 'dGVzdA==' });

      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content[0].source.media_type).toBe('image/jpeg');
    });

    it('should include additional context in prompt', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeImage(
        { base64: 'dGVzdA==', mediaType: 'image/jpeg' },
        { analysisType: 'xray', additionalContext: 'Pasient med 3 ukers smerter' }
      );

      const call = mockCreate.mock.calls[0][0];
      const textContent = call.messages[0].content[1].text;
      expect(textContent).toContain('3 ukers smerter');
    });

    it('should use general analysis type as default', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'General analysis' }],
        usage: {},
      });

      const result = await analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' });

      expect(result.analysisType).toBe('general');
    });

    it('should include system prompt in Norwegian', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' });

      const call = mockCreate.mock.calls[0][0];
      expect(call.system).toContain('norsk');
      expect(call.system).toContain('helsepersonell');
    });

    it('should concatenate multiple text blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: 'Part 1. ' },
          { type: 'text', text: 'Part 2.' },
        ],
        usage: {},
      });

      const result = await analyzeImage({ base64: 'dGVzdA==', mediaType: 'image/jpeg' });

      expect(result.analysis).toBe('Part 1. Part 2.');
    });

    it('should use specified model', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeImage(
        { base64: 'dGVzdA==', mediaType: 'image/jpeg' },
        { model: 'claude-opus-4-6' }
      );

      const call = mockCreate.mock.calls[0][0];
      expect(call.model).toBe('claude-opus-4-6');
    });
  });
});
