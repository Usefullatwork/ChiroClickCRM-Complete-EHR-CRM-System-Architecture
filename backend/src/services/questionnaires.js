/**
 * Questionnaires Service
 * Manages standardized clinical outcome questionnaires with automatic scoring
 * Supports: NDI, Oswestry, PSFS, EQ5D, LEFS, DASH, etc.
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get all available questionnaires
 */
export const getAllQuestionnaires = async (organizationId, options = {}) => {
  const {
    bodyRegion,
    language = 'NO',
    activeOnly = true
  } = options;

  let sql = `
    SELECT
      id,
      code,
      name,
      full_name,
      description,
      language,
      version,
      questions,
      scoring_method,
      min_score,
      max_score,
      score_interpretation,
      target_body_region,
      estimated_minutes,
      indicated_for,
      clinical_cutoff_scores,
      psychometric_properties,
      reference_citation,
      educational_link,
      is_active
    FROM questionnaires
    WHERE (organization_id = $1 OR organization_id IS NULL)
      AND language = $2
  `;

  const params = [organizationId, language];
  let paramCount = 2;

  if (bodyRegion) {
    paramCount++;
    sql += ` AND target_body_region = $${paramCount}`;
    params.push(bodyRegion);
  }

  if (activeOnly) {
    sql += ` AND is_active = true`;
  }

  sql += ` ORDER BY name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get a specific questionnaire by code
 */
export const getQuestionnaireByCode = async (code) => {
  const result = await query(
    `SELECT * FROM questionnaires WHERE code = $1 AND is_active = true`,
    [code]
  );

  if (result.rows.length === 0) {
    throw new Error(`Questionnaire ${code} not found`);
  }

  return result.rows[0];
};

/**
 * Submit a questionnaire response and calculate scores
 */
export const submitQuestionnaireResponse = async (responseData) => {
  const {
    patientId,
    encounterId,
    questionnaireId,
    responses,
    administeredBy
  } = responseData;

  // Get questionnaire definition
  const questionnaireResult = await query(
    `SELECT * FROM questionnaires WHERE id = $1`,
    [questionnaireId]
  );

  if (questionnaireResult.rows.length === 0) {
    throw new Error('Questionnaire not found');
  }

  const questionnaire = questionnaireResult.rows[0];

  // Calculate scores based on questionnaire type
  const scoreData = await calculateQuestionnaireScore(
    questionnaire,
    responses
  );

  // Get previous score for comparison
  const previousResult = await query(
    `SELECT total_score, administered_date
     FROM questionnaire_responses
     WHERE patient_id = $1
       AND questionnaire_id = $2
     ORDER BY administered_date DESC
     LIMIT 1`,
    [patientId, questionnaireId]
  );

  const previousScore = previousResult.rows.length > 0
    ? previousResult.rows[0].total_score
    : null;

  let scoreChange = null;
  let changePercentage = null;
  let clinicallySignificantChange = false;

  if (previousScore !== null) {
    scoreChange = scoreData.totalScore - previousScore;
    changePercentage = (scoreChange / previousScore) * 100;

    // Check if change meets MCID
    const mcid = questionnaire.clinical_cutoff_scores?.minimal_clinically_important_difference;
    if (mcid && Math.abs(scoreChange) >= mcid) {
      clinicallySignificantChange = true;
    }
  }

  // Insert response
  const insertResult = await query(
    `INSERT INTO questionnaire_responses (
      organization_id,
      patient_id,
      encounter_id,
      questionnaire_id,
      responses,
      total_score,
      percentage_score,
      severity_level,
      previous_score,
      score_change,
      change_percentage,
      clinically_significant_change,
      administered_by
    ) VALUES (
      (SELECT organization_id FROM patients WHERE id = $1),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    RETURNING *`,
    [
      patientId,
      encounterId,
      questionnaireId,
      JSON.stringify(responses),
      scoreData.totalScore,
      scoreData.percentageScore,
      scoreData.severityLevel,
      previousScore,
      scoreChange,
      changePercentage,
      clinicallySignificantChange,
      administeredBy
    ]
  );

  return insertResult.rows[0];
};

/**
 * Calculate questionnaire score based on type
 */
const calculateQuestionnaireScore = async (questionnaire, responses) => {
  const { code, scoring_method, min_score, max_score, score_interpretation } = questionnaire;

  let totalScore = 0;
  let percentageScore = 0;
  let severityLevel = 'None';

  switch (code) {
    case 'NDI':
      return calculateNDI(responses, score_interpretation);
    case 'OSWESTRY':
      return calculateOswestry(responses, score_interpretation);
    case 'PSFS':
      return calculatePSFS(responses);
    case 'EQ5D':
      return calculateEQ5D(responses);
    case 'LEFS':
      return calculateLEFS(responses, score_interpretation);
    case 'DASH':
      return calculateDASH(responses, score_interpretation);
    default:
      // Generic scoring based on scoring_method
      return calculateGenericScore(
        responses,
        scoring_method,
        min_score,
        max_score,
        score_interpretation
      );
  }
};

/**
 * Calculate NDI (Neck Disability Index) score
 * 10 sections, each 0-5 points, total 0-50
 */
const calculateNDI = (responses, interpretation) => {
  let totalScore = 0;
  const questions = Object.keys(responses);

  questions.forEach(questionId => {
    totalScore += parseInt(responses[questionId]) || 0;
  });

  // NDI is expressed as percentage
  const percentageScore = (totalScore / 50) * 100;

  // Determine severity
  let severityLevel = 'None';
  if (percentageScore >= 70) {
    severityLevel = 'Complete disability';
  } else if (percentageScore >= 50) {
    severityLevel = 'Severe';
  } else if (percentageScore >= 30) {
    severityLevel = 'Moderate';
  } else if (percentageScore >= 10) {
    severityLevel = 'Mild';
  }

  return {
    totalScore,
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Calculate Oswestry Disability Index score
 * 10 sections, each 0-5 points, total 0-50
 */
const calculateOswestry = (responses, interpretation) => {
  let totalScore = 0;
  let validSections = 0;

  Object.keys(responses).forEach(questionId => {
    const value = parseInt(responses[questionId]);
    if (!isNaN(value)) {
      totalScore += value;
      validSections++;
    }
  });

  // If not all sections completed, calculate proportionally
  const maxPossibleScore = validSections * 5;
  const percentageScore = validSections > 0
    ? (totalScore / maxPossibleScore) * 100
    : 0;

  // Determine severity
  let severityLevel = 'Minimal disability';
  if (percentageScore >= 81) {
    severityLevel = 'Bed-bound or exaggerating';
  } else if (percentageScore >= 61) {
    severityLevel = 'Crippling back pain';
  } else if (percentageScore >= 41) {
    severityLevel = 'Severe disability';
  } else if (percentageScore >= 21) {
    severityLevel = 'Moderate disability';
  }

  return {
    totalScore,
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Calculate PSFS (Patient-Specific Functional Scale) score
 * 3-5 activities rated 0-10, average score
 */
const calculatePSFS = (responses) => {
  let totalScore = 0;
  let activityCount = 0;

  Object.keys(responses).forEach(questionId => {
    const value = parseInt(responses[questionId]);
    if (!isNaN(value)) {
      totalScore += value;
      activityCount++;
    }
  });

  const averageScore = activityCount > 0
    ? totalScore / activityCount
    : 0;

  // PSFS: Higher score = better function (0-10 scale)
  const percentageScore = (averageScore / 10) * 100;

  let severityLevel = 'Unable to perform';
  if (averageScore >= 7) {
    severityLevel = 'Minimal limitation';
  } else if (averageScore >= 4) {
    severityLevel = 'Moderate limitation';
  }

  return {
    totalScore: parseFloat(averageScore.toFixed(2)),
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Calculate EQ-5D score
 * 5 dimensions, each 1-5 levels
 */
const calculateEQ5D = (responses) => {
  const dimensions = ['mobility', 'self_care', 'usual_activities', 'pain_discomfort', 'anxiety_depression'];
  let healthState = '';

  dimensions.forEach(dim => {
    const value = responses[dim] || 1;
    healthState += value;
  });

  // VAS score (0-100)
  const vasScore = parseInt(responses.vas) || 0;

  // Calculate index score (requires country-specific tariff)
  // Simplified version - full implementation would use value sets
  let indexScore = 1.0;
  dimensions.forEach(dim => {
    const level = parseInt(responses[dim]) || 1;
    if (level > 1) {
      indexScore -= 0.05 * (level - 1); // Simplified penalty
    }
  });

  const percentageScore = indexScore * 100;

  let severityLevel = 'Excellent health';
  if (indexScore < 0.5) {
    severityLevel = 'Poor health';
  } else if (indexScore < 0.7) {
    severityLevel = 'Moderate health';
  } else if (indexScore < 0.9) {
    severityLevel = 'Good health';
  }

  return {
    totalScore: parseFloat(indexScore.toFixed(3)),
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel,
    healthState,
    vasScore
  };
};

/**
 * Calculate LEFS (Lower Extremity Functional Scale) score
 * 20 items, each 0-4, total 0-80
 */
const calculateLEFS = (responses, interpretation) => {
  let totalScore = 0;

  Object.keys(responses).forEach(questionId => {
    totalScore += parseInt(responses[questionId]) || 0;
  });

  const percentageScore = (totalScore / 80) * 100;

  let severityLevel = 'Severe functional limitation';
  if (totalScore >= 60) {
    severityLevel = 'Minimal functional limitation';
  } else if (totalScore >= 40) {
    severityLevel = 'Moderate functional limitation';
  }

  return {
    totalScore,
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Calculate DASH (Disabilities of Arm, Shoulder, and Hand) score
 * 30 items, each 1-5, converted to 0-100 scale
 */
const calculateDASH = (responses, interpretation) => {
  let totalScore = 0;
  let validItems = 0;

  Object.keys(responses).forEach(questionId => {
    const value = parseInt(responses[questionId]);
    if (!isNaN(value)) {
      totalScore += value;
      validItems++;
    }
  });

  // Need at least 27 items completed
  if (validItems < 27) {
    throw new Error('DASH requires at least 27 of 30 items to be completed');
  }

  // DASH formula: ((sum of responses / number of items) - 1) × 25
  const dashScore = ((totalScore / validItems) - 1) * 25;

  const percentageScore = dashScore;

  let severityLevel = 'No disability';
  if (dashScore >= 66) {
    severityLevel = 'Severe disability';
  } else if (dashScore >= 33) {
    severityLevel = 'Moderate disability';
  } else if (dashScore >= 16) {
    severityLevel = 'Mild disability';
  }

  return {
    totalScore: parseFloat(dashScore.toFixed(2)),
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Generic score calculation
 */
const calculateGenericScore = (responses, scoring_method, min_score, max_score, interpretation) => {
  let totalScore = 0;

  if (scoring_method === 'SUM') {
    Object.values(responses).forEach(value => {
      totalScore += parseInt(value) || 0;
    });
  } else if (scoring_method === 'AVERAGE') {
    const values = Object.values(responses).map(v => parseInt(v) || 0);
    totalScore = values.reduce((a, b) => a + b, 0) / values.length;
  }

  const range = max_score - min_score;
  const percentageScore = range > 0
    ? ((totalScore - min_score) / range) * 100
    : 0;

  // Determine severity based on interpretation ranges
  let severityLevel = 'Unknown';
  if (interpretation?.ranges) {
    interpretation.ranges.forEach(range => {
      if (totalScore >= range.min && totalScore <= range.max) {
        severityLevel = range.severity;
      }
    });
  }

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    severityLevel
  };
};

/**
 * Get patient's questionnaire history
 */
export const getPatientQuestionnaireHistory = async (patientId, questionnaireCode = null) => {
  let sql = `
    SELECT
      qr.*,
      q.code,
      q.name,
      q.target_body_region
    FROM questionnaire_responses qr
    JOIN questionnaires q ON qr.questionnaire_id = q.id
    WHERE qr.patient_id = $1
  `;

  const params = [patientId];

  if (questionnaireCode) {
    sql += ` AND q.code = $2`;
    params.push(questionnaireCode);
  }

  sql += ` ORDER BY qr.administered_date DESC`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get questionnaire response by ID
 */
export const getQuestionnaireResponse = async (responseId) => {
  const result = await query(
    `SELECT
      qr.*,
      q.code,
      q.name,
      q.questions,
      q.clinical_cutoff_scores
     FROM questionnaire_responses qr
     JOIN questionnaires q ON qr.questionnaire_id = q.id
     WHERE qr.id = $1`,
    [responseId]
  );

  if (result.rows.length === 0) {
    throw new Error('Questionnaire response not found');
  }

  return result.rows[0];
};

/**
 * Get aggregate outcome data for a diagnosis
 */
export const getOutcomesByDiagnosis = async (organizationId, icpcCode) => {
  const result = await query(
    `SELECT
      q.code as questionnaire_code,
      q.name as questionnaire_name,
      COUNT(qr.id) as response_count,
      AVG(qr.total_score) as avg_score,
      AVG(qr.percentage_score) as avg_percentage,
      AVG(qr.score_change) as avg_change,
      COUNT(CASE WHEN qr.clinically_significant_change THEN 1 END) as significant_improvements
     FROM questionnaire_responses qr
     JOIN questionnaires q ON qr.questionnaire_id = q.id
     JOIN clinical_encounters ce ON qr.encounter_id = ce.id
     WHERE qr.organization_id = $1
       AND $2 = ANY(ce.icpc_codes)
     GROUP BY q.code, q.name
     ORDER BY response_count DESC`,
    [organizationId, icpcCode]
  );

  return result.rows;
};

/**
 * Calculate treatment effectiveness based on outcome measures
 */
export const calculateTreatmentEffectiveness = async (patientId) => {
  const result = await query(
    `SELECT
      q.code,
      q.name,
      q.clinical_cutoff_scores,
      qr.total_score as initial_score,
      qr2.total_score as latest_score,
      qr2.total_score - qr.total_score as score_change,
      qr2.clinically_significant_change
     FROM questionnaire_responses qr
     JOIN questionnaires q ON qr.questionnaire_id = q.id
     JOIN LATERAL (
       SELECT * FROM questionnaire_responses
       WHERE patient_id = qr.patient_id
         AND questionnaire_id = qr.questionnaire_id
         AND administered_date > qr.administered_date
       ORDER BY administered_date DESC
       LIMIT 1
     ) qr2 ON true
     WHERE qr.patient_id = $1
       AND qr.treatment_phase = 'Pre-treatment'
     ORDER BY qr2.administered_date DESC`,
    [patientId]
  );

  return result.rows;
};

export default {
  getAllQuestionnaires,
  getQuestionnaireByCode,
  submitQuestionnaireResponse,
  getPatientQuestionnaireHistory,
  getQuestionnaireResponse,
  getOutcomesByDiagnosis,
  calculateTreatmentEffectiveness
};
