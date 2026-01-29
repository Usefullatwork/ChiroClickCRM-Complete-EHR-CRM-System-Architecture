/**
 * AI Controller
 * Handles AI-powered clinical intelligence requests
 */

import * as aiService from '../services/ai.js';
import { generateCompletionStream, getModelForField, buildFieldPrompt } from '../services/ai.js';
import logger from '../utils/logger.js';
import cache, { CacheKeys } from '../utils/cache.js';
import crypto from 'crypto';
import aiFeedbackService from '../application/services/AIFeedbackService.js';
import aiRetrainingService from '../application/services/AIRetrainingService.js';
import circuitBreakerRegistry from '../infrastructure/resilience/CircuitBreakerRegistry.js';

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
    // Return graceful fallback instead of 500
    res.json({ original: req.body.text, corrected: req.body.text, hasChanges: false, aiAvailable: false, error: error.message });
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
    // Return graceful fallback instead of 500
    res.json({ section: req.body.section, chiefComplaint: req.body.chiefComplaint, suggestion: '', aiAvailable: false, error: error.message });
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
    // Return graceful fallback instead of 500
    res.json({ suggestion: '', codes: [], reasoning: '', aiAvailable: false, error: error.message });
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
    // Return graceful fallback instead of 500
    res.json({
      analysis: 'Analyse utilgjengelig. Vennligst gjennomgå manuelt.',
      riskLevel: 'UNKNOWN',
      canTreat: true,
      recommendReferral: false,
      detectedFlags: [],
      medicationWarnings: [],
      aiAvailable: false,
      error: error.message
    });
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
    // Return graceful fallback instead of 500
    res.json({ summary: '', encounterId: req.body.encounter?.id, aiAvailable: false, error: error.message });
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
    // Return graceful fallback instead of 500
    res.json({ success: false, error: error.message });
  }
};

export const getAIStatus = async (req, res) => {
  try {
    const status = await aiService.getAIStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error in getAIStatus controller:', error);
    // Return graceful fallback instead of 500
    res.json({ provider: 'unknown', available: false, enabled: false, error: error.message });
  }
};

/**
 * Generate field text with streaming SSE response
 * Supports inline AI generation for individual SOAP fields
 */
