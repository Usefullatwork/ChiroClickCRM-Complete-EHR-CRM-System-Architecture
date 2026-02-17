/**
 * Outcomes Service
 * Tracks patient outcomes and treatment effectiveness over time
 */

import { query } from '../config/database.js';
import _logger from '../utils/logger.js';

/**
 * Get patient outcome summary
 * Tracks VAS pain scores, ROM improvements, treatment response
 */
export const getPatientOutcomeSummary = async (organizationId, patientId) => {
  // Get all encounters with measurements
  const encountersResult = await query(
    `SELECT
      ce.id,
      ce.encounter_date,
      ce.encounter_type,
      ce.subjective,
      ce.objective,
      ce.assessment,
      ce.plan,
      ce.vas_pain_start,
      ce.vas_pain_end,
      ce.icpc_codes,
      cm.height,
      cm.weight,
      cm.blood_pressure,
      cm.rom_measurements,
      cm.strength_tests,
      cm.functional_tests
    FROM clinical_encounters ce
    LEFT JOIN clinical_measurements cm ON cm.encounter_id = ce.id
    WHERE ce.organization_id = $1
      AND ce.patient_id = $2
    ORDER BY ce.encounter_date ASC`,
    [organizationId, patientId]
  );

  const encounters = encountersResult.rows;

  if (encounters.length === 0) {
    return {
      patient_id: patientId,
      total_encounters: 0,
      pain_trend: null,
      treatment_effectiveness: null,
      encounters: [],
    };
  }

  // Calculate pain trend
  const painScores = encounters
    .filter((e) => e.vas_pain_start !== null)
    .map((e) => ({
      date: e.encounter_date,
      start: e.vas_pain_start,
      end: e.vas_pain_end,
      improvement: e.vas_pain_start - (e.vas_pain_end || e.vas_pain_start),
    }));

  const avgInitialPain =
    painScores.length > 0
      ? painScores.reduce((sum, p) => sum + p.start, 0) / painScores.length
      : null;

  const latestPain =
    painScores.length > 0
      ? painScores[painScores.length - 1].end || painScores[painScores.length - 1].start
      : null;

  const totalPainReduction = avgInitialPain && latestPain ? avgInitialPain - latestPain : null;

  // Calculate treatment effectiveness
  const effectivenessScore =
    totalPainReduction !== null
      ? Math.min(100, Math.max(0, (totalPainReduction / avgInitialPain) * 100))
      : null;

  return {
    patient_id: patientId,
    total_encounters: encounters.length,
    pain_trend: {
      initial_average: avgInitialPain,
      latest_score: latestPain,
      total_reduction: totalPainReduction,
      pain_scores: painScores,
    },
    treatment_effectiveness: {
      score: effectivenessScore,
      rating:
        effectivenessScore > 70
          ? 'EXCELLENT'
          : effectivenessScore > 50
            ? 'GOOD'
            : effectivenessScore > 30
              ? 'MODERATE'
              : 'POOR',
    },
    encounters: encounters.map((e) => ({
      id: e.id,
      date: e.encounter_date,
      type: e.encounter_type,
      vas_pain_start: e.vas_pain_start,
      vas_pain_end: e.vas_pain_end,
      icpc_codes: e.icpc_codes,
    })),
  };
};

/**
 * Get diagnosis outcome statistics
 * Shows treatment success rates by diagnosis code
 */
