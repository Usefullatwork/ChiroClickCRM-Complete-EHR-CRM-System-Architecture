/**
 * AI Controller
 * Handles AI-powered clinical intelligence requests
 */

import * as aiService from '../services/ai.js';
import { generateCompletionStream, getModelForField, buildFieldPrompt } from '../services/ai.js';
import logger from '../utils/logger.js';
import cache, { CacheKeys } from '../utils/cache.js';
import crypto from 'crypto';

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

export default {
  spellCheck,
  generateSOAPSuggestion,
  suggestDiagnosis,
  analyzeRedFlags,
  generateClinicalSummary,
  recordOutcomeFeedback,
  getAIStatus,
  generateFieldStream,
  generateField
};
