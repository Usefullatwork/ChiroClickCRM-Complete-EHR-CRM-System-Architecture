/**
 * Care Episodes Service
 * Tracks patient care episodes for Active vs Maintenance billing determination
 *
 * Key concepts:
 * - ACTIVE: Patient showing measurable improvement, billable to insurance
 * - MAINTENANCE: Patient at MMI (Maximum Medical Improvement), may need ABN
 * - Modifier determines: AT (active), GA (ABN on file), GZ (no ABN, expect denial)
 */

import { query, _transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// Episode statuses and their meanings
export const EPISODE_STATUS = {
  ACTIVE: 'ACTIVE', // Patient showing improvement, billable
  MAINTENANCE: 'MAINTENANCE', // At MMI, needs ABN for coverage
  DISCHARGED: 'DISCHARGED', // Care complete, goals met
  INACTIVE: 'INACTIVE', // Episode paused/discontinued
};

// Body regions for chiropractic care
export const BODY_REGIONS = {
  CERVICAL: 'CERVICAL',
  THORACIC: 'THORACIC',
  LUMBAR: 'LUMBAR',
  SACRAL: 'SACRAL',
  EXTREMITY: 'EXTREMITY',
};

/**
 * Create a new care episode for a patient
 */
export const createEpisode = async (organizationId, episodeData) => {
  const {
    patient_id,
    chief_complaint,
    body_region = null,
    primary_diagnosis_icpc = null,
    primary_diagnosis_icd10 = null,
    secondary_diagnoses = [],
    initial_visit_frequency = null,
    estimated_duration_weeks = null,
    total_visits_planned = null,
    baseline_pain_level = null,
    baseline_function_score = null,
    clinical_notes = null,
  } = episodeData;

  // Calculate next re-eval date (typically 30 days or 12 visits)
  const nextReevalDue = new Date();
  nextReevalDue.setDate(nextReevalDue.getDate() + 30);

  const result = await query(
    `INSERT INTO care_episodes (
      organization_id,
      patient_id,
      chief_complaint,
      body_region,
      status,
      primary_diagnosis_icpc,
      primary_diagnosis_icd10,
      secondary_diagnoses,
      initial_visit_frequency,
      estimated_duration_weeks,
      total_visits_planned,
      baseline_pain_level,
      current_pain_level,
      baseline_function_score,
      current_function_score,
      last_reeval_date,
      next_reeval_due,
      clinical_notes
    ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8, $9, $10, $11, $11, $12, $12, CURRENT_DATE, $13, $14)
    RETURNING *`,
    [
      organizationId,
      patient_id,
      chief_complaint,
      body_region,
      primary_diagnosis_icpc,
      primary_diagnosis_icd10,
      secondary_diagnoses,
      initial_visit_frequency,
      estimated_duration_weeks,
      total_visits_planned,
      baseline_pain_level,
      baseline_function_score,
      nextReevalDue,
      clinical_notes,
    ]
  );

  logger.info(`Care episode created: ${result.rows[0].id} for patient: ${patient_id}`);
  return result.rows[0];
};

/**
 * Get active episode for a patient
 */
export const getActiveEpisode = async (organizationId, patientId) => {
  const result = await query(
    `SELECT e.*, p.first_name || ' ' || p.last_name as patient_name
     FROM care_episodes e
     JOIN patients p ON p.id = e.patient_id
     WHERE e.organization_id = $1
       AND e.patient_id = $2
       AND e.status IN ('ACTIVE', 'MAINTENANCE')
     ORDER BY e.start_date DESC
     LIMIT 1`,
    [organizationId, patientId]
  );

  return result.rows[0] || null;
};

/**
 * Get episode by ID
 */
export const getEpisodeById = async (organizationId, episodeId) => {
  const result = await query(
    `SELECT e.*,
            p.first_name || ' ' || p.last_name as patient_name,
            u.first_name || ' ' || u.last_name as mmi_determined_by_name
     FROM care_episodes e
     JOIN patients p ON p.id = e.patient_id
     LEFT JOIN users u ON u.id = e.mmi_determined_by
     WHERE e.organization_id = $1 AND e.id = $2`,
    [organizationId, episodeId]
  );

  return result.rows[0] || null;
};

/**
 * Get all episodes for a patient
 */
export const getPatientEpisodes = async (organizationId, patientId) => {
  const result = await query(
    `SELECT e.*,
            COUNT(ce.id) as visit_count
     FROM care_episodes e
     LEFT JOIN clinical_encounters ce ON ce.episode_id = e.id
     WHERE e.organization_id = $1 AND e.patient_id = $2
     GROUP BY e.id
     ORDER BY e.start_date DESC`,
    [organizationId, patientId]
  );

  return result.rows;
};

/**
 * Update episode progress (after each visit)
 */
export const updateEpisodeProgress = async (organizationId, episodeId, progressData) => {
  const {
    current_pain_level = null,
    current_function_score = null,
    clinical_notes = null,
  } = progressData;

  const updates = ['visits_since_last_reeval = visits_since_last_reeval + 1'];
  const params = [episodeId, organizationId];
  let paramIndex = 3;

  if (current_pain_level !== null) {
    updates.push(`current_pain_level = $${paramIndex}`);
    params.push(current_pain_level);
    paramIndex++;
  }

  if (current_function_score !== null) {
    updates.push(`current_function_score = $${paramIndex}`);
    params.push(current_function_score);
    paramIndex++;
  }

  if (clinical_notes !== null) {
    updates.push(`clinical_notes = COALESCE(clinical_notes, '') || E'\\n' || $${paramIndex}`);
    params.push(`[${new Date().toISOString().split('T')[0]}] ${clinical_notes}`);
    paramIndex++;
  }

  const result = await query(
    `UPDATE care_episodes
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Episode not found');
  }

  return result.rows[0];
};

/**
 * Perform re-evaluation (updates next re-eval date and resets visit count)
 */
export const performReEvaluation = async (organizationId, episodeId, reevalData) => {
  const {
    current_pain_level,
    current_function_score,
    clinical_notes,
    next_reeval_weeks = 4, // Default 4 weeks
  } = reevalData;

  const nextReevalDue = new Date();
  nextReevalDue.setDate(nextReevalDue.getDate() + next_reeval_weeks * 7);

  const result = await query(
    `UPDATE care_episodes
     SET current_pain_level = $3,
         current_function_score = $4,
         last_reeval_date = CURRENT_DATE,
         next_reeval_due = $5,
         visits_since_last_reeval = 0,
         clinical_notes = COALESCE(clinical_notes, '') || E'\\n' || $6,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      episodeId,
      organizationId,
      current_pain_level,
      current_function_score,
      nextReevalDue,
      `[RE-EVAL ${new Date().toISOString().split('T')[0]}] ${clinical_notes}`,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Episode not found');
  }

  logger.info(`Re-evaluation performed for episode: ${episodeId}`);
  return result.rows[0];
};

/**
 * Transition episode to maintenance status
 * This is a critical billing decision - marks patient as at MMI
 */
export const transitionToMaintenance = async (organizationId, episodeId, transitionData) => {
  const {
    mmi_determined_by,
    abn_on_file = false,
    abn_signed_date = null,
    abn_document_id = null,
    clinical_notes = null,
  } = transitionData;

  const result = await query(
    `UPDATE care_episodes
     SET status = 'MAINTENANCE',
         mmi_date = CURRENT_DATE,
         mmi_determined_by = $3,
         abn_on_file = $4,
         abn_signed_date = $5,
         abn_document_id = $6,
         clinical_notes = COALESCE(clinical_notes, '') || E'\\n' || $7,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      episodeId,
      organizationId,
      mmi_determined_by,
      abn_on_file,
      abn_signed_date,
      abn_document_id,
      `[MAINTENANCE ${new Date().toISOString().split('T')[0]}] Patient at MMI. ${clinical_notes || ''}`,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Episode not found');
  }

  logger.info(`Episode transitioned to maintenance: ${episodeId}`);
  return result.rows[0];
};

/**
 * Record ABN signature for maintenance care
 */
export const recordABN = async (organizationId, episodeId, abnData) => {
  const { abn_signed_date, abn_document_id = null } = abnData;

  const result = await query(
    `UPDATE care_episodes
     SET abn_on_file = true,
         abn_signed_date = $3,
         abn_document_id = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [episodeId, organizationId, abn_signed_date, abn_document_id]
  );

  if (result.rows.length === 0) {
    throw new Error('Episode not found');
  }

  logger.info(`ABN recorded for episode: ${episodeId}`);
  return result.rows[0];
};

/**
 * Discharge episode (care complete)
 */
export const dischargeEpisode = async (organizationId, episodeId, dischargeData) => {
  const { discharge_notes = null } = dischargeData;

  const result = await query(
    `UPDATE care_episodes
     SET status = 'DISCHARGED',
         end_date = CURRENT_DATE,
         discharge_notes = $3,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [episodeId, organizationId, discharge_notes]
  );

  if (result.rows.length === 0) {
    throw new Error('Episode not found');
  }

  logger.info(`Episode discharged: ${episodeId}`);
  return result.rows[0];
};

/**
 * Get episodes needing re-evaluation
 */
export const getEpisodesNeedingReeval = async (organizationId) => {
  const result = await query(
    `SELECT * FROM episodes_needing_reeval
     WHERE organization_id = $1`,
    [organizationId]
  );

  return result.rows;
};

/**
 * Get billing modifier for an episode (calls DB function)
 */
export const getBillingModifier = async (episodeId, patientId) => {
  const result = await query(`SELECT determine_billing_modifier($1, $2) as modifier`, [
    episodeId,
    patientId,
  ]);

  return result.rows[0].modifier;
};

/**
 * Calculate improvement percentage
 */
export const calculateImprovement = (episode) => {
  if (!episode) {
    return null;
  }

  const {
    baseline_pain_level,
    current_pain_level,
    baseline_function_score,
    current_function_score,
  } = episode;

  // Calculate pain improvement
  if (baseline_pain_level && current_pain_level !== null) {
    const painImprovement =
      ((baseline_pain_level - current_pain_level) / baseline_pain_level) * 100;
    return {
      type: 'pain',
      baseline: baseline_pain_level,
      current: current_pain_level,
      improvement: Math.round(painImprovement * 10) / 10,
    };
  }

  // Calculate function improvement (ODI/NDI)
  if (baseline_function_score && current_function_score !== null) {
    const functionImprovement =
      ((baseline_function_score - current_function_score) / baseline_function_score) * 100;
    return {
      type: 'function',
      baseline: baseline_function_score,
      current: current_function_score,
      improvement: Math.round(functionImprovement * 10) / 10,
    };
  }

  return null;
};

/**
 * Get episode summary with billing info
 */
export const getEpisodeSummary = async (organizationId, episodeId) => {
  const episode = await getEpisodeById(organizationId, episodeId);
  if (!episode) {
    return null;
  }

  const modifier = await getBillingModifier(episodeId, episode.patient_id);
  const improvement = calculateImprovement(episode);

  // Get visit count and claim summary
  const statsResult = await query(
    `SELECT
       (SELECT COUNT(*) FROM clinical_encounters WHERE episode_id = $1) as total_visits,
       (SELECT COUNT(*) FROM claims WHERE episode_id = $1) as total_claims,
       (SELECT SUM(total_charge) FROM claims WHERE episode_id = $1) as total_charges,
       (SELECT SUM(total_paid) FROM claims WHERE episode_id = $1) as total_paid`,
    [episodeId]
  );

  return {
    ...episode,
    billing_modifier: modifier,
    improvement,
    stats: statsResult.rows[0],
  };
};

export default {
  EPISODE_STATUS,
  BODY_REGIONS,
  createEpisode,
  getActiveEpisode,
  getEpisodeById,
  getPatientEpisodes,
  updateEpisodeProgress,
  performReEvaluation,
  transitionToMaintenance,
  recordABN,
  dischargeEpisode,
  getEpisodesNeedingReeval,
  getBillingModifier,
  calculateImprovement,
  getEpisodeSummary,
};
