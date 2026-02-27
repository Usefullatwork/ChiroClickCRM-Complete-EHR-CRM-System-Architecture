/**
 * Clinical Orchestrator
 *
 * Fan-out/synthesize pattern: runs multiple specialized analyses
 * in parallel, then synthesizes results through Claude.
 *
 * Pipeline:
 * 1. Safety screening (red flags) — ALWAYS runs first, can halt pipeline
 * 2. Specialized assessments (parallel) — clinical docs, diagnosis, etc.
 * 3. Synthesis — Claude combines all results into cohesive output
 */

import logger from '../utils/logger.js';
import { getAIProvider } from './providers/aiProviderFactory.js';

/**
 * Run the full orchestrated clinical pipeline.
 * Enhanced version of clinicalAgent.js pipeline that supports
 * multi-provider coordination (Ollama for fast tasks, Claude for synthesis).
 *
 * @param {Object} patientData - { age, name, ... }
 * @param {Object} soapData - { subjective, objective, assessment, plan }
 * @param {Object} options - { includeDifferential, includeLetterDraft, language }
 * @returns {Object} Pipeline results
 */
export async function orchestrate(patientData, soapData, options = {}) {
  const { includeDifferential = true, includeLetterDraft = false, language = 'no' } = options;
  const provider = getAIProvider();
  const startTime = Date.now();
  const steps = [];

  // Step 1: Safety screening (critical — can halt pipeline)
  let safety;
  try {
    const safetyPrompt = buildSafetyPrompt(soapData, patientData);
    const safetyResult = await provider.generate(safetyPrompt, null, {
      taskType: 'red_flag_analysis',
      maxTokens: 500,
      temperature: 0.1,
    });
    safety = parseSafetyResult(safetyResult.text);
    steps.push({
      step: 'safety',
      status: 'completed',
      durationMs: Date.now() - startTime,
      provider: safetyResult.provider,
    });
  } catch (error) {
    logger.error('Safety screening failed:', error.message);
    safety = { riskLevel: 'UNKNOWN', canTreat: true, flags: [], error: error.message };
    steps.push({ step: 'safety', status: 'error', error: error.message });
  }

  // Halt on critical risk
  if (safety.riskLevel === 'CRITICAL') {
    return {
      halted: true,
      haltReason: `Kritisk risiko identifisert: ${safety.flags.join(', ')}`,
      safety,
      steps,
      totalTime: Date.now() - startTime,
    };
  }

  // Step 2: Parallel specialized assessments
  const assessmentPromises = [];

  // Clinical documentation
  assessmentPromises.push(
    runAssessment(provider, 'clinical', buildClinicalPrompt(soapData, patientData), {
      taskType: 'clinical_summary',
      maxTokens: 800,
    })
  );

  // Differential diagnosis (optional)
  if (includeDifferential) {
    assessmentPromises.push(
      runAssessment(provider, 'differential', buildDifferentialPrompt(soapData), {
        taskType: 'differential_diagnosis',
        maxTokens: 600,
      })
    );
  }

  // Letter draft (optional)
  if (includeLetterDraft) {
    assessmentPromises.push(
      runAssessment(provider, 'letter', buildLetterPrompt(soapData, patientData), {
        taskType: 'referral_letter',
        maxTokens: 1000,
      })
    );
  }

  const assessments = await Promise.allSettled(assessmentPromises);
  const results = {};

  for (const result of assessments) {
    if (result.status === 'fulfilled') {
      results[result.value.name] = result.value;
      steps.push({ step: result.value.name, status: 'completed', provider: result.value.provider });
    } else {
      steps.push({ step: 'assessment', status: 'error', error: result.reason?.message });
    }
  }

  // Step 3: Synthesis (optional — only when Claude is available and multiple results exist)
  let synthesis = null;
  const claudeMode = (process.env.CLAUDE_FALLBACK_MODE || 'disabled').toLowerCase();
  if (claudeMode !== 'disabled' && Object.keys(results).length > 1) {
    try {
      const synthesisPrompt = buildSynthesisPrompt(safety, results, language);
      const synthResult = await provider.generate(synthesisPrompt, null, {
        taskType: 'clinical_reasoning',
        maxTokens: 1000,
        temperature: 0.2,
      });
      synthesis = synthResult.text;
      steps.push({ step: 'synthesis', status: 'completed', provider: synthResult.provider });
    } catch (error) {
      logger.warn('Synthesis step failed:', error.message);
      steps.push({ step: 'synthesis', status: 'error', error: error.message });
    }
  }

  return {
    halted: false,
    safety,
    clinical: results.clinical?.text,
    differential: results.differential?.text,
    letter: results.letter?.text,
    synthesis,
    steps,
    totalTime: Date.now() - startTime,
  };
}

// Helper: run a single assessment
async function runAssessment(provider, name, prompt, options) {
  const result = await provider.generate(prompt, null, options);
  return { name, text: result.text, provider: result.provider };
}

// Helper: parse safety result text into structured format
function parseSafetyResult(text) {
  const upperText = text.toUpperCase();
  let riskLevel = 'LOW';
  if (upperText.includes('KRITISK') || upperText.includes('CRITICAL')) riskLevel = 'CRITICAL';
  else if (upperText.includes('HØY') || upperText.includes('HIGH')) riskLevel = 'HIGH';
  else if (upperText.includes('MODERAT') || upperText.includes('MODERATE')) riskLevel = 'MODERATE';

  return {
    riskLevel,
    canTreat: riskLevel !== 'CRITICAL',
    flags: [],
    rawText: text,
  };
}

// Prompt builders
function buildSafetyPrompt(soapData, patientData) {
  return `Vurder røde flagg for denne pasienten:\n${patientData.age ? `Alder: ${patientData.age}\n` : ''}Subjektivt: ${soapData.subjective || 'Ikke angitt'}\nObjektivt: ${soapData.objective || 'Ikke angitt'}\n\nAngi risikonivå: LAV, MODERAT, HØY, eller KRITISK.`;
}

function buildClinicalPrompt(soapData, patientData) {
  return `Skriv klinisk sammendrag:\n${patientData.age ? `Alder: ${patientData.age}\n` : ''}S: ${soapData.subjective || ''}\nO: ${soapData.objective || ''}\nA: ${soapData.assessment || ''}\nP: ${soapData.plan || ''}`;
}

function buildDifferentialPrompt(soapData) {
  return `Lag differensialdiagnose basert på:\nS: ${soapData.subjective || ''}\nO: ${soapData.objective || ''}`;
}

function buildLetterPrompt(soapData, patientData) {
  return `Skriv henvisningsbrev basert på:\nPasient: ${patientData.name || 'Ikke angitt'}, ${patientData.age ? `${patientData.age} år` : ''}\nDiagnose: ${soapData.assessment || ''}\nFunn: ${soapData.objective || ''}`;
}

function buildSynthesisPrompt(safety, results, language) {
  const parts = ['Syntetiser følgende kliniske vurderinger til et sammenhengende sammendrag:\n'];
  if (safety) parts.push(`Sikkerhetsvurdering: ${safety.riskLevel}`);
  if (results.clinical) parts.push(`\nKlinisk sammendrag:\n${results.clinical.text}`);
  if (results.differential) parts.push(`\nDifferensialdiagnose:\n${results.differential.text}`);
  parts.push(`\nSkriv på ${language === 'en' ? 'engelsk' : 'norsk bokmål'}.`);
  return parts.join('\n');
}

export { parseSafetyResult };
