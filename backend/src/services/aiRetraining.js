/**
 * AI Retraining Pipeline Service
 * Automated model retraining based on user feedback
 * Generates new Ollama models with improved training data
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { query, _transaction, _getClient } from '../config/database.js';
import * as _aiLearning from './aiLearning.js';
import * as _trainingAnonymization from './trainingAnonymization.js';
import * as outlookBridge from './outlookBridge.js';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

// Configuration
const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
const MODELS_DIR = process.env.MODELS_DIR || './models';
const AI_TRAINING_DIR = process.env.AI_TRAINING_DIR || './ai-training';
const BASE_MODEL = process.env.AI_BASE_MODEL || 'llama3.2';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'chiroclick-clinical';
const RETRAINING_FEEDBACK_THRESHOLD = parseInt(process.env.RETRAINING_FEEDBACK_THRESHOLD || '50');
const RETRAINING_REJECTION_THRESHOLD = parseInt(process.env.RETRAINING_REJECTION_THRESHOLD || '20');

// Model version tracking
let currentModelVersion = null;
let previousModelVersion = null;

/**
 * Ensure all required directories exist
 */
const ensureDirectories = () => {
  const dirs = [
    TRAINING_DIR,
    MODELS_DIR,
    AI_TRAINING_DIR,
    `${TRAINING_DIR}/feedback`,
    `${TRAINING_DIR}/merged`,
    `${TRAINING_DIR}/backup`,
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

/**
 * Get current retraining status
 */
export const getRetrainingStatus = async () => {
  try {
    const result = await query(
      `SELECT * FROM ai_retraining_events
       ORDER BY started_at DESC
       LIMIT 1`
    );

    const currentEvent = result.rows[0] || null;

    // Get threshold metrics
    const thresholdResult = await query(
      `SELECT
        COUNT(*) as feedback_count,
        SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejection_count
       FROM ai_feedback
       WHERE created_at > NOW() - INTERVAL '7 days'
         AND processed_for_training = false`
    );

    const metrics = thresholdResult.rows[0];

    return {
      currentEvent,
      currentModelVersion,
      previousModelVersion,
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
};

/**
 * Get retraining history
 */
export const getRetrainingHistory = async (limit = 20) => {
  try {
    const result = await query(
      `SELECT
        id,
        model_version,
        previous_version,
        status,
        trigger_type,
        feedback_count,
        training_examples,
        started_at,
        completed_at,
        error_message,
        test_results,
        activated_at
       FROM ai_retraining_events
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting retraining history:', error);
    throw error;
  }
};

/**
 * Export feedback data to JSONL training format
 */
export const exportFeedbackToTrainingFormat = async (options = {}) => {
  const { minRating = 3, days = 90, includeRejected = true } = options;

  ensureDirectories();
  logger.info('Exporting feedback to training format...');

  try {
    // Get high-quality feedback (accepted with corrections or highly rated)
    const feedbackResult = await query(
      `SELECT
        af.id,
        af.suggestion_type,
        af.original_suggestion,
        af.user_correction,
        af.accepted,
        af.correction_type,
        af.user_rating,
        af.context_data,
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

      // Create training example based on feedback type
      if (feedback.accepted && !feedback.user_correction) {
        // Accepted as-is: reinforce original suggestion
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
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
        // User made corrections: use corrected version
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
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
        // Rejected: potentially use as negative example (for RLAIF)
        trainingExamples.push({
          messages: [
            {
              role: 'user',
              content: buildPromptFromContext(feedback.suggestion_type, feedback.context_data),
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

    // Write to JSONL file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(TRAINING_DIR, 'feedback', `feedback_${timestamp}.jsonl`);
    const jsonlContent = trainingExamples.map((ex) => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);

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
  } catch (error) {
    logger.error('Error exporting feedback to training format:', error);
    throw error;
  }
};

/**
 * Build prompt from context data
 */
const buildPromptFromContext = (suggestionType, contextData) => {
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
};

/**
 * Merge feedback training data with base training data
 */
export const mergeWithBaseTrainingData = async (feedbackDataPath) => {
  ensureDirectories();
  logger.info('Merging feedback data with base training data...');

  try {
    // Read the base Modelfile to extract existing MESSAGE examples
    const modelfilePath = path.join(AI_TRAINING_DIR, 'Modelfile');
    let baseExamples = [];

    if (fs.existsSync(modelfilePath)) {
      const modelfileContent = fs.readFileSync(modelfilePath, 'utf-8');
      baseExamples = extractMessagesFromModelfile(modelfileContent);
      logger.info(`Extracted ${baseExamples.length} examples from base Modelfile`);
    }

    // Read feedback training data
    let feedbackExamples = [];
    if (fs.existsSync(feedbackDataPath)) {
      const feedbackContent = fs.readFileSync(feedbackDataPath, 'utf-8');
      feedbackExamples = feedbackContent
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
      logger.info(`Loaded ${feedbackExamples.length} feedback examples`);
    }

    // Deduplicate: prefer newer feedback examples over base
    const mergedExamples = [...baseExamples];
    const existingPrompts = new Set(
      baseExamples.map((e) => e.messages?.[0]?.content?.toLowerCase())
    );

    for (const example of feedbackExamples) {
      const prompt = example.messages?.[0]?.content?.toLowerCase();
      if (!existingPrompts.has(prompt)) {
        mergedExamples.push(example);
        existingPrompts.add(prompt);
      } else {
        // Replace base example with feedback example (feedback is more recent/relevant)
        const idx = mergedExamples.findIndex(
          (e) => e.messages?.[0]?.content?.toLowerCase() === prompt
        );
        if (idx !== -1 && !example.metadata?.isNegativeExample) {
          mergedExamples[idx] = example;
        }
      }
    }

    // Write merged data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(TRAINING_DIR, 'merged', `merged_${timestamp}.jsonl`);
    const jsonlContent = mergedExamples.map((ex) => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);

    logger.info(`Merged ${mergedExamples.length} total examples to ${outputPath}`);

    return {
      outputPath,
      totalExamples: mergedExamples.length,
      baseExamples: baseExamples.length,
      feedbackExamples: feedbackExamples.length,
      newExamples: mergedExamples.length - baseExamples.length,
    };
  } catch (error) {
    logger.error('Error merging training data:', error);
    throw error;
  }
};

/**
 * Extract MESSAGE pairs from Modelfile
 */
const extractMessagesFromModelfile = (modelfileContent) => {
  const examples = [];
  const lines = modelfileContent.split('\n');

  let currentUser = null;

  for (const line of lines) {
    if (line.startsWith('MESSAGE user')) {
      // Extract content between triple quotes
      const match = line.match(/MESSAGE user """(.*)"""/);
      if (match) {
        currentUser = match[1];
      }
    } else if (line.startsWith('MESSAGE assistant') && currentUser) {
      const match = line.match(/MESSAGE assistant """(.*)"""/);
      if (match) {
        examples.push({
          messages: [
            { role: 'user', content: currentUser },
            { role: 'assistant', content: match[1] },
          ],
          metadata: { type: 'base' },
        });
        currentUser = null;
      }
    }
  }

  return examples;
};

/**
 * Convert merged training data to Ollama Modelfile format
 */
export const convertToOllamaFormat = async (mergedDataPath, options = {}) => {
  const { temperature = 0.3, topP = 0.9, numPredict = 500, systemPrompt = null } = options;

  ensureDirectories();
  logger.info('Converting to Ollama Modelfile format...');

  try {
    // Read merged training data
    const mergedContent = fs.readFileSync(mergedDataPath, 'utf-8');
    const examples = mergedContent
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
      .filter((ex) => !ex.metadata?.isNegativeExample); // Exclude negative examples

    // Read existing Modelfile for system prompt
    const baseModelfilePath = path.join(AI_TRAINING_DIR, 'Modelfile');
    let baseSystemPrompt = '';

    if (fs.existsSync(baseModelfilePath)) {
      const baseContent = fs.readFileSync(baseModelfilePath, 'utf-8');
      const systemMatch = baseContent.match(/SYSTEM """([\s\S]*?)"""/);
      if (systemMatch) {
        baseSystemPrompt = systemMatch[1];
      }
    }

    const finalSystemPrompt = systemPrompt || baseSystemPrompt || getDefaultSystemPrompt();

    // Build Modelfile content
    const version = generateModelVersion();
    let modelfileContent = `# Ollama Modelfile for Norwegian Chiropractic Documentation AI
# Generated: ${new Date().toISOString()}
# Version: ${version}
# Training examples: ${examples.length}

FROM ${BASE_MODEL}

# Set parameters for clinical documentation
PARAMETER temperature ${temperature}
PARAMETER top_p ${topP}
PARAMETER num_predict ${numPredict}
PARAMETER stop "<|eot_id|>"
PARAMETER stop "<|end_of_text|>"

# Norwegian chiropractic clinical documentation system prompt
SYSTEM """${finalSystemPrompt}"""

`;

    // Add MESSAGE examples
    for (const example of examples) {
      if (example.messages && example.messages.length >= 2) {
        const userMsg = example.messages[0].content.replace(/"""/g, '\\"\\"\\"');
        const assistantMsg = example.messages[1].content.replace(/"""/g, '\\"\\"\\"');

        modelfileContent += `MESSAGE user """${userMsg}"""\n`;
        modelfileContent += `MESSAGE assistant """${assistantMsg}"""\n\n`;
      }
    }

    // Add license notice
    modelfileContent += `# License notice
LICENSE """
This model is trained on Norwegian chiropractic clinical documentation.
Enhanced with user feedback and corrections.
Version: ${version}
For educational and clinical documentation assistance purposes only.
Not a substitute for professional clinical judgment.
"""
`;

    // Write new Modelfile
    const outputPath = path.join(MODELS_DIR, `Modelfile.${version}`);
    fs.writeFileSync(outputPath, modelfileContent);

    logger.info(`Generated Modelfile version ${version} at ${outputPath}`);

    return {
      outputPath,
      version,
      examplesCount: examples.length,
      parameters: { temperature, topP, numPredict },
    };
  } catch (error) {
    logger.error('Error converting to Ollama format:', error);
    throw error;
  }
};

/**
 * Generate model version string
 */
const generateModelVersion = () => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
  return `v${dateStr}.${timeStr}`;
};

/**
 * Get default system prompt
 */
const getDefaultSystemPrompt =
  () => `Du er en klinisk dokumentasjonsassistent for kiropraktorer i Norge.

Din oppgave er å hjelpe med profesjonell klinisk dokumentasjon på norsk, inkludert:
- SOPE/SOAP-notater (Subjektiv, Objektiv, Plan/Evaluering)
- Vestibulær vurdering og VNG-dokumentasjon
- Henvisninger og sykemeldinger
- Kliniske fraser og maler

VIKTIGE RETNINGSLINJER:
1. Bruk alltid profesjonelt medisinsk språk
2. Vær presis og konsis
3. Inkluder relevante ICPC-2 diagnosekoder
4. Dokumenter alltid røde flagg-vurdering
5. Bruk standardiserte kliniske termer

Svar alltid på norsk med profesjonell klinisk dokumentasjon.`;

/**
 * Rebuild Ollama model with new Modelfile
 */
export const rebuildOllamaModel = async (modelfilePath, modelName = null) => {
  const targetModelName = modelName || MODEL_NAME;
  logger.info(`Rebuilding Ollama model: ${targetModelName}...`);

  try {
    // Verify Modelfile exists
    if (!fs.existsSync(modelfilePath)) {
      throw new Error(`Modelfile not found: ${modelfilePath}`);
    }

    // Check if Ollama is running
    try {
      await execAsync('ollama list');
    } catch (ollamaError) {
      throw new Error('Ollama is not running or not installed. Please start Ollama first.');
    }

    // Create the model
    const { stdout, stderr } = await execAsync(
      `ollama create ${targetModelName} -f "${modelfilePath}"`,
      { timeout: 300000 } // 5 minute timeout
    );

    logger.info('Ollama create output:', stdout);
    if (stderr) {
      logger.warn('Ollama create stderr:', stderr);
    }

    // Verify model was created
    const { stdout: listOutput } = await execAsync('ollama list');
    if (!listOutput.includes(targetModelName)) {
      throw new Error('Model creation completed but model not found in ollama list');
    }

    logger.info(`Successfully rebuilt model: ${targetModelName}`);

    return {
      success: true,
      modelName: targetModelName,
      output: stdout,
      message: `Model ${targetModelName} rebuilt successfully`,
    };
  } catch (error) {
    logger.error('Error rebuilding Ollama model:', error);
    throw new Error(`Failed to rebuild model: ${error.message}`);
  }
};

/**
 * Test new model performance
 */
export const testNewModel = async (modelName = null) => {
  const targetModelName = modelName || MODEL_NAME;
  logger.info(`Testing new model: ${targetModelName}...`);

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

  try {
    for (const testCase of testCases) {
      try {
        const { stdout } = await execAsync(
          `ollama run ${targetModelName} "${testCase.prompt.replace(/"/g, '\\"')}"`,
          { timeout: 60000 }
        );

        const response = stdout.trim();
        const containsExpected = testCase.expectedContains.some((keyword) =>
          response.toLowerCase().includes(keyword.toLowerCase())
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
      passed: passRate >= 75, // Require at least 75% pass rate
      results,
    };
  } catch (error) {
    logger.error('Error testing new model:', error);
    throw error;
  }
};

/**
 * Activate new model (switch to new version)
 */
export const activateNewModel = async (version, retrainingEventId = null) => {
  logger.info(`Activating model version: ${version}...`);

  try {
    // Backup current model version
    previousModelVersion = currentModelVersion;
    currentModelVersion = version;

    // Copy new Modelfile to ai-training directory
    const newModelfilePath = path.join(MODELS_DIR, `Modelfile.${version}`);
    const activeModelfilePath = path.join(AI_TRAINING_DIR, 'Modelfile');

    if (fs.existsSync(newModelfilePath)) {
      // Backup current Modelfile
      if (fs.existsSync(activeModelfilePath)) {
        const backupPath = path.join(TRAINING_DIR, 'backup', `Modelfile.backup.${Date.now()}`);
        fs.copyFileSync(activeModelfilePath, backupPath);
        logger.info(`Backed up current Modelfile to ${backupPath}`);
      }

      // Copy new Modelfile
      fs.copyFileSync(newModelfilePath, activeModelfilePath);
      logger.info(`Activated new Modelfile from ${newModelfilePath}`);
    }

    // Update retraining event if provided
    if (retrainingEventId) {
      await query(
        `UPDATE ai_retraining_events
         SET status = 'active', activated_at = NOW()
         WHERE id = $1`,
        [retrainingEventId]
      );
    }

    // Update environment/config (in memory for current process)
    process.env.AI_MODEL_VERSION = version;

    logger.info(`Model version ${version} is now active`);

    return {
      success: true,
      version,
      previousVersion: previousModelVersion,
      message: `Model version ${version} activated successfully`,
    };
  } catch (error) {
    logger.error('Error activating new model:', error);
    throw error;
  }
};

/**
 * Rollback to previous model version
 */
export const rollbackModel = async (targetVersion = null) => {
  const rollbackTo = targetVersion || previousModelVersion;
  logger.info(`Rolling back to model version: ${rollbackTo}...`);

  try {
    if (!rollbackTo) {
      throw new Error('No previous version available for rollback');
    }

    // Find the Modelfile for the target version
    const targetModelfilePath = path.join(MODELS_DIR, `Modelfile.${rollbackTo}`);

    // Check backup directory if not in models directory
    if (!fs.existsSync(targetModelfilePath)) {
      // Try to find in backup
      const backupDir = path.join(TRAINING_DIR, 'backup');
      const backupFiles = fs.readdirSync(backupDir).filter((f) => f.includes(rollbackTo));
      if (backupFiles.length === 0) {
        throw new Error(`Modelfile for version ${rollbackTo} not found`);
      }
    }

    // Rebuild the model with the previous version
    const rebuildResult = await rebuildOllamaModel(targetModelfilePath, MODEL_NAME);

    // Update version tracking
    currentModelVersion = rollbackTo;

    // Log rollback event
    await query(
      `INSERT INTO ai_retraining_events (
        model_version,
        previous_version,
        status,
        trigger_type,
        started_at,
        completed_at
      ) VALUES ($1, $2, 'rollback', 'manual', NOW(), NOW())`,
      [rollbackTo, previousModelVersion]
    );

    logger.info(`Successfully rolled back to version ${rollbackTo}`);

    return {
      success: true,
      rolledBackTo: rollbackTo,
      previousVersion: previousModelVersion,
      rebuildResult,
      message: `Successfully rolled back to version ${rollbackTo}`,
    };
  } catch (error) {
    logger.error('Error rolling back model:', error);
    throw error;
  }
};

/**
 * Notify admins about retraining events
 */
export const notifyAdmins = async (eventType, details) => {
  logger.info(`Notifying admins about: ${eventType}`);

  try {
    // Get admin users
    const adminsResult = await query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE role = 'ADMIN' AND is_active = true`
    );

    const admins = adminsResult.rows;

    if (admins.length === 0) {
      logger.warn('No admin users found to notify');
      return { notified: 0 };
    }

    const subject = getNotificationSubject(eventType);
    const body = getNotificationBody(eventType, details);

    let notifiedCount = 0;

    for (const admin of admins) {
      try {
        await outlookBridge.sendEmail({
          to: admin.email,
          subject,
          body,
        });
        notifiedCount++;
        logger.info(`Notified admin: ${admin.email}`);
      } catch (emailError) {
        logger.error(`Failed to notify admin ${admin.email}:`, emailError);
      }
    }

    // Also log to database
    await query(
      `INSERT INTO admin_notifications (
        notification_type,
        subject,
        details,
        recipients_count,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [eventType, subject, JSON.stringify(details), notifiedCount]
    );

    return { notified: notifiedCount, total: admins.length };
  } catch (error) {
    logger.error('Error notifying admins:', error);
    // Don't throw - notification failure shouldn't break the pipeline
    return { notified: 0, error: error.message };
  }
};

/**
 * Get notification subject based on event type
 */
const getNotificationSubject = (eventType) => {
  const subjects = {
    retraining_started: 'AI Model Retraining Started',
    retraining_completed: 'AI Model Retraining Completed Successfully',
    retraining_failed: 'AI Model Retraining Failed',
    threshold_reached: 'AI Retraining Threshold Reached',
    model_activated: 'New AI Model Version Activated',
    model_rollback: 'AI Model Rolled Back to Previous Version',
    test_failed: 'AI Model Testing Failed',
  };
  return subjects[eventType] || `AI Retraining Event: ${eventType}`;
};

/**
 * Get notification body based on event type
 */
const getNotificationBody = (eventType, details) => {
  const timestamp = new Date().toLocaleString('no-NO', { timeZone: 'Europe/Oslo' });

  let body = `ChiroClick AI System Notification\n`;
  body += `Time: ${timestamp}\n\n`;

  switch (eventType) {
    case 'retraining_started':
      body += `AI model retraining has started.\n`;
      body += `Trigger: ${details.trigger || 'Manual'}\n`;
      body += `Feedback count: ${details.feedbackCount || 'N/A'}\n`;
      break;
    case 'retraining_completed':
      body += `AI model retraining completed successfully!\n`;
      body += `New version: ${details.version || 'N/A'}\n`;
      body += `Training examples: ${details.examplesCount || 'N/A'}\n`;
      body += `Test pass rate: ${details.testPassRate || 'N/A'}%\n`;
      break;
    case 'retraining_failed':
      body += `AI model retraining failed.\n`;
      body += `Error: ${details.error || 'Unknown error'}\n`;
      body += `Step: ${details.step || 'Unknown'}\n`;
      break;
    case 'threshold_reached':
      body += `Retraining threshold has been reached.\n`;
      body += `Feedback count: ${details.feedbackCount || 'N/A'}\n`;
      body += `Rejection count: ${details.rejectionCount || 'N/A'}\n`;
      body += `Automatic retraining will be triggered soon.\n`;
      break;
    case 'model_activated':
      body += `New AI model version has been activated.\n`;
      body += `Version: ${details.version || 'N/A'}\n`;
      body += `Previous version: ${details.previousVersion || 'N/A'}\n`;
      break;
    case 'model_rollback':
      body += `AI model has been rolled back.\n`;
      body += `Rolled back to: ${details.rolledBackTo || 'N/A'}\n`;
      body += `Reason: ${details.reason || 'Manual rollback'}\n`;
      break;
    default:
      body += JSON.stringify(details, null, 2);
  }

  body += `\n\n---\nChiroClick CRM AI System`;

  return body;
};

/**
 * Run the full retraining pipeline
 */
export const runRetrainingPipeline = async (options = {}) => {
  const { trigger = 'manual', dryRun = false } = options;

  logger.info('Starting AI retraining pipeline...', { trigger, dryRun });

  const pipelineId = `retrain_${Date.now()}`;
  const results = {
    pipelineId,
    trigger,
    dryRun,
    steps: [],
    startTime: new Date(),
  };

  let retrainingEventId = null;

  try {
    // Create retraining event record
    if (!dryRun) {
      const eventResult = await query(
        `INSERT INTO ai_retraining_events (
          model_version,
          status,
          trigger_type,
          started_at
        ) VALUES ($1, 'running', $2, NOW())
        RETURNING id`,
        [generateModelVersion(), trigger]
      );
      retrainingEventId = eventResult.rows[0].id;
    }

    // Notify about start
    await notifyAdmins('retraining_started', { trigger });

    // Step 1: Export feedback to training format
    logger.info('Step 1: Exporting feedback data...');
    const feedbackExport = await exportFeedbackToTrainingFormat();
    results.steps.push({ step: 'export_feedback', ...feedbackExport });

    if (feedbackExport.examplesCount === 0) {
      logger.info('No new feedback examples to process. Pipeline complete.');
      results.success = true;
      results.message = 'No new feedback to process';
      results.endTime = new Date();
      return results;
    }

    // Step 2: Merge with base training data
    logger.info('Step 2: Merging training data...');
    const mergeResult = await mergeWithBaseTrainingData(feedbackExport.outputPath);
    results.steps.push({ step: 'merge_data', ...mergeResult });

    // Step 3: Convert to Ollama format
    logger.info('Step 3: Converting to Ollama format...');
    const convertResult = await convertToOllamaFormat(mergeResult.outputPath);
    results.steps.push({ step: 'convert_format', ...convertResult });

    if (dryRun) {
      logger.info('Dry run complete. Skipping model rebuild and activation.');
      results.success = true;
      results.dryRun = true;
      results.endTime = new Date();
      return results;
    }

    // Step 4: Rebuild Ollama model
    logger.info('Step 4: Rebuilding Ollama model...');
    const rebuildResult = await rebuildOllamaModel(convertResult.outputPath);
    results.steps.push({ step: 'rebuild_model', ...rebuildResult });

    // Step 5: Test new model
    logger.info('Step 5: Testing new model...');
    const testResult = await testNewModel();
    results.steps.push({ step: 'test_model', ...testResult });

    // Update event with test results
    if (retrainingEventId) {
      await query(
        `UPDATE ai_retraining_events
         SET training_examples = $1, test_results = $2, feedback_count = $3
         WHERE id = $4`,
        [
          convertResult.examplesCount,
          JSON.stringify(testResult),
          feedbackExport.examplesCount,
          retrainingEventId,
        ]
      );
    }

    // Check if tests passed
    if (!testResult.passed) {
      logger.warn('Model tests did not meet threshold. Consider manual review.');
      await notifyAdmins('test_failed', testResult);

      if (retrainingEventId) {
        await query(
          `UPDATE ai_retraining_events
           SET status = 'test_failed', completed_at = NOW()
           WHERE id = $1`,
          [retrainingEventId]
        );
      }

      results.success = false;
      results.message = 'Model tests did not pass threshold';
      results.endTime = new Date();
      return results;
    }

    // Step 6: Activate new model
    logger.info('Step 6: Activating new model...');
    const activateResult = await activateNewModel(convertResult.version, retrainingEventId);
    results.steps.push({ step: 'activate_model', ...activateResult });

    // Mark processed feedback
    if (feedbackExport.processedFeedbackIds.length > 0) {
      await query(
        `UPDATE ai_feedback
         SET processed_for_training = true, processed_at = NOW()
         WHERE id = ANY($1)`,
        [feedbackExport.processedFeedbackIds]
      );
    }

    // Update retraining event
    if (retrainingEventId) {
      await query(
        `UPDATE ai_retraining_events
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [retrainingEventId]
      );
    }

    results.success = true;
    results.version = convertResult.version;
    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000;

    // Notify about completion
    await notifyAdmins('retraining_completed', {
      version: convertResult.version,
      examplesCount: convertResult.examplesCount,
      testPassRate: testResult.passRate,
    });

    logger.info(`Retraining pipeline completed successfully in ${results.duration}s`);

    return results;
  } catch (error) {
    logger.error('Retraining pipeline failed:', error);

    // Update retraining event with error
    if (retrainingEventId) {
      await query(
        `UPDATE ai_retraining_events
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [error.message, retrainingEventId]
      );
    }

    // Notify about failure
    await notifyAdmins('retraining_failed', {
      error: error.message,
      step:
        results.steps.length > 0 ? results.steps[results.steps.length - 1].step : 'initialization',
    });

    results.success = false;
    results.error = error.message;
    results.endTime = new Date();

    throw error;
  }
};

/**
 * Check if retraining is needed and trigger if threshold reached
 */
export const checkAndTriggerRetraining = async () => {
  try {
    const status = await getRetrainingStatus();

    if (status.currentEvent?.status === 'running') {
      logger.info('Retraining already in progress, skipping');
      return { triggered: false, reason: 'already_running' };
    }

    if (status.thresholds.thresholdReached) {
      logger.info('Retraining threshold reached, triggering pipeline');

      // Notify about threshold
      await notifyAdmins('threshold_reached', {
        feedbackCount: status.thresholds.currentFeedbackCount,
        rejectionCount: status.thresholds.currentRejectionCount,
      });

      // Run pipeline in background
      setImmediate(async () => {
        try {
          await runRetrainingPipeline({ trigger: 'automatic' });
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
};

export default {
  runRetrainingPipeline,
  exportFeedbackToTrainingFormat,
  mergeWithBaseTrainingData,
  convertToOllamaFormat,
  rebuildOllamaModel,
  testNewModel,
  activateNewModel,
  rollbackModel,
  notifyAdmins,
  getRetrainingStatus,
  getRetrainingHistory,
  checkAndTriggerRetraining,
};
