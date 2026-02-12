/**
 * Outcome Measure Scoring Algorithms
 * Implements validated clinical scoring for ODI, NDI, VAS, DASH, NPRS
 */

/**
 * Score ODI (Oswestry Disability Index) - Low Back Pain
 * 10 sections, each scored 0-5
 * @param {number[]} answers - Array of 10 scores (0-5 each), null for unanswered
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreODI(answers) {
  if (!Array.isArray(answers)) {
    throw new Error('ODI answers must be an array');
  }

  const validAnswers = answers.filter((a) => a !== null && a !== undefined);
  if (validAnswers.length === 0) {
    throw new Error('At least one ODI section must be answered');
  }

  for (const a of validAnswers) {
    if (a < 0 || a > 5 || !Number.isInteger(a)) {
      throw new Error('Each ODI answer must be an integer 0-5');
    }
  }

  const score = validAnswers.reduce((sum, v) => sum + v, 0);
  const maxScore = validAnswers.length * 5;
  const percentage = Math.round((score / maxScore) * 10000) / 100;

  let severity;
  if (percentage <= 20) severity = 'Minimal disability';
  else if (percentage <= 40) severity = 'Moderate disability';
  else if (percentage <= 60) severity = 'Severe disability';
  else if (percentage <= 80) severity = 'Crippled';
  else severity = 'Bed-bound';

  return { score, maxScore, percentage, severity };
}

/**
 * Score NDI (Neck Disability Index)
 * 10 sections, each scored 0-5
 * @param {number[]} answers - Array of 10 scores (0-5 each), null for unanswered
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreNDI(answers) {
  if (!Array.isArray(answers)) {
    throw new Error('NDI answers must be an array');
  }

  const validAnswers = answers.filter((a) => a !== null && a !== undefined);
  if (validAnswers.length === 0) {
    throw new Error('At least one NDI section must be answered');
  }

  for (const a of validAnswers) {
    if (a < 0 || a > 5 || !Number.isInteger(a)) {
      throw new Error('Each NDI answer must be an integer 0-5');
    }
  }

  const score = validAnswers.reduce((sum, v) => sum + v, 0);
  const maxScore = validAnswers.length * 5;
  const percentage = Math.round((score / maxScore) * 10000) / 100;

  let severity;
  if (score <= 4) severity = 'No disability';
  else if (score <= 14) severity = 'Mild disability';
  else if (score <= 24) severity = 'Moderate disability';
  else if (score <= 34) severity = 'Severe disability';
  else severity = 'Complete disability';

  return { score, maxScore, percentage, severity };
}

/**
 * Score VAS (Visual Analog Scale)
 * Single value 0-100 mm
 * @param {number} value - VAS value (0-100)
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreVAS(value) {
  if (typeof value !== 'number' || value < 0 || value > 100) {
    throw new Error('VAS value must be a number 0-100');
  }

  const score = Math.round(value * 100) / 100;
  const maxScore = 100;
  const percentage = score;

  let severity;
  if (score === 0) severity = 'No pain';
  else if (score <= 30) severity = 'Mild pain';
  else if (score <= 60) severity = 'Moderate pain';
  else severity = 'Severe pain';

  return { score, maxScore, percentage, severity };
}

/**
 * Score DASH (Disabilities of Arm, Shoulder and Hand)
 * 30 items, each scored 1-5
 * Minimum 27 answered items required
 * Score = ((sum/n) - 1) * 25
 * @param {number[]} answers - Array of 30 scores (1-5 each), null for unanswered
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreDASH(answers) {
  if (!Array.isArray(answers)) {
    throw new Error('DASH answers must be an array');
  }

  const validAnswers = answers.filter((a) => a !== null && a !== undefined);
  if (validAnswers.length < 27) {
    throw new Error('DASH requires at least 27 of 30 items answered');
  }

  for (const a of validAnswers) {
    if (a < 1 || a > 5 || !Number.isInteger(a)) {
      throw new Error('Each DASH answer must be an integer 1-5');
    }
  }

  const sum = validAnswers.reduce((s, v) => s + v, 0);
  const n = validAnswers.length;
  const score = Math.round((sum / n - 1) * 25 * 100) / 100;
  const maxScore = 100;
  const percentage = score;

  let severity;
  if (score <= 15) severity = 'No difficulty';
  else if (score <= 40) severity = 'Mild difficulty';
  else if (score <= 60) severity = 'Moderate difficulty';
  else severity = 'Severe difficulty';

  return { score, maxScore, percentage, severity };
}

/**
 * Score NPRS (Numeric Pain Rating Scale)
 * Single value 0-10
 * @param {number} value - NPRS value (0-10)
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreNPRS(value) {
  if (typeof value !== 'number' || value < 0 || value > 10 || !Number.isInteger(value)) {
    throw new Error('NPRS value must be an integer 0-10');
  }

  const score = value;
  const maxScore = 10;
  const percentage = (score / maxScore) * 100;

  let severity;
  if (score === 0) severity = 'No pain';
  else if (score <= 3) severity = 'Mild pain';
  else if (score <= 6) severity = 'Moderate pain';
  else severity = 'Severe pain';

  return { score, maxScore, percentage, severity };
}

/**
 * Get the scorer function for a questionnaire type
 * @param {string} type - Questionnaire type (ODI, NDI, VAS, DASH, NPRS)
 * @returns {Function} Scoring function
 */
export function getScorer(type) {
  const scorers = {
    ODI: scoreODI,
    NDI: scoreNDI,
    VAS: scoreVAS,
    DASH: scoreDASH,
    NPRS: scoreNPRS,
  };

  const scorer = scorers[type];
  if (!scorer) {
    throw new Error(`Unknown questionnaire type: ${type}`);
  }
  return scorer;
}

/**
 * Score any questionnaire by type and raw answers
 * @param {string} type - Questionnaire type
 * @param {*} rawAnswers - Answers (array or single value depending on type)
 * @returns {{ score: number, maxScore: number, percentage: number, severity: string }}
 */
export function scoreQuestionnaire(type, rawAnswers) {
  const scorer = getScorer(type);

  if (type === 'VAS' || type === 'NPRS') {
    const value =
      typeof rawAnswers === 'object' && rawAnswers !== null
        ? (rawAnswers.value ?? rawAnswers.score)
        : rawAnswers;
    return scorer(Number(value));
  }

  return scorer(rawAnswers);
}
