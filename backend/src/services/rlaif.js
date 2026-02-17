/**
 * RLAIF (Reinforcement Learning from AI Feedback) Service
 * Uses heuristic scoring to evaluate and rank AI suggestions for training
 * Standalone desktop mode - no cloud API dependencies
 */

import { query } from '../config/database.js';
import * as _aiLearning from './aiLearning.js';
import logger from '../utils/logger.js';

/**
 * Quality criteria for Norwegian chiropractic documentation
 */
const QUALITY_CRITERIA = {
  clinical_accuracy: {
    weight: 0.25,
    description: 'Korrekt bruk av medisinske termer og anatomi',
  },
  completeness: {
    weight: 0.2,
    description: 'Inneholder alle nødvendige elementer for dokumentasjonstypen',
  },
  conciseness: {
    weight: 0.15,
    description: 'Presis og effektiv formulering uten unødvendig fylltekst',
  },
  norwegian_quality: {
    weight: 0.15,
    description: 'Korrekt norsk språk og medisinsk terminologi',
  },
  professional_tone: {
    weight: 0.1,
    description: 'Profesjonell og nøytral tone passende for journalføring',
  },
  icpc2_compliance: {
    weight: 0.1,
    description: 'Korrekt bruk av ICPC-2 koder der relevant',
  },
  red_flag_awareness: {
    weight: 0.05,
    description: 'Dokumenterer vurdering av røde flagg når relevant',
  },
};

/**
 * Generate preference pairs for training using Claude
 * Creates ranked pairs of suggestions for preference learning
 */
export const generatePreferencePairs = async (suggestions, options = {}) => {
  const {
    _suggestionType = 'clinical_documentation',
    _contextData = {},
    _minPairs = 10,
    _maxPairs = 50,
  } = options;

  logger.info(
    `RLAIF: Generating preference pairs for ${suggestions.length} suggestions (heuristic mode)`
  );
  return generatePreferencePairsOffline(suggestions, options);
};

/**
 * Create pairs of suggestions for comparison
 */
const createSuggestionPairs = (suggestions, maxPairs) => {
  const pairs = [];

  for (let i = 0; i < suggestions.length && pairs.length < maxPairs; i++) {
    for (let j = i + 1; j < suggestions.length && pairs.length < maxPairs; j++) {
      pairs.push([suggestions[i], suggestions[j]]);
    }
  }

  // Shuffle pairs for randomness
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs.slice(0, maxPairs);
};

/**
 * Preference pair generation using heuristics
 */
const generatePreferencePairsOffline = async (suggestions, options) => {
  const { suggestionType = 'clinical_documentation' } = options;
  const preferencePairs = [];

  const pairs = createSuggestionPairs(suggestions, options.maxPairs || 50);

  for (const [a, b] of pairs) {
    const scoreA = calculateHeuristicScore(a, suggestionType);
    const scoreB = calculateHeuristicScore(b, suggestionType);

    if (Math.abs(scoreA - scoreB) > 0.1) {
      // Only include pairs with clear difference
      preferencePairs.push({
        chosen: scoreA > scoreB ? a : b,
        rejected: scoreA > scoreB ? b : a,
        scores: {
          chosen: Math.max(scoreA, scoreB),
          rejected: Math.min(scoreA, scoreB),
        },
        reasoning: 'Heuristic-based ranking (offline mode)',
        suggestionType,
        generatedBy: 'heuristic',
      });
    }
  }

  if (preferencePairs.length > 0) {
    await storePreferencePairs(preferencePairs);
  }

  return {
    success: true,
    pairsGenerated: preferencePairs.length,
    pairs: preferencePairs,
    mode: 'offline',
  };
};

/**
 * Calculate heuristic score for offline ranking
 */
