/**
 * Clinical Evaluation Service
 *
 * Runs the same clinical prompt through both Ollama and Claude,
 * then uses Claude to grade the quality of both responses.
 * Implements model-based grading from Anthropic's eval cookbook.
 */

import logger from '../utils/logger.js';
import { getAIProvider } from './providers/aiProviderFactory.js';
import { query } from '../config/database.js';

let Anthropic = null;

async function getGraderClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Clinical evals require CLAUDE_API_KEY');
  }
  if (!Anthropic) {
    const sdk = await import('@anthropic-ai/sdk');
    Anthropic = sdk.default || sdk.Anthropic;
  }
  return new Anthropic({ apiKey });
}

/**
 * Grading rubric for clinical outputs
 */
const GRADING_SYSTEM = `Du er en erfaren klinisk evaluator. Grader AI-generert klinisk innhold på en skala fra 1-5 for hver kategori:

1. Klinisk nøyaktighet (1-5): Er informasjonen medisinsk korrekt?
2. Relevans (1-5): Er svaret relevant for det kliniske spørsmålet?
3. Fullstendighet (1-5): Dekker svaret alle viktige aspekter?
4. Språkkvalitet (1-5): Er norsk medisinsk terminologi korrekt brukt?
5. Sikkerhet (1-5): Identifiseres røde flagg og kontraindikasjoner?

Svar som JSON: { "accuracy": N, "relevance": N, "completeness": N, "language": N, "safety": N, "overall": N, "feedback": "..." }
Der "overall" er et vektet gjennomsnitt med sikkerhet vektet dobbelt.`;

/**
 * Run a comparative evaluation: same prompt through Ollama and Claude,
 * then Claude grades both outputs.
 */
export async function runComparison(prompt, options = {}) {
  const { systemPrompt = null, taskType = 'clinical_summary', maxTokens = 500 } = options;

  const _provider = getAIProvider();
  const results = { ollama: null, claude: null, grades: null };

  // Run Ollama
  try {
    const { OllamaProvider } = await import('./providers/ollamaProvider.js');
    const ollamaProvider = new OllamaProvider();
    const ollamaResult = await ollamaProvider.generate(prompt, systemPrompt, {
      taskType,
      maxTokens,
      temperature: 0.3,
    });
    results.ollama = {
      text: ollamaResult.text,
      durationMs: ollamaResult.durationMs,
      model: ollamaResult.model,
    };
  } catch (error) {
    results.ollama = { error: error.message };
  }

  // Run Claude
  try {
    const { ClaudeProvider } = await import('./providers/claudeProvider.js');
    const claudeProvider = new ClaudeProvider();
    const claudeResult = await claudeProvider.generate(prompt, systemPrompt, {
      taskType,
      maxTokens,
      temperature: 0.3,
    });
    results.claude = {
      text: claudeResult.text,
      durationMs: claudeResult.durationMs,
      model: claudeResult.model,
    };
  } catch (error) {
    results.claude = { error: error.message };
  }

  // Grade both using Claude as evaluator
  if (results.ollama?.text && results.claude?.text) {
    try {
      results.grades = await gradeOutputs(prompt, results.ollama.text, results.claude.text);
    } catch (error) {
      logger.warn('Grading failed:', error.message);
      results.grades = { error: error.message };
    }
  }

  return results;
}

/**
 * Grade two outputs using Claude as model-based evaluator
 */
