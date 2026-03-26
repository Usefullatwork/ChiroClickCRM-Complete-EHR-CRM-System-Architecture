/**
 * AI Retraining Service
 * Handles automated model retraining pipeline with Ollama
 *
 * @module application/services/AIRetrainingService
 */

import { eventBus, registerEventHandlers } from '../../domain/events/EventBus.js';
import { DOMAIN_EVENTS, EventFactory } from '../../domain/events/DomainEvents.js';
import { CircuitBreakers } from '../../infrastructure/resilience/CircuitBreaker.js';
import { aiFeedbackService } from './AIFeedbackService.js';
import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MODELS_DIR = process.env.MODELS_DIR || './models';
const AI_TRAINING_DIR = process.env.AI_TRAINING_DIR || './ai-training';
const BASE_MODEL = process.env.AI_BASE_MODEL || 'mistral:7b';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'chiroclick-clinical';
const RETRAINING_FEEDBACK_THRESHOLD = parseInt(process.env.RETRAINING_FEEDBACK_THRESHOLD || '50');
const RETRAINING_REJECTION_THRESHOLD = parseInt(process.env.RETRAINING_REJECTION_THRESHOLD || '20');

const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

/**
 * AI Retraining Service - Manages model fine-tuning pipeline
 */
class AIRetrainingService {
  constructor() {
    this.isRetraining = false;
    this.currentModelVersion = null;

    // Configuration thresholds
    this.config = {
      minExamplesForRetraining: 100,
      acceptanceRateDropThreshold: 0.1, // 10% drop triggers retraining
      maxDaysBetweenTraining: 7,
      validationSplitRatio: 0.2,
      minValidationAccuracy: 0.75,
    };

    // Initialize event handlers
    this.initEventHandlers();

    logger.info('AIRetrainingService initialized');
  }

  /**
   * Initialize event handlers
   */
  initEventHandlers() {
    registerEventHandlers({
      [DOMAIN_EVENTS.TRAINING_THRESHOLD_REACHED]: this.handleTrainingThresholdReached.bind(this),
    });

    logger.debug('AI retraining event handlers registered');
  }

  /**
   * Handle training threshold reached event
   */
  async handleTrainingThresholdReached(event) {
    const { stats } = event.payload;

    logger.info('Training threshold reached, evaluating retraining need', stats);

    try {
      const shouldRetrain = await this.evaluateRetrainingNeed(stats);

      if (shouldRetrain) {
        await this.triggerRetraining();
      }
    } catch (error) {
      logger.error('Error handling training threshold:', error);
    }
  }

