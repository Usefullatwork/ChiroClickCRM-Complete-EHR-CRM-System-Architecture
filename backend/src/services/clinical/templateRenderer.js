/**
 * Template Renderer
 * Clinical test library, red flags, test clusters, and screening
 */

import { query } from '../../config/database.js';

/**
 * Get orthopedic tests library
 */
export const getTestsLibrary = async (filters = {}) => {
  const { testCategory, bodyRegion, system, search, language = 'NO' } = filters;

  let sql = `
    SELECT id, code,
      CASE WHEN $1 = 'EN' THEN test_name_en ELSE test_name_no END as test_name,
      test_category, body_region, system,
      CASE WHEN $1 = 'EN' THEN description_en ELSE description_no END as description,
      CASE WHEN $1 = 'EN' THEN procedure_en ELSE procedure_no END as procedure,
      CASE WHEN $1 = 'EN' THEN positive_finding_en ELSE positive_finding_no END as positive_finding,
      indicates_conditions, sensitivity, specificity, result_type, result_options
    FROM clinical_tests_library WHERE 1=1
  `;
  const params = [language];
  let paramCount = 1;

  if (testCategory) {
    paramCount++;
    sql += ` AND test_category = $${paramCount}`;
    params.push(testCategory);
  }
  if (bodyRegion) {
    paramCount++;
    sql += ` AND body_region = $${paramCount}`;
    params.push(bodyRegion);
  }
  if (system) {
    paramCount++;
    sql += ` AND system = $${paramCount}`;
    params.push(system);
  }
  if (search) {
    paramCount++;
    sql += ` AND (test_name_en ILIKE $${paramCount} OR test_name_no ILIKE $${paramCount}
             OR description_en ILIKE $${paramCount} OR description_no ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  sql += ` ORDER BY body_region, test_category, test_name_en`;
  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get specific test by code
 */
export const getTestByCode = async (code, language = 'NO') => {
  const result = await query(
    `SELECT id, code,
      CASE WHEN $2 = 'EN' THEN test_name_en ELSE test_name_no END as test_name,
      test_category, body_region, system,
      CASE WHEN $2 = 'EN' THEN description_en ELSE description_no END as description,
      CASE WHEN $2 = 'EN' THEN procedure_en ELSE procedure_no END as procedure,
      CASE WHEN $2 = 'EN' THEN positive_finding_en ELSE positive_finding_no END as positive_finding,
      CASE WHEN $2 = 'EN' THEN negative_finding_en ELSE negative_finding_no END as negative_finding,
      indicates_conditions, sensitivity, specificity,
      likelihood_ratio_positive, likelihood_ratio_negative,
      result_type, result_options, interpretation_guide
    FROM clinical_tests_library WHERE code = $1`,
    [code, language]
  );
  if (result.rows.length === 0) {
    throw new Error('Test not found');
  }
  return result.rows[0];
};

/**
 * Get red flags library
 */
export const getRedFlags = async (filters = {}) => {
  const { pathologyCategory, bodyRegion, significanceLevel, language = 'NO' } = filters;

  let sql = `
    SELECT id, code,
      CASE WHEN $1 = 'EN' THEN flag_name_en ELSE flag_name_no END as flag_name,
      pathology_category, body_region,
      CASE WHEN $1 = 'EN' THEN description_en ELSE description_no END as description,
      significance_level, age_min, age_max,
      CASE WHEN $1 = 'EN' THEN clinical_context_en ELSE clinical_context_no END as clinical_context,
      CASE WHEN $1 = 'EN' THEN recommended_action_en ELSE recommended_action_no END as recommended_action,
      evidence_level, references
    FROM red_flags_library WHERE 1=1
  `;
  const params = [language];
  let paramCount = 1;

  if (pathologyCategory) {
    paramCount++;
    sql += ` AND pathology_category = $${paramCount}`;
    params.push(pathologyCategory);
  }
  if (bodyRegion) {
    paramCount++;
    sql += ` AND (body_region = $${paramCount} OR body_region IS NULL)`;
    params.push(bodyRegion);
  }
  if (significanceLevel) {
    paramCount++;
    sql += ` AND significance_level = $${paramCount}`;
    params.push(significanceLevel);
  }

  sql += ` ORDER BY CASE significance_level WHEN 'HIGH' THEN 1 WHEN 'MODERATE' THEN 2 WHEN 'LOW' THEN 3 END,
    pathology_category, flag_name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Screen patient for red flags
 */
export const screenRedFlags = async (patientData, symptoms, findings) => {
  const { age, gender } = patientData;

  const ageResult = await query(
    `SELECT code, flag_name_no as flag_name, pathology_category, description_no as description,
            significance_level, recommended_action_no as recommended_action
    FROM red_flags_library
    WHERE (age_min IS NULL OR age_min <= $1) AND (age_max IS NULL OR age_max >= $1)`,
    [age]
  );

  const screening = {
    patientAge: age,
    patientGender: gender,
    screeningDate: new Date(),
    redFlagsIdentified: [],
    riskLevel: 'LOW',
    recommendedActions: [],
  };

  const allFlags = ageResult.rows;

  for (const flag of allFlags) {
    let isPresent = false;
    if (symptoms && Array.isArray(symptoms)) {
      isPresent = symptoms.some((s) => flag.description.toLowerCase().includes(s.toLowerCase()));
    }
    if (!isPresent && findings && Array.isArray(findings)) {
      isPresent = findings.some((f) => flag.description.toLowerCase().includes(f.toLowerCase()));
    }

    if (isPresent) {
      screening.redFlagsIdentified.push({
        code: flag.code,
        name: flag.flag_name,
        category: flag.pathology_category,
        significance: flag.significance_level,
        action: flag.recommended_action,
      });
      if (flag.significance_level === 'HIGH' && screening.riskLevel !== 'HIGH') {
        screening.riskLevel = 'HIGH';
      } else if (flag.significance_level === 'MODERATE' && screening.riskLevel === 'LOW') {
        screening.riskLevel = 'MODERATE';
      }
      if (
        flag.recommended_action &&
        !screening.recommendedActions.includes(flag.recommended_action)
      ) {
        screening.recommendedActions.push(flag.recommended_action);
      }
    }
  }

  return screening;
};

/**
 * Get test clusters
 */
export const getTestClusters = async (filters = {}) => {
  const { bodyRegion, language = 'NO' } = filters;

  let sql = `
    SELECT id, code,
      CASE WHEN $1 = 'EN' THEN cluster_name_en ELSE cluster_name_no END as cluster_name,
      body_region, suspected_condition, test_codes,
      CASE WHEN $1 = 'EN' THEN interpretation_en ELSE interpretation_no END as interpretation,
      sensitivity, specificity, positive_likelihood_ratio, negative_likelihood_ratio,
      evidence_quality, references
    FROM test_clusters WHERE 1=1
  `;
  const params = [language];
  let paramCount = 1;

  if (bodyRegion) {
    paramCount++;
    sql += ` AND body_region = $${paramCount}`;
    params.push(bodyRegion);
  }
  sql += ` ORDER BY body_region, cluster_name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get test cluster by condition
 */
export const getTestClusterByCondition = async (condition, language = 'NO') => {
  const result = await query(
    `SELECT id, code,
      CASE WHEN $2 = 'EN' THEN cluster_name_en ELSE cluster_name_no END as cluster_name,
      body_region, suspected_condition, test_codes,
      CASE WHEN $2 = 'EN' THEN description_en ELSE description_no END as description,
      CASE WHEN $2 = 'EN' THEN interpretation_en ELSE interpretation_no END as interpretation,
      sensitivity, specificity, positive_likelihood_ratio, negative_likelihood_ratio,
      evidence_quality, references
    FROM test_clusters
    WHERE suspected_condition ILIKE $1 OR code = $1
    ORDER BY evidence_quality DESC LIMIT 1`,
    [`%${condition}%`, language]
  );
  if (result.rows.length === 0) {
    throw new Error('Cluster not found');
  }
  return result.rows[0];
};
