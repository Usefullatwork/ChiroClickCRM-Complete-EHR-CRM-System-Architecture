/**
 * Unit Tests for Structured Extraction (src/services/clinical/structuredExtraction.js)
 * Tests SOAP extraction and diagnosis extraction using Claude tool_use
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

const mockMessagesCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {
      this.messages = { create: mockMessagesCreate };
    }
  },
}));

const { extractSOAP, extractDiagnoses, SOAP_EXTRACTION_TOOL, DIAGNOSIS_EXTRACTION_TOOL } =
  await import('../../../src/services/clinical/structuredExtraction.js');

describe('structuredExtraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLAUDE_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  // ===========================================================================
  // Tool definitions
  // ===========================================================================
  describe('SOAP_EXTRACTION_TOOL', () => {
    it('should define required schema fields', () => {
      expect(SOAP_EXTRACTION_TOOL.name).toBe('extract_soap');
      expect(SOAP_EXTRACTION_TOOL.input_schema.required).toContain('subjective');
      expect(SOAP_EXTRACTION_TOOL.input_schema.required).toContain('objective');
      expect(SOAP_EXTRACTION_TOOL.input_schema.required).toContain('assessment');
      expect(SOAP_EXTRACTION_TOOL.input_schema.required).toContain('plan');
    });
  });

  describe('DIAGNOSIS_EXTRACTION_TOOL', () => {
    it('should define required schema fields', () => {
      expect(DIAGNOSIS_EXTRACTION_TOOL.name).toBe('extract_diagnoses');
      expect(DIAGNOSIS_EXTRACTION_TOOL.input_schema.required).toContain('primary_diagnosis');
    });
  });

  // ===========================================================================
  // extractSOAP
  // ===========================================================================
  describe('extractSOAP', () => {
    it('should extract SOAP data from clinical text', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_soap',
            input: {
              subjective: 'Smerter i nakke',
              objective: 'Nedsatt ROM',
              assessment: 'Cervical dysfunksjon',
              plan: 'Mobilisering',
            },
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const result = await extractSOAP('Pasient med smerter i nakke, nedsatt ROM');
      expect(result.data.subjective).toBe('Smerter i nakke');
      expect(result.data.objective).toBe('Nedsatt ROM');
      expect(result.data.assessment).toBe('Cervical dysfunksjon');
      expect(result.data.plan).toBe('Mobilisering');
      expect(result.usage.inputTokens).toBe(100);
    });

    it('should throw when no tool_use block returned', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'No structured data' }],
        usage: {},
      });

      await expect(extractSOAP('some text')).rejects.toThrow('No structured data extracted');
    });

    it('should throw when CLAUDE_API_KEY is missing', async () => {
      delete process.env.CLAUDE_API_KEY;
      await expect(extractSOAP('test')).rejects.toThrow('CLAUDE_API_KEY');
    });

    it('should use correct tool_choice', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_soap',
            input: { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' },
          },
        ],
        usage: {},
      });

      await extractSOAP('text');
      expect(mockMessagesCreate.mock.calls[0][0].tool_choice).toEqual({
        type: 'tool',
        name: 'extract_soap',
      });
    });

    it('should include usage in result', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_soap',
            input: { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' },
          },
        ],
        usage: { input_tokens: 200, output_tokens: 100 },
      });

      const result = await extractSOAP('text');
      expect(result.usage.inputTokens).toBe(200);
      expect(result.usage.outputTokens).toBe(100);
    });
  });

  // ===========================================================================
  // extractDiagnoses
  // ===========================================================================
  describe('extractDiagnoses', () => {
    it('should extract diagnosis codes from clinical text', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_diagnoses',
            input: {
              primary_diagnosis: { code: 'L03', name: 'Lumbal smerte', confidence: 0.9 },
              secondary_diagnoses: [],
              differential: ['M54.5'],
            },
          },
        ],
        usage: { input_tokens: 80, output_tokens: 40 },
      });

      const result = await extractDiagnoses('Pasient med lumbal smerte');
      expect(result.data.primary_diagnosis.code).toBe('L03');
      expect(result.data.primary_diagnosis.confidence).toBe(0.9);
    });

    it('should include available codes in prompt when provided', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_diagnoses',
            input: { primary_diagnosis: { code: 'L03' } },
          },
        ],
        usage: {},
      });

      await extractDiagnoses('text', [{ code: 'L03', description: 'Lumbal smerte' }]);
      const prompt = mockMessagesCreate.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('L03');
      expect(prompt).toContain('Lumbal smerte');
    });

    it('should throw when no tool_use block returned', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'No diagnosis found' }],
        usage: {},
      });

      await expect(extractDiagnoses('some text')).rejects.toThrow('No diagnosis data extracted');
    });

    it('should throw when CLAUDE_API_KEY is missing', async () => {
      delete process.env.CLAUDE_API_KEY;
      await expect(extractDiagnoses('test')).rejects.toThrow('CLAUDE_API_KEY');
    });

    it('should use correct tool_choice for diagnosis', async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'extract_diagnoses',
            input: { primary_diagnosis: { code: 'L03' } },
          },
        ],
        usage: {},
      });

      await extractDiagnoses('text');
      expect(mockMessagesCreate.mock.calls[0][0].tool_choice).toEqual({
        type: 'tool',
        name: 'extract_diagnoses',
      });
    });
  });
});
