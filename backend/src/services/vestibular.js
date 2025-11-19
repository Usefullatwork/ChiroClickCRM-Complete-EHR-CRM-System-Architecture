/**
 * Vestibular Assessments Service
 * Business logic for vestibular/dizziness assessments, BPPV testing, VNG, and treatment tracking
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Create a new vestibular assessment
 */
export const createAssessment = async (assessmentData) => {
  const {
    encounter_id,
    patient_id,
    organization_id,
    assessed_by,
    // Anamnese
    dizziness_type,
    dizziness_description,
    onset_date,
    onset_description,
    onset_trigger,
    duration_description,
    triggers,
    trigger_details,
    associated_symptoms,
    headache_type,
    neck_symptoms,
    ear_symptoms,
    autonomic_symptoms,
    neurological_symptoms,
    // Undersøkelse
    ortho_tests,
    dtr_reflexes,
    dermatomes,
    myotomes,
    babinski,
    pupil_reflex,
    cranial_nerves,
    fukuda_test,
    rhomberg_test,
    tandem_rhomberg,
    parietal_arm_test,
    coordination,
    saccades,
    smooth_pursuits,
    convergence,
    gaze_nystagmus,
    hit_test,
    // BPPV Testing
    dix_hallpike_right,
    dix_hallpike_left,
    supine_roll_right,
    supine_roll_left,
    deep_head_hang,
    lean_test,
    // VNG
    vng_performed,
    vng_results,
    // Diagnoser
    primary_diagnosis,
    bppv_details,
    other_diagnoses,
    // Behandling
    maneuvers_performed,
    manual_treatment,
    vrt_exercises,
    home_exercises,
    // Outcome
    dhi_score,
    dhi_data,
    follow_up_plan,
    referral_needed,
    referral_to,
    notes
  } = assessmentData;

  try {
    const result = await query(
      `INSERT INTO vestibular_assessments (
        encounter_id, patient_id, organization_id, assessed_by,
        dizziness_type, dizziness_description, onset_date, onset_description, onset_trigger, duration_description,
        triggers, trigger_details, associated_symptoms, headache_type, neck_symptoms, ear_symptoms,
        autonomic_symptoms, neurological_symptoms,
        ortho_tests, dtr_reflexes, dermatomes, myotomes, babinski, pupil_reflex, cranial_nerves,
        fukuda_test, rhomberg_test, tandem_rhomberg, parietal_arm_test, coordination,
        saccades, smooth_pursuits, convergence, gaze_nystagmus, hit_test,
        dix_hallpike_right, dix_hallpike_left, supine_roll_right, supine_roll_left, deep_head_hang, lean_test,
        vng_performed, vng_results,
        primary_diagnosis, bppv_details, other_diagnoses,
        maneuvers_performed, manual_treatment, vrt_exercises, home_exercises,
        dhi_score, dhi_data, follow_up_plan, referral_needed, referral_to, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35,
        $36, $37, $38, $39, $40, $41,
        $42, $43,
        $44, $45, $46,
        $47, $48, $49, $50,
        $51, $52, $53, $54, $55, $56
      ) RETURNING *`,
      [
        encounter_id, patient_id, organization_id, assessed_by,
        dizziness_type, dizziness_description, onset_date, onset_description, onset_trigger, duration_description,
        JSON.stringify(triggers || {}), trigger_details, JSON.stringify(associated_symptoms || {}), headache_type, neck_symptoms, JSON.stringify(ear_symptoms || {}),
        autonomic_symptoms, neurological_symptoms,
        JSON.stringify(ortho_tests || {}), JSON.stringify(dtr_reflexes || {}), dermatomes, myotomes, babinski, pupil_reflex, cranial_nerves,
        JSON.stringify(fukuda_test || {}), JSON.stringify(rhomberg_test || {}), tandem_rhomberg, parietal_arm_test, JSON.stringify(coordination || {}),
        JSON.stringify(saccades || {}), JSON.stringify(smooth_pursuits || {}), JSON.stringify(convergence || {}), gaze_nystagmus, JSON.stringify(hit_test || {}),
        JSON.stringify(dix_hallpike_right || {}), JSON.stringify(dix_hallpike_left || {}), JSON.stringify(supine_roll_right || {}), JSON.stringify(supine_roll_left || {}), JSON.stringify(deep_head_hang || {}), JSON.stringify(lean_test || {}),
        vng_performed || false, JSON.stringify(vng_results || {}),
        primary_diagnosis, JSON.stringify(bppv_details || {}), other_diagnoses,
        JSON.stringify(maneuvers_performed || []), JSON.stringify(manual_treatment || []), JSON.stringify(vrt_exercises || []), home_exercises,
        dhi_score, JSON.stringify(dhi_data || {}), follow_up_plan, referral_needed || false, referral_to, notes
      ]
    );

    logger.info(`Vestibular assessment created: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating vestibular assessment:', error);
    throw error;
  }
};

/**
 * Get assessment by ID
 */
export const getAssessmentById = async (assessmentId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        va.*,
        p.first_name || ' ' || p.last_name as patient_name,
        u.first_name || ' ' || u.last_name as assessed_by_name
      FROM vestibular_assessments va
      LEFT JOIN patients p ON p.id = va.patient_id
      LEFT JOIN users u ON u.id = va.assessed_by
      WHERE va.id = $1 AND va.organization_id = $2`,
      [assessmentId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching vestibular assessment:', error);
    throw error;
  }
};

/**
 * Get assessments by patient ID
 */
export const getAssessmentsByPatient = async (patientId, organizationId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM vestibular_assessments
       WHERE patient_id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT
        va.*,
        u.first_name || ' ' || u.last_name as assessed_by_name
      FROM vestibular_assessments va
      LEFT JOIN users u ON u.id = va.assessed_by
      WHERE va.patient_id = $1 AND va.organization_id = $2
      ORDER BY va.assessment_date DESC
      LIMIT $3 OFFSET $4`,
      [patientId, organizationId, limit, offset]
    );

    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching patient vestibular assessments:', error);
    throw error;
  }
};

/**
 * Get assessment by encounter ID
 */
export const getAssessmentByEncounter = async (encounterId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        va.*,
        p.first_name || ' ' || p.last_name as patient_name,
        u.first_name || ' ' || u.last_name as assessed_by_name
      FROM vestibular_assessments va
      LEFT JOIN patients p ON p.id = va.patient_id
      LEFT JOIN users u ON u.id = va.assessed_by
      WHERE va.encounter_id = $1 AND va.organization_id = $2`,
      [encounterId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching encounter vestibular assessment:', error);
    throw error;
  }
};

/**
 * Update assessment
 */
export const updateAssessment = async (assessmentId, organizationId, updates) => {
  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Handle JSONB fields
    const jsonbFields = [
      'triggers', 'associated_symptoms', 'ear_symptoms', 'ortho_tests', 'dtr_reflexes',
      'fukuda_test', 'rhomberg_test', 'coordination', 'saccades', 'smooth_pursuits',
      'convergence', 'hit_test', 'dix_hallpike_right', 'dix_hallpike_left',
      'supine_roll_right', 'supine_roll_left', 'deep_head_hang', 'lean_test',
      'vng_results', 'bppv_details', 'maneuvers_performed', 'manual_treatment',
      'vrt_exercises', 'dhi_data'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(jsonbFields.includes(key) ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assessmentId, organizationId);

    const result = await query(
      `UPDATE vestibular_assessments
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Vestibular assessment updated: ${assessmentId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating vestibular assessment:', error);
    throw error;
  }
};

/**
 * Delete assessment
 */
export const deleteAssessment = async (assessmentId, organizationId) => {
  try {
    const result = await query(
      `DELETE FROM vestibular_assessments
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [assessmentId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`Vestibular assessment deleted: ${assessmentId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error deleting vestibular assessment:', error);
    throw error;
  }
};

/**
 * Get BPPV statistics for a patient (trend analysis)
 */
export const getBPPVTrends = async (patientId, organizationId) => {
  try {
    const result = await query(
      `SELECT
        assessment_date,
        primary_diagnosis,
        bppv_details,
        maneuvers_performed,
        dhi_score
      FROM vestibular_assessments
      WHERE patient_id = $1 AND organization_id = $2
        AND primary_diagnosis LIKE '%BPPV%'
      ORDER BY assessment_date ASC`,
      [patientId, organizationId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching BPPV trends:', error);
    throw error;
  }
};

/**
 * Get common diagnoses statistics
 */
export const getCommonDiagnoses = async (organizationId, options = {}) => {
  const { startDate = null, endDate = null } = options;

  try {
    let whereClause = 'WHERE organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND assessment_date >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND assessment_date <= $${paramIndex}`;
      paramIndex++;
    }

    const result = await query(
      `SELECT
        primary_diagnosis,
        COUNT(*) as count,
        ROUND(AVG(dhi_score), 1) as avg_dhi_score
      FROM vestibular_assessments
      ${whereClause}
      GROUP BY primary_diagnosis
      ORDER BY count DESC
      LIMIT 10`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching common vestibular diagnoses:', error);
    throw error;
  }
};

/**
 * Get treatment efficacy statistics
 */
export const getTreatmentEfficacy = async (organizationId, maneuverType = null) => {
  try {
    let whereClause = 'WHERE va1.organization_id = $1';
    const params = [organizationId];

    if (maneuverType) {
      params.push(maneuverType);
      whereClause += ` AND va1.maneuvers_performed::jsonb @> $2::jsonb`;
    }

    const result = await query(
      `WITH first_last AS (
        SELECT
          patient_id,
          MIN(assessment_date) as first_date,
          MAX(assessment_date) as last_date
        FROM vestibular_assessments
        ${whereClause}
        GROUP BY patient_id
        HAVING COUNT(*) >= 2
      )
      SELECT
        COUNT(DISTINCT va1.patient_id) as patient_count,
        ROUND(AVG(va1.dhi_score), 1) as avg_initial_dhi,
        ROUND(AVG(va2.dhi_score), 1) as avg_final_dhi,
        ROUND(AVG(va1.dhi_score - va2.dhi_score), 1) as avg_improvement
      FROM vestibular_assessments va1
      JOIN first_last fl ON va1.patient_id = fl.patient_id AND va1.assessment_date = fl.first_date
      JOIN vestibular_assessments va2 ON va2.patient_id = fl.patient_id AND va2.assessment_date = fl.last_date
      WHERE va1.dhi_score IS NOT NULL AND va2.dhi_score IS NOT NULL`,
      params
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching treatment efficacy:', error);
    throw error;
  }
};

export default {
  createAssessment,
  getAssessmentById,
  getAssessmentsByPatient,
  getAssessmentByEncounter,
  updateAssessment,
  deleteAssessment,
  getBPPVTrends,
  getCommonDiagnoses,
  getTreatmentEfficacy
};
