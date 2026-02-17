/**
 * AI Training Service
 * Manages model status, training data, Modelfile rebuilding,
 * and Ollama model creation/backup/restore.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, exec } from 'child_process';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const AI_TRAINING_DIR = path.join(PROJECT_ROOT, 'ai-training');
const MODELS_CACHE_DIR = path.join(AI_TRAINING_DIR, 'models-cache');
const _SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

const MODEL_NAMES = ['chiro-no', 'chiro-fast', 'chiro-norwegian', 'chiro-medical'];

/**
 * Check if Ollama is running and get model status
 */
export async function getStatus() {
  const result = {
    ollamaRunning: false,
    models: {},
    totalModels: 0,
    missingModels: 0,
  };

  try {
    const output = execSync('ollama list', { encoding: 'utf-8', timeout: 10000 });
    result.ollamaRunning = true;

    for (const name of MODEL_NAMES) {
      const found = output.toLowerCase().includes(name);
      // Extract size from listing if found
      let size = null;
      if (found) {
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes(name)) {
            const match = line.match(/(\d+\.?\d*\s*[GMKT]B)/i);
            if (match) {
              size = match[1];
            }
          }
        }
      }
      result.models[name] = { exists: found, size };
      if (found) {
        result.totalModels++;
      } else {
        result.missingModels++;
      }
    }
  } catch (error) {
    logger.warn('Ollama not running or not installed:', error.message);
  }

  return result;
}

/**
 * List training data files and example counts
 */
export function getTrainingData() {
  const files = [];
  let totalExamples = 0;

  try {
    const jsonlFiles = fs.readdirSync(AI_TRAINING_DIR).filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(AI_TRAINING_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      const exampleCount = lines.length;
      const stat = fs.statSync(filePath);

      files.push({
        name: file,
        examples: exampleCount,
        sizeBytes: stat.size,
        sizeKB: Math.round(stat.size / 1024),
        modified: stat.mtime,
      });
      totalExamples += exampleCount;
    }
  } catch (error) {
    logger.error('Error reading training data:', error.message);
  }

  return { files, totalExamples };
}

/**
 * Add new JSONL examples to training data
 */
export function addExamples(jsonlContent, targetFile = 'training-data.jsonl') {
  // Validate JSONL format
  const lines = jsonlContent
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  const validLines = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (!parsed.prompt && !parsed.response && !parsed.completion) {
        errors.push(`Line ${i + 1}: Missing prompt/response/completion fields`);
        continue;
      }
      validLines.push(lines[i]);
    } catch (e) {
      errors.push(`Line ${i + 1}: Invalid JSON - ${e.message}`);
    }
  }

  if (validLines.length === 0) {
    return { success: false, errors, added: 0 };
  }

  // Append to target file
  const filePath = path.join(AI_TRAINING_DIR, targetFile);
  const appendContent = `\n${validLines.join('\n')}\n`;
  fs.appendFileSync(filePath, appendContent, 'utf-8');

  return {
    success: true,
    added: validLines.length,
    errors,
    targetFile,
  };
}

/**
 * Rebuild Modelfiles from training data and re-create Ollama models
 */
