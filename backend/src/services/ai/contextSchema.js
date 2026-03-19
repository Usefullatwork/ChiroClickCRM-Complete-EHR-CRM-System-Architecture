/**
 * Context Schema — Tier Definitions and Token Budgets
 *
 * Implements OpenViking-inspired tiered context management:
 * - L0 (Always): Patient safety data — loaded for every AI call
 * - L1 (Session): Current encounter context — cached per session
 * - L2 (On-demand): Historical data — loaded only for summary/letter tasks
 */

/** Context tiers with token budgets */
export const CONTEXT_TIERS = {
  L0: {
    name: 'critical',
    description: 'Patient safety data (always loaded)',
    maxTokens: 500,
    ttl: 0, // Always fresh
    fields: ['demographics', 'medications', 'allergies', 'red_flags', 'contraindications'],
  },
  L1: {
    name: 'session',
    description: 'Current encounter context (cached per session)',
    maxTokens: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    fields: ['current_encounter', 'todays_appointments', 'recent_encounters'],
  },
  L2: {
    name: 'historical',
    description: 'Historical data (on-demand for summaries/letters)',
    maxTokens: 1500,
    ttl: 15 * 60 * 1000, // 15 minutes
    fields: ['encounter_history', 'exercise_prescriptions', 'referral_letters', 'outcome_data'],
  },
};

/** Task types that need each tier level */
export const TASK_TIER_MAP = {
  // L0 only (quick tasks)
  spell_check: ['L0'],
  autocomplete: ['L0'],
  abbreviation: ['L0'],
  quick_suggestion: ['L0'],

  // L0 + L1 (clinical documentation)
  soap_notes: ['L0', 'L1'],
  diagnosis_suggestion: ['L0', 'L1'],
  red_flag_analysis: ['L0', 'L1'],
  treatment_safety: ['L0', 'L1'],
  contraindication_check: ['L0', 'L1'],
  patient_communication: ['L0', 'L1'],
  patient_education: ['L0', 'L1'],

  // L0 + L1 + L2 (comprehensive tasks)
  clinical_summary: ['L0', 'L1', 'L2'],
  referral_letter: ['L0', 'L1', 'L2'],
  report_writing: ['L0', 'L1', 'L2'],
  journal_organization: ['L0', 'L1', 'L2'],
  differential_diagnosis: ['L0', 'L1', 'L2'],
  clinical_reasoning: ['L0', 'L1', 'L2'],
};

/** Total token budget across all tiers */
export const TOTAL_CONTEXT_BUDGET = 3000;

/**
 * Get required tiers for a task type
 * @param {string} taskType
 * @returns {string[]} Array of tier IDs ['L0', 'L1', 'L2']
 */
export const getTiersForTask = (taskType) => {
  return TASK_TIER_MAP[taskType] || ['L0'];
};
