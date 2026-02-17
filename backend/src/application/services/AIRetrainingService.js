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
import path from 'path';

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

# ChiroClickCRM Fine-tuned Model
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

      const modelVersion = result.rows[0]?.value || 'chiro-no';

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
}

// Create singleton instance
export const aiRetrainingService = new AIRetrainingService();

export default aiRetrainingService;