export const getDiagnosisOutcomeStats = async (organizationId, icpcCode, limit = 50) => {
  const result = await query(
    `SELECT
      ce.patient_id,
      ce.encounter_date,
      ce.vas_pain_start,
      ce.vas_pain_end,
      p.first_name || ' ' || p.last_name as patient_name
    FROM clinical_encounters ce
    JOIN patients p ON p.id = ce.patient_id
    WHERE ce.organization_id = $1
      AND $2 = ANY(ce.icpc_codes)
      AND ce.vas_pain_start IS NOT NULL
    ORDER BY ce.encounter_date DESC
    LIMIT $3`,
    [organizationId, icpcCode, limit]
  );

  const outcomes = result.rows.map((row) => ({
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    date: row.encounter_date,
    pain_reduction: row.vas_pain_start - (row.vas_pain_end || row.vas_pain_start),
    improvement_percent:
      ((row.vas_pain_start - (row.vas_pain_end || row.vas_pain_start)) / row.vas_pain_start) * 100,
  }));

  const avgImprovement =
    outcomes.length > 0
      ? outcomes.reduce((sum, o) => sum + o.improvement_percent, 0) / outcomes.length
      : 0;

  const successRate =
    outcomes.length > 0
      ? (outcomes.filter((o) => o.improvement_percent > 30).length / outcomes.length) * 100
      : 0;

  return {
    icpc_code: icpcCode,
    total_cases: outcomes.length,
    avg_improvement_percent: Math.round(avgImprovement * 10) / 10,
    success_rate: Math.round(successRate * 10) / 10,
    outcomes,
  };
};

/**
 * Get treatment outcome statistics
 * Shows effectiveness of specific treatment codes
 */
export const getTreatmentOutcomeStats = async (organizationId, startDate, endDate) => {
  const result = await query(
    `SELECT
      fm.treatment_codes,
      ce.vas_pain_start,
      ce.vas_pain_end,
      ce.patient_id
    FROM financial_metrics fm
    JOIN clinical_encounters ce ON ce.id = fm.encounter_id
    WHERE fm.organization_id = $1
      AND ce.encounter_date >= $2
      AND ce.encounter_date <= $3
      AND ce.vas_pain_start IS NOT NULL`,
    [organizationId, startDate, endDate]
  );

  // Aggregate by treatment code
  const treatmentStats = {};

  for (const row of result.rows) {
    const codes =
      typeof row.treatment_codes === 'string'
        ? JSON.parse(row.treatment_codes)
        : row.treatment_codes;

    if (Array.isArray(codes)) {
      for (const treatment of codes) {
        const code = treatment.code || treatment;
        if (!treatmentStats[code]) {
          treatmentStats[code] = {
            code,
            description: treatment.description || '',
            usage_count: 0,
            total_improvement: 0,
            avg_improvement: 0,
          };
        }

        const improvement = row.vas_pain_start - (row.vas_pain_end || row.vas_pain_start);
        treatmentStats[code].usage_count++;
        treatmentStats[code].total_improvement += improvement;
      }
    }
  }

  // Calculate averages
  const stats = Object.values(treatmentStats).map((stat) => ({
    ...stat,
    avg_improvement:
      stat.usage_count > 0 ? Math.round((stat.total_improvement / stat.usage_count) * 10) / 10 : 0,
  }));

  // Sort by avg improvement
  stats.sort((a, b) => b.avg_improvement - a.avg_improvement);

  return stats;
};

/**
 * Get cohort analysis
 * Compare outcomes across different patient groups
 */