async function gradeOutputs(prompt, outputA, outputB) {
  const client = await getGraderClient();

  const gradingPrompt = `Klinisk prompt:\n${prompt}\n\n--- Svar A (Lokal modell) ---\n${outputA}\n\n--- Svar B (Claude) ---\n${outputB}\n\nGrader begge svar separat. Svar som JSON med "svar_a" og "svar_b" nøkler, hver med graderings-objektet beskrevet i instruksjonene.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: GRADING_SYSTEM,
    messages: [{ role: 'user', content: gradingPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    logger.warn('Failed to parse grading JSON');
  }

  return { raw: text };
}

/**
 * Run a batch of evaluations and store results
 */
export async function runEvalBatch(testCases, options = {}) {
  const results = [];

  for (const testCase of testCases) {
    try {
      const result = await runComparison(testCase.prompt, {
        systemPrompt: testCase.systemPrompt,
        taskType: testCase.taskType || 'clinical_summary',
        ...options,
      });
      results.push({ id: testCase.id, ...result });
    } catch (error) {
      results.push({ id: testCase.id, error: error.message });
    }
  }

  // Persist eval results (non-blocking)
  persistEvalResults(results).catch((err) =>
    logger.warn('Failed to persist eval results:', err.message)
  );

  return results;
}

/**
 * Store evaluation results in database
 */
async function persistEvalResults(results) {
  for (const result of results) {
    if (result.error) {
      continue;
    }

    try {
      await query(
        `INSERT INTO ai_api_usage (provider, model, input_tokens, output_tokens, cost_usd, task_type, duration_ms)
         VALUES ('eval', 'comparison', 0, 0, 0, 'clinical_eval', $1)`,
        [result.ollama?.durationMs || 0]
      );
    } catch {
      // Table might not exist yet
    }
  }
}

/**
 * Get evaluation summary statistics
 */
export async function getEvalSummary() {
  try {
    const result = await query(
      `SELECT
        COUNT(*) as total_evals,
        AVG(duration_ms)::integer as avg_duration_ms
       FROM ai_api_usage
       WHERE task_type = 'clinical_eval'`
    );
    return result.rows[0] || { total_evals: 0, avg_duration_ms: 0 };
  } catch {
    return { total_evals: 0, avg_duration_ms: 0 };
  }
}

/**
 * Export rejected/modified suggestions as anonymized JSONL training examples.
 * These represent cases where the AI failed and the clinician corrected or rejected
 * the output — ideal negative examples for LoRA fine-tuning.
 */
export async function exportFailedCases() {
  const { anonymizeText } = await import('../services/trainingExport.js');
  const { validateForCloudAPI } = await import('../services/complianceValidator.js');

  // Fødselsnummer pattern: 11 digits (6 birth + 5 personal)
  const fnummerPattern = /\b\d{6}\s?\d{5}\b/;

  const result = await query(
    `SELECT id, suggestion_type, input_text, suggested_text, modified_text,
            feedback_status, confidence_score, model_name
     FROM ai_suggestions
     WHERE feedback_status IN ('REJECTED', 'MODIFIED')
     ORDER BY created_at DESC`
  );

  const rows = result.rows || [];
  const examples = [];
  const skipped = { pii: 0, compliance: 0 };

  for (const row of rows) {
    const inputText = row.input_text || '';
    const suggestedText = row.suggested_text || '';
    const modifiedText = row.modified_text || '';

    // Refuse to export data containing fødselsnummer
    if (
      fnummerPattern.test(inputText) ||
      fnummerPattern.test(suggestedText) ||
      fnummerPattern.test(modifiedText)
    ) {
      skipped.pii++;
      continue;
    }

    // Validate compliance before export
    const validation = validateForCloudAPI(inputText);
    if (!validation.valid) {
      skipped.compliance++;
      continue;
    }

    // Determine the correct output: for MODIFIED, use the human-corrected text;
    // for REJECTED, use a system message indicating rejection
    const correctOutput =
      row.feedback_status === 'MODIFIED' && modifiedText
        ? anonymizeText(modifiedText)
        : '[AVVIST — utilstrekkelig kvalitet]';

    examples.push({
      messages: [
        {
          role: 'system',
          content: 'Du er en klinisk assistent for kiropraktorer i Norge. Skriv på norsk bokmål.',
        },
        {
          role: 'user',
          content: anonymizeText(inputText),
        },
        {
          role: 'assistant',
          content: correctOutput,
        },
      ],
      metadata: {
        source: 'production_feedback',
        category: row.suggestion_type || 'general',
        feedback_status: row.feedback_status,
        original_model: row.model_name,
        original_confidence: row.confidence_score,
        rejected_output: anonymizeText(suggestedText),
      },
    });
  }

  logger.info('Exported failed cases for training', {
    total: rows.length,
    exported: examples.length,
    skipped,
  });

  return examples;
}

export { GRADING_SYSTEM };
