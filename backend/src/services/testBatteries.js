/**
 * Test Batteries Service
 * Manages structured assessment protocols (SPPB, 9TSB, custom batteries)
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get all test batteries
 */
export const getAllTestBatteries = async (organizationId, options = {}) => {
  const {
    bodyRegion,
    targetPopulation,
    systemOnly = false,
    activeOnly = true
  } = options;

  let sql = `
    SELECT
      id,
      name,
      description,
      code,
      target_population,
      target_body_region,
      estimated_minutes,
      tests,
      scoring_method,
      composite_score_calculation,
      indicated_for,
      contraindications,
      psychometric_properties,
      reference_citation,
      educational_link,
      is_system,
      is_template,
      is_active,
      usage_count,
      created_at
    FROM test_batteries
    WHERE (organization_id = $1 OR is_system = true)
  `;

  const params = [organizationId];
  let paramCount = 1;

  if (systemOnly) {
    sql += ` AND is_system = true`;
  }

  if (bodyRegion) {
    paramCount++;
    sql += ` AND target_body_region = $${paramCount}`;
    params.push(bodyRegion);
  }

  if (targetPopulation) {
    paramCount++;
    sql += ` AND target_population = $${paramCount}`;
    params.push(targetPopulation);
  }

  if (activeOnly) {
    sql += ` AND is_active = true`;
  }

  sql += ` ORDER BY is_system DESC, usage_count DESC, name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get test battery by code
 */
export const getTestBatteryByCode = async (code) => {
  const result = await query(
    `SELECT * FROM test_batteries WHERE code = $1 AND is_active = true`,
    [code]
  );

  if (result.rows.length === 0) {
    throw new Error(`Test battery ${code} not found`);
  }

  return result.rows[0];
};

/**
 * Create custom test battery
 */
export const createTestBattery = async (organizationId, userId, batteryData) => {
  const {
    name,
    description,
    code,
    targetPopulation,
    targetBodyRegion,
    estimatedMinutes,
    tests,
    scoringMethod,
    compositeScoreCalculation,
    indicatedFor,
    contraindications
  } = batteryData;

  // Validate required fields
  if (!name || !tests || tests.length === 0) {
    throw new Error('Name and at least one test are required');
  }

  const result = await query(
    `INSERT INTO test_batteries (
      organization_id,
      name,
      description,
      code,
      target_population,
      target_body_region,
      estimated_minutes,
      tests,
      scoring_method,
      composite_score_calculation,
      indicated_for,
      contraindications,
      is_system,
      is_template,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, true, $13)
    RETURNING *`,
    [
      organizationId,
      name,
      description,
      code,
      targetPopulation,
      targetBodyRegion,
      estimatedMinutes || 15,
      JSON.stringify(tests),
      scoringMethod || 'INDIVIDUAL',
      JSON.stringify(compositeScoreCalculation || {}),
      indicatedFor || [],
      contraindications || [],
      userId
    ]
  );

  return result.rows[0];
};

/**
 * Update test battery
 */
export const updateTestBattery = async (batteryId, organizationId, updates) => {
  const {
    name,
    description,
    tests,
    scoringMethod,
    compositeScoreCalculation,
    indicatedFor,
    contraindications,
    isActive
  } = updates;

  const result = await query(
    `UPDATE test_batteries
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         tests = COALESCE($3, tests),
         scoring_method = COALESCE($4, scoring_method),
         composite_score_calculation = COALESCE($5, composite_score_calculation),
         indicated_for = COALESCE($6, indicated_for),
         contraindications = COALESCE($7, contraindications),
         is_active = COALESCE($8, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $9
       AND organization_id = $10
       AND is_system = false
     RETURNING *`,
    [
      name,
      description,
      JSON.stringify(tests),
      scoringMethod,
      JSON.stringify(compositeScoreCalculation),
      indicatedFor,
      contraindications,
      isActive,
      batteryId,
      organizationId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Test battery not found or not editable');
  }

  return result.rows[0];
};

/**
 * Submit test battery results
 */
export const submitBatteryResults = async (resultData) => {
  const {
    patientId,
    encounterId,
    batteryId,
    testResults,
    testDurationMinutes,
    clinicalFindings,
    recommendations,
    administeredBy
  } = resultData;

  // Get battery definition
  const batteryResult = await query(
    `SELECT * FROM test_batteries WHERE id = $1`,
    [batteryId]
  );

  if (batteryResult.rows.length === 0) {
    throw new Error('Test battery not found');
  }

  const battery = batteryResult.rows[0];

  // Calculate composite score
  const scoreData = calculateCompositeScore(battery, testResults);

  // Get normative comparison if applicable
  const patientData = await query(
    `SELECT date_of_birth, gender FROM patients WHERE id = $1`,
    [patientId]
  );

  let normativePercentile = null;
  if (patientData.rows.length > 0) {
    const patient = patientData.rows[0];
    const age = calculateAge(patient.date_of_birth);
    normativePercentile = await getNormativePercentile(
      battery.code,
      scoreData.compositeScore,
      age,
      patient.gender
    );
  }

  // Get previous score for comparison
  const previousResult = await query(
    `SELECT composite_score, administered_date
     FROM test_battery_results
     WHERE patient_id = $1
       AND battery_id = $2
     ORDER BY administered_date DESC
     LIMIT 1`,
    [patientId, batteryId]
  );

  const previousScore = previousResult.rows.length > 0
    ? previousResult.rows[0].composite_score
    : null;

  const scoreChange = previousScore !== null
    ? scoreData.compositeScore - previousScore
    : null;

  // Insert results
  const insertResult = await query(
    `INSERT INTO test_battery_results (
      organization_id,
      patient_id,
      encounter_id,
      battery_id,
      test_results,
      composite_score,
      composite_interpretation,
      normative_percentile,
      previous_score,
      score_change,
      test_duration_minutes,
      clinical_findings,
      recommendations,
      administered_by
    ) VALUES (
      (SELECT organization_id FROM patients WHERE id = $1),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    RETURNING *`,
    [
      patientId,
      encounterId,
      batteryId,
      JSON.stringify(testResults),
      scoreData.compositeScore,
      scoreData.interpretation,
      normativePercentile,
      previousScore,
      scoreChange,
      testDurationMinutes,
      clinicalFindings,
      recommendations,
      administeredBy
    ]
  );

  // Increment battery usage count
  await query(
    `UPDATE test_batteries
     SET usage_count = usage_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [batteryId]
  );

  return insertResult.rows[0];
};

/**
 * Calculate composite score for battery
 */
const calculateCompositeScore = (battery, testResults) => {
  const { scoring_method, composite_score_calculation } = battery;

  let compositeScore = 0;
  let interpretation = 'Unknown';

  if (scoring_method === 'SUM') {
    // Sum all test scores
    testResults.forEach(result => {
      compositeScore += parseFloat(result.score) || 0;
    });
  } else if (scoring_method === 'WEIGHTED') {
    // Weighted sum based on battery configuration
    const weights = composite_score_calculation?.weights || {};
    testResults.forEach(result => {
      const weight = weights[result.test_id] || 1;
      compositeScore += (parseFloat(result.score) || 0) * weight;
    });
  } else if (scoring_method === 'AVERAGE') {
    // Average of all test scores
    const total = testResults.reduce((sum, result) => sum + (parseFloat(result.score) || 0), 0);
    compositeScore = total / testResults.length;
  }

  // Determine interpretation based on battery-specific ranges
  if (composite_score_calculation?.interpretation) {
    const ranges = composite_score_calculation.interpretation;
    for (const range of ranges) {
      if (compositeScore >= range.min && compositeScore <= range.max) {
        interpretation = range.label;
        break;
      }
    }
  }

  return {
    compositeScore: parseFloat(compositeScore.toFixed(2)),
    interpretation
  };
};

/**
 * Get normative percentile for test score
 */
const getNormativePercentile = async (batteryCode, score, age, gender) => {
  const result = await query(
    `SELECT
       CASE
         WHEN $1 <= percentile_5 THEN 5
         WHEN $1 <= percentile_25 THEN 25
         WHEN $1 <= percentile_50 THEN 50
         WHEN $1 <= percentile_75 THEN 75
         ELSE 95
       END as percentile
     FROM normative_data
     WHERE test_name = $2
       AND (gender = $3 OR gender = 'ALL')
       AND $4 BETWEEN COALESCE(age_min, 0) AND COALESCE(age_max, 999)
     ORDER BY evidence_level DESC, year_published DESC
     LIMIT 1`,
    [score, batteryCode, gender, age]
  );

  return result.rows.length > 0 ? result.rows[0].percentile : null;
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get patient's battery history
 */
export const getPatientBatteryHistory = async (patientId, batteryCode = null) => {
  let sql = `
    SELECT
      tbr.*,
      tb.code,
      tb.name,
      tb.target_body_region
    FROM test_battery_results tbr
    JOIN test_batteries tb ON tbr.battery_id = tb.id
    WHERE tbr.patient_id = $1
  `;

  const params = [patientId];

  if (batteryCode) {
    sql += ` AND tb.code = $2`;
    params.push(batteryCode);
  }

  sql += ` ORDER BY tbr.administered_date DESC`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get battery result by ID
 */
export const getBatteryResult = async (resultId) => {
  const result = await query(
    `SELECT
      tbr.*,
      tb.code,
      tb.name,
      tb.tests,
      tb.composite_score_calculation
     FROM test_battery_results tbr
     JOIN test_batteries tb ON tbr.battery_id = tb.id
     WHERE tbr.id = $1`,
    [resultId]
  );

  if (result.rows.length === 0) {
    throw new Error('Battery result not found');
  }

  return result.rows[0];
};

/**
 * Delete custom test battery
 */
export const deleteTestBattery = async (batteryId, organizationId) => {
  const result = await query(
    `DELETE FROM test_batteries
     WHERE id = $1
       AND organization_id = $2
       AND is_system = false
     RETURNING id`,
    [batteryId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Test battery not found or not deletable');
  }

  return { success: true };
};

export default {
  getAllTestBatteries,
  getTestBatteryByCode,
  createTestBattery,
  updateTestBattery,
  submitBatteryResults,
  getPatientBatteryHistory,
  getBatteryResult,
  deleteTestBattery
};
