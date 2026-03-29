/**
 * Data Curation
 * Exports AI feedback to JSONL training format and builds prompts.
 *
 * @module application/services/dataCuration
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import fs from 'fs/promises';
import path from 'path';

const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';

/**
 * Hash training data for versioning (simple DJB2-style hash).
 *
 * @param {string} data
 * @returns {string} Hex hash string
 */
export const hashTrainingData = (data) => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Build a Norwegian-language prompt string from feedback context.
 *
 * @param {string} suggestionType - Type of AI suggestion
 * @param {Object} contextData - Context data from the suggestion
 * @returns {string} Norwegian prompt string
 */
export const buildPromptFromContext = (suggestionType, contextData) => {
  const context = contextData || {};
  switch (suggestionType) {
    case 'soap_subjective':
      return `Skriv subjektiv del av SOPE-notat basert pa: ${context.chiefComplaint || 'ikke spesifisert'}`;
    case 'soap_objective':
      return `Skriv objektiv del av SOPE-notat. Funn: ${context.findings || 'ikke spesifisert'}`;
    case 'soap_assessment':
      return `Skriv vurdering basert pa undersoekelsesfunn. Symptomer: ${context.symptoms || 'ikke spesifisert'}`;
    case 'soap_plan':
      return `Skriv behandlingsplan. Diagnose: ${context.diagnosis || 'ikke spesifisert'}`;
    case 'sms_reminder':
      return `Skriv SMS-paminnelse om time. Tone: ${context.tone || 'vennlig'}`;
    case 'sms_followup':
      return `Skriv oppfoelgings-SMS etter behandling. Tone: ${context.tone || 'empatisk'}`;
    case 'clinical_phrase':
      return `Generer klinisk frase for: ${context.phraseType || 'generell dokumentasjon'}`;
    case 'vestibular_documentation':
      return `Dokumenter vestibulaer undersokelse. Tester: ${context.tests || 'standard VNG'}`;
    default:
      return `Generer ${suggestionType}: ${JSON.stringify(context)}`;
  }
};

/**
 * Export feedback data to JSONL training format.
 * Used by the admin export-feedback endpoint.
 *
 * @param {Object} options
 * @param {number} options.minRating - Minimum user rating to include
 * @param {number} options.days - Lookback window in days
 * @param {boolean} options.includeRejected - Include rejected suggestions
 * @returns {Promise<Object>} Export result with path, counts, breakdown
 */
export const exportFeedbackToTrainingFormat = async (options = {}) => {
  const { minRating = 3, days = 90, includeRejected = true } = options;

  await fs.mkdir(TRAINING_DIR, { recursive: true });
  logger.info('Exporting feedback to training format...');

  const feedbackResult = await query(
    `SELECT
      af.id, af.suggestion_type, af.original_suggestion, af.user_correction,
      af.accepted, af.correction_type, af.user_rating, af.context_data,
      af.confidence_score
     FROM ai_feedback af
     WHERE af.created_at > NOW() - make_interval(days => $2)
       AND af.processed_for_training = false
       AND (
         (af.accepted = true AND af.user_rating >= $1)
         OR (af.correction_type IN ('minor', 'major') AND af.user_correction IS NOT NULL)
         ${includeRejected ? 'OR (af.accepted = false AND af.user_rating IS NOT NULL)' : ''}
       )
     ORDER BY af.user_rating DESC NULLS LAST, af.created_at DESC`,
    [minRating, days]
  );

  const trainingExamples = [];
  const processedIds = [];

  for (const feedback of feedbackResult.rows) {
    processedIds.push(feedback.id);

    if (feedback.accepted && !feedback.user_correction) {
      trainingExamples.push({
        messages: [
          {
            role: 'user',
            content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
          },
          { role: 'assistant', content: feedback.original_suggestion },
        ],
        metadata: {
          type: 'accepted',
          rating: feedback.user_rating,
          suggestionType: feedback.suggestion_type,
        },
      });
    } else if (feedback.user_correction) {
      trainingExamples.push({
        messages: [
          {
            role: 'user',
            content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
          },
          { role: 'assistant', content: feedback.user_correction },
        ],
        metadata: {
          type: 'corrected',
          correctionType: feedback.correction_type,
          rating: feedback.user_rating,
          suggestionType: feedback.suggestion_type,
        },
      });
    } else if (!feedback.accepted && includeRejected) {
      trainingExamples.push({
        messages: [
          {
            role: 'user',
            content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
          },
          { role: 'assistant', content: feedback.original_suggestion },
        ],
        metadata: {
          type: 'rejected',
          rating: feedback.user_rating,
          suggestionType: feedback.suggestion_type,
          isNegativeExample: true,
        },
      });
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const feedbackDir = path.join(TRAINING_DIR, 'feedback');
  await fs.mkdir(feedbackDir, { recursive: true });
  const outputPath = path.join(feedbackDir, `feedback_${timestamp}.jsonl`);
  const jsonlContent = trainingExamples.map((ex) => JSON.stringify(ex)).join('\n');
  await fs.writeFile(outputPath, jsonlContent, 'utf-8');

  logger.info(`Exported ${trainingExamples.length} training examples to ${outputPath}`);

  return {
    outputPath,
    examplesCount: trainingExamples.length,
    processedFeedbackIds: processedIds,
    breakdown: {
      accepted: trainingExamples.filter((e) => e.metadata.type === 'accepted').length,
      corrected: trainingExamples.filter((e) => e.metadata.type === 'corrected').length,
      rejected: trainingExamples.filter((e) => e.metadata.type === 'rejected').length,
    },
  };
};
