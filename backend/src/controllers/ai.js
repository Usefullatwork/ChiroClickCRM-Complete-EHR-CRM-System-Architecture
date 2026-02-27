/**
 * AI Controller
 * Handles AI-powered clinical intelligence requests
 */

import crypto from 'crypto';
import * as aiService from '../services/ai.js';
import { generateCompletionStream, getModelForField, buildFieldPrompt } from '../services/ai.js';
import {
  analyzeWithThinking,
  differentialDiagnosis,
  analyzeRedFlagsWithThinking,
} from '../services/extendedThinking.js';
import { analyzeImage as analyzeVisionImage } from '../services/clinicalVision.js';
import { extractSOAP, extractDiagnoses } from '../services/structuredExtraction.js';
import { orchestrate } from '../services/clinicalOrchestrator.js';
import logger from '../utils/logger.js';
import cache from '../utils/cache.js';
import {
  RecordFeedbackCommand,
  recordFeedbackHandler,
} from '../application/commands/RecordFeedbackCommand.js';
import {
  GetAIMetricsQuery,
  getAIMetricsHandler,
  getAIDashboardHandler,
} from '../application/queries/GetAIMetricsQuery.js';
import { circuitBreakerRegistry } from '../infrastructure/resilience/CircuitBreaker.js';
import { aiRetrainingService } from '../application/services/AIRetrainingService.js';
import { aiFeedbackService } from '../application/services/AIFeedbackService.js';

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
    res.json({
      original: req.body.text,
      corrected: req.body.text,
      hasChanges: false,
      aiAvailable: false,
      error: error.message,
    });
  }
};

export const generateSOAPSuggestion = async (req, res) => {
  try {
    const { chiefComplaint, section } = req.body;

    if (!chiefComplaint || !section) {
      return res.status(400).json({ error: 'Chief complaint and section are required' });
    }

    if (!['subjective', 'objective', 'assessment', 'plan'].includes(section)) {
      return res
        .status(400)
        .json({ error: 'Invalid section. Must be: subjective, objective, assessment, or plan' });
    }

    const result = await aiService.generateSOAPSuggestions(chiefComplaint, section);
    res.json(result);
  } catch (error) {
    logger.error('Error in generateSOAPSuggestion controller:', error);
    // Return graceful fallback instead of 500
    res.json({
      section: req.body.section,
      chiefComplaint: req.body.chiefComplaint,
      suggestion: '',
      aiAvailable: false,
      error: error.message,
    });
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
    res.json({
      suggestion: '',
      codes: [],
      reasoning: '',
      aiAvailable: false,
      error: error.message,
    });
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
      error: error.message,
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
    res.json({
      summary: '',
      encounterId: req.body.encounter?.id,
      aiAvailable: false,
      error: error.message,
    });
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
  const { fieldType, context = {}, language = 'no' } = req.body;

  if (!fieldType) {
    return res.status(400).json({ error: 'fieldType is required' });
  }

  const result = await aiService.generateFieldText(fieldType, context, language);
  res.json(result);
};

// =================================================================
// AI Feedback & Metrics Handlers
// =================================================================

/**
 * Record feedback on AI suggestion
 */
export const recordFeedback = async (req, res) => {
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
    userId: req.user.id,
  });

  res.json(result);
};

/**
 * Get AI feedback metrics
 */
export const getAIFeedbackMetrics = async (req, res) => {
  const { period = 'week', fieldType } = req.query;

  const metrics = await aiFeedbackService.getMetrics({
    organizationId: req.organizationId,
    period,
    fieldType,
  });

  res.json(metrics);
};

/**
 * Get circuit breaker health status
 */
export const getCircuitStatus = async (req, res) => {
  const status = circuitBreakerRegistry.getHealthSummary();
  const allStatus = circuitBreakerRegistry.getAllStatus();

  res.json({
    summary: status,
    services: allStatus,
  });
};

/**
 * Get retraining status
 */
export const getRetrainingStatus = async (req, res) => {
  const checkStatus = await aiFeedbackService.checkRetrainingStatus(req.organizationId);
  const retrainingStatus = aiRetrainingService.getStatus();

  res.json({
    check: checkStatus,
    retraining: retrainingStatus,
    history: aiRetrainingService.getHistory(5),
  });
};

/**
 * Record suggestion feedback (accept/reject/modify)
 * Uses CQRS Command pattern
 */
export const recordSuggestionFeedback = async (req, res) => {
  const { suggestionId, action, originalContent, modifiedContent, reason, responseTime } = req.body;

  if (!suggestionId || !action) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'suggestionId and action are required',
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
    organizationId: req.organizationId,
  });

  const result = await recordFeedbackHandler.handle(command);

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Get comprehensive AI metrics
 * Uses CQRS Query pattern
 */
