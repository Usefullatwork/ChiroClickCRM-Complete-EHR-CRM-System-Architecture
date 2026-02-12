/**
 * Outcome Questionnaire Controller
 * Handles ODI, NDI, VAS, DASH, NPRS submission, retrieval, and trend analysis
 */

import { query } from '../config/database.js';
import { scoreQuestionnaire } from '../services/outcomeScoring.js';
import logger from '../utils/logger.js';

const VALID_TYPES = ['ODI', 'NDI', 'VAS', 'DASH', 'NPRS'];

/**
 * Submit a questionnaire response
 */
export const submitQuestionnaire = async (req, res) => {
  try {
    const { organizationId } = req;
    const userId = req.user?.id;
    const { patientId, encounterId, questionnaireType, rawAnswers, notes } = req.body;

    if (!patientId || !questionnaireType || rawAnswers === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, questionnaireType, rawAnswers',
      });
    }

    if (!VALID_TYPES.includes(questionnaireType)) {
      return res.status(400).json({
        error: `Invalid questionnaire type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    let result;
    try {
      result = scoreQuestionnaire(questionnaireType, rawAnswers);
    } catch (scoreError) {
      return res.status(400).json({ error: scoreError.message });
    }

    const insertResult = await query(
      `INSERT INTO questionnaire_responses
        (patient_id, organization_id, encounter_id, practitioner_id,
         questionnaire_type, raw_answers, calculated_score, max_possible_score,
         percentage_score, severity_category, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        patientId,
        organizationId,
        encounterId || null,
        userId || null,
        questionnaireType,
        JSON.stringify(rawAnswers),
        result.score,
        result.maxScore,
        result.percentage,
        result.severity,
        notes || null,
      ]
    );

    logger.info('Questionnaire submitted', {
      type: questionnaireType,
      patientId,
      score: result.score,
      severity: result.severity,
    });

    res.status(201).json({
      ...insertResult.rows[0],
      scoring: result,
    });
  } catch (error) {
    logger.error('Error in submitQuestionnaire:', error);
    res.status(500).json({ error: 'Failed to submit questionnaire' });
  }
};

/**
 * Get all questionnaires for a patient, optionally filtered by type
 */
export const getPatientQuestionnaires = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const { type, limit, offset } = req.query;

    let sql = `
      SELECT * FROM questionnaire_responses
      WHERE patient_id = $1 AND organization_id = $2
    `;
    const params = [patientId, organizationId];

    if (type && VALID_TYPES.includes(type)) {
      params.push(type);
      sql += ` AND questionnaire_type = $${params.length}`;
    }

    sql += ' ORDER BY completed_at DESC';

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }
    if (offset) {
      params.push(parseInt(offset, 10));
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error in getPatientQuestionnaires:', error);
    res.status(500).json({ error: 'Failed to get questionnaires' });
  }
};

/**
 * Get a single questionnaire by ID
 */
export const getQuestionnaireById = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM questionnaire_responses
       WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error in getQuestionnaireById:', error);
    res.status(500).json({ error: 'Failed to get questionnaire' });
  }
};

/**
 * Get trend data for a patient's questionnaire scores over time
 */
export const getPatientTrend = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const { type } = req.query;

    let sql = `
      SELECT id, questionnaire_type, calculated_score, max_possible_score,
             percentage_score, severity_category, completed_at
      FROM questionnaire_responses
      WHERE patient_id = $1 AND organization_id = $2
    `;
    const params = [patientId, organizationId];

    if (type && VALID_TYPES.includes(type)) {
      params.push(type);
      sql += ` AND questionnaire_type = $${params.length}`;
    }

    sql += ' ORDER BY completed_at ASC';

    const result = await query(sql, params);

    // Group by type for multi-line chart support
    const grouped = {};
    for (const row of result.rows) {
      const t = row.questionnaire_type;
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push({
        id: row.id,
        score: parseFloat(row.calculated_score),
        maxScore: parseFloat(row.max_possible_score),
        percentage: parseFloat(row.percentage_score),
        severity: row.severity_category,
        date: row.completed_at,
      });
    }

    res.json(grouped);
  } catch (error) {
    logger.error('Error in getPatientTrend:', error);
    res.status(500).json({ error: 'Failed to get trend data' });
  }
};

/**
 * Delete a questionnaire response
 */
export const deleteQuestionnaire = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM questionnaire_responses
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    logger.info('Questionnaire deleted', { id });
    res.json({ message: 'Questionnaire deleted', id });
  } catch (error) {
    logger.error('Error in deleteQuestionnaire:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
};

export default {
  submitQuestionnaire,
  getPatientQuestionnaires,
  getQuestionnaireById,
  getPatientTrend,
  deleteQuestionnaire,
};