export const getCohortAnalysis = async (organizationId, options = {}) => {
  const {
    groupBy = 'age_group', // age_group, gender, diagnosis
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
  } = options;

  let groupColumn;
  switch (groupBy) {
    case 'age_group':
      groupColumn = `CASE
        WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 30 THEN 'Under 30'
        WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 50 THEN '30-49'
        WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 70 THEN '50-69'
        ELSE '70+'
      END`;
      break;
    case 'gender':
      groupColumn = 'p.gender';
      break;
    default:
      groupColumn = 'p.category';
  }

  const result = await query(
    `SELECT
      ${groupColumn} as cohort,
      COUNT(DISTINCT ce.patient_id) as patient_count,
      COUNT(ce.id) as encounter_count,
      AVG(ce.vas_pain_start) as avg_initial_pain,
      AVG(COALESCE(ce.vas_pain_end, ce.vas_pain_start)) as avg_final_pain,
      AVG(ce.vas_pain_start - COALESCE(ce.vas_pain_end, ce.vas_pain_start)) as avg_pain_reduction
    FROM clinical_encounters ce
    JOIN patients p ON p.id = ce.patient_id
    WHERE ce.organization_id = $1
      AND ce.encounter_date >= $2
      AND ce.encounter_date <= $3
      AND ce.vas_pain_start IS NOT NULL
    GROUP BY cohort
    ORDER BY cohort`,
    [organizationId, startDate, endDate]
  );

  return result.rows.map((row) => ({
    cohort: row.cohort,
    patient_count: parseInt(row.patient_count),
    encounter_count: parseInt(row.encounter_count),
    avg_initial_pain: Math.round(parseFloat(row.avg_initial_pain) * 10) / 10,
    avg_final_pain: Math.round(parseFloat(row.avg_final_pain) * 10) / 10,
    avg_pain_reduction: Math.round(parseFloat(row.avg_pain_reduction) * 10) / 10,
    improvement_rate:
      Math.round((parseFloat(row.avg_pain_reduction) / parseFloat(row.avg_initial_pain)) * 1000) /
      10,
  }));
};

/**
 * Get longitudinal patient data for charts
 */
export const getPatientLongitudinalData = async (organizationId, patientId) => {
  const result = await query(
    `SELECT
      ce.encounter_date,
      ce.vas_pain_start,
      ce.vas_pain_end,
      cm.rom_measurements,
      cm.functional_tests
    FROM clinical_encounters ce
    LEFT JOIN clinical_measurements cm ON cm.encounter_id = ce.id
    WHERE ce.organization_id = $1
      AND ce.patient_id = $2
    ORDER BY ce.encounter_date ASC`,
    [organizationId, patientId]
  );

  return result.rows;
};

/**
 * Predict treatment outcome using simple heuristics
 * (In production, this could use ML models)
 */
export const predictTreatmentOutcome = async (organizationId, patientId, _proposedTreatment) => {
  // Get patient's historical response to similar treatments
  const historyResult = await query(
    `SELECT
      ce.vas_pain_start,
      ce.vas_pain_end,
      fm.treatment_codes
    FROM clinical_encounters ce
    JOIN financial_metrics fm ON fm.encounter_id = ce.id
    WHERE ce.organization_id = $1
      AND ce.patient_id = $2
      AND ce.vas_pain_start IS NOT NULL
    ORDER BY ce.encounter_date DESC
    LIMIT 10`,
    [organizationId, patientId]
  );

  if (historyResult.rows.length === 0) {
    return {
      prediction: 'UNKNOWN',
      confidence: 0,
      message: 'No historical data available for this patient',
    };
  }

  // Calculate average improvement
  const avgImprovement =
    historyResult.rows.reduce((sum, row) => {
      const improvement = row.vas_pain_start - (row.vas_pain_end || row.vas_pain_start);
      return sum + improvement;
    }, 0) / historyResult.rows.length;

  // Simple prediction logic
  let prediction, confidence;
  if (avgImprovement > 3) {
    prediction = 'EXCELLENT';
    confidence = 85;
  } else if (avgImprovement > 2) {
    prediction = 'GOOD';
    confidence = 70;
  } else if (avgImprovement > 1) {
    prediction = 'MODERATE';
    confidence = 60;
  } else {
    prediction = 'POOR';
    confidence = 50;
  }

  return {
    prediction,
    confidence,
    avg_historical_improvement: Math.round(avgImprovement * 10) / 10,
    message: `Based on ${historyResult.rows.length} previous encounters`,
  };
};

export default {
  getPatientOutcomeSummary,
  getDiagnosisOutcomeStats,
  getTreatmentOutcomeStats,
  getCohortAnalysis,
  getPatientLongitudinalData,
  predictTreatmentOutcome,
};