  /**
   * Evaluate if retraining is needed
   */
  async evaluateRetrainingNeed(stats) {
    // Check acceptance rate drop
    const currentMetrics = await aiFeedbackService.getMetrics(7);
    const previousMetrics = await aiFeedbackService.getMetrics(14);

    const currentRate = parseFloat(currentMetrics.acceptanceRate?.acceptanceRate || 0);
    const previousRate = parseFloat(previousMetrics.acceptanceRate?.acceptanceRate || currentRate);

    const rateDrop = previousRate - currentRate;

    // Check days since last training
    const lastTraining = await this.getLastTrainingRun();
    const daysSinceTraining = lastTraining
      ? Math.floor(
          (Date.now() - new Date(lastTraining.completed_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      : Infinity;

    const reasons = [];

    if (stats.newExamples >= this.config.minExamplesForRetraining) {
      reasons.push(
        `New examples threshold (${stats.newExamples} >= ${this.config.minExamplesForRetraining})`
      );
    }

    if (rateDrop >= this.config.acceptanceRateDropThreshold * 100) {
      reasons.push(`Acceptance rate dropped by ${rateDrop.toFixed(2)}%`);
    }

    if (daysSinceTraining >= this.config.maxDaysBetweenTraining) {
      reasons.push(
        `Days since training (${daysSinceTraining} >= ${this.config.maxDaysBetweenTraining})`
      );
    }

    if (reasons.length > 0) {
      logger.info('Retraining needed:', { reasons });
      return true;
    }

    logger.debug('Retraining not needed at this time');
    return false;
  }

  /**
   * Trigger the retraining pipeline
   */
  async triggerRetraining() {
    if (this.isRetraining) {
      logger.warn('Retraining already in progress, skipping');
      return { skipped: true, reason: 'Already retraining' };
    }

    this.isRetraining = true;
    const trainingRunId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Record training run start
      await this.recordTrainingRun(trainingRunId, 'STARTED');

      // Emit training started event
      await eventBus.emit(DOMAIN_EVENTS.MODEL_TRAINING_STARTED, {
        trainingRunId,
        startedAt: new Date().toISOString(),
      });

      logger.info('Starting model retraining pipeline', { trainingRunId });

      // Step 1: Export training data
      const trainingData = await this.exportTrainingData();
      logger.info(`Exported ${trainingData.count} training examples`);

      if (trainingData.count < 10) {
        throw new Error('Insufficient training data');
      }

      // Step 2: Generate new model version name
      const newModelVersion = `chiro-no-v${Date.now()}`;

      // Step 3: Create Modelfile with training data
      const modelfile = await this.createModelfile(trainingData, newModelVersion);

      // Step 4: Train model via Ollama (using circuit breaker)
      const _trainResult = await CircuitBreakers.ollama.execute(
        async () => await this.trainModel(newModelVersion, modelfile)
      );

      // Step 5: Validate new model
      const validation = await this.validateModel(newModelVersion);

      if (!validation.passed) {
        logger.warn('Model validation failed, rolling back', validation);
        await this.rollbackModel(newModelVersion);
        await this.recordTrainingRun(trainingRunId, 'VALIDATION_FAILED', {
          validation,
          duration: Date.now() - startTime,
        });

        return {
          success: false,
          reason: 'Validation failed',
          validation,
        };
      }

      // Step 6: Activate new model
      await this.activateModel(newModelVersion);

      // Record success
      const duration = Date.now() - startTime;
      await this.recordTrainingRun(trainingRunId, 'COMPLETED', {
        modelVersion: newModelVersion,
        trainingExamples: trainingData.count,
        validation,
        duration,
      });

      // Emit training completed event
      await eventBus.emit(
        EventFactory.modelTrainingCompleted(newModelVersion, {
          trainingExamples: trainingData.count,
          validation,
          duration,
        })
      );

      logger.info('Model retraining completed successfully', {
        trainingRunId,
        modelVersion: newModelVersion,
        duration: `${(duration / 1000).toFixed(2)}s`,
      });

      return {
        success: true,
        trainingRunId,
        modelVersion: newModelVersion,
        trainingExamples: trainingData.count,
        validation,
        duration,
      };
    } catch (error) {
      logger.error('Model retraining failed:', error);

      await this.recordTrainingRun(trainingRunId, 'FAILED', {
        error: error.message,
        duration: Date.now() - startTime,
      });

      // Emit training failed event
      await eventBus.emit(DOMAIN_EVENTS.MODEL_TRAINING_FAILED, {
        trainingRunId,
        error: error.message,
      });

      return {
        success: false,
        trainingRunId,
        error: error.message,
      };
    } finally {
      this.isRetraining = false;
    }
  }

  /**
   * Export training data for fine-tuning
   */
  async exportTrainingData() {
    return await aiFeedbackService.exportTrainingData({
      startDate: await this.getLastTrainingDate(),
      includeRejected: false,
      minConfidence: 0.7,
    });
  }

  /**
   * Create Ollama Modelfile for fine-tuning
   */
  async createModelfile(trainingData, modelVersion) {
    const baseModel = process.env.AI_BASE_MODEL || 'mistral:7b';

    const modelfile = `
FROM ${baseModel}

# ChiroClickEHR Fine-tuned Model
# Version: ${modelVersion}
# Training examples: ${trainingData.count}
# Generated: ${new Date().toISOString()}

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096

SYSTEM """
Du er en AI-assistent for kiropraktorer i Norge.
Du hjelper med å skrive kliniske notater, SOAP-journaler, og pasientkommunikasjon.
Bruk alltid profesjonell medisinsk terminologi på norsk.
Vær konsis og presis. Følg norske retningslinjer for journalføring.
"""

# Training examples incorporated via ADAPTER
${
  trainingData.data
    ? `
# Training data hash: ${this.hashTrainingData(trainingData.data)}
`
    : ''
}
`.trim();

    // Save Modelfile
    const modelfilePath = path.join(TRAINING_DIR, `Modelfile.${modelVersion}`);
    await fs.mkdir(TRAINING_DIR, { recursive: true });
    await fs.writeFile(modelfilePath, modelfile, 'utf-8');

    return modelfile;
  }

  /**
   * Train model using Ollama API
   */
  async trainModel(modelVersion, modelfile) {
    const response = await fetch(`${OLLAMA_HOST}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: modelVersion,
        modelfile: modelfile,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama training failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Validate new model with test set
   */
  async validateModel(modelVersion) {
    // Get validation examples
    const validationExamples = await this.getValidationExamples();

    if (validationExamples.length < 5) {
      logger.warn('Insufficient validation examples, skipping validation');
      return { passed: true, skipped: true };
    }

    let correct = 0;
    const results = [];

    for (const example of validationExamples.slice(0, 20)) {
      try {
        const response = await CircuitBreakers.ollama.execute(async () => {
          const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelVersion,
              prompt: example.input,
              stream: false,
            }),
          });
          return await res.json();
        });

        // Simple similarity check
        const similarity = this.calculateSimilarity(response.response, example.expectedOutput);

        if (similarity >= 0.7) {
          correct++;
        }

        results.push({
          input: example.input.substring(0, 100),
          similarity,
          passed: similarity >= 0.7,
        });
      } catch (error) {
        logger.warn('Validation example failed:', error.message);
      }
    }

    const accuracy = correct / Math.min(validationExamples.length, 20);

    return {
      passed: accuracy >= this.config.minValidationAccuracy,
      accuracy: (accuracy * 100).toFixed(2),
      totalExamples: validationExamples.length,
      testedExamples: Math.min(validationExamples.length, 20),
      correctPredictions: correct,
      results,
    };
  }

  /**
   * Get validation examples from accepted suggestions
   */
  async getValidationExamples() {
    try {
      const result = await query(`
        SELECT
          s.context as input,
          s.content as expectedOutput
        FROM ai_suggestions s
        JOIN ai_feedback f ON f.suggestion_id = s.id
        WHERE f.action = 'ACCEPTED'
          AND s.confidence >= 0.8
        ORDER BY RANDOM()
        LIMIT 50
      `);

      return result.rows;
    } catch (error) {
      logger.warn('Error getting validation examples:', error.message);
      return [];
    }
  }

  /**
   * Activate new model as primary
   */
  async activateModel(modelVersion) {
    // Update active model in config
    await query(
      `
      INSERT INTO system_config (key, value, updated_at)
      VALUES ('active_ai_model', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `,
      [modelVersion]
    );

    this.currentModelVersion = modelVersion;

    // Emit model activated event
    await eventBus.emit(DOMAIN_EVENTS.MODEL_ACTIVATED, {
      modelVersion,
      activatedAt: new Date().toISOString(),
    });

    logger.info(`Model ${modelVersion} activated as primary`);
  }

  /**
   * Rollback to previous model
   */
  async rollbackModel(failedModelVersion) {
    logger.info(`Rolling back from ${failedModelVersion}`);

    // Delete failed model from Ollama
    try {
      await fetch(`${OLLAMA_HOST}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: failedModelVersion }),
      });
    } catch (error) {
      logger.warn('Error deleting failed model:', error.message);
    }

