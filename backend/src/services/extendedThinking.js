/**
 * Extended Thinking Service
 * Uses Claude's extended thinking (thinking budget) for clinical reasoning.
 * Provides transparent differential diagnosis and red flag analysis.
 */

import logger from '../utils/logger.js';

// Lazy-load SDK
let Anthropic = null;

/**
 * Run extended thinking analysis on clinical data.
 * Uses Claude's extended thinking (thinking budget) to show clinical reasoning.
 * @param {string} prompt - The clinical prompt to analyze
 * @param {Object} options - Configuration options
 * @param {number} options.maxThinkingTokens - Budget for thinking tokens (default 5000)
 * @param {number} options.maxOutputTokens - Max output tokens (default 2000)
 * @param {string} options.model - Claude model to use
 * @param {string} options.taskType - Type of clinical task
 * @returns {{ reasoning: string, answer: string, usage: Object }}
 */
export async function analyzeWithThinking(prompt, options = {}) {
  const {
    maxThinkingTokens = 5000,
    maxOutputTokens = 2000,
    model = 'claude-sonnet-4-6',
    taskType = 'clinical_reasoning',
  } = options;

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Extended thinking requires CLAUDE_API_KEY');

  if (!Anthropic) {
    const sdk = await import('@anthropic-ai/sdk');
    Anthropic = sdk.default || sdk.Anthropic;
  }

  const client = new Anthropic({ apiKey });

  logger.debug('Extended thinking request', { model, taskType, maxThinkingTokens });

  const response = await client.messages.create({
    model,
    max_tokens: maxOutputTokens + maxThinkingTokens,
    thinking: { type: 'enabled', budget_tokens: maxThinkingTokens },
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract thinking and text blocks
  let reasoning = '';
  let answer = '';
  for (const block of response.content) {
    if (block.type === 'thinking') reasoning = block.thinking;
    if (block.type === 'text') answer += block.text;
  }

  logger.debug('Extended thinking complete', {
    taskType,
    reasoningLength: reasoning.length,
    answerLength: answer.length,
  });

  return {
    reasoning,
    answer,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Differential diagnosis with extended thinking.
 * Builds a clinical prompt from SOAP data, runs thinking analysis.
 * @param {Object} soapData - SOAP note data
 * @param {Object} patientData - Patient demographics
 * @returns {{ reasoning: string, answer: string, usage: Object, taskType: string }}
 */
export async function differentialDiagnosis(soapData, patientData = {}) {
  const prompt = buildDifferentialPrompt(soapData, patientData);
  const result = await analyzeWithThinking(prompt, {
    taskType: 'differential_diagnosis',
    maxThinkingTokens: 8000,
  });

  return {
    ...result,
    taskType: 'differential_diagnosis',
  };
}

/**
 * Red flag analysis with transparent reasoning.
 * @param {Object} soapData - SOAP note data
 * @param {Object} patientData - Patient demographics
 * @returns {{ reasoning: string, answer: string, usage: Object, taskType: string }}
 */
export async function analyzeRedFlagsWithThinking(soapData, patientData = {}) {
  const prompt = buildRedFlagPrompt(soapData, patientData);
  const result = await analyzeWithThinking(prompt, {
    taskType: 'red_flag_analysis',
    maxThinkingTokens: 5000,
  });

  return {
    ...result,
    taskType: 'red_flag_analysis',
  };
}

/**
 * Build differential diagnosis prompt from clinical data
 */
function buildDifferentialPrompt(soapData, patientData) {
  const parts = ['Utfor en differensialdiagnose basert pa folgende kliniske data:\n'];
  if (patientData.age) parts.push(`Alder: ${patientData.age}`);
  if (patientData.gender) parts.push(`Kjonn: ${patientData.gender}`);
  if (soapData.subjective) parts.push(`\nSubjektivt:\n${soapData.subjective}`);
  if (soapData.objective) parts.push(`\nObjektivt:\n${soapData.objective}`);
  if (soapData.assessment) parts.push(`\nVurdering:\n${soapData.assessment}`);
  parts.push(
    '\nList de mest sannsynlige diagnosene rangert etter sannsynlighet. Inkluder ICPC-2 koder der mulig. Forklar resonneringen for hver diagnose.'
  );
  return parts.join('\n');
}

/**
 * Build red flag analysis prompt from clinical data
 */
function buildRedFlagPrompt(soapData, patientData) {
  const parts = ['Analyser folgende kliniske data for rode flagg (red flags):\n'];
  if (patientData.age) parts.push(`Alder: ${patientData.age}`);
  if (soapData.subjective) parts.push(`\nSubjektivt:\n${soapData.subjective}`);
  if (soapData.objective) parts.push(`\nObjektivt:\n${soapData.objective}`);
  parts.push(
    '\nVurder risiko for: nevrologiske utfall, cauda equina, fraktur, infeksjon, malignitet, vaskulaere hendelser. Angi risikoniva (LAV/MODERAT/HOY/KRITISK) for hvert flagg.'
  );
  return parts.join('\n');
}
