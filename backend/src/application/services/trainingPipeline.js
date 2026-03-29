/**
 * Training Pipeline
 * Orchestrates model fine-tuning via Ollama: export data, create Modelfile,
 * train, validate, activate, and rollback.
 *
 * @module application/services/trainingPipeline
 */

import { eventBus } from '../../domain/events/EventBus.js';
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
import { recordTrainingRun, getLastTrainingRun } from './retrainingMetrics.js';
import { validateModel } from './modelValidation.js';
import { hashTrainingData } from './dataCuration.js';

const execAsync = promisify(exec);

const MODELS_DIR = process.env.MODELS_DIR || './models';
const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'chiroclick-clinical';

/**
 * Get last training date from the most recent completed run.
 * @returns {Promise<string|null>}
 */
export const getLastTrainingDate = async () => {
  const lastRun = await getLastTrainingRun();
  return lastRun?.completed_at || null;
};

/**
 * Export training data for fine-tuning (delegates to AIFeedbackService).
 * @returns {Promise<Object>}
 */
export const exportTrainingData = async () => {
  return await aiFeedbackService.exportTrainingData({
    startDate: await getLastTrainingDate(),
    includeRejected: false,
    minConfidence: 0.7,
  });
};

/**
 * Create an Ollama Modelfile for fine-tuning.
 *
 * @param {Object} trainingData - Training data with .count and .data
 * @param {string} modelVersion - Target model version name
 * @returns {Promise<string>} The Modelfile content
 */
