/**
 * Structured Extraction Service Tests
 * Tests for Claude tool_use based SOAP and diagnosis extraction
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Stable mock functions
const mockCreate = jest.fn();

// Mock @anthropic-ai/sdk
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
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

describe('Structured Extraction Service', () => {
  let extractSOAP, extractDiagnoses, SOAP_EXTRACTION_TOOL, DIAGNOSIS_EXTRACTION_TOOL;

  beforeEach(async () => {
    process.env.CLAUDE_API_KEY = 'test-api-key';
    mockCreate.mockReset();

    const mod = await import('../../src/services/structuredExtraction.js');
    extractSOAP = mod.extractSOAP;
    extractDiagnoses = mod.extractDiagnoses;
    SOAP_EXTRACTION_TOOL = mod.SOAP_EXTRACTION_TOOL;
    DIAGNOSIS_EXTRACTION_TOOL = mod.DIAGNOSIS_EXTRACTION_TOOL;
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  describe('Tool definitions', () => {
    it('should have correct SOAP extraction tool schema', () => {
      expect(SOAP_EXTRACTION_TOOL.name).toBe('extract_soap');
      expect(SOAP_EXTRACTION_TOOL.input_schema.required).toEqual([
        'subjective',
        'objective',
        'assessment',
        'plan',
      ]);
      expect(SOAP_EXTRACTION_TOOL.input_schema.properties).toHaveProperty('icpc2_codes');
      expect(SOAP_EXTRACTION_TOOL.input_schema.properties).toHaveProperty('red_flags');
    });

    it('should have correct diagnosis extraction tool schema', () => {
      expect(DIAGNOSIS_EXTRACTION_TOOL.name).toBe('extract_diagnoses');
      expect(DIAGNOSIS_EXTRACTION_TOOL.input_schema.required).toEqual(['primary_diagnosis']);
      expect(DIAGNOSIS_EXTRACTION_TOOL.input_schema.properties).toHaveProperty(
        'secondary_diagnoses'
      );
      expect(DIAGNOSIS_EXTRACTION_TOOL.input_schema.properties).toHaveProperty('differential');
    });
  });

  describe('extractSOAP', () => {
    it('should extract structured SOAP data from clinical text', async () => {
      const soapData = {
        subjective: 'Pasienten klager over korsryggsmerter',
        objective: 'SLR positiv venstre side',
        assessment: 'Lumbal radikulopati',
        plan: 'MR henvisning, NSAIDs',
        icpc2_codes: [{ code: 'L86', description: 'Lumbal diskussyndrom', confidence: 0.85 }],
        red_flags: [],
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'tool_use', id: 'tool_1', name: 'extract_soap', input: soapData }],
        usage: { input_tokens: 200, output_tokens: 150 },
      });

      const result = await extractSOAP('Pas. med korsryggsmerter og utstralende smerter...');

      expect(result.data.subjective).toBe('Pasienten klager over korsryggsmerter');
      expect(result.data.assessment).toBe('Lumbal radikulopati');
      expect(result.data.icpc2_codes).toHaveLength(1);
      expect(result.data.icpc2_codes[0].code).toBe('L86');
      expect(result.usage.inputTokens).toBe(200);
      expect(result.usage.outputTokens).toBe(150);
    });

    it('should force tool_choice to extract_soap', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'extract_soap',
            input: {
              subjective: 'S',
              objective: 'O',
              assessment: 'A',
              plan: 'P',
            },
          },
        ],
        usage: {},
      });

      await extractSOAP('Clinical text');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tool_choice: { type: 'tool', name: 'extract_soap' },
          tools: [SOAP_EXTRACTION_TOOL],
        })
      );
    });

    it('should throw if no tool_use block in response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Sorry, I cannot extract this' }],
        usage: {},
      });

      await expect(extractSOAP('Vague text')).rejects.toThrow('No structured data extracted');
    });

    it('should throw if CLAUDE_API_KEY is not set', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(extractSOAP('test')).rejects.toThrow(
        'Structured extraction requires CLAUDE_API_KEY'
      );
    });

    it('should use specified model', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'extract_soap',
            input: { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' },
          },
        ],
        usage: {},
      });

      await extractSOAP('Text', { model: 'claude-opus-4-6' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-opus-4-6' })
      );
    });
  });

  describe('extractDiagnoses', () => {
    it('should extract diagnosis codes from clinical text', async () => {
      const diagData = {
        primary_diagnosis: {
          code: 'L86',
          name: 'Lumbal diskussyndrom',
          confidence: 0.9,
        },
        secondary_diagnoses: [{ code: 'L03', name: 'Korsryggssymptomer', confidence: 0.7 }],
        differential: ['Spinal stenose', 'Piriformis syndrom'],
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'tool_use', id: 'tool_1', name: 'extract_diagnoses', input: diagData }],
        usage: { input_tokens: 180, output_tokens: 120 },
      });

      const result = await extractDiagnoses('Lumbal radikulopati med SLR positiv...');

      expect(result.data.primary_diagnosis.code).toBe('L86');
      expect(result.data.secondary_diagnoses).toHaveLength(1);
      expect(result.data.differential).toContain('Spinal stenose');
      expect(result.usage.inputTokens).toBe(180);
    });

    it('should include available codes in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'extract_diagnoses',
            input: { primary_diagnosis: { code: 'L86', name: 'Test', confidence: 0.8 } },
          },
        ],
        usage: {},
      });

      const codes = [
        { code: 'L86', description: 'Lumbal diskussyndrom' },
        { code: 'L03', description: 'Korsryggssymptomer' },
      ];
      await extractDiagnoses('Clinical text', codes);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      expect(prompt).toContain('L86: Lumbal diskussyndrom');
      expect(prompt).toContain('L03: Korsryggssymptomer');
    });

    it('should throw if no tool_use block in response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'No diagnosis found' }],
        usage: {},
      });

      await expect(extractDiagnoses('Test')).rejects.toThrow('No diagnosis data extracted');
    });

    it('should force tool_choice to extract_diagnoses', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'extract_diagnoses',
            input: { primary_diagnosis: { code: 'L86', name: 'Test', confidence: 0.5 } },
          },
        ],
        usage: {},
      });

      await extractDiagnoses('Text');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tool_choice: { type: 'tool', name: 'extract_diagnoses' },
        })
      );
    });

    it('should handle available codes with name field instead of description', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'extract_diagnoses',
            input: { primary_diagnosis: { code: 'L86', name: 'Test', confidence: 0.8 } },
          },
        ],
        usage: {},
      });

      const codes = [{ code: 'L86', name: 'Lumbal diskussyndrom' }];
      await extractDiagnoses('Text', codes);

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      expect(prompt).toContain('L86: Lumbal diskussyndrom');
    });
  });
});
