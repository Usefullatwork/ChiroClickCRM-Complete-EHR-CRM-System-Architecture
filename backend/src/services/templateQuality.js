/**
 * Template Quality Scoring and Governance Service
 * Ensures clinical templates meet quality standards before use in AI training
 * Prevents poor quality or unsafe templates from polluting the AI model
 */

import pool from '../config/database.js';

/**
 * Quality scoring criteria weights
 */
const QUALITY_WEIGHTS = {
  LENGTH: 0.2,
  MEDICAL_TERMINOLOGY: 0.25,
  STRUCTURE: 0.15,
  COMPLETENESS: 0.15,
  USAGE_HISTORY: 0.15,
  PII_CHECK: 0.1  // Negative score if PII found
};

/**
 * Norwegian medical terminology patterns for chiropractic care
 */
const MEDICAL_TERMS = {
  // Examination terms
  examination: [
    /palpasjon|palperer|palpabel/gi,
    /inspeksjon|observasjon|visuell/gi,
    /rom|bevegelsesutslag|mobilitet/gi,
    /motorikk|muskelstyrke|kraft/gi,
    /sensibilitet|følelse/gi,
    /refleks(er)?/gi
  ],

  // Pain descriptors
  pain: [
    /smerte(r)?|vondt|ømhet/gi,
    /vas|nrs|smerte.*?skala/gi,
    /akutt|kronisk|subakutt/gi,
    /radierende|utstrålende/gi,
    /konstant|intermitterende/gi
  ],

  // Anatomical regions
  anatomy: [
    /(cervical|thorakal|lumbal|sacral)/gi,
    /nakke|rygg|skulder|hofte|kne/gi,
    /(c\d|th\d|l\d|s\d)/gi, // Vertebral levels
    /bilateral|unilateral|venstre|høyre/gi,
    /paravertebral|facett/gi
  ],

  // Treatment techniques
  treatment: [
    /hvla|manipulasjon/gi,
    /mobilisering|bvm/gi,
    /myofascial|triggerpunkt/gi,
    /tøyning|stretch/gi,
    /aktivering|stabilisering/gi,
    /tape|taping/gi
  ],

  // Clinical findings
  findings: [
    /hyperton|trigger.*?punkt|fibrose/gi,
    /hypo.*?mobil|restrik(sjon|tert)/gi,
    /pareser?|svakhet|kraftnedsettelse/gi,
    /inflammasjon|betennelse|ery tem/gi,
    /ødem|hevelse/gi
  ]
};

/**
 * Calculate comprehensive quality score for a template
 */