export const getAIMetrics = async (req, res) => {
  const { days = 7, includeHistory = true, includeCircuitStatus = true } = req.query;

  const query = new GetAIMetricsQuery({
    days: parseInt(days, 10),
    includeHistory: includeHistory === 'true' || includeHistory === true,
    includeCircuitStatus: includeCircuitStatus === 'true' || includeCircuitStatus === true,
  });

  const metrics = await getAIMetricsHandler.handle(query);

  res.json({
    success: true,
    data: metrics,
  });
};

/**
 * Get simplified AI dashboard metrics
 */
export const getAIDashboardMetrics = async (req, res) => {
  const metrics = await getAIDashboardHandler.handle({
    organizationId: req.organizationId,
  });

  res.json({
    success: true,
    data: metrics,
  });
};

/**
 * Reset circuit breaker for a specific service
 */
export const resetCircuitBreaker = async (req, res) => {
  const { service } = req.params;

  const breaker = circuitBreakerRegistry.get(service);
  if (!breaker) {
    return res.status(404).json({
      error: 'NotFound',
      message: `Circuit breaker "${service}" not found`,
    });
  }

  breaker.reset();

  logger.info(`Circuit breaker "${service}" reset by user ${req.user?.id}`);

  res.json({
    success: true,
    message: `Circuit breaker "${service}" has been reset`,
    data: breaker.getStatus(),
  });
};

/**
 * Get AI model training history
 */
export const getTrainingHistory = async (req, res) => {
  const { limit = 10 } = req.query;

  const history = await aiRetrainingService.getTrainingHistory(parseInt(limit, 10));
  const currentModel = await aiRetrainingService.getCurrentModelInfo();

  res.json({
    success: true,
    data: {
      currentModel,
      history,
    },
  });
};

/**
 * Manually trigger model retraining
 */
export const triggerRetraining = async (req, res) => {
  logger.info(`Manual retraining triggered by user ${req.user?.id}`);

  const result = await aiRetrainingService.triggerRetraining();

  res.json({
    success: true,
    data: result,
  });
};

/**
 * Extended analysis using Claude extended thinking
 * Supports differential diagnosis and red flag analysis with transparent reasoning
 */
export const extendedAnalysis = async (req, res) => {
  try {
    const { prompt, soapData, patientData, analysisType = 'differential' } = req.body;

    let result;
    if (analysisType === 'red_flags' && soapData) {
      result = await analyzeRedFlagsWithThinking(soapData, patientData || {});
    } else if (analysisType === 'differential' && soapData) {
      result = await differentialDiagnosis(soapData, patientData || {});
    } else {
      result = await analyzeWithThinking(prompt || '', { taskType: analysisType });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message.includes('CLAUDE_API_KEY')) {
      return res.json({
        success: false,
        error: 'Claude API not configured',
        requiresClaudeAPI: true,
      });
    }
    logger.error('Error in extendedAnalysis controller:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Analyze clinical images using Claude vision
 */
export const analyzeImage = async (req, res) => {
  try {
    const { base64, mediaType, analysisType, additionalContext } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'base64 image data required' });
    }

    const result = await analyzeVisionImage(
      { base64, mediaType },
      { analysisType, additionalContext }
    );
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message.includes('CLAUDE_API_KEY')) {
      return res.json({
        success: false,
        error: 'Claude API not configured',
        requiresClaudeAPI: true,
      });
    }
    logger.error('Error in analyzeImage controller:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Extract structured SOAP or diagnosis data from clinical text using Claude tool_use
 */
export const extractStructured = async (req, res) => {
  try {
    const { text, type = 'soap', availableCodes } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Clinical text required' });
    }

    let result;
    if (type === 'diagnoses') {
      result = await extractDiagnoses(text, availableCodes || []);
    } else {
      result = await extractSOAP(text);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.message.includes('CLAUDE_API_KEY')) {
      return res.json({
        success: false,
        error: 'Claude API not configured',
        requiresClaudeAPI: true,
      });
    }
    logger.error('Error in extractStructured controller:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Run multi-provider clinical analysis pipeline
 * Calls orchestrator directly for the full result (clinical, differential, letter, synthesis)
 */
export const runClinicalPipeline = async (req, res) => {
  try {
    const { patientData, soapData, options = {} } = req.body;

    if (!patientData || !soapData) {
      return res.status(400).json({ error: 'patientData and soapData are required' });
    }

    const result = await orchestrate(patientData, soapData, {
      language: options.language || 'no',
      includeDifferential: options.includeDifferential !== false,
      includeLetterDraft: options.includeLetterDraft || false,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in runClinicalPipeline controller:', error);
    res.json({
      success: false,
      data: null,
      aiAvailable: false,
      error: error.message,
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
  resetCircuitBreaker,
  getTrainingHistory,
  triggerRetraining,
  extendedAnalysis,
  analyzeImage,
  extractStructured,
  runClinicalPipeline,
};
