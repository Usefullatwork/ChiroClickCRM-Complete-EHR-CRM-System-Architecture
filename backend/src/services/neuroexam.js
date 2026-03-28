/**
 * Neurological Examination Service
 * Business logic for neurological exams, BPPV treatment, referrals, and red flags
 */

import { query as dbQuery, transaction } from '../config/database.js';

/** Determine cluster ID from test ID */
function determineClusterId(testId) {
  const clusterMappings = {
    saccade_: 'CEREBELLAR',
    smooth_pursuit: 'CEREBELLAR',
    gaze_evoked: 'CEREBELLAR',
    finger_nose: 'CEREBELLAR',
    dysdiadocho: 'CEREBELLAR',
    tandem: 'CEREBELLAR',
    romberg: 'CEREBELLAR',
    heel_knee: 'CEREBELLAR',
    spontaneous_nystagmus: 'VESTIBULAR',
    head_impulse: 'VESTIBULAR',
    caloric: 'VESTIBULAR',
    skew: 'VESTIBULAR',
    gait_head: 'VESTIBULAR',
    dynamic_visual: 'VESTIBULAR',
    dix_hallpike: 'BPPV',
    supine_roll: 'BPPV',
    bow_and_lean: 'BPPV',
    deep_head: 'BPPV',
    cervical_rom: 'CERVICOGENIC',
    pursuit_neck: 'CERVICOGENIC',
    flexion_rotation: 'CERVICOGENIC',
    vertebral_artery: 'CERVICOGENIC',
    joint_position: 'CERVICOGENIC',
    palpation: 'CERVICOGENIC',
    provocation: 'CERVICOGENIC',
    tmj: 'TMJ',
    masseter: 'TMJ',
    mandibular: 'TMJ',
    cervical_mandibular: 'TMJ',
    sharp_purser: 'UPPER_CERVICAL_INSTABILITY',
    alar: 'UPPER_CERVICAL_INSTABILITY',
    transverse: 'UPPER_CERVICAL_INSTABILITY',
    membrana: 'UPPER_CERVICAL_INSTABILITY',
    hoffmann: 'MYELOPATHY',
    hyperreflexia: 'MYELOPATHY',
    babinski: 'MYELOPATHY',
    lhermitte: 'MYELOPATHY',
    hand_function: 'MYELOPATHY',
    leg_length: 'ACTIVATOR',
    segmental: 'ACTIVATOR',
  };

  for (const [prefix, cluster] of Object.entries(clusterMappings)) {
    if (testId.startsWith(prefix) || testId.includes(prefix)) {
      return cluster;
    }
  }

  return 'OTHER';
}

/** Determine referral urgency based on red flags and scores */
function determineReferralUrgency(redFlags, _clusterScores) {
  if (!redFlags || redFlags.length === 0) {
    return null;
  }

  const hasMyelopathy = redFlags.some(
    (f) =>
      f.clusterId === 'MYELOPATHY' ||
      f.testId?.includes('hoffmann') ||
      f.testId?.includes('babinski') ||
      f.testId?.includes('lhermitte')
  );
  if (hasMyelopathy) {
    return 'EMERGENT';
  }

  const hasInstability = redFlags.some(
    (f) =>
      f.clusterId === 'UPPER_CERVICAL_INSTABILITY' ||
      f.testId?.includes('sharp_purser') ||
      f.testId?.includes('alar') ||
      f.testId?.includes('transverse')
  );
  if (hasInstability) {
    return 'EMERGENT';
  }

  const hasCentralSigns = redFlags.some(
    (f) => f.testId?.includes('skew') || f.label?.toLowerCase().includes('central')
  );
  if (hasCentralSigns) {
    return 'URGENT';
  }

  return 'ROUTINE';
}

