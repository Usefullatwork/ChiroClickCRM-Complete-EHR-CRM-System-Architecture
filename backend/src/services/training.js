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

/**
 * Category-specific prompts for targeted training data generation
 */
const CATEGORY_PROMPTS = {
  icpc2_codes: `Generer kliniske eksempler der en kiropraktor må velge riktig ICPC-2 diagnosekode.
Inkluder pasientbeskrivelse, relevante funn, og korrekt ICPC-2 kode med begrunnelse.
Bruk vanlige muskel- og skjelettdiagnoser (L01-L99, N01-N99).`,

  red_flags: `Generer kliniske scenarier der pasienten presenterer med røde flagg som krever umiddelbar henvisning.
Inkluder: cauda equina-syndrom, frakturer, infeksjon, malignitet, nevrologiske utfall.
Vis korrekt identifisering og håndtering av hvert rødt flagg.`,

  soap_notes: `Generer komplette SOAP-notater for kiropraktisk behandling.
S: Subjektiv (pasientens beskrivelse), O: Objektiv (funn ved undersøkelse),
A: Analyse (diagnose/vurdering), P: Plan (behandling og oppfølging).
Bruk norsk medisinsk terminologi.`,

  letters: `Generer kliniske brev på norsk: henvisningsbrev til spesialist, epikriser,
forsikringsrapporter, og studieattester. Bruk formelt medisinsk språk og inkluder
relevante kliniske funn og diagnoser.`,

  differential_diagnosis: `Generer differensialdiagnostiske vurderinger for vanlige kiropraktiske presentasjoner.
Inkluder muskel-skjelett, nevrologiske, og viscerale differensialdiagnoser.
Vis systematisk utredning og begrunnelse for valgt diagnose.`,

  treatment_plans: `Generer behandlingsplaner for vanlige kiropraktiske tilstander.
Inkluder: behandlingsteknikker, frekvens, prognostiske faktorer, hjemmeøvelser,
og kriterier for henvisning. Bruk evidensbaserte anbefalinger.`,

  patient_communication: `Generer eksempler på pasientkommunikasjon på norsk: forklaringer av diagnoser,
behandlingsalternativer, prognoser, og egenbehandlingsråd.
Bruk pasientvennlig språk uten unødvendig medisinsk sjargong.`,

  quick_fields: `Generer korte kliniske autofyll-tekster for hurtigfelter i journal:
ROM-verdier, ortopediske tester (positive/negative), nevrologiske funn,
palpasjonsfunn, og behandlingsteknikker. Korte, presise formuleringer.`,
};

/**
 * Generate targeted training data using Claude for a specific category.
 * @param {string} category - Category key from CATEGORY_PROMPTS
 * @param {number} count - Number of examples to generate
 * @returns {Array} Generated training examples
 */
export async function generateTargetedData(category, count = 10) {
  const { ClaudeProvider } = await import('./providers/claudeProvider.js');
  const { ensureCompliance } = await import('./complianceValidator.js');
  const { query: dbQuery } = await import('../config/database.js');

  const categoryPrompt = CATEGORY_PROMPTS[category];
  if (!categoryPrompt) {
    throw new Error(
      `Unknown category: ${category}. Valid: ${Object.keys(CATEGORY_PROMPTS).join(', ')}`
    );
  }

  const claudeProvider = new ClaudeProvider();
  const generated = [];
  const errors = [];

  for (let i = 0; i < count; i++) {
    try {
      const prompt = `${categoryPrompt}\n\nGenerer ETT klinisk eksempel i JSON-format:\n{\n  "instruction": "Kort instruksjon for oppgaven",\n  "input": "Klinisk scenario/kontekst",\n  "output": "Forventet korrekt svar",\n  "quality_score": 0.85\n}\n\nSvar KUN med JSON-objektet, ingen annen tekst. Eksempel nr ${i + 1} av ${count}.`;

      const result = await claudeProvider.generate(prompt, categoryPrompt, {
        maxTokens: 1000,
        temperature: 0.7,
        taskType: 'clinical_reasoning',
      });

      // Parse the JSON response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        errors.push({ index: i, error: 'No JSON found in response' });
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.instruction || !parsed.output) {
        errors.push({ index: i, error: 'Missing required fields (instruction, output)' });
        continue;
      }

      // Validate compliance — refuse data with PII
      const instructionCheck = ensureCompliance(parsed.instruction);
      const inputCheck = ensureCompliance(parsed.input || '');
      const outputCheck = ensureCompliance(parsed.output);

      const example = {
        source: 'claude_generated',
        category,
        instruction: instructionCheck.text,
        input: inputCheck.text || null,
        output: outputCheck.text,
        quality_score: Math.min(1, Math.max(0, parseFloat(parsed.quality_score) || 0.8)),
        approved: false,
      };

      // Store in database
      await dbQuery(
        `INSERT INTO ai_training_data (source, category, instruction, input, output, quality_score, approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          example.source,
          example.category,
          example.instruction,
          example.input,
          example.output,
          example.quality_score,
          example.approved,
        ]
      );

      generated.push(example);
    } catch (error) {
      errors.push({ index: i, error: error.message });
      logger.warn(
        `Failed to generate targeted data (${category}, ${i + 1}/${count}):`,
        error.message
      );
    }
  }

  logger.info('Generated targeted training data', {
    category,
    requested: count,
    generated: generated.length,
    errors: errors.length,
  });

  return { generated, errors, category, requested: count };
}

export default {
  getStatus,
  getTrainingData,
  addExamples,
  rebuild,
  backup,
  restore,
  testModel,
  generateTargetedData,
};
