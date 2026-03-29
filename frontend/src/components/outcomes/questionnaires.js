/**
 * Outcome Measures - Validated Clinical Questionnaires
 * Thin wrapper: data from JSON, scoring functions preserved
 */

import QUESTIONNAIRES from './questionnaires.json';

export { QUESTIONNAIRES };

/**
 * Get interpretation level for a score
 */
function getInterpretation(questionnaire, score) {
  const interpretations = questionnaire.scoring.interpretation;
  return interpretations.find((i) => score >= i.min && score <= i.max) || interpretations[0];
}

/**
 * Calculate score for standard questionnaires (NDI, ODI)
 */
export function calculateScore(questionnaireId, answers) {
  const questionnaire = QUESTIONNAIRES[questionnaireId];
  if (!questionnaire) {
    return null;
  }

  if (questionnaire.type === 'slider' || questionnaire.type === 'numeric') {
    return {
      rawScore: answers.value || 0,
      percentage: ((answers.value || 0) / questionnaire.scoring.maxScore) * 100,
      interpretation: getInterpretation(questionnaire, answers.value || 0),
    };
  }

  const answeredSections = questionnaire.sections.filter(
    (s) => answers[s.id] !== undefined && !s.optional
  );
  const totalSections = questionnaire.sections.filter((s) => !s.optional).length;

  if (answeredSections.length === 0) {
    return null;
  }

  const rawScore = Object.values(answers).reduce((sum, val) => sum + (val || 0), 0);
  const maxPossible = answeredSections.length * 5;
  const percentage = (rawScore / maxPossible) * 100;

  return {
    rawScore,
    maxPossible,
    percentage: Math.round(percentage * 10) / 10,
    interpretation: getInterpretation(questionnaire, percentage),
    sectionsAnswered: answeredSections.length,
    sectionsTotal: totalSections,
  };
}

/**
 * Calculate FABQ subscale scores
 */
export function calculateFABQScore(answers) {
  const physicalItems = ['fabq2', 'fabq3', 'fabq4', 'fabq5'];
  const physicalScore = physicalItems.reduce((sum, id) => sum + (answers[id] || 0), 0);

  const workItems = ['fabq6', 'fabq7', 'fabq9', 'fabq10', 'fabq11', 'fabq12', 'fabq15'];
  const workScore = workItems.reduce((sum, id) => sum + (answers[id] || 0), 0);

  return {
    physical: {
      score: physicalScore,
      maxScore: 24,
      percentage: Math.round((physicalScore / 24) * 100),
      interpretation: physicalScore >= 15 ? 'high' : 'low',
    },
    work: {
      score: workScore,
      maxScore: 42,
      percentage: Math.round((workScore / 42) * 100),
      interpretation: workScore >= 25 ? 'high' : 'low',
    },
  };
}

/**
 * Calculate change between two assessments
 */
export function calculateChange(previousScore, currentScore, mcid) {
  const change = previousScore - currentScore;
  const percentChange = previousScore > 0 ? (change / previousScore) * 100 : 0;

  let significance = 'none';
  if (Math.abs(change) >= mcid) {
    significance = change > 0 ? 'improved' : 'worsened';
  }

  return {
    absoluteChange: change,
    percentChange: Math.round(percentChange * 10) / 10,
    significance,
    mcid,
    clinicallySignificant: Math.abs(change) >= mcid,
  };
}

/**
 * Calculate RMDQ score
 */
export function calculateRMDQScore(answers) {
  const rmdq = QUESTIONNAIRES.RMDQ;
  const checkedItems = rmdq.sections.filter((s) => answers[s.id] === true || answers[s.id] === 1);
  const rawScore = checkedItems.length;

  return {
    rawScore,
    maxScore: 24,
    percentage: Math.round((rawScore / 24) * 100),
    interpretation: getInterpretation(rmdq, rawScore),
  };
}

/**
 * Calculate STarT Back score
 */
