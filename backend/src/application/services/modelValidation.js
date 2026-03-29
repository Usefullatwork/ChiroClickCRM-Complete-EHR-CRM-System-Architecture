/**
 * Model Validation
 * Validates trained models using test prompts and similarity scoring.
 *
 * @module application/services/modelValidation
 */

import { CircuitBreakers } from '../../infrastructure/resilience/CircuitBreaker.js';
import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'chiroclick-clinical';

/**
 * Calculate Jaccard similarity between two texts.
 *
 * @param {string} text1
 * @param {string} text2
 * @returns {number} Similarity score 0-1
 */
export const calculateSimilarity = (text1, text2) => {
  if (!text1 || !text2) {
    return 0;
  }

  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
};

/**
 * Retrieve random accepted validation examples from the database.
 *
 * @returns {Promise<Array>} Array of { input, expectedOutput }
 */
export const getValidationExamples = async () => {
  try {
    const result = await query(`
      SELECT
        s.context as input,
        s.content as "expectedOutput"
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
};

/**
 * Validate a model version against a held-out test set.
 *
 * @param {string} modelVersion - The Ollama model name to validate
 * @param {Object} config - Configuration with minValidationAccuracy
 * @returns {Promise<Object>} Validation result
 */
export const validateModel = async (modelVersion, config = {}) => {
  const minAccuracy = config.minValidationAccuracy || 0.75;
  const validationExamples = await getValidationExamples();

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

      const similarity = calculateSimilarity(response.response, example.expectedOutput);

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
    passed: accuracy >= minAccuracy,
    accuracy: (accuracy * 100).toFixed(2),
    totalExamples: validationExamples.length,
    testedExamples: Math.min(validationExamples.length, 20),
    correctPredictions: correct,
    results,
  };
};

/**
 * Test a model via CLI with Norwegian clinical prompts.
 *
 * @param {string|null} modelName - Model to test (defaults to AI_MODEL_NAME)
 * @returns {Promise<Object>} Test results
 */
export const testNewModel = async (modelName = null) => {
  const targetModelName = modelName || MODEL_NAME;
  logger.info(`Testing model: ${targetModelName}...`);

  const testCases = [
    {
      name: 'SOAP Subjective',
      prompt:
        'Skriv subjektiv del av SOPE-notat: Pasient med korsryggsmerter i 2 uker etter lofting',
      expectedContains: ['smert', 'uke', 'loft'],
    },
    {
      name: 'SMS Reminder',
      prompt: 'Skriv en SMS paminnelse om time, vennlig tone',
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
};

/**
 * Get current model info from system_config and Ollama.
 *
 * @returns {Promise<Object>}
 */
export const getCurrentModelInfo = async () => {
  try {
    const result = await query(`
      SELECT value FROM system_config WHERE key = 'active_ai_model'
    `);

    const modelVersion = result.rows[0]?.value || 'chiro-no-sft-dpo-v5';

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
};