export async function rebuild() {
  const steps = [];

  // Step 1: Run build-modelfiles.js
  try {
    const scriptPath = path.join(AI_TRAINING_DIR, 'scripts', 'build-modelfiles.js');
    const output = execSync(`node "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: AI_TRAINING_DIR,
    });
    steps.push({ step: 'build-modelfiles', success: true, output: output.trim() });
  } catch (error) {
    steps.push({ step: 'build-modelfiles', success: false, error: error.message });
    return { success: false, steps, error: 'Failed to generate Modelfiles' };
  }

  // Step 2: Create each Ollama model
  for (const model of MODEL_NAMES) {
    try {
      const modelfilePath = path.join(AI_TRAINING_DIR, `Modelfile.${model}`);
      if (!fs.existsSync(modelfilePath)) {
        steps.push({ step: `create-${model}`, success: false, error: 'Modelfile not found' });
        continue;
      }

      const output = execSync(`ollama create ${model} -f "${modelfilePath}"`, {
        encoding: 'utf-8',
        timeout: 300000, // 5 min per model (may need to pull base)
        cwd: AI_TRAINING_DIR,
      });
      steps.push({ step: `create-${model}`, success: true, output: output.trim() });
    } catch (error) {
      steps.push({ step: `create-${model}`, success: false, error: error.message });
    }
  }

  const allSuccess = steps.every((s) => s.success);
  return { success: allSuccess, steps };
}

/**
 * Backup models to project folder
 */
export async function backup() {
  try {
    if (!fs.existsSync(MODELS_CACHE_DIR)) {
      fs.mkdirSync(MODELS_CACHE_DIR, { recursive: true });
    }

    const results = [];
    for (const model of MODEL_NAMES) {
      try {
        const modelDir = path.join(MODELS_CACHE_DIR, model);
        if (!fs.existsSync(modelDir)) {
          fs.mkdirSync(modelDir, { recursive: true });
        }

        const output = execSync(`ollama show ${model} --modelfile`, {
          encoding: 'utf-8',
          timeout: 30000,
        });
        fs.writeFileSync(path.join(modelDir, 'Modelfile'), output, 'utf-8');
        results.push({ model, success: true });
      } catch (error) {
        results.push({ model, success: false, error: error.message });
      }
    }

    // Also copy source Modelfiles
    for (const model of MODEL_NAMES) {
      const src = path.join(AI_TRAINING_DIR, `Modelfile.${model}`);
      const dest = path.join(MODELS_CACHE_DIR, `Modelfile.${model}`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }

    return { success: true, results, backupDir: MODELS_CACHE_DIR };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Restore models from backup
 */
export async function restore() {
  const results = [];

  for (const model of MODEL_NAMES) {
    try {
      // Check if already exists
      const listOutput = execSync('ollama list', { encoding: 'utf-8', timeout: 10000 });
      if (listOutput.toLowerCase().includes(model)) {
        results.push({ model, success: true, action: 'already_exists' });
        continue;
      }

      // Try backup Modelfile first
      const backupModelfile = path.join(MODELS_CACHE_DIR, model, 'Modelfile');
      const sourceModelfile = path.join(AI_TRAINING_DIR, `Modelfile.${model}`);

      let modelfilePath = null;
      if (fs.existsSync(backupModelfile)) {
        modelfilePath = backupModelfile;
      } else if (fs.existsSync(sourceModelfile)) {
        modelfilePath = sourceModelfile;
      }

      if (!modelfilePath) {
        results.push({ model, success: false, error: 'No Modelfile found' });
        continue;
      }

      execSync(`ollama create ${model} -f "${modelfilePath}"`, {
        encoding: 'utf-8',
        timeout: 300000,
      });
      results.push({ model, success: true, action: 'restored' });
    } catch (error) {
      results.push({ model, success: false, error: error.message });
    }
  }

  return { success: results.every((r) => r.success), results };
}

/**
 * Test a model with a prompt
 */
export async function testModel(modelName, prompt) {
  if (!MODEL_NAMES.includes(modelName)) {
    throw new Error(`Unknown model: ${modelName}. Valid: ${MODEL_NAMES.join(', ')}`);
  }

  const testPrompt = prompt || 'Hva er de vanligste årsaker til korsryggsmerter?';

  return new Promise((resolve, reject) => {
    const _child = exec(
      `echo ${testPrompt.replace(/"/g, '\\"')} | ollama run ${modelName} --nowordwrap`,
      { encoding: 'utf-8', timeout: 60000 },
      (error, stdout, _stderr) => {
        if (error) {
          reject(new Error(`Model test failed: ${error.message}`));
          return;
        }
        resolve({
          model: modelName,
          prompt: testPrompt,
          response: stdout.trim(),
          success: true,
        });
      }
    );
  });
}

export default {
  getStatus,
  getTrainingData,
  addExamples,
  rebuild,
  backup,
  restore,
  testModel,
};
