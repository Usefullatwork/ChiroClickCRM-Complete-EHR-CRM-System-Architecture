/**
 * Orthopedic Examination Definitions
 * Thin wrapper: data from JSON, functions preserved for backward compatibility
 */

import ORTHO_EXAM_CLUSTERS from './orthopedicExamDefinitions.json';

export { ORTHO_EXAM_CLUSTERS };

/**
 * Calculate cluster score based on test results
 */
export function calculateOrthoClusterScore(clusterId, testResults) {
  const cluster = ORTHO_EXAM_CLUSTERS[clusterId];
  if (!cluster) {
    return null;
  }

  const positiveTests = cluster.tests.filter((test) => testResults[test.id]?.result === 'positive');

  const score = {
    clusterId,
    clusterName: cluster.name,
    positive: positiveTests.length,
    total: cluster.tests.length,
    threshold: cluster.diagnosticCriteria.threshold,
    meetsThreshold: positiveTests.length >= cluster.diagnosticCriteria.threshold,
    interpretation: cluster.diagnosticCriteria.interpretation,
    positiveTests: positiveTests.map((t) => t.name),
    isRedFlagCluster: cluster.redFlagCluster || false,
  };

  return score;
}

/**
 * Check for red flags in test results
 */
export function checkOrthoRedFlags(testResults) {
  const redFlags = [];

  Object.entries(ORTHO_EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    cluster.tests.forEach((test) => {
      if (test.redFlag && testResults[test.id]?.result === 'positive') {
        redFlags.push({
          clusterId,
          testId: test.id,
          testName: test.name,
          condition: test.redFlagCondition,
          urgency: cluster.urgency || 'URGENT',
          action:
            cluster.urgency === 'IMMEDIATE'
              ? 'AKUTT HENVISNING - Ring legevakt/ambulanse'
              : 'Henvisning til bildediagnostikk/spesialist',
        });
      }
    });

    if (cluster.redFlagCluster) {
      const score = calculateOrthoClusterScore(clusterId, testResults);
      if (score?.meetsThreshold) {
        redFlags.push({
          clusterId,
          clusterName: cluster.name,
          urgency: cluster.urgency || 'URGENT',
          action:
            cluster.urgency === 'IMMEDIATE'
              ? 'AKUTT HENVISNING P\u00c5KREVD'
              : 'Henvisning til spesialist anbefalt',
        });
      }
    }
  });

  return redFlags;
}

/**
 * Generate clinical narrative from orthopedic exam
 */
export function generateOrthoNarrative(examData, language = 'no') {
  const lines = [];
  const lang = language === 'no' ? 'no' : 'en';

  Object.entries(examData.clusterResults || {}).forEach(([clusterId, results]) => {
    const cluster = ORTHO_EXAM_CLUSTERS[clusterId];
    if (!cluster) {
      return;
    }

    const score = calculateOrthoClusterScore(clusterId, results);
    if (!score) {
      return;
    }

    lines.push(`\n**${cluster.name[lang]}** (${score.positive}/${score.total}):`);

    cluster.tests.forEach((test) => {
      const result = results[test.id];
      if (result?.result === 'positive') {
        let testLine = `- ${test.name[lang]}: ${lang === 'no' ? 'Positiv' : 'Positive'}`;
        if (result.side) {
          testLine += ` (${result.side})`;
        }
        if (result.notes) {
          testLine += ` - ${result.notes}`;
        }
        lines.push(testLine);
      } else if (result?.result === 'negative') {
        lines.push(`- ${test.name[lang]}: ${lang === 'no' ? 'Negativ' : 'Negative'}`);
      }
    });

    if (score.meetsThreshold) {
      lines.push(`\n*${score.interpretation[lang]}*`);
    }
  });

  if (examData.redFlags?.length > 0) {
    lines.push(`\n**${lang === 'no' ? 'R\u00d8DE FLAGG' : 'RED FLAGS'}:**`);
    examData.redFlags.forEach((rf) => {
      lines.push(`- ${rf.testName?.[lang] || rf.clusterName?.[lang]}: ${rf.action}`);
    });
  }

  return lines.join('\n');
}

/**
 * Get clusters by body region
 */
export function getClustersByRegion(region) {
  return Object.values(ORTHO_EXAM_CLUSTERS).filter((c) => c.region === region);
}

/**
 * Get all available body regions
 */
export function getAvailableRegions() {
  const regions = new Set();
  Object.values(ORTHO_EXAM_CLUSTERS).forEach((c) => regions.add(c.region));
  return Array.from(regions);
}

export default ORTHO_EXAM_CLUSTERS;
