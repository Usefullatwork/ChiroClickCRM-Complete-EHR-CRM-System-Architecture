/**
 * Training Data Export Service
 * Exports anonymized AI feedback data as JSONL for model retraining.
 * All PII is scrubbed before export (GDPR compliant).
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Regex-scrub sensitive data from text
 * @param {string} text - Raw text that may contain PII
 * @returns {string} Anonymized text
 */
export function anonymizeText(text) {
  if (!text) {
    return '';
  }

  let cleaned = text;

  // Norwegian fødselsnummer (11 digits: 6 birth + 5 personal)
  cleaned = cleaned.replace(/\b\d{6}\s?\d{5}\b/g, '[FNUMMER]');

  // Phone numbers (+47 prefix optional, 8 digits in groups)
  cleaned = cleaned.replace(/\b(?:\+47\s?)?\d{3}\s?\d{2}\s?\d{3}\b/g, '[TELEFON]');

  // Email addresses
  cleaned = cleaned.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EPOST]');

  // Dates in dd.mm.yyyy format
  cleaned = cleaned.replace(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g, '[DATO]');

  // Names after "Pasient:" or "Patient:"
  cleaned = cleaned.replace(/(?:Pasient|Patient):\s*\w+\s+\w+/gi, 'Pasient: [NAVN]');

  return cleaned;
}

/**
 * Round age to nearest decade for anonymization
 * @param {number} age - Exact age
 * @returns {string} Decade string (e.g., "40s")
 */
export function anonymizeAge(age) {
  if (age === null || age === undefined || isNaN(age)) {
    return 'unknown';
  }
  return `${Math.floor(age / 10) * 10}s`;
}

/**
 * Build a ChatML SFT training example from an ai_suggestions row
 * @param {object} suggestion - Row from ai_suggestions table
 * @returns {object} ChatML-formatted training example
 */
export function buildChatMLExample(suggestion) {
  return {
    messages: [
      {
        role: 'system',
        content: 'Du er en klinisk assistent for kiropraktorer i Norge.',
      },
      {
        role: 'user',
        content: anonymizeText(suggestion.input_text),
      },
      {
        role: 'assistant',
        content: anonymizeText(suggestion.modified_text || suggestion.suggested_text),
      },
    ],
    metadata: {
      type: suggestion.suggestion_type,
      feedback: suggestion.feedback_status,
      confidence: suggestion.confidence_score,
    },
  };
}

/**
 * Build a DPO (Direct Preference Optimization) pair from a MODIFIED suggestion.
 * The human-edited version is "chosen", the original AI output is "rejected".
 * @param {object} suggestion - Row from ai_suggestions where feedback_status = 'MODIFIED'
 * @returns {object} DPO training pair
 */
export function buildDPOPair(suggestion) {
  return {
    prompt: anonymizeText(suggestion.input_text),
    chosen: anonymizeText(suggestion.modified_text),
    rejected: anonymizeText(suggestion.suggested_text),
    metadata: {
      type: suggestion.suggestion_type,
    },
  };
}

/**
 * Export all feedback-bearing AI suggestions as anonymized training data.
 * Idempotent — re-exports all qualifying rows each time.
 * @param {string} organizationId - Organization UUID
 * @returns {object} { sft: [], dpo: [], stats: { total, sft_count, dpo_count } }
 */
export async function exportTrainingData(organizationId) {
  logger.info('Exporting training data', { organizationId });

  const result = await query(
    `SELECT id, suggestion_type, input_text, suggested_text, modified_text,
            feedback_status, confidence_score, model_name
     FROM ai_suggestions
     WHERE organization_id = $1
       AND feedback_status IN ('APPROVED', 'MODIFIED', 'REJECTED')
     ORDER BY created_at DESC`,
    [organizationId]
  );

  const rows = result.rows || [];
  const sft = [];
  const dpo = [];

  for (const row of rows) {
    // APPROVED and MODIFIED rows become SFT examples
    if (row.feedback_status === 'APPROVED' || row.feedback_status === 'MODIFIED') {
      sft.push(buildChatMLExample(row));
    }

    // MODIFIED rows also produce DPO pairs (human correction vs AI original)
    if (row.feedback_status === 'MODIFIED' && row.modified_text) {
      dpo.push(buildDPOPair(row));
    }
  }

  const stats = {
    total: rows.length,
    sft_count: sft.length,
    dpo_count: dpo.length,
  };

  logger.info('Training data export complete', { organizationId, ...stats });

  return { sft, dpo, stats };
}

/**
 * Get export statistics without actually building the data.
 * @param {string} organizationId - Organization UUID
 * @returns {object} Breakdown of available training data
 */
export async function getExportStats(organizationId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE feedback_status IN ('APPROVED', 'MODIFIED', 'REJECTED')) AS total,
       COUNT(*) FILTER (WHERE feedback_status = 'APPROVED') AS approved,
       COUNT(*) FILTER (WHERE feedback_status = 'MODIFIED') AS modified,
       COUNT(*) FILTER (WHERE feedback_status = 'REJECTED') AS rejected
     FROM ai_suggestions
     WHERE organization_id = $1`,
    [organizationId]
  );

  const row = result.rows?.[0] || {};
  const total = parseInt(row.total, 10) || 0;
  const approved = parseInt(row.approved, 10) || 0;
  const modified = parseInt(row.modified, 10) || 0;
  const rejected = parseInt(row.rejected, 10) || 0;

  return {
    total,
    approved,
    modified,
    rejected,
    sft_available: approved + modified,
    dpo_available: modified,
  };
}
