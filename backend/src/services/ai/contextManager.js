/**
 * Context Manager — Tiered Context Loading
 *
 * Implements OpenViking-inspired L0/L1/L2 context tiers for AI generation.
 * Behind CONTEXT_TIERED_ENABLED feature flag (off by default).
 *
 * L0 (Always): demographics, medications, allergies, red flags, contraindications
 * L1 (Session): current encounter SOAP, today's appointments, recent encounters
 * L2 (On-demand): historical encounters, exercises, referral letters
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { CONTEXT_TIERS, getTiersForTask, TOTAL_CONTEXT_BUDGET } from './contextSchema.js';

const TIERED_ENABLED = process.env.CONTEXT_TIERED_ENABLED === 'true';

// Session-scoped cache (L1/L2)
const contextCache = new Map();

/**
 * Estimate token count from text (rough: 1 token ≈ 4 chars for Norwegian)
 */
const estimateTokens = (text) => Math.ceil((text || '').length / 4);

/**
 * Truncate text to fit within a token budget
 */
const truncateToTokens = (text, maxTokens) => {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
};

/**
 * Build cache key for a patient+tier combination
 */
const cacheKey = (patientId, tier) => `${patientId}:${tier}`;

/**
 * Check if cached data is still valid
 */
const isCacheValid = (key, ttl) => {
  const entry = contextCache.get(key);
  if (!entry) return false;
  if (ttl === 0) return false; // L0 always refetched
  return Date.now() - entry.timestamp < ttl;
};

/**
 * Load L0 context — patient safety data (always fresh)
 */
const loadL0 = async (patientId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        p.first_name, p.date_of_birth, p.gender,
        p.medical_history, p.current_medications, p.allergies,
        p.red_flags, p.contraindications
       FROM patients p
       WHERE p.id = $1 AND p.organization_id = $2`,
      [patientId, organizationId]
    );

    if (!result.rows[0]) return '';

    const p = result.rows[0];
    const age = p.date_of_birth
      ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31557600000)
      : null;

    const parts = [];
    parts.push(`Pasient: ${age ? age + ' år' : 'alder ukjent'}, ${p.gender || 'ukjent kjønn'}`);

    if (p.current_medications?.length) {
      parts.push(
        `Medisiner: ${Array.isArray(p.current_medications) ? p.current_medications.join(', ') : p.current_medications}`
      );
    }
    if (p.allergies?.length) {
      parts.push(`Allergier: ${Array.isArray(p.allergies) ? p.allergies.join(', ') : p.allergies}`);
    }
    if (p.red_flags?.length) {
      parts.push(
        `Røde flagg: ${Array.isArray(p.red_flags) ? p.red_flags.join(', ') : p.red_flags}`
      );
    }
    if (p.contraindications?.length) {
      parts.push(
        `Kontraindikasjoner: ${Array.isArray(p.contraindications) ? p.contraindications.join(', ') : p.contraindications}`
      );
    }

    return parts.join('\n');
  } catch (err) {
    logger.warn('L0 context load failed:', err.message);
    return '';
  }
};

/**
 * Load L1 context — current session data (cached with TTL)
 */
const loadL1 = async (patientId, organizationId) => {
  const key = cacheKey(patientId, 'L1');
  if (isCacheValid(key, CONTEXT_TIERS.L1.ttl)) {
    return contextCache.get(key).data;
  }

  try {
    // Recent encounters (last 3)
    const encounters = await query(
      `SELECT subjective, objective, assessment, plan, icpc_codes, created_at
       FROM encounters
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 3`,
      [patientId, organizationId]
    );

    const parts = [];
    if (encounters.rows.length > 0) {
      const latest = encounters.rows[0];
      parts.push('Siste konsultasjon:');
      if (latest.subjective?.chief_complaint) {
        parts.push(`  Hovedplage: ${latest.subjective.chief_complaint}`);
      }
      if (latest.icpc_codes?.length) {
        parts.push(`  Diagnoser: ${latest.icpc_codes.join(', ')}`);
      }
      if (latest.plan?.follow_up) {
        parts.push(`  Plan: ${latest.plan.follow_up}`);
      }
    }

    const data = parts.join('\n');
    contextCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    logger.warn('L1 context load failed:', err.message);
    return '';
  }
};

/**
 * Load L2 context — historical data (cached with longer TTL)
 */
const loadL2 = async (patientId, organizationId) => {
  const key = cacheKey(patientId, 'L2');
  if (isCacheValid(key, CONTEXT_TIERS.L2.ttl)) {
    return contextCache.get(key).data;
  }

  try {
    // Encounter history summary
    const history = await query(
      `SELECT icpc_codes, subjective->>'chief_complaint' as complaint, created_at
       FROM encounters
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [patientId, organizationId]
    );

    const parts = [];
    if (history.rows.length > 0) {
      parts.push(`Behandlingshistorikk (${history.rows.length} konsultasjoner):`);
      for (const enc of history.rows) {
        const date = enc.created_at ? new Date(enc.created_at).toISOString().slice(0, 10) : '?';
        const codes = enc.icpc_codes?.join(', ') || '';
        parts.push(`  ${date}: ${enc.complaint || 'ukjent'} ${codes ? `(${codes})` : ''}`);
      }
    }

    const data = parts.join('\n');
    contextCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    logger.warn('L2 context load failed:', err.message);
    return '';
  }
};

/**
 * Build tiered context for an AI generation call
 *
 * @param {string} taskType - The task type (soap_notes, red_flag_analysis, etc.)
 * @param {Object} options - { patientId, organizationId }
 * @returns {{ contextText: string, tiers: string[], tokenEstimate: number }}
 */
export const buildTieredContext = async (taskType, options = {}) => {
  if (!TIERED_ENABLED) {
    return { contextText: '', tiers: [], tokenEstimate: 0 };
  }

  const { patientId, organizationId } = options;
  if (!patientId || !organizationId) {
    return { contextText: '', tiers: [], tokenEstimate: 0 };
  }

  const requiredTiers = getTiersForTask(taskType);
  const parts = [];
  let totalTokens = 0;

  for (const tierName of requiredTiers) {
    const tier = CONTEXT_TIERS[tierName];
    if (!tier) continue;

    let tierText = '';
    switch (tierName) {
      case 'L0':
        tierText = await loadL0(patientId, organizationId);
        break;
      case 'L1':
        tierText = await loadL1(patientId, organizationId);
        break;
      case 'L2':
        tierText = await loadL2(patientId, organizationId);
        break;
    }

    if (tierText) {
      const truncated = truncateToTokens(tierText, tier.maxTokens);
      const tokens = estimateTokens(truncated);

      if (totalTokens + tokens <= TOTAL_CONTEXT_BUDGET) {
        parts.push(truncated);
        totalTokens += tokens;
      } else {
        logger.debug(
          `Skipping ${tierName} context: would exceed budget (${totalTokens + tokens} > ${TOTAL_CONTEXT_BUDGET})`
        );
      }
    }
  }

  const contextText =
    parts.length > 0
      ? `--- Pasientkontekst ---\n${parts.join('\n\n')}\n--- Slutt kontekst ---`
      : '';

  return { contextText, tiers: requiredTiers, tokenEstimate: totalTokens };
};

/**
 * Clear cached context for a patient (call after data mutations)
 */
export const invalidatePatientContext = (patientId) => {
  for (const tier of ['L0', 'L1', 'L2']) {
    contextCache.delete(cacheKey(patientId, tier));
  }
};

/**
 * Clear all cached context
 */
export const clearContextCache = () => {
  contextCache.clear();
};

export { TIERED_ENABLED };