/** Insert normalized test results into neuro_exam_test_results table */
async function insertTestResults(client, examId, testResults) {
  for (const [testId, testData] of Object.entries(testResults)) {
    if (testData && testData.criteria) {
      const positiveCriteria = Object.entries(testData.criteria)
        .filter(([, val]) => val)
        .map(([key]) => key);
      const isPositive = positiveCriteria.length > 0;

      await client.query(
        `INSERT INTO neuro_exam_test_results (
          examination_id, cluster_id, test_id, is_positive, positive_criteria,
          measured_value, side, is_red_flag, clinician_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          examId,
          determineClusterId(testId),
          testId,
          isPositive,
          positiveCriteria,
          testData.value || null,
          testData.side || 'N/A',
          testData.isRedFlag || false,
          testData.notes || null,
        ]
      );
    }
  }
}

/** List neurological examinations with filters */
export const listExams = async (organizationId, filters = {}) => {
  const { patientId, status, hasRedFlags, limit = 50, offset = 0 } = filters;

  let queryText = `
    SELECT
      ne.*,
      p.first_name || ' ' || p.last_name as patient_name,
      u.first_name || ' ' || u.last_name as practitioner_name
    FROM neurological_examinations ne
    JOIN patients p ON p.id = ne.patient_id
    LEFT JOIN users u ON u.id = ne.practitioner_id
    WHERE ne.organization_id = $1
  `;
  const params = [organizationId];
  let paramIndex = 2;

  if (patientId) {
    queryText += ` AND ne.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }

  if (status) {
    queryText += ` AND ne.status = $${paramIndex++}`;
    params.push(status);
  }

  if (hasRedFlags !== undefined) {
    queryText += ` AND ne.has_red_flags = $${paramIndex++}`;
    params.push(hasRedFlags === 'true');
  }

  queryText += ` ORDER BY ne.exam_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await dbQuery(queryText, params);

  return {
    data: result.rows,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: result.rowCount,
    },
  };
};

/** Get a single examination by ID with test results and vestibular findings. Returns null if not found. */
export const getExamById = async (organizationId, examId) => {
  const result = await dbQuery(
    `
    SELECT
      ne.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.date_of_birth as patient_dob,
      u.first_name || ' ' || u.last_name as practitioner_name
    FROM neurological_examinations ne
    JOIN patients p ON p.id = ne.patient_id
    LEFT JOIN users u ON u.id = ne.practitioner_id
    WHERE ne.id = $1 AND ne.organization_id = $2
  `,
    [examId, organizationId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const testResults = await dbQuery(
    `
    SELECT
      id, examination_id, cluster_id, test_id,
      is_positive, positive_criteria, measured_value,
      side, is_red_flag, requires_referral,
      clinician_notes, created_at
    FROM neuro_exam_test_results
    WHERE examination_id = $1
    ORDER BY cluster_id, test_id
  `,
    [examId]
  );

  const vestibularFindings = await dbQuery(
    `
    SELECT
      id, examination_id,
      spontaneous_nystagmus_present, spontaneous_nystagmus_direction,
      spontaneous_nystagmus_velocity, fixation_suppression,
      gaze_evoked_horizontal, gaze_evoked_vertical, rebound_nystagmus,
      saccade_accuracy_horizontal, saccade_accuracy_vertical, saccade_latency_ms,
      pursuit_gain_horizontal, pursuit_gain_vertical, saccadic_pursuit,
      hit_right_positive, hit_left_positive, catch_up_saccades,
      caloric_performed, caloric_unilateral_weakness, caloric_affected_side,
      caloric_directional_preponderance, dva_lines_lost, dva_affected_side,
      hints_result, hints_hearing_loss_ipsilateral, created_at
    FROM vestibular_findings
    WHERE examination_id = $1
  `,
    [examId]
  );

  return {
    ...result.rows[0],
    detailed_test_results: testResults.rows,
    vestibular_findings: vestibularFindings.rows[0] || null,
  };
};

/** Create a new neurological examination (transactional) */
export const createExam = async (organizationId, practitionerId, examData) => {
  const {
    patientId,
    encounterId,
    examType = 'COMPREHENSIVE',
    testResults = {},
    clusterScores = {},
    redFlags = [],
    bppvDiagnosis,
    narrativeText,
  } = examData;

  return await transaction(async (client) => {
    const examResult = await client.query(
      `
      INSERT INTO neurological_examinations (
        organization_id,
        patient_id,
        encounter_id,
        practitioner_id,
        exam_type,
        test_results,
        cluster_scores,
        red_flags,
        bppv_diagnosis,
        narrative_text,
        narrative_generated_at,
        referral_recommended,
        referral_urgency,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
      [
        organizationId,
        patientId,
        encounterId || null,
        practitionerId,
        examType,
        JSON.stringify(testResults),
        JSON.stringify(clusterScores),
        JSON.stringify(redFlags),
        bppvDiagnosis ? JSON.stringify(bppvDiagnosis) : null,
        narrativeText || null,
        narrativeText ? new Date() : null,
        redFlags.length > 0,
        determineReferralUrgency(redFlags, clusterScores),
        'IN_PROGRESS',
      ]
    );

    const examId = examResult.rows[0].id;

    await insertTestResults(client, examId, testResults);

    return examResult.rows[0];
  });
};