export const generateFieldStream = async (req, res) => {
  try {
    const { fieldType, context = {}, language = 'no' } = req.body;

    if (!fieldType) {
      return res.status(400).json({ error: 'fieldType is required' });
    }

    // Generate cache key based on field type and context
    const contextHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ fieldType, context, language }))
      .digest('hex')
      .slice(0, 12);
    const cacheKey = `ai:field:${fieldType}:${language}:${contextHash}`;

    // Check cache first for non-streaming quick response
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('AI field cache hit', { fieldType, cacheKey });
      // For cached responses, send as regular JSON
      return res.json({ text: cached, cached: true, fieldType });
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Build prompt and get appropriate model
    const prompt = buildFieldPrompt(fieldType, context, language);
    const model = getModelForField(fieldType);

    logger.debug('AI field stream start', { fieldType, model, language });

    let fullText = '';

    try {
      for await (const chunk of generateCompletionStream(prompt, { model })) {
        fullText += chunk;
        // Send SSE formatted data
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Cache the complete response for 1 hour
      cache.set(cacheKey, fullText.trim(), 3600);

      // Send completion signal
      res.write(`data: ${JSON.stringify({ done: true, fullText: fullText.trim() })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      logger.debug('AI field stream complete', { fieldType, length: fullText.length });
    } catch (streamError) {
      logger.error('AI field stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    logger.error('Error in generateFieldStream controller:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Field generation failed' });
    }
  }
};

/**
 * Generate field text without streaming (for non-SSE clients)
 */
export const generateField = async (req, res) => {
  try {
    const { fieldType, context = {}, language = 'no' } = req.body;

    if (!fieldType) {
      return res.status(400).json({ error: 'fieldType is required' });
    }

    const result = await aiService.generateFieldText(fieldType, context, language);
    res.json(result);
  } catch (error) {
    logger.error('Error in generateField controller:', error);
    res.status(500).json({ error: error.message || 'Field generation failed' });
  }
};

// =================================================================
// AI Feedback & Metrics Handlers
// =================================================================

/**
 * Record feedback on AI suggestion
 */
export const recordFeedback = async (req, res) => {
  try {
    const { suggestionId, feedbackType, rating, correctedText, comment, context } = req.body;

    if (!suggestionId || !feedbackType) {
      return res.status(400).json({ error: 'suggestionId and feedbackType are required' });
    }

    const result = await aiFeedbackService.recordFeedback({
      suggestionId,
      feedbackType,
      rating,
      correctedText,
      comment,
      context,
      organizationId: req.organizationId,
      userId: req.user.id
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in recordFeedback controller:', error);
    res.status(500).json({ error: error.message || 'Failed to record feedback' });
  }
};

/**
 * Get AI performance metrics
 */
export const getAIMetrics = async (req, res) => {
  try {
    const { period = 'week', fieldType } = req.query;

    const metrics = await aiFeedbackService.getMetrics({
      organizationId: req.organizationId,
      period,
      fieldType
    });

    res.json(metrics);
  } catch (error) {
    logger.error('Error in getAIMetrics controller:', error);
    res.status(500).json({ error: error.message || 'Failed to get metrics' });
  }
};

/**
 * Get circuit breaker health status
 */
export const getCircuitStatus = async (req, res) => {
  try {
    const status = circuitBreakerRegistry.getHealthSummary();
    const allStatus = circuitBreakerRegistry.getAllStatus();

    res.json({
      summary: status,
      services: allStatus
    });
  } catch (error) {
    logger.error('Error in getCircuitStatus controller:', error);
    res.status(500).json({ error: error.message || 'Failed to get circuit status' });
  }
};

/**
 * Reset circuit breaker for a service
 */
export const resetCircuitBreaker = async (req, res) => {
  try {
    const { service } = req.params;

    const status = circuitBreakerRegistry.getStatus(service);
    if (!status) {
      return res.status(404).json({ error: `Circuit breaker for service '${service}' not found` });
    }

    circuitBreakerRegistry.reset(service);

    logger.info('Circuit breaker reset by user', {
      service,
      userId: req.user.id,
      previousState: status.state
    });

    res.json({
      success: true,
      service,
      previousState: status.state,
      currentState: 'CLOSED',
      resetBy: req.user.id,
      resetAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in resetCircuitBreaker controller:', error);
    res.status(500).json({ error: error.message || 'Failed to reset circuit breaker' });
  }
};

/**
 * Get retraining status
 */
export const getRetrainingStatus = async (req, res) => {
  try {
    const checkStatus = await aiFeedbackService.checkRetrainingStatus(req.organizationId);
    const retrainingStatus = aiRetrainingService.getStatus();

    res.json({
      check: checkStatus,
      retraining: retrainingStatus,
      history: aiRetrainingService.getHistory(5)
    });
  } catch (error) {
    logger.error('Error in getRetrainingStatus controller:', error);
    res.status(500).json({ error: error.message || 'Failed to get retraining status' });
  }
};

/**
 * Trigger AI retraining
 */
export const triggerRetraining = async (req, res) => {
  try {
    const result = await aiFeedbackService.triggerRetraining({
      organizationId: req.organizationId,
      reason: 'manual',
      triggeredBy: req.user.id
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in triggerRetraining controller:', error);
    res.status(500).json({ error: error.message || 'Failed to trigger retraining' });
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
  generateFieldStream,
  generateField,
  // New CQRS endpoints
  recordFeedback,
  getAIMetrics,
  getCircuitStatus,
  resetCircuitBreaker,
  getRetrainingStatus,
  triggerRetraining
};