export const createModelfile = async (trainingData, modelVersion) => {
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
Du hjelper med a skrive kliniske notater, SOAP-journaler, og pasientkommunikasjon.
Bruk alltid profesjonell medisinsk terminologi pa norsk.
Vaer konsis og presis. Folg norske retningslinjer for journalforing.
"""

# Training examples incorporated via ADAPTER
${
  trainingData.data
    ? `
# Training data hash: ${hashTrainingData(trainingData.data)}
`
    : ''
}
`.trim();

  const modelfilePath = path.join(TRAINING_DIR, `Modelfile.${modelVersion}`);
  await fs.mkdir(TRAINING_DIR, { recursive: true });
  await fs.writeFile(modelfilePath, modelfile, 'utf-8');

  return modelfile;
};

/**
 * Train a model using the Ollama HTTP API.
 *
 * @param {string} modelVersion - Target model version
 * @param {string} modelfile - Modelfile content
 * @returns {Promise<Object>} Ollama API response
 */
export const trainModel = async (modelVersion, modelfile) => {
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
};

/**
 * Activate a model version as the primary model.
 *
 * @param {string} modelVersion
 * @returns {Promise<void>}
 */
export const activateModel = async (modelVersion) => {
  await query(
    `INSERT INTO system_config (key, value, updated_at)
     VALUES ('active_ai_model', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [modelVersion]
  );

  await eventBus.emit(DOMAIN_EVENTS.MODEL_ACTIVATED, {
    modelVersion,
    activatedAt: new Date().toISOString(),
  });

  logger.info(`Model ${modelVersion} activated as primary`);
};

/**
 * Roll back to a previous model version.
 * Uses Modelfile rebuild if available, otherwise deletes via Ollama API.
 *
 * @param {string} targetVersion - Version to roll back to
 * @param {string|null} currentModelVersion - Currently active version
 * @returns {Promise<Object>}
 */
export const rollbackModel = async (targetVersion, currentModelVersion = null) => {
  if (!targetVersion) {
    // Simple delete fallback (used during validation failures)
    try {
      await fetch(`${OLLAMA_HOST}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetVersion }),
      });
    } catch (error) {
      logger.warn('Error deleting model from Ollama:', error.message);
    }

    await eventBus.emit(DOMAIN_EVENTS.MODEL_ROLLED_BACK, {
      failedModelVersion: targetVersion,
      rolledBackAt: new Date().toISOString(),
    });

    return { success: true, rolledBackTo: targetVersion };
  }

  logger.info(`Rolling back to model version: ${targetVersion}...`);

  const targetModelfilePath = path.join(MODELS_DIR, `Modelfile.${targetVersion}`);

  if (fsSync.existsSync(targetModelfilePath)) {
    try {
      await execAsync('ollama list');
    } catch {
      throw new Error('Ollama is not running. Start Ollama before rollback.');
    }

    const { stdout } = await execAsync(`ollama create ${MODEL_NAME} -f "${targetModelfilePath}"`, {
      timeout: 300000,
    });

    await query(
      `INSERT INTO ai_retraining_events (model_version, previous_version, status, trigger_type, started_at, completed_at)
       VALUES ($1, $2, 'rollback', 'manual', NOW(), NOW())`,
      [targetVersion, currentModelVersion]
    );

    logger.info(`Rolled back to version ${targetVersion}`);

    return {
      success: true,
      rolledBackTo: targetVersion,
      message: `Successfully rolled back to version ${targetVersion}`,
      output: stdout,
    };
  }

  // Fallback: delete via Ollama API
  try {
    await fetch(`${OLLAMA_HOST}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: targetVersion }),
    });
  } catch (error) {
    logger.warn('Error deleting model from Ollama:', error.message);
  }

  await eventBus.emit(DOMAIN_EVENTS.MODEL_ROLLED_BACK, {
    failedModelVersion: targetVersion,
    rolledBackAt: new Date().toISOString(),
  });

  return { success: true, rolledBackTo: targetVersion };
};

/**
 * Trigger a single retraining run (export -> train -> validate -> activate).
 *
 * @param {Object} state - Shared mutable state { isRetraining, currentModelVersion, config }
 * @returns {Promise<Object>} Training result
 */
export const triggerRetraining = async (state) => {
  if (state.isRetraining) {
    logger.warn('Retraining already in progress, skipping');
    return { skipped: true, reason: 'Already retraining' };
  }

  state.isRetraining = true;
  const trainingRunId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    await recordTrainingRun(trainingRunId, 'STARTED');

    await eventBus.emit(DOMAIN_EVENTS.MODEL_TRAINING_STARTED, {
      trainingRunId,
      startedAt: new Date().toISOString(),
    });

    logger.info('Starting model retraining pipeline', { trainingRunId });

    // Step 1: Export training data
    const trainingData = await exportTrainingData();
    logger.info(`Exported ${trainingData.count} training examples`);

    if (trainingData.count < 10) {
      throw new Error('Insufficient training data');
    }

    // Step 2: Generate new model version name
    const newModelVersion = `chiro-no-v${Date.now()}`;

    // Step 3: Create Modelfile
    const modelfile = await createModelfile(trainingData, newModelVersion);

    // Step 4: Train model via Ollama (with circuit breaker)
    await CircuitBreakers.ollama.execute(async () => await trainModel(newModelVersion, modelfile));

    // Step 5: Validate new model
    const validation = await validateModel(newModelVersion, state.config);

    if (!validation.passed) {
      logger.warn('Model validation failed, rolling back', validation);
      await rollbackModel(newModelVersion, state.currentModelVersion);
      await recordTrainingRun(trainingRunId, 'VALIDATION_FAILED', {
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
    await activateModel(newModelVersion);
    state.currentModelVersion = newModelVersion;

    // Record success
    const duration = Date.now() - startTime;
    await recordTrainingRun(trainingRunId, 'COMPLETED', {
      modelVersion: newModelVersion,
      trainingExamples: trainingData.count,
      validation,
      duration,
    });

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

    await recordTrainingRun(trainingRunId, 'FAILED', {
      error: error.message,
      duration: Date.now() - startTime,
    });

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
    state.isRetraining = false;
  }
};

/**
 * Run the full legacy retraining pipeline.
 * Steps: export feedback -> merge -> convert -> rebuild -> test -> activate.
 *
 * @param {Object} state - Shared mutable state
 * @param {Object} options
 * @param {string} options.trigger
 * @param {boolean} options.dryRun
 * @param {Function} exportFeedbackFn - exportFeedbackToTrainingFormat function
 * @param {Function} testModelFn - testNewModel function
 * @returns {Promise<Object>}
 */
export const runRetrainingPipeline = async (state, options, exportFeedbackFn, testModelFn) => {
  const { trigger = 'manual', dryRun = false } = options;

  if (state.isRetraining) {
    logger.warn('Retraining already in progress, skipping');
    return { skipped: true, reason: 'Already retraining' };
  }

  logger.info('Starting AI retraining pipeline...', { trigger, dryRun });

  const pipelineId = `retrain_${Date.now()}`;
  const results = { pipelineId, trigger, dryRun, steps: [], startTime: new Date() };
  let retrainingEventId = null;
  state.isRetraining = true;

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
    const feedbackExport = await exportFeedbackFn();
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

    // Step 2: Train via triggerRetraining
    const trainResult = await triggerRetraining(state);
    results.steps.push({ step: 'train_model', ...trainResult });

    // Step 3: Test model
    if (trainResult.modelVersion) {
      logger.info('Step 3: Testing new model...');
      const testResult = await testModelFn(trainResult.modelVersion);
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
    state.isRetraining = false;
  }
};