/** Update an existing neurological examination (transactional). Returns null if not found. */
export const updateExam = async (organizationId, examId, updateData) => {
  const { testResults, clusterScores, redFlags, bppvDiagnosis, narrativeText, status } = updateData;

  return await transaction(async (client) => {
    // Check exam exists and belongs to organization
    const existing = await client.query(
      `
      SELECT id FROM neurological_examinations
      WHERE id = $1 AND organization_id = $2
    `,
      [examId, organizationId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const updateResult = await client.query(
      `
      UPDATE neurological_examinations SET
        test_results = COALESCE($1, test_results),
        cluster_scores = COALESCE($2, cluster_scores),
        red_flags = COALESCE($3, red_flags),
        bppv_diagnosis = COALESCE($4, bppv_diagnosis),
        narrative_text = COALESCE($5, narrative_text),
        narrative_generated_at = CASE WHEN $5 IS NOT NULL THEN NOW() ELSE narrative_generated_at END,
        referral_recommended = COALESCE($6, referral_recommended),
        referral_urgency = COALESCE($7, referral_urgency),
        status = COALESCE($8, status),
        completed_at = CASE WHEN $8 = 'COMPLETED' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `,
      [
        testResults ? JSON.stringify(testResults) : null,
        clusterScores ? JSON.stringify(clusterScores) : null,
        redFlags ? JSON.stringify(redFlags) : null,
        bppvDiagnosis ? JSON.stringify(bppvDiagnosis) : null,
        narrativeText,
        redFlags ? redFlags.length > 0 : null,
        redFlags ? determineReferralUrgency(redFlags, clusterScores) : null,
        status,
        examId,
      ]
    );

    // Update normalized test results
    if (testResults) {
      await client.query('DELETE FROM neuro_exam_test_results WHERE examination_id = $1', [examId]);
      await insertTestResults(client, examId, testResults);
    }

    return updateResult.rows[0];
  });
};

/** Mark an examination as complete. Returns null if not found. */
export const completeExam = async (organizationId, examId, narrativeText) => {
  const result = await dbQuery(
    `
    UPDATE neurological_examinations SET
      status = 'COMPLETED',
      completed_at = NOW(),
      narrative_text = COALESCE($1, narrative_text),
      narrative_generated_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE narrative_generated_at END,
      updated_at = NOW()
    WHERE id = $2 AND organization_id = $3
    RETURNING *
  `,
    [narrativeText, examId, organizationId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/** Record a referral for an examination. Returns null if not found. */
export const recordReferral = async (organizationId, examId, { specialty, urgency }) => {
  const result = await dbQuery(
    `
    UPDATE neurological_examinations SET
      referral_specialty = $1,
      referral_urgency = $2,
      referral_sent_at = NOW(),
      updated_at = NOW()
    WHERE id = $3 AND organization_id = $4
    RETURNING *
  `,
    [specialty, urgency, examId, organizationId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/** Log a BPPV treatment session */
export const logBPPVTreatment = async (practitionerId, treatmentData) => {
  const {
    examId,
    patientId,
    canalAffected,
    sideAffected,
    variant,
    treatmentManeuver,
    repetitions,
    preVAS,
    postVAS,
    immediateResolution,
    homeExercises,
    notes,
  } = treatmentData;

  const result = await dbQuery(
    `
    INSERT INTO bppv_treatments (
      examination_id,
      patient_id,
      practitioner_id,
      canal_affected,
      side_affected,
      variant,
      treatment_maneuver,
      repetitions,
      pre_treatment_vertigo_vas,
      post_treatment_vertigo_vas,
      immediate_resolution,
      home_exercises_prescribed,
      brandt_daroff_prescribed,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `,
    [
      examId || null,
      patientId,
      practitionerId,
      canalAffected,
      sideAffected,
      variant || null,
      treatmentManeuver,
      repetitions || 1,
      preVAS || null,
      postVAS || null,
      immediateResolution || false,
      homeExercises || false,
      homeExercises || false,
      notes || null,
    ]
  );

  return result.rows[0];
};

/** Get pending red flag alerts sorted by urgency */
export const getRedFlagAlerts = async (organizationId) => {
  const result = await dbQuery(
    `
    SELECT
      exam_id, organization_id, patient_id, patient_name,
      exam_date, red_flags, referral_urgency,
      referral_pending, examiner_name
    FROM neuro_red_flag_alerts
    WHERE organization_id = $1
    ORDER BY
      CASE referral_urgency WHEN 'EMERGENT' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
      exam_date DESC
    LIMIT 50
  `,
    [organizationId]
  );

  return result.rows;
};

/** Get patient neurological exam history with BPPV treatments */
export const getPatientHistory = async (organizationId, patientId) => {
  const result = await dbQuery(
    `
    SELECT
      ne.id,
      ne.exam_date,
      ne.exam_type,
      ne.status,
      ne.cluster_scores,
      ne.has_red_flags,
      ne.bppv_diagnosis,
      ne.referral_recommended,
      ne.referral_urgency,
      u.first_name || ' ' || u.last_name as practitioner_name
    FROM neurological_examinations ne
    LEFT JOIN users u ON u.id = ne.practitioner_id
    WHERE ne.patient_id = $1 AND ne.organization_id = $2
    ORDER BY ne.exam_date DESC
    LIMIT 20
  `,
    [patientId, organizationId]
  );

  const bppvHistory = await dbQuery(
    `
    SELECT
      patient_id, patient_name, canal_affected, side_affected,
      treatment_maneuver, treatment_date, immediate_resolution,
      pre_treatment_vertigo_vas, post_treatment_vertigo_vas,
      vas_improvement, follow_up_required, follow_up_date
    FROM bppv_treatment_outcomes
    WHERE patient_id = $1
    ORDER BY treatment_date DESC
    LIMIT 10
  `,
    [patientId]
  );

  return {
    examinations: result.rows,
    bppvTreatments: bppvHistory.rows,
  };
};
