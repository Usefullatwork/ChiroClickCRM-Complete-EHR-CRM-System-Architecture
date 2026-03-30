/**
 * Session Memory — Post-Generation Learning Extraction
 *
 * Extracts patterns and insights from AI generation results to improve
 * future context loading. Stores learnings in session-scoped memory
 * that persists across calls within the same session.
 *
 * Behind CONTEXT_TIERED_ENABLED feature flag.
 */

import logger from '../../utils/logger.js';

const TIERED_ENABLED = process.env.CONTEXT_TIERED_ENABLED === 'true';

// Session memory store (keyed by organizationId:patientId)
const sessionStore = new Map();

// Max learnings per patient session
const MAX_LEARNINGS = 20;

/**
 * Build session key
 */
const sessionKey = (organizationId, patientId) => `${organizationId}:${patientId}`;

/**
 * Extract learning points from an AI generation result
 *
 * Looks for patterns like:
 * - Red flags mentioned → remember for future calls
 * - Diagnoses suggested → cache for consistency
 * - Treatment preferences → learn from corrections
 *
 * @param {string} taskType - The task that was performed
 * @param {string} output - The AI output text
 * @param {Object} metadata - Additional context (confidence, model, etc.)
 * @returns {Object[]} Array of learning entries
 */
const extractLearnings = (taskType, output, metadata = {}) => {
  const learnings = [];
  const lower = output.toLowerCase();

  // Extract mentioned red flags
  const redFlagPatterns = [
    { pattern: 'cauda equina', category: 'red_flag', severity: 'critical' },
    { pattern: 'myelopati', category: 'red_flag', severity: 'critical' },
    { pattern: 'vertebrobasilær', category: 'red_flag', severity: 'critical' },
    { pattern: 'fraktur', category: 'red_flag', severity: 'high' },
    { pattern: 'infeksjon', category: 'red_flag', severity: 'high' },
    { pattern: 'malign', category: 'red_flag', severity: 'critical' },
  ];

  for (const { pattern, category, severity } of redFlagPatterns) {
    if (lower.includes(pattern)) {
      learnings.push({
        type: 'observation',
        category,
        value: pattern,
        severity,
        source: taskType,
        timestamp: Date.now(),
      });
    }
  }

  // Extract ICPC codes mentioned
  const codeMatches = output.match(/[A-Z]\d{2}(\.\d)?/g);
  if (codeMatches) {
    const uniqueCodes = [...new Set(codeMatches)];
    learnings.push({
      type: 'diagnosis_codes',
      category: 'clinical',
      value: uniqueCodes,
      source: taskType,
      timestamp: Date.now(),
    });
  }

  // Track confidence trends
  if (metadata.confidence) {
    learnings.push({
      type: 'confidence',
      category: 'quality',
      value: metadata.confidence.score,
      level: metadata.confidence.level,
      source: taskType,
      timestamp: Date.now(),
    });
  }

  return learnings;
};

/**
 * Store learnings from an AI generation into session memory
 */
export const recordLearning = (organizationId, patientId, taskType, output, metadata = {}) => {
  if (!TIERED_ENABLED) {
    return;
  }

  const key = sessionKey(organizationId, patientId);
  if (!sessionStore.has(key)) {
    sessionStore.set(key, { learnings: [], created: Date.now() });
  }

  const session = sessionStore.get(key);
  const newLearnings = extractLearnings(taskType, output, metadata);

  for (const learning of newLearnings) {
    session.learnings.push(learning);
  }

  // Trim to max
  if (session.learnings.length > MAX_LEARNINGS) {
    session.learnings = session.learnings.slice(-MAX_LEARNINGS);
  }

  logger.debug('Session memory updated', {
    patient: patientId,
    newLearnings: newLearnings.length,
    totalLearnings: session.learnings.length,
  });
};

/**
 * Get session learnings formatted as context text
 */
export const getSessionContext = (organizationId, patientId) => {
  if (!TIERED_ENABLED) {
    return '';
  }

  const key = sessionKey(organizationId, patientId);
  const session = sessionStore.get(key);
  if (!session || session.learnings.length === 0) {
    return '';
  }

  const parts = [];

  // Aggregate red flags from session
  const redFlags = session.learnings.filter((l) => l.category === 'red_flag').map((l) => l.value);
  if (redFlags.length > 0) {
    parts.push(`Røde flagg nevnt i denne sesjonen: ${[...new Set(redFlags)].join(', ')}`);
  }

  // Aggregate diagnosis codes
  const codes = session.learnings
    .filter((l) => l.type === 'diagnosis_codes')
    .flatMap((l) => l.value);
  if (codes.length > 0) {
    parts.push(`Diagnosekoder brukt: ${[...new Set(codes)].join(', ')}`);
  }

  return parts.join('\n');
};

/**
 * Clear session memory for a patient
 */
export const clearSessionMemory = (organizationId, patientId) => {
  sessionStore.delete(sessionKey(organizationId, patientId));
};

/**
 * Clear all session memories
 */
export const clearAllSessionMemory = () => {
  sessionStore.clear();
};