const calculateHeuristicScore = (suggestion, _type) => {
  const text = suggestion.text || suggestion.content || String(suggestion);
  let score = 0.5; // Base score

  // Length scoring (prefer medium-length responses)
  const length = text.length;
  if (length >= 50 && length <= 500) {
    score += 0.1;
  } else if (length > 500 && length <= 1000) {
    score += 0.05;
  }

  // Norwegian language indicators
  const norwegianWords = ['og', 'er', 'en', 'det', 'på', 'som', 'med', 'til', 'av', 'har'];
  const wordCount = norwegianWords.filter((w) => text.toLowerCase().includes(` ${w} `)).length;
  score += Math.min(wordCount * 0.02, 0.1);

  // Clinical terminology presence
  const clinicalTerms = [
    'smerte',
    'symptom',
    'diagnose',
    'behandling',
    'undersøkelse',
    'palpasjon',
    'mobilisering',
    'ROM',
    'VAS',
    'ICPC',
  ];
  const clinicalCount = clinicalTerms.filter((t) => text.toLowerCase().includes(t)).length;
  score += Math.min(clinicalCount * 0.03, 0.15);

  // ICPC-2 code presence
  if (/L\d{2}/.test(text) || /[A-Z]\d{2}/.test(text)) {
    score += 0.1;
  }

  // Professional structure indicators
  if (text.includes(':') || text.includes('-') || text.includes('•')) {
    score += 0.05;
  }

  // Penalize certain issues
  if (text.includes('TODO') || text.includes('FIXME')) {
    score -= 0.2;
  }
  if (/\s{3,}/.test(text)) {
    // Excessive whitespace
    score -= 0.05;
  }

  return Math.max(0, Math.min(1, score));
};

/**
 * Store preference pairs in database
 */
