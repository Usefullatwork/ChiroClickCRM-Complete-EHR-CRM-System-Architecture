/**
 * AI Controller
 * Handles AI-powered clinical intelligence requests
 */

import * as aiService from '../services/ai.js';
import logger from '../utils/logger.js';
import { RecordFeedbackCommand, recordFeedbackHandler } from '../application/commands/RecordFeedbackCommand.js';
import { GetAIMetricsQuery, getAIMetricsHandler, getAIDashboardHandler } from '../application/queries/GetAIMetricsQuery.js';
import { circuitBreakerRegistry, CircuitBreakers } from '../infrastructure/resilience/CircuitBreaker.js';
import { aiRetrainingService } from '../application/services/AIRetrainingService.js';

export const spellCheck = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await aiService.spellCheckNorwegian(text);
    res.json(result);
  } catch (error) {
    logger.error('Error in spellCheck controller:', error);
    res.status(500).json({ error: error.message || 'Spell check failed' });
  }
};

export const generateSOAPSuggestion = async (req, res) => {
  try {
    const { chiefComplaint, section } = req.body;

    if (!chiefComplaint || !section) {
      return res.status(400).json({ error: 'Chief complaint and section are required' });
    }

    if (!['subjective', 'objective', 'assessment', 'plan'].includes(section)) {
      return res.status(400).json({ error: 'Invalid section. Must be: subjective, objective, assessment, or plan' });
    }

    const result = await aiService.generateSOAPSuggestions(chiefComplaint, section);
    res.json(result);
  } catch (error) {
    logger.error('Error in generateSOAPSuggestion controller:', error);
    res.status(500).json({ error: error.message || 'SOAP suggestion failed' });
  }
};

export const suggestDiagnosis = async (req, res) => {
  try {
    const { soapData } = req.body;

    if (!soapData) {
      return res.status(400).json({ error: 'SOAP data is required' });
    }

    const result = await aiService.suggestDiagnosisCodes(soapData);
    res.json(result);
  } catch (error) {
    logger.error('Error in suggestDiagnosis controller:', error);
    res.status(500).json({ error: error.message || 'Diagnosis suggestion failed' });
  }
};

export const analyzeRedFlags = async (req, res) => {
  try {
    const { patientData, soapData } = req.body;

    if (!patientData || !soapData) {
      return res.status(400).json({ error: 'Patient data and SOAP data are required' });
    }

    const result = await aiService.analyzeRedFlags(patientData, soapData);
    res.json(result);
  } catch (error) {
    logger.error('Error in analyzeRedFlags controller:', error);
    res.status(500).json({ error: error.message || 'Red flag analysis failed' });
  }
};

export const generateClinicalSummary = async (req, res) => {
  try {
    const { encounter } = req.body;

    if (!encounter) {
      return res.status(400).json({ error: 'Encounter data is required' });
    }

    const result = await aiService.generateClinicalSummary(encounter);
    res.json(result);
  } catch (error) {
    logger.error('Error in generateClinicalSummary controller:', error);
    res.status(500).json({ error: error.message || 'Clinical summary generation failed' });
  }
};

export const recordOutcomeFeedback = async (req, res) => {
  try {
    const { encounterId, outcomeData } = req.body;

    if (!encounterId || !outcomeData) {
      return res.status(400).json({ error: 'Encounter ID and outcome data are required' });
    }

    const result = await aiService.learnFromOutcome(encounterId, outcomeData);
    res.json(result);
  } catch (error) {
    logger.error('Error in recordOutcomeFeedback controller:', error);
    res.status(500).json({ error: error.message || 'Outcome feedback recording failed' });
  }
};

