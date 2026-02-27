/**
 * Structured Extraction Service
 * Uses Claude tool_use for reliable JSON extraction from clinical text.
 * Extracts SOAP notes and diagnosis codes with structured schemas.
 */

import logger from '../utils/logger.js';

let Anthropic = null;

// Tool definitions for structured extraction
const SOAP_EXTRACTION_TOOL = {
  name: 'extract_soap',
  description: 'Extract structured SOAP note components from clinical text',
  input_schema: {
    type: 'object',
    properties: {
      subjective: {
        type: 'string',
        description: 'Patient-reported symptoms and history',
      },
      objective: {
        type: 'string',
        description: 'Examination findings, vital signs, test results',
      },
      assessment: {
        type: 'string',
        description: 'Clinical assessment and diagnosis',
      },
      plan: {
        type: 'string',
        description: 'Treatment plan and follow-up',
      },
      icpc2_codes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            description: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
        description: 'Suggested ICPC-2 diagnosis codes',
      },
      red_flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Identified red flags requiring attention',
      },
    },
    required: ['subjective', 'objective', 'assessment', 'plan'],
  },
};

const DIAGNOSIS_EXTRACTION_TOOL = {
  name: 'extract_diagnoses',
  description: 'Extract structured diagnosis information from clinical text',
  input_schema: {
    type: 'object',
    properties: {
      primary_diagnosis: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
      secondary_diagnoses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
      },
      differential: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['primary_diagnosis'],
  },
};

async function getClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Structured extraction requires CLAUDE_API_KEY');
  }
  if (!Anthropic) {
    const sdk = await import('@anthropic-ai/sdk');
    Anthropic = sdk.default || sdk.Anthropic;
  }
  return new Anthropic({ apiKey });
}

/**
 * Extract structured SOAP data from free text using tool_use
 * @param {string} clinicalText - Free-text clinical notes
 * @param {Object} options - { model }
 * @returns {{ data: Object, usage: Object }}
 */
export async function extractSOAP(clinicalText, options = {}) {
  const { model = 'claude-sonnet-4-6' } = options;
  const client = await getClient();

  logger.debug('Extracting SOAP from clinical text', { textLength: clinicalText.length });

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    tools: [SOAP_EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_soap' },
    messages: [
      {
        role: 'user',
        content: `Ekstraher strukturert SOAP-data fra folgende kliniske tekst:\n\n${clinicalText}`,
      },
    ],
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock) {
    throw new Error('No structured data extracted');
  }

  logger.debug('SOAP extraction complete', { fields: Object.keys(toolBlock.input) });

  return {
    data: toolBlock.input,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Extract diagnosis codes from clinical text using tool_use
 * @param {string} clinicalText - Free-text clinical notes
 * @param {Array} availableCodes - Optional list of ICPC-2 codes to prefer
 * @param {Object} options - { model }
 * @returns {{ data: Object, usage: Object }}
 */
export async function extractDiagnoses(clinicalText, availableCodes = [], options = {}) {
  const { model = 'claude-sonnet-4-6' } = options;
  const client = await getClient();

  let prompt = `Ekstraher diagnosekoder fra folgende kliniske tekst:\n\n${clinicalText}`;
  if (availableCodes.length > 0) {
    prompt += `\n\nTilgjengelige ICPC-2 koder:\n${availableCodes.map((c) => `${c.code}: ${c.description || c.name}`).join('\n')}`;
  }

  logger.debug('Extracting diagnoses from clinical text', {
    textLength: clinicalText.length,
    availableCodes: availableCodes.length,
  });

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    tools: [DIAGNOSIS_EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_diagnoses' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock) {
    throw new Error('No diagnosis data extracted');
  }

  logger.debug('Diagnosis extraction complete', {
    primary: toolBlock.input.primary_diagnosis?.code,
  });

  return {
    data: toolBlock.input,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

export { SOAP_EXTRACTION_TOOL, DIAGNOSIS_EXTRACTION_TOOL };