export const scoreTemplateQuality = (template) => {
  const scores = {
    length: 0,
    medicalTerminology: 0,
    structure: 0,
    completeness: 0,
    usageHistory: 0,
    piiCheck: 1, // Start at 1, deduct if PII found
    details: {}
  };

  const text = template.template_text || '';

  // 1. Length Score (optimal: 50-500 characters)
  const length = text.length;
  if (length >= 50 && length <= 500) {
    scores.length = 1.0;
  } else if (length >= 30 && length <= 1000) {
    scores.length = 0.7;
  } else if (length < 20) {
    scores.length = 0.0; // Too short
  } else if (length > 2000) {
    scores.length = 0.3; // Too long
  } else {
    scores.length = 0.5;
  }
  scores.details.length = { value: length, score: scores.length };

  // 2. Medical Terminology Score
  let termCategories = 0;
  let totalTermsFound = 0;

  Object.entries(MEDICAL_TERMS).forEach(([category, patterns]) => {
    let categoryMatches = 0;
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        categoryMatches += matches.length;
        totalTermsFound += matches.length;
      }
    });
    if (categoryMatches > 0) termCategories++;
  });

  scores.medicalTerminology = Math.min(
    (termCategories / Object.keys(MEDICAL_TERMS).length) + (totalTermsFound * 0.05),
    1.0
  );
  scores.details.medicalTerminology = {
    categories: termCategories,
    totalTerms: totalTermsFound,
    score: scores.medicalTerminology
  };

  // 3. Structure Score (lists, colons, organization)
  let structurePoints = 0;

  if (text.includes(':')) structurePoints += 0.3; // Has labels
  if (text.includes('\n') || text.includes('\\n')) structurePoints += 0.2; // Multi-line
  if (/\d+/.test(text)) structurePoints += 0.2; // Contains numbers (measurements, scores)
  if (/[-•*]/.test(text)) structurePoints += 0.2; // Has bullet points
  if (/[A-ZÆØÅ][a-zæøå]+:/.test(text)) structurePoints += 0.1; // Proper labeling

  scores.structure = Math.min(structurePoints, 1.0);
  scores.details.structure = { points: structurePoints };

  // 4. Completeness Score (has enough information)
  let completenessPoints = 0;

  // Should have some description
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 10) completenessPoints += 0.3;
  if (wordCount >= 20) completenessPoints += 0.2;

  // Should have clinical context
  if (/smerte|vondt|plager/gi.test(text)) completenessPoints += 0.2;

  // Should have some anatomical reference
  if (/(cervical|thorakal|lumbal|nakke|rygg|skulder)/gi.test(text)) completenessPoints += 0.2;

  // Should not be too repetitive
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/));
  const repetitionRatio = uniqueWords.size / wordCount;
  if (repetitionRatio > 0.5) completenessPoints += 0.1;

  scores.completeness = Math.min(completenessPoints, 1.0);
  scores.details.completeness = { wordCount, uniqueRatio: repetitionRatio };

  // 5. Usage History Score (if available)
  if (template.usage_count !== undefined) {
    if (template.usage_count >= 10) scores.usageHistory = 1.0;
    else if (template.usage_count >= 5) scores.usageHistory = 0.7;
    else if (template.usage_count >= 2) scores.usageHistory = 0.4;
    else scores.usageHistory = 0.1;
  } else {
    scores.usageHistory = 0.5; // Neutral if no data
  }
  scores.details.usageHistory = { usageCount: template.usage_count };

  // 6. PII Check (CRITICAL - automatic failure if PII found)
  const piiPatterns = [
    { pattern: /\b\d{11}\b/g, type: 'Personnummer', severity: 'CRITICAL' },
    { pattern: /\b\d{8}\b/g, type: 'Telefonnummer', severity: 'MODERATE' },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'E-post', severity: 'MODERATE' },
    { pattern: /\b[A-ZÆØÅ][a-zæøå]+ [A-ZÆØÅ][a-zæøå]+\b/g, type: 'Mulig fullt navn', severity: 'LOW' }
  ];

  const piiIssues = [];
  piiPatterns.forEach(({ pattern, type, severity }) => {
    const matches = text.match(pattern);
    if (matches) {
      piiIssues.push({ type, severity, count: matches.length });
      if (severity === 'CRITICAL') {
        scores.piiCheck = 0; // Automatic fail
      } else if (severity === 'MODERATE') {
        scores.piiCheck -= 0.5;
      } else {
        scores.piiCheck -= 0.2;
      }
    }
  });

  scores.piiCheck = Math.max(0, scores.piiCheck);
  scores.details.piiCheck = { issues: piiIssues, passed: piiIssues.length === 0 };

  // Calculate weighted total score
  const totalScore =
    scores.length * QUALITY_WEIGHTS.LENGTH +
    scores.medicalTerminology * QUALITY_WEIGHTS.MEDICAL_TERMINOLOGY +
    scores.structure * QUALITY_WEIGHTS.STRUCTURE +
    scores.completeness * QUALITY_WEIGHTS.COMPLETENESS +
    scores.usageHistory * QUALITY_WEIGHTS.USAGE_HISTORY +
    scores.piiCheck * QUALITY_WEIGHTS.PII_CHECK;

  return {
    totalScore: Math.max(0, Math.min(1, totalScore)),
    scores,
    recommendation: getRecommendation(totalScore, scores),
    requiresReview: totalScore < 0.6 || scores.piiCheck < 1.0
  };
};

/**
 * Get recommendation based on score
 */
