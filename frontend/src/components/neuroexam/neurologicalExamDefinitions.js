/**
 * Neurological Examination Definitions
 * Thin wrapper: data from JSON, functions preserved for backward compatibility
 */

import EXAM_CLUSTERS from './neurologicalExamDefinitions.json';

export { EXAM_CLUSTERS };

/**
 * Determine if a test is positive based on criteria
 */
function isTestPositive(test, testResult) {
  if (!testResult || !testResult.criteria) {
    return false;
  }
  const checkedCriteria = Object.keys(testResult.criteria).filter((k) => testResult.criteria[k]);
  const hasNonExclusivePositive = checkedCriteria.some((criterionId) => {
    const criterion = test.criteria.find((c) => c.id === criterionId);
    return criterion && !criterion.exclusive;
  });
  return hasNonExclusivePositive;
}

/**
 * Get interpretation based on score
 */
function getInterpretation(interpretations, score) {
  for (const [level, config] of Object.entries(interpretations)) {
    if (config.min !== undefined && config.max !== undefined) {
      if (score >= config.min && score <= config.max) {
        return { level, ...config };
      }
    } else if (config.min !== undefined && score >= config.min) {
      return { level, ...config };
    }
  }
  return null;
}

/**
 * Calculate cluster score from test results
 */
export function calculateClusterScore(clusterId, testResults) {
  const cluster = EXAM_CLUSTERS[clusterId];
  if (!cluster || !cluster.diagnosticCriteria) {
    return { score: 0, total: 0, interpretation: null };
  }

  let positiveTests = 0;
  const total = cluster.diagnosticCriteria.total;

  cluster.tests.forEach((test) => {
    const testResult = testResults[test.id];
    if (testResult && isTestPositive(test, testResult)) {
      positiveTests++;
    }
  });

  const interpretation = getInterpretation(
    cluster.diagnosticCriteria.interpretation,
    positiveTests
  );

  return {
    score: positiveTests,
    total,
    threshold: cluster.diagnosticCriteria.threshold,
    interpretation,
    meetsThreshold: positiveTests >= cluster.diagnosticCriteria.threshold,
    sensitivity: cluster.diagnosticCriteria.sensitivity,
    specificity: cluster.diagnosticCriteria.specificity,
  };
}

/**
 * Check for red flags in test results
 */
export function checkRedFlags(testResults) {
  const redFlags = [];

  Object.entries(EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    if (cluster.redFlags) {
      cluster.redFlags.items.forEach((flag) => {
        const flagResult = testResults[`${clusterId}_redFlag_${flag.id}`];
        if (flagResult) {
          redFlags.push({
            clusterId,
            clusterName: cluster.name,
            flag: flag.label,
            action: cluster.criticalAction || cluster.referralAction,
          });
        }
      });
    }

    if (cluster.tests) {
      cluster.tests.forEach((test) => {
        if (test.redFlag) {
          const testResult = testResults[test.id];
          if (testResult && isTestPositive(test, testResult)) {
            redFlags.push({
              clusterId,
              clusterName: cluster.name,
              testId: test.id,
              testName: test.name,
              interpretation: test.interpretation,
              action: cluster.criticalAction || cluster.referralAction,
            });
          }
        }
      });
    }
  });

  return redFlags;
}

/**
 * Generate clinical narrative from test results
 */
export function generateNarrative(testResults, lang = 'no') {
  const narratives = [];

  Object.entries(EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    const clusterResults = [];

    cluster.tests?.forEach((test) => {
      const testResult = testResults[test.id];
      if (testResult && testResult.criteria) {
        const positiveFindings = [];

        Object.entries(testResult.criteria).forEach(([criterionId, isChecked]) => {
          if (isChecked) {
            const criterion = test.criteria.find((c) => c.id === criterionId);
            if (criterion && !criterion.exclusive) {
              positiveFindings.push(criterion.label[lang]);
            }
          }
        });

        if (positiveFindings.length > 0) {
          clusterResults.push({
            testName: test.name[lang],
            findings: positiveFindings,
            interpretation: test.interpretation?.[lang],
          });
        }
      }
    });

    if (clusterResults.length > 0) {
      const score = calculateClusterScore(clusterId, testResults);
      narratives.push({
        clusterName: cluster.name[lang],
        score: `${score.score}/${score.total}`,
        interpretation: score.interpretation?.label?.[lang],
        tests: clusterResults,
      });
    }
  });

  return narratives;
}

/**
 * Format narrative for clinical documentation
 */
export function formatNarrativeForSOAP(narratives, _lang = 'no') {
  if (narratives.length === 0) {
    return '';
  }

  const lines = [];

  narratives.forEach((cluster) => {
    lines.push(`\n**${cluster.clusterName}** (Score: ${cluster.score})`);
    if (cluster.interpretation) {
      lines.push(`Tolkning: ${cluster.interpretation}`);
    }

    cluster.tests.forEach((test) => {
      lines.push(`- ${test.testName}: ${test.findings.join(', ')}`);
      if (test.interpretation) {
        lines.push(`  \u2192 ${test.interpretation}`);
      }
    });
  });

  return lines.join('\n');
}

/**
 * Determine BPPV type and affected side from test results
 */
export function diagnoseBPPV(testResults) {
  const results = {
    type: null,
    affectedSide: null,
    confidence: 'low',
    treatment: null,
  };

  const dhRight = testResults['dix_hallpike_right'];
  const dhLeft = testResults['dix_hallpike_left'];

  if (dhRight?.criteria?.geotropic_torsional) {
    results.type = 'posterior';
    results.affectedSide = 'right';
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.posterior.treatment;
  } else if (dhLeft?.criteria?.geotropic_torsional) {
    results.type = 'posterior';
    results.affectedSide = 'left';
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.posterior.treatment;
  }

  const srRight = testResults['supine_roll_right'];
  const srLeft = testResults['supine_roll_left'];

  if (srRight?.criteria?.geotropic_horizontal || srLeft?.criteria?.geotropic_horizontal) {
    results.type = 'lateral_geotropic';
    if (srRight?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'right';
    } else if (srLeft?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'left';
    }
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.lateral_geotropic.treatment;
  } else if (srRight?.criteria?.ageotropic_horizontal || srLeft?.criteria?.ageotropic_horizontal) {
    results.type = 'lateral_ageotropic';
    if (srRight?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'left';
    } else if (srLeft?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'right';
    }
    results.confidence = 'moderate';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.lateral_ageotropic.treatment;
  }

  const dhh = testResults['deep_head_hanging'];
  if (dhh?.criteria?.downbeating) {
    results.type = 'anterior';
    results.confidence = 'moderate';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.anterior.treatment;
  }

  return results;
}

export default EXAM_CLUSTERS;