const storePreferencePairs = async (pairs) => {
  try {
    for (const pair of pairs) {
      await query(
        `INSERT INTO rlaif_preference_pairs (
          chosen_text,
          rejected_text,
          chosen_score,
          rejected_score,
          suggestion_type,
          reasoning,
          generated_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          JSON.stringify(pair.chosen),
          JSON.stringify(pair.rejected),
          pair.scores.chosen || pair.scores.a?.total,
          pair.scores.rejected || pair.scores.b?.total,
          pair.suggestionType,
          pair.reasoning,
          pair.generatedBy,
        ]
      );
    }
    logger.info(`RLAIF: Stored ${pairs.length} preference pairs`);
  } catch (error) {
    logger.error('RLAIF: Error storing preference pairs:', error);
    throw error;
  }
};

/**
 * Augment training data with AI-generated examples
 * Creates additional training pairs from AI rankings
 */
export const augmentTrainingData = async (options = {}) => {
  const { baseExamples = [], targetCount = 100, suggestionType = null } = options;

  logger.info('RLAIF: Augmenting training data...');

  try {
    // Get stored preference pairs
    const pairsResult = await query(
      `SELECT * FROM rlaif_preference_pairs
       WHERE used_for_training = false
       ${suggestionType ? 'AND suggestion_type = $1' : ''}
       ORDER BY created_at DESC
       LIMIT $${suggestionType ? 2 : 1}`,
      suggestionType ? [suggestionType, targetCount] : [targetCount]
    );

    const pairs = pairsResult.rows;
    const augmentedExamples = [...baseExamples];

    for (const pair of pairs) {
      // Create training example from preferred response
      const chosen =
        typeof pair.chosen_text === 'string' ? JSON.parse(pair.chosen_text) : pair.chosen_text;

      augmentedExamples.push({
        messages: [
          { role: 'user', content: buildPromptForType(pair.suggestion_type) },
          { role: 'assistant', content: chosen.text || chosen.content || String(chosen) },
        ],
        metadata: {
          type: 'rlaif_augmented',
          score: pair.chosen_score,
          source: pair.generated_by,
        },
      });

      // Mark as used
      await query(`UPDATE rlaif_preference_pairs SET used_for_training = true WHERE id = $1`, [
        pair.id,
      ]);
    }

    logger.info(
      `RLAIF: Augmented with ${pairs.length} examples, total: ${augmentedExamples.length}`
    );

    return {
      success: true,
      originalCount: baseExamples.length,
      augmentedCount: pairs.length,
      totalExamples: augmentedExamples.length,
      examples: augmentedExamples,
    };
  } catch (error) {
    logger.error('RLAIF: Error augmenting training data:', error);
    throw error;
  }
};

/**
 * Build prompt for suggestion type
 */
const buildPromptForType = (type) => {
  const prompts = {
    soap_subjective: 'Skriv subjektiv del av SOPE-notat for en pasient',
    soap_objective: 'Skriv objektiv undersøkelsesfunn',
    soap_assessment: 'Skriv klinisk vurdering basert på funn',
    soap_plan: 'Skriv behandlingsplan',
    sms_reminder: 'Skriv SMS-påminnelse om time',
    sms_followup: 'Skriv oppfølgings-SMS etter behandling',
    clinical_phrase: 'Generer klinisk frase',
    vestibular_documentation: 'Dokumenter vestibulær undersøkelse',
  };
  return prompts[type] || 'Generer klinisk dokumentasjon';
};

/**
 * Evaluate suggestion quality using Claude
 * Returns detailed quality scores
 */
export const evaluateSuggestionQuality = async (suggestion, options = {}) =>
  evaluateSuggestionQualityOffline(suggestion, options);

/**
 * Offline quality evaluation using heuristics
 */
const evaluateSuggestionQualityOffline = async (suggestion, options) => {
  const text = suggestion.text || suggestion.content || String(suggestion);
  const { _suggestionType = 'clinical_documentation' } = options;

  const scores = {};
  let weightedTotal = 0;

  // Clinical accuracy (heuristic)
  const clinicalTermCount = countClinicalTerms(text);
  scores.clinical_accuracy = Math.min(10, clinicalTermCount * 1.5);

  // Completeness (based on length and structure)
  const hasStructure = /[:\-•\n]/.test(text);
  scores.completeness = Math.min(10, text.length / 50 + (hasStructure ? 3 : 0));

  // Conciseness (penalize very long or very short)
  const idealLength = 200;
  const lengthDiff = Math.abs(text.length - idealLength);
  scores.conciseness = Math.max(0, 10 - lengthDiff / 50);

  // Norwegian quality (check for Norwegian words)
  const norwegianScore = countNorwegianIndicators(text);
  scores.norwegian_quality = Math.min(10, norwegianScore * 2);

  // Professional tone (absence of informal language)
  const informalCount = countInformalIndicators(text);
  scores.professional_tone = Math.max(0, 10 - informalCount * 2);

  // ICPC-2 compliance
  const hasIcpc = /[A-Z]\d{2}/.test(text);
  scores.icpc2_compliance = hasIcpc ? 8 : 4;

  // Red flag awareness
  const hasRedFlagMention = /r[øo]d(e)? flagg|alvor|akutt|henvisning/i.test(text);
  scores.red_flag_awareness = hasRedFlagMention ? 8 : 5;

  // Calculate weighted total
  for (const [criterion, score] of Object.entries(scores)) {
    const weight = QUALITY_CRITERIA[criterion]?.weight || 0.1;
    weightedTotal += score * weight;
  }

  // Determine grade
  let grade;
  if (weightedTotal >= 8) {
    grade = 'A';
  } else if (weightedTotal >= 6.5) {
    grade = 'B';
  } else if (weightedTotal >= 5) {
    grade = 'C';
  } else if (weightedTotal >= 3.5) {
    grade = 'D';
  } else {
    grade = 'F';
  }

  const evaluation = {
    scores,
    weighted_total: Math.round(weightedTotal * 10) / 10,
    grade,
    strengths: getStrengths(scores),
    improvements: getImprovements(scores),
    summary: `Heuristisk evaluering: ${grade} (${weightedTotal.toFixed(1)}/10)`,
  };

  await storeEvaluation(suggestion, evaluation, options);

  return {
    success: true,
    evaluation,
    mode: 'offline',
  };
};

/**
 * Count clinical terms in text
 */
const countClinicalTerms = (text) => {
  const terms = [
    'smerte',
    'symptom',
    'diagnose',
    'behandling',
    'undersøkelse',
    'palpasjon',
    'mobilisering',
    'ROM',
    'VAS',
    'ICPC',
    'anamnese',
    'funn',
    'vurdering',
    'plan',
    'oppfølging',
    'henvisning',
    'refleks',
    'sensibilitet',
    'kraft',
    'ømhet',
    'triggerpunkt',
    'subluksasjon',
    'leddmobilisering',
  ];
  return terms.filter((t) => text.toLowerCase().includes(t)).length;
};

/**
 * Count Norwegian language indicators
 */
const countNorwegianIndicators = (text) => {
  const indicators = ['æ', 'ø', 'å', ' og ', ' er ', ' på ', ' det ', ' som ', ' med '];
  return indicators.filter((i) => text.toLowerCase().includes(i)).length;
};

/**
 * Count informal language indicators
 */
const countInformalIndicators = (text) => {
  const informal = ['lol', 'hehe', '!!', '???', 'wow', 'kult', 'fett'];
  return informal.filter((i) => text.toLowerCase().includes(i)).length;
};

/**
 * Get strengths based on scores
 */
const getStrengths = (scores) =>
  Object.entries(scores)
    .filter(([_, score]) => score >= 7)
    .map(([criterion, _]) => QUALITY_CRITERIA[criterion]?.description || criterion)
    .slice(0, 3);

/**
 * Get improvements based on scores
 */
const getImprovements = (scores) =>
  Object.entries(scores)
    .filter(([_, score]) => score < 5)
    .map(([criterion, _]) => `Forbedre: ${QUALITY_CRITERIA[criterion]?.description || criterion}`)
    .slice(0, 3);

/**
 * Store evaluation in database
 */
const storeEvaluation = async (suggestion, evaluation, options) => {
  try {
    await query(
      `INSERT INTO rlaif_evaluations (
        suggestion_text,
        suggestion_type,
        scores,
        weighted_total,
        grade,
        evaluation_details,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        JSON.stringify(suggestion),
        options.suggestionType || 'clinical_documentation',
        JSON.stringify(evaluation.scores),
        evaluation.weighted_total,
        evaluation.grade,
        JSON.stringify(evaluation),
      ]
    );
  } catch (error) {
    logger.warn('RLAIF: Failed to store evaluation:', error.message);
  }
};

/**
 * Get RLAIF statistics
 */
export const getRLAIFStats = async () => {
  try {
    const [pairsResult, evalsResult] = await Promise.all([
      query(`SELECT
        COUNT(*) as total_pairs,
        COUNT(*) FILTER (WHERE used_for_training = true) as used_pairs,
        AVG(chosen_score) as avg_chosen_score,
        AVG(rejected_score) as avg_rejected_score
      FROM rlaif_preference_pairs`),
      query(`SELECT
        COUNT(*) as total_evaluations,
        AVG(weighted_total) as avg_score,
        COUNT(*) FILTER (WHERE grade = 'A') as grade_a,
        COUNT(*) FILTER (WHERE grade = 'B') as grade_b,
        COUNT(*) FILTER (WHERE grade = 'C') as grade_c,
        COUNT(*) FILTER (WHERE grade IN ('D', 'F')) as grade_low
      FROM rlaif_evaluations`),
    ]);

    return {
      preferencePairs: pairsResult.rows[0],
      evaluations: evalsResult.rows[0],
      mode: 'local',
    };
  } catch (error) {
    logger.error('RLAIF: Error getting stats:', error);
    throw error;
  }
};

/**
 * Helper: delay function for rate limiting
 */
const _delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  generatePreferencePairs,
  augmentTrainingData,
  evaluateSuggestionQuality,
  getRLAIFStats,
  QUALITY_CRITERIA,
};