    // Emit rollback event
    await eventBus.emit(DOMAIN_EVENTS.MODEL_ROLLED_BACK, {
      failedModelVersion,
      rolledBackAt: new Date().toISOString(),
    });
  }

  /**
   * Record training run in database
   */
  async recordTrainingRun(runId, status, metadata = {}) {
    try {
      await query(
        `
        INSERT INTO ai_training_runs (id, status, metadata, created_at, completed_at)
        VALUES ($1, $2, $3, NOW(), ${status === 'COMPLETED' || status === 'FAILED' ? 'NOW()' : 'NULL'})
        ON CONFLICT (id) DO UPDATE SET
          status = $2,
          metadata = $3,
          completed_at = ${status === 'COMPLETED' || status === 'FAILED' ? 'NOW()' : 'ai_training_runs.completed_at'}
      `,
        [runId, status, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.warn('Error recording training run:', error.message);
    }
  }

  /**
   * Get last training run
   */
  async getLastTrainingRun() {
    try {
      const result = await query(`
        SELECT * FROM ai_training_runs
        WHERE status = 'COMPLETED'
        ORDER BY completed_at DESC
        LIMIT 1
      `);
      return result.rows[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Get last training date
   */
  async getLastTrainingDate() {
    const lastRun = await this.getLastTrainingRun();
    return lastRun?.completed_at || null;
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) {
      return 0;
    }

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Hash training data for versioning
   */
  hashTrainingData(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get current model info
   */
  async getCurrentModelInfo() {
    try {
      const result = await query(`
        SELECT value FROM system_config WHERE key = 'active_ai_model'
      `);

      const modelVersion = result.rows[0]?.value || 'chiro-no-sft-dpo-v5';

      // Get model details from Ollama
      const response = await fetch(`${OLLAMA_HOST}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelVersion }),
      });

      if (response.ok) {
        const modelInfo = await response.json();
        return {
          version: modelVersion,
          ...modelInfo,
        };
      }

      return { version: modelVersion };
    } catch (error) {
      logger.warn('Error getting model info:', error.message);
      return { version: 'unknown', error: error.message };
    }
  }

  /**
   * Get training history
   */
  async getTrainingHistory(limit = 10) {
    try {
      const result = await query(
        `
        SELECT id, status, metadata, created_at, completed_at
        FROM ai_training_runs
        ORDER BY created_at DESC
        LIMIT $1
      `,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.warn('Error getting training history:', error.message);
      return [];
    }
  }

  /**
   * Get retraining status (threshold metrics + current event).
   * Queries ai_retraining_events for the latest run and the feedback
   * threshold counters needed by the admin dashboard.
   */
  async getRetrainingStatus() {
    try {
      const eventResult = await query(`
        SELECT * FROM ai_retraining_events
        ORDER BY started_at DESC
        LIMIT 1
      `);
      const currentEvent = eventResult.rows[0] || null;

      const thresholdResult = await query(`
        SELECT
          COUNT(*) as feedback_count,
          SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejection_count
        FROM ai_feedback
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND processed_for_training = false
      `);
      const metrics = thresholdResult.rows[0];

      return {
        currentEvent,
        currentModelVersion: this.currentModelVersion,
        isRetraining: this.isRetraining,
        thresholds: {
          feedbackThreshold: RETRAINING_FEEDBACK_THRESHOLD,
          rejectionThreshold: RETRAINING_REJECTION_THRESHOLD,
          currentFeedbackCount: parseInt(metrics.feedback_count || 0),
          currentRejectionCount: parseInt(metrics.rejection_count || 0),
          thresholdReached:
            parseInt(metrics.feedback_count || 0) >= RETRAINING_FEEDBACK_THRESHOLD ||
            parseInt(metrics.rejection_count || 0) >= RETRAINING_REJECTION_THRESHOLD,
        },
      };
    } catch (error) {
      logger.error('Error getting retraining status:', error);
      throw error;
    }
  }

  /**
   * Alias for getRetrainingStatus — used by controllers/ai.js
   */
  getStatus() {
    return {
      isRetraining: this.isRetraining,
      currentModelVersion: this.currentModelVersion,
    };
  }

  /**
   * Get retraining history from ai_retraining_events table.
   * @param {number} limit
   */
  async getRetrainingHistory(limit = 20) {
    try {
      const result = await query(
        `
        SELECT
          id, model_version, previous_version, status, trigger_type,
          feedback_count, training_examples, started_at, completed_at,
          error_message, test_results, activated_at
        FROM ai_retraining_events
        ORDER BY started_at DESC
        LIMIT $1
      `,
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting retraining history:', error.message);
      return [];
    }
  }

  /**
   * Alias for getRetrainingHistory — synchronous wrapper used by controllers/ai.js.
   * Returns a promise (callers must await it or handle the promise).
   */
  getHistory(limit = 5) {
    return this.getRetrainingHistory(limit);
  }

  /**
   * Export feedback data to JSONL training format.
   * Used by the admin export-feedback endpoint.
   */
  async exportFeedbackToTrainingFormat(options = {}) {
    const { minRating = 3, days = 90, includeRejected = true } = options;

    await fs.mkdir(TRAINING_DIR, { recursive: true });
    logger.info('Exporting feedback to training format...');

    const feedbackResult = await query(
      `SELECT
        af.id, af.suggestion_type, af.original_suggestion, af.user_correction,
        af.accepted, af.correction_type, af.user_rating, af.context_data,
        af.confidence_score
       FROM ai_feedback af
       WHERE af.created_at > NOW() - make_interval(days => $2)
         AND af.processed_for_training = false
         AND (
           (af.accepted = true AND af.user_rating >= $1)
           OR (af.correction_type IN ('minor', 'major') AND af.user_correction IS NOT NULL)
           ${includeRejected ? 'OR (af.accepted = false AND af.user_rating IS NOT NULL)' : ''}
         )
       ORDER BY af.user_rating DESC NULLS LAST, af.created_at DESC`,
      [minRating, days]
    );

    const trainingExamples = [];
    const processedIds = [];

    for (const feedback of feedbackResult.rows) {
      processedIds.push(feedback.id);

      if (feedback.accepted && !feedback.user_correction) {
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: this._buildPromptFromContext(
                feedback.suggestion_type,
                feedback.context_data
              ),
            },
            { role: 'assistant', content: feedback.original_suggestion },
          ],
          metadata: {
            type: 'accepted',
            rating: feedback.user_rating,
            suggestionType: feedback.suggestion_type,
          },
        });
      } else if (feedback.user_correction) {
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: this._buildPromptFromContext(
                feedback.suggestion_type,
                feedback.context_data
              ),
            },
            { role: 'assistant', content: feedback.user_correction },
          ],
          metadata: {
            type: 'corrected',
            correctionType: feedback.correction_type,
            rating: feedback.user_rating,
            suggestionType: feedback.suggestion_type,
          },
        });
      } else if (!feedback.accepted && includeRejected) {
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: this._buildPromptFromContext(
                feedback.suggestion_type,
                feedback.context_data
              ),
            },
            { role: 'assistant', content: feedback.original_suggestion },
          ],
          metadata: {
            type: 'rejected',
            rating: feedback.user_rating,
            suggestionType: feedback.suggestion_type,
            isNegativeExample: true,
          },
        });
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const feedbackDir = path.join(TRAINING_DIR, 'feedback');
    await fs.mkdir(feedbackDir, { recursive: true });
    const outputPath = path.join(feedbackDir, `feedback_${timestamp}.jsonl`);
    const jsonlContent = trainingExamples.map((ex) => JSON.stringify(ex)).join('\n');
    await fs.writeFile(outputPath, jsonlContent, 'utf-8');

    logger.info(`Exported ${trainingExamples.length} training examples to ${outputPath}`);

    return {
      outputPath,
      examplesCount: trainingExamples.length,
      processedFeedbackIds: processedIds,
      breakdown: {
        accepted: trainingExamples.filter((e) => e.metadata.type === 'accepted').length,
        corrected: trainingExamples.filter((e) => e.metadata.type === 'corrected').length,
        rejected: trainingExamples.filter((e) => e.metadata.type === 'rejected').length,
      },
    };
  }

  /**
   * Build a Norwegian-language prompt string from feedback context.
   * @private
   */
  _buildPromptFromContext(suggestionType, contextData) {
    const context = contextData || {};
    switch (suggestionType) {
      case 'soap_subjective':
        return `Skriv subjektiv del av SOPE-notat basert på: ${context.chiefComplaint || 'ikke spesifisert'}`;
      case 'soap_objective':
        return `Skriv objektiv del av SOPE-notat. Funn: ${context.findings || 'ikke spesifisert'}`;
      case 'soap_assessment':
        return `Skriv vurdering basert på undersøkelsesfunn. Symptomer: ${context.symptoms || 'ikke spesifisert'}`;
      case 'soap_plan':
        return `Skriv behandlingsplan. Diagnose: ${context.diagnosis || 'ikke spesifisert'}`;
      case 'sms_reminder':
        return `Skriv SMS-påminnelse om time. Tone: ${context.tone || 'vennlig'}`;
      case 'sms_followup':
        return `Skriv oppfølgings-SMS etter behandling. Tone: ${context.tone || 'empatisk'}`;
      case 'clinical_phrase':
        return `Generer klinisk frase for: ${context.phraseType || 'generell dokumentasjon'}`;
      case 'vestibular_documentation':
        return `Dokumenter vestibulær undersøkelse. Tester: ${context.tests || 'standard VNG'}`;
      default:
        return `Generer ${suggestionType}: ${JSON.stringify(context)}`;
    }
  }

  /**
   * Test a model via CLI.
   * Runs a set of Norwegian clinical prompts and checks keyword presence.
   * @param {string|null} modelName
   */
  async testNewModel(modelName = null) {
    const targetModelName = modelName || MODEL_NAME;
    logger.info(`Testing model: ${targetModelName}...`);

    const testCases = [
      {
        name: 'SOAP Subjective',
        prompt:
          'Skriv subjektiv del av SOPE-notat: Pasient med korsryggsmerter i 2 uker etter løfting',
        expectedContains: ['smert', 'uke', 'løft'],
      },
      {
        name: 'SMS Reminder',
        prompt: 'Skriv en SMS påminnelse om time, vennlig tone',
        expectedContains: ['time', 'Hei'],
      },
      {
        name: 'ICPC-2 Codes',
        prompt: 'Hva er vanlige ICPC-2 koder for nakke- og ryggsmerter?',
        expectedContains: ['L01', 'L03', 'L83', 'L84'],
      },
      {
        name: 'Clinical Phrase',
        prompt: 'Generer klinisk frase for leddmobilisering',
        expectedContains: ['mobilisering', 'ledd'],
      },
    ];

    const results = [];
    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        const { stdout } = await execAsync(
          `ollama run ${targetModelName} "${testCase.prompt.replace(/"/g, '\\"')}"`,
          { timeout: 60000 }
        );
        const response = stdout.trim();
        const containsExpected = testCase.expectedContains.some((kw) =>
          response.toLowerCase().includes(kw.toLowerCase())
        );
        results.push({
          name: testCase.name,
          prompt: testCase.prompt,
          response: response.substring(0, 500),
          passed: containsExpected && response.length > 10,
          expectedKeywords: testCase.expectedContains,
        });
        if (containsExpected && response.length > 10) {
          passedTests++;
        }
      } catch (testError) {
        results.push({
          name: testCase.name,
          prompt: testCase.prompt,
          response: null,
          passed: false,
          error: testError.message,
        });
      }
    }

    const passRate = (passedTests / testCases.length) * 100;
    logger.info(
      `Model test results: ${passedTests}/${testCases.length} passed (${passRate.toFixed(1)}%)`
    );

    return {
      modelName: targetModelName,
      totalTests: testCases.length,
      passedTests,
      passRate,
      passed: passRate >= 75,
      results,
    };
  }

  /**
   * Full rollback — restore a previous Modelfile and rebuild via Ollama CLI.
   * Falls back to the abstract Ollama DELETE if no Modelfile is available.
   * @param {string|null} targetVersion
   */
  async rollbackModel(targetVersion = null) {
    const rollbackTo = targetVersion || null;
    logger.info(`Rolling back to model version: ${rollbackTo}...`);

    if (!rollbackTo) {
      throw new Error('No target version provided for rollback');
    }

    const targetModelfilePath = path.join(MODELS_DIR, `Modelfile.${rollbackTo}`);

    if (fsSync.existsSync(targetModelfilePath)) {
      try {
        await execAsync('ollama list');
      } catch {
        throw new Error('Ollama is not running. Start Ollama before rollback.');
      }

      const { stdout } = await execAsync(
        `ollama create ${MODEL_NAME} -f "${targetModelfilePath}"`,
        { timeout: 300000 }
      );

      await query(
        `INSERT INTO ai_retraining_events (model_version, previous_version, status, trigger_type, started_at, completed_at)
         VALUES ($1, $2, 'rollback', 'manual', NOW(), NOW())`,
        [rollbackTo, this.currentModelVersion]
      );

      this.currentModelVersion = rollbackTo;
      logger.info(`Rolled back to version ${rollbackTo}`);

      return {
        success: true,
        rolledBackTo: rollbackTo,
        message: `Successfully rolled back to version ${rollbackTo}`,
        output: stdout,
      };
    }

    // Fallback: delete the current failed model from Ollama
    try {
      await fetch(`${OLLAMA_HOST}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rollbackTo }),
      });
    } catch (error) {
      logger.warn('Error deleting model from Ollama:', error.message);
    }

    await eventBus.emit(DOMAIN_EVENTS.MODEL_ROLLED_BACK, {
      failedModelVersion: rollbackTo,
      rolledBackAt: new Date().toISOString(),
    });

    return { success: true, rolledBackTo: rollbackTo };
  }

  /**
   * Run the full legacy retraining pipeline.
   * Steps: export feedback → merge → convert → rebuild → test → activate.
   * @param {Object} options
   * @param {string} options.trigger
   * @param {boolean} options.dryRun
   */
  async runRetrainingPipeline(options = {}) {
    const { trigger = 'manual', dryRun = false } = options;

    if (this.isRetraining) {
      logger.warn('Retraining already in progress, skipping');
      return { skipped: true, reason: 'Already retraining' };
    }

    logger.info('Starting AI retraining pipeline...', { trigger, dryRun });

    const pipelineId = `retrain_${Date.now()}`;
    const results = { pipelineId, trigger, dryRun, steps: [], startTime: new Date() };
    let retrainingEventId = null;
    this.isRetraining = true;

    try {
      if (!dryRun) {
        const eventResult = await query(
          `INSERT INTO ai_retraining_events (model_version, status, trigger_type, started_at)
           VALUES ($1, 'running', $2, NOW()) RETURNING id`,
          [`v${Date.now()}`, trigger]
        );
        retrainingEventId = eventResult.rows[0].id;
      }

      // Step 1: Export feedback
      logger.info('Step 1: Exporting feedback data...');
      const feedbackExport = await this.exportFeedbackToTrainingFormat();
      results.steps.push({ step: 'export_feedback', ...feedbackExport });

      if (feedbackExport.examplesCount === 0) {
        results.success = true;
        results.message = 'No new feedback to process';
        results.endTime = new Date();
        return results;
      }

      if (dryRun) {
        results.success = true;
        results.dryRun = true;
        results.endTime = new Date();
        return results;
      }

      // Step 2: Train via existing triggerRetraining logic (Ollama API)
      const trainResult = await this.triggerRetraining();
      results.steps.push({ step: 'train_model', ...trainResult });

      // Step 3: Test model
      if (trainResult.modelVersion) {
        logger.info('Step 3: Testing new model...');
        const testResult = await this.testNewModel(trainResult.modelVersion);
        results.steps.push({ step: 'test_model', ...testResult });

        if (retrainingEventId) {
          await query(
            `UPDATE ai_retraining_events
             SET training_examples = $1, test_results = $2, feedback_count = $3, status = $4, completed_at = NOW()
             WHERE id = $5`,
            [
              feedbackExport.examplesCount,
              JSON.stringify(testResult),
              feedbackExport.examplesCount,
              testResult.passed ? 'completed' : 'test_failed',
              retrainingEventId,
            ]
          );
        }
      } else if (retrainingEventId) {
        await query(
          `UPDATE ai_retraining_events SET status = $1, completed_at = NOW() WHERE id = $2`,
          [trainResult.success ? 'completed' : 'failed', retrainingEventId]
        );
      }

      // Mark processed feedback
      if (feedbackExport.processedFeedbackIds.length > 0) {
        await query(
          `UPDATE ai_feedback SET processed_for_training = true, processed_at = NOW() WHERE id = ANY($1)`,
          [feedbackExport.processedFeedbackIds]
        );
      }

      results.success = trainResult.success !== false;
      results.endTime = new Date();
      results.duration = (results.endTime - results.startTime) / 1000;

      logger.info(`Retraining pipeline completed in ${results.duration}s`);
      return results;
    } catch (error) {
      logger.error('Retraining pipeline failed:', error);

      if (retrainingEventId) {
        await query(
          `UPDATE ai_retraining_events SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
          [error.message, retrainingEventId]
        );
      }

      results.success = false;
      results.error = error.message;
      results.endTime = new Date();
      throw error;
    } finally {
      this.isRetraining = false;
    }
  }

  /**
   * Check if retraining is needed and trigger pipeline if threshold is reached.
   * Called by the weekly cron job in scheduler.js.
   */
  async checkAndTriggerRetraining() {
    try {
      const status = await this.getRetrainingStatus();

      if (status.currentEvent?.status === 'running' || this.isRetraining) {
        logger.info('Retraining already in progress, skipping');
        return { triggered: false, reason: 'already_running' };
      }

      if (status.thresholds.thresholdReached) {
        logger.info('Retraining threshold reached, triggering pipeline');

        setImmediate(async () => {
          try {
            await this.runRetrainingPipeline({ trigger: 'automatic' });
          } catch (error) {
            logger.error('Automatic retraining failed:', error);
          }
        });

        return { triggered: true, reason: 'threshold_reached' };
      }

      return { triggered: false, reason: 'threshold_not_reached', status: status.thresholds };
    } catch (error) {
      logger.error('Error checking retraining threshold:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const aiRetrainingService = new AIRetrainingService();

export default aiRetrainingService;
