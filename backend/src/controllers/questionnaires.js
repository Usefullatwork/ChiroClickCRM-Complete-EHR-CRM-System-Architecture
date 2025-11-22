/**
 * Questionnaires Controller
 * API endpoints for clinical outcome questionnaires
 */

import * as questionnaireService from '../services/questionnaires.js';
import logger from '../config/logger.js';

/**
 * GET /api/questionnaires
 * Get all available questionnaires
 */
export const getQuestionnaires = async (req, res) => {
  try {
    const { organization_id } = req.auth;
    const { body_region, language, active_only } = req.query;

    const questionnaires = await questionnaireService.getAllQuestionnaires(
      organization_id,
      {
        bodyRegion: body_region,
        language,
        activeOnly: active_only !== 'false'
      }
    );

    res.json({
      success: true,
      data: questionnaires,
      count: questionnaires.length
    });
  } catch (error) {
    logger.error('Error fetching questionnaires:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questionnaires',
      message: error.message
    });
  }
};

/**
 * GET /api/questionnaires/:code
 * Get specific questionnaire by code
 */
export const getQuestionnaireByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const questionnaire = await questionnaireService.getQuestionnaireByCode(code);

    res.json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    logger.error(`Error fetching questionnaire ${req.params.code}:`, error);
    res.status(404).json({
      success: false,
      error: 'Questionnaire not found',
      message: error.message
    });
  }
};

/**
 * POST /api/questionnaires/responses
 * Submit a questionnaire response
 */
export const submitResponse = async (req, res) => {
  try {
    const { user_id } = req.auth;
    const {
      patient_id,
      encounter_id,
      questionnaire_id,
      responses
    } = req.body;

    // Validate required fields
    if (!patient_id || !questionnaire_id || !responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'patient_id, questionnaire_id, and responses are required'
      });
    }

    const response = await questionnaireService.submitQuestionnaireResponse({
      patientId: patient_id,
      encounterId: encounter_id,
      questionnaireId: questionnaire_id,
      responses,
      administeredBy: user_id
    });

    res.status(201).json({
      success: true,
      data: response,
      message: 'Questionnaire response submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting questionnaire response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit questionnaire response',
      message: error.message
    });
  }
};

/**
 * GET /api/questionnaires/responses/:id
 * Get a specific questionnaire response
 */
export const getResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await questionnaireService.getQuestionnaireResponse(id);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error(`Error fetching questionnaire response ${req.params.id}:`, error);
    res.status(404).json({
      success: false,
      error: 'Questionnaire response not found',
      message: error.message
    });
  }
};

/**
 * GET /api/patients/:patientId/questionnaires
 * Get patient's questionnaire history
 */
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { questionnaire_code } = req.query;

    const history = await questionnaireService.getPatientQuestionnaireHistory(
      patientId,
      questionnaire_code
    );

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error(`Error fetching questionnaire history for patient ${req.params.patientId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questionnaire history',
      message: error.message
    });
  }
};

/**
 * GET /api/outcomes/diagnosis/:icpcCode
 * Get aggregate outcome data by diagnosis
 */
export const getOutcomesByDiagnosis = async (req, res) => {
  try {
    const { organization_id } = req.auth;
    const { icpcCode } = req.params;

    const outcomes = await questionnaireService.getOutcomesByDiagnosis(
      organization_id,
      icpcCode
    );

    res.json({
      success: true,
      data: outcomes
    });
  } catch (error) {
    logger.error(`Error fetching outcomes for diagnosis ${req.params.icpcCode}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diagnosis outcomes',
      message: error.message
    });
  }
};

/**
 * GET /api/patients/:patientId/treatment-effectiveness
 * Calculate treatment effectiveness based on outcome measures
 */
export const getTreatmentEffectiveness = async (req, res) => {
  try {
    const { patientId } = req.params;

    const effectiveness = await questionnaireService.calculateTreatmentEffectiveness(patientId);

    res.json({
      success: true,
      data: effectiveness
    });
  } catch (error) {
    logger.error(`Error calculating treatment effectiveness for patient ${req.params.patientId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate treatment effectiveness',
      message: error.message
    });
  }
};

export default {
  getQuestionnaires,
  getQuestionnaireByCode,
  submitResponse,
  getResponse,
  getPatientHistory,
  getOutcomesByDiagnosis,
  getTreatmentEffectiveness
};