export function calculateSTarTBackScore(answers) {
  const startBack = QUESTIONNAIRES.STARTBACK;

  let totalScore = 0;
  startBack.sections.forEach((section) => {
    if (answers[section.id] === 1 || answers[section.id] === true) {
      totalScore += 1;
    }
  });

  if (answers.start9 >= 3) {
    totalScore += 1;
  }

  let psychosocialScore = 0;
  ['start5', 'start6', 'start7', 'start8'].forEach((id) => {
    if (answers[id] === 1 || answers[id] === true) {
      psychosocialScore += 1;
    }
  });
  if (answers.start9 >= 3) {
    psychosocialScore += 1;
  }

  let riskLevel, interpretation;
  if (totalScore <= 3) {
    riskLevel = 'low';
    interpretation = startBack.scoring.interpretation[0];
  } else if (psychosocialScore <= 3) {
    riskLevel = 'medium';
    interpretation = startBack.scoring.interpretation[1];
  } else {
    riskLevel = 'high';
    interpretation = startBack.scoring.interpretation[2];
  }

  return {
    totalScore,
    psychosocialScore,
    maxTotalScore: 9,
    maxPsychosocialScore: 5,
    riskLevel,
    interpretation,
  };
}

/**
 * Calculate Bournemouth Questionnaire score
 */
export function calculateBQScore(answers) {
  const bq = QUESTIONNAIRES.BQ;
  let totalScore = 0;
  let answeredCount = 0;

  bq.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  if (answeredCount === 0) {
    return null;
  }

  const proratedScore = answeredCount < 7 ? (totalScore / answeredCount) * 7 : totalScore;

  return {
    rawScore: totalScore,
    proratedScore: Math.round(proratedScore * 10) / 10,
    maxScore: 70,
    percentage: Math.round((proratedScore / 70) * 100),
    interpretation: getInterpretation(bq, proratedScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Calculate DASH score
 */
export function calculateDASHScore(answers) {
  const dash = QUESTIONNAIRES.DASH;
  let totalScore = 0;
  let answeredCount = 0;

  dash.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null && !section.optional) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  const requiredItems = Math.ceil(dash.sections.filter((s) => !s.optional).length * 0.9);
  if (answeredCount < requiredItems) {
    return {
      error: true,
      message: {
        en: `At least ${requiredItems} items must be answered`,
        no: `Minst ${requiredItems} sp\u00f8rsm\u00e5l m\u00e5 besvares`,
      },
      itemsAnswered: answeredCount,
      requiredItems,
    };
  }

  const dashScore = (totalScore / answeredCount - 1) * 25;

  return {
    rawScore: Math.round(dashScore * 10) / 10,
    maxScore: 100,
    percentage: Math.round(dashScore),
    interpretation: getInterpretation(dash, dashScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Calculate HIT-6 score
 */
export function calculateHIT6Score(answers) {
  const hit6 = QUESTIONNAIRES.HIT6;
  let totalScore = 0;
  let answeredCount = 0;

  hit6.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  if (answeredCount < 6) {
    return {
      error: true,
      message: {
        en: 'All 6 items must be answered',
        no: 'Alle 6 sp\u00f8rsm\u00e5l m\u00e5 besvares',
      },
      itemsAnswered: answeredCount,
    };
  }

  return {
    rawScore: totalScore,
    minScore: 36,
    maxScore: 78,
    interpretation: getInterpretation(hit6, totalScore),
  };
}

/**
 * Calculate Quebec Back Pain Disability Scale score
 */
export function calculateQBPDSScore(answers) {
  const qbpds = QUESTIONNAIRES.QBPDS;
  let totalScore = 0;
  let answeredCount = 0;

  qbpds.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  if (answeredCount === 0) {
    return null;
  }

  const proratedScore = answeredCount < 20 ? (totalScore / answeredCount) * 20 : totalScore;

  return {
    rawScore: totalScore,
    proratedScore: Math.round(proratedScore),
    maxScore: 100,
    percentage: Math.round(proratedScore),
    interpretation: getInterpretation(qbpds, proratedScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Universal scoring function for all questionnaires
 */
export function calculateQuestionnaireScore(questionnaireId, answers) {
  switch (questionnaireId) {
    case 'RMDQ':
      return calculateRMDQScore(answers);
    case 'STARTBACK':
      return calculateSTarTBackScore(answers);
    case 'BQ':
      return calculateBQScore(answers);
    case 'DASH':
      return calculateDASHScore(answers);
    case 'HIT6':
      return calculateHIT6Score(answers);
    case 'QBPDS':
      return calculateQBPDSScore(answers);
    case 'FABQ':
      return calculateFABQScore(answers);
    default:
      return calculateScore(questionnaireId, answers);
  }
}