const getRecommendation = (totalScore, scores) => {
  if (scores.piiCheck < 1.0) {
    return {
      status: 'REJECT',
      reason: 'PII oppdaget - må fjernes før bruk',
      action: 'REMOVE_PII'
    };
  }

  if (totalScore >= 0.8) {
    return {
      status: 'APPROVED',
      reason: 'Høy kvalitet - klar for bruk',
      action: 'AUTO_APPROVE'
    };
  }

  if (totalScore >= 0.6) {
    return {
      status: 'REVIEW',
      reason: 'God kvalitet - anbefaler manuell gjennomgang',
      action: 'MANUAL_REVIEW'
    };
  }

  if (totalScore >= 0.4) {
    return {
      status: 'NEEDS_IMPROVEMENT',
      reason: 'Lav kvalitet - trenger forbedring',
      action: 'REQUEST_REVISION'
    };
  }

  return {
    status: 'REJECT',
    reason: 'For lav kvalitet for bruk i AI-trening',
    action: 'REJECT'
  };
};

/**
 * Score a batch of templates
 */
export const scoreBatchTemplates = async (templateIds = null) => {
  let query = `
    SELECT
      id,
      template_text,
      template_category,
      usage_count,
      quality_score as current_score
    FROM clinical_templates
  `;

  const params = [];
  if (templateIds && Array.isArray(templateIds)) {
    query += ' WHERE id = ANY($1)';
    params.push(templateIds);
  }

  const result = await pool.query(query, params);

  const scoredTemplates = result.rows.map(template => {
    const score = scoreTemplateQuality(template);
    return {
      id: template.id,
      category: template.template_category,
      oldScore: template.current_score,
      newScore: score.totalScore,
      recommendation: score.recommendation,
      requiresReview: score.requiresReview,
      details: score.scores.details
    };
  });

  return scoredTemplates;
};

/**
 * Update template quality scores in database
 */
export const updateTemplateScores = async (scoredTemplates) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const template of scoredTemplates) {
      await client.query(
        `UPDATE clinical_templates
         SET
           quality_score = $1,
           review_status = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [
          template.newScore,
          template.recommendation.status.toLowerCase(),
          template.id
        ]
      );
    }

    await client.query('COMMIT');

    return {
      updated: scoredTemplates.length,
      approved: scoredTemplates.filter(t => t.recommendation.status === 'APPROVED').length,
      needsReview: scoredTemplates.filter(t => t.requiresReview).length,
      rejected: scoredTemplates.filter(t => t.recommendation.status === 'REJECT').length
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get templates needing review
 */
export const getTemplatesNeedingReview = async (limit = 50) => {
  const result = await pool.query(
    `SELECT
      id,
      template_text,
      template_category,
      quality_score,
      review_status,
      usage_count,
      created_at
    FROM clinical_templates
    WHERE review_status IN ('pending', 'needs_improvement', 'review')
      OR quality_score < 0.6
    ORDER BY quality_score ASC, usage_count DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows.map(template => ({
    ...template,
    scoreAnalysis: scoreTemplateQuality(template)
  }));
};

/**
 * Approve template (manual review)
 */
export const approveTemplate = async (templateId, reviewerId, notes = null) => {
  await pool.query(
    `UPDATE clinical_templates
     SET
       review_status = 'approved',
       reviewed_by = $2,
       reviewed_at = NOW(),
       version = version + 1
     WHERE id = $1`,
    [templateId, reviewerId]
  );

  // Log the review
  await pool.query(
    `INSERT INTO template_reviews (
      template_id,
      reviewer_id,
      old_version,
      new_version,
      review_notes,
      approved,
      created_at
    )
    SELECT
      id,
      $2,
      version - 1,
      version,
      $3,
      true,
      NOW()
    FROM clinical_templates
    WHERE id = $1`,
    [templateId, reviewerId, notes]
  );

  return { success: true };
};

/**
 * Reject template with reason
 */
export const rejectTemplate = async (templateId, reviewerId, reason) => {
  await pool.query(
    `UPDATE clinical_templates
     SET
       review_status = 'rejected',
       reviewed_by = $2,
       reviewed_at = NOW()
     WHERE id = $1`,
    [templateId, reviewerId]
  );

  await pool.query(
    `INSERT INTO template_reviews (
      template_id,
      reviewer_id,
      review_notes,
      approved,
      created_at
    ) VALUES ($1, $2, $3, false, NOW())`,
    [templateId, reviewerId, reason]
  );

  return { success: true };
};

export default {
  scoreTemplateQuality,
  scoreBatchTemplates,
  updateTemplateScores,
  getTemplatesNeedingReview,
  approveTemplate,
  rejectTemplate
};