export const getAIStatus = async (req, res) => {
  try {
    const status = await aiService.getAIStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error in getAIStatus controller:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
};

/**
 * Record suggestion feedback (accept/reject/modify)
 * Uses CQRS Command pattern
 */
export const recordSuggestionFeedback = async (req, res) => {
  try {
    const { suggestionId, action, originalContent, modifiedContent, reason, responseTime } = req.body;

    if (!suggestionId || !action) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'suggestionId and action are required'
      });
    }

    const command = new RecordFeedbackCommand({
      suggestionId,
      action,
      originalContent,
      modifiedContent,
      reason,
      responseTime,
      userId: req.user?.id,
      organizationId: req.organizationId
    });

    const result = await recordFeedbackHandler.handle(command);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error recording suggestion feedback:', error);
    res.status(500).json({
      error: 'FeedbackError',
      message: error.message || 'Failed to record feedback'
    });
  }
};

/**
 * Get comprehensive AI metrics
 * Uses CQRS Query pattern
 */
export const getAIMetrics = async (req, res) => {
  try {
    const { days = 7, includeHistory = true, includeCircuitStatus = true } = req.query;

    const query = new GetAIMetricsQuery({
      days: parseInt(days, 10),
      includeHistory: includeHistory === 'true' || includeHistory === true,
      includeCircuitStatus: includeCircuitStatus === 'true' || includeCircuitStatus === true
    });

    const metrics = await getAIMetricsHandler.handle(query);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting AI metrics:', error);
    res.status(500).json({
      error: 'MetricsError',
      message: error.message || 'Failed to get AI metrics'
    });
  }
};

/**
 * Get simplified AI dashboard metrics
 */
export const getAIDashboardMetrics = async (req, res) => {
  try {
    const metrics = await getAIDashboardHandler.handle({
      organizationId: req.organizationId
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting AI dashboard metrics:', error);
    res.status(500).json({
      error: 'MetricsError',
      message: error.message || 'Failed to get dashboard metrics'
    });
  }
};

/**
 * Get circuit breaker status for all services
 */
export const getCircuitBreakerStatus = async (req, res) => {
  try {
    const status = circuitBreakerRegistry.getAllStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting circuit breaker status:', error);
    res.status(500).json({
      error: 'CircuitBreakerError',
      message: error.message || 'Failed to get circuit breaker status'
    });
  }
};

/**
 * Reset circuit breaker for a specific service
 */
export const resetCircuitBreaker = async (req, res) => {
  try {
    const { service } = req.params;

    const breaker = circuitBreakerRegistry.get(service);
    if (!breaker) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Circuit breaker "${service}" not found`
      });
    }

    breaker.reset();

    logger.info(`Circuit breaker "${service}" reset by user ${req.user?.id}`);

    res.json({
      success: true,
      message: `Circuit breaker "${service}" has been reset`,
      data: breaker.getStatus()
    });
  } catch (error) {
    logger.error('Error resetting circuit breaker:', error);
    res.status(500).json({
      error: 'CircuitBreakerError',
      message: error.message || 'Failed to reset circuit breaker'
    });
  }
};

/**
 * Get AI model training history
 */
export const getTrainingHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = await aiRetrainingService.getTrainingHistory(parseInt(limit, 10));
    const currentModel = await aiRetrainingService.getCurrentModelInfo();

    res.json({
      success: true,
      data: {
        currentModel,
        history
      }
    });
  } catch (error) {
    logger.error('Error getting training history:', error);
    res.status(500).json({
      error: 'TrainingError',
      message: error.message || 'Failed to get training history'
    });
  }
};

/**
 * Manually trigger model retraining
 */
export const triggerRetraining = async (req, res) => {
  try {
    logger.info(`Manual retraining triggered by user ${req.user?.id}`);

    const result = await aiRetrainingService.triggerRetraining();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error triggering retraining:', error);
    res.status(500).json({
      error: 'TrainingError',
      message: error.message || 'Failed to trigger retraining'
    });
  }
};

export default {
  spellCheck,
  generateSOAPSuggestion,
  suggestDiagnosis,
  analyzeRedFlags,
  generateClinicalSummary,
  recordOutcomeFeedback,
  getAIStatus,
  recordSuggestionFeedback,
  getAIMetrics,
  getAIDashboardMetrics,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  getTrainingHistory,
  triggerRetraining
};
