/**
 * Ollama Training Pipeline
 * Fine-tune Gemini 3 Pro with clinical documentation
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as googleDrive from './googleDrive.js';
import * as documentParser from './documentParser.js';
import * as trainingAnonymization from './trainingAnonymization.js';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

const TRAINING_DIR = process.env.TRAINING_DATA_DIR || './training_data';
const MODELS_DIR = process.env.MODELS_DIR || './models';
const BASE_MODEL = process.env.AI_MODEL || 'chiro-no-sft-dpo-v5';

/**
 * Ensure directories exist
 */
const ensureDirectories = () => {
  [
    TRAINING_DIR,
    MODELS_DIR,
    `${TRAINING_DIR}/raw`,
    `${TRAINING_DIR}/parsed`,
    `${TRAINING_DIR}/anonymized`,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Step 1: Fetch documents from Google Drive
 */
export const fetchTrainingDocuments = async (folderId, options = {}) => {
  ensureDirectories();
  logger.info('Fetching training documents from Google Drive...');

  const {
    includeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  } = options;

  const documents = await googleDrive.syncTrainingDocuments(folderId, `${TRAINING_DIR}/raw`, {
    mimeTypes: includeTypes,
  });

  logger.info(`Fetched ${documents.length} documents`);

  return {
    totalDocuments: documents.length,
    documents,
    directory: `${TRAINING_DIR}/raw`,
  };
};

/**
 * Step 2: Parse documents and extract text
 */
export const parseTrainingDocuments = async () => {
  ensureDirectories();
  logger.info('Parsing training documents...');

  const result = await documentParser.parseDirectory(`${TRAINING_DIR}/raw`, {
    recursive: true,
    includeTypes: ['.pdf', '.docx', '.doc'],
  });

  result.documents.forEach((doc) => {
    const fileName = `${path.basename(doc.fileName, path.extname(doc.fileName))}.json`;
    const outputPath = path.join(`${TRAINING_DIR}/parsed`, fileName);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          fileName: doc.fileName,
          text: doc.text,
          metadata: doc.metadata,
          parsedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  });

  logger.info(`Parsed ${result.total} documents with ${result.errorCount} errors`);
  return result;
};

/**
 * Step 3: Anonymize parsed documents (GDPR compliance)
 */
export const anonymizeTrainingData = async (options = {}) => {
  ensureDirectories();
  logger.info('Anonymizing training data...');

  const parsedFiles = fs
    .readdirSync(`${TRAINING_DIR}/parsed`)
    .filter((file) => file.endsWith('.json'));
  const documents = parsedFiles.map((file) =>
    JSON.parse(fs.readFileSync(path.join(`${TRAINING_DIR}/parsed`, file), 'utf-8'))
  );

  const result = trainingAnonymization.batchAnonymize(documents, options);

  result.anonymized.forEach((doc) => {
    const fileName = `anonymized_${doc.fileName}`;
    const outputPath = path.join(`${TRAINING_DIR}/anonymized`, fileName);
    fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));
  });

  logger.info(`Anonymized ${result.success} documents`);
  return result;
};

/**
 * Step 4: Create training dataset for Ollama
 */
export const createTrainingDataset = async (clinicalEncounters = []) => {
  ensureDirectories();
  logger.info('Creating training dataset...');

  const anonymizedFiles = fs
    .readdirSync(`${TRAINING_DIR}/anonymized`)
    .filter((file) => file.endsWith('.json'));
  const allExamples = [];

  anonymizedFiles.forEach((file) => {
    const doc = JSON.parse(fs.readFileSync(path.join(`${TRAINING_DIR}/anonymized`, file), 'utf-8'));
    const soap = documentParser.extractSOAPNotes(doc.text);

    if (soap.subjective && soap.objective) {
      allExamples.push({
        prompt: `Subjektivt: ${soap.subjective}\n\nHva finner du ved objektiv undersøkelse?`,
        response: soap.objective,
      });
    }

    const chunks = documentParser.chunkTextForTraining(doc.text, 512, 50);
    chunks.forEach((chunk, idx) => {
      if (idx < chunks.length - 1) {
        allExamples.push({
          prompt: `Fortsett følgende journalnotat:\n\n${chunk.substring(0, 200)}...`,
          response: chunks[idx + 1].substring(0, 300),
        });
      }
    });
  });

  if (clinicalEncounters.length > 0) {
    const encounterExamples = trainingAnonymization.createTrainingExamples(
      clinicalEncounters.map((e) => trainingAnonymization.anonymizeEncounter(e))
    );
    allExamples.push(...encounterExamples);
  }

  const datasetPath = path.join(TRAINING_DIR, 'training_dataset.jsonl');
  const jsonlContent = allExamples.map((ex) => JSON.stringify(ex)).join('\n');
  fs.writeFileSync(datasetPath, jsonlContent);

  logger.info(`Created training dataset with ${allExamples.length} examples`);

  return {
    examples: allExamples.length,
    datasetPath,
    sampleExamples: allExamples.slice(0, 5),
  };
};

/**
 * Step 5: Create Ollama Modelfile
 */
export const createModelfile = async (modelName, options = {}) => {
  const {
    temperature = 0.7,
    topP = 0.9,
    topK = 40,
    systemPrompt = 'Du er en erfaren norsk kiropraktor som hjelper med journalføring og klinisk vurdering.',
  } = options;

  const modelfile = `FROM ${BASE_MODEL}
SYSTEM "${systemPrompt}"
PARAMETER temperature ${temperature}
PARAMETER top_p ${topP}
PARAMETER top_k ${topK}
PARAMETER num_ctx 4096`;

  const modelfilePath = path.join(MODELS_DIR, `Modelfile.${modelName}`);
  fs.writeFileSync(modelfilePath, modelfile);

  logger.info(`Created Modelfile at ${modelfilePath}`);
  return { modelfilePath, modelfile };
};

/**
 * Step 6: Train model with Ollama
 */
export const trainModel = async (modelName) => {
  ensureDirectories();
  logger.info(`Training model: ${modelName}...`);

  const modelfilePath = path.join(MODELS_DIR, `Modelfile.${modelName}`);

  if (!fs.existsSync(modelfilePath)) {
    throw new Error('Modelfile not found. Run createModelfile first.');
  }

  try {
    const { stdout, _stderr } = await execAsync(`ollama create ${modelName} -f ${modelfilePath}`);
    logger.info('Ollama create output:', stdout);

    return {
      success: true,
      modelName,
      output: stdout,
      message: `Model ${modelName} created successfully`,
    };
  } catch (error) {
    logger.error('Error training model:', error);
    throw new Error(`Failed to train model: ${error.message}`);
  }
};

/**
 * Complete training pipeline
 */
export const runFullPipeline = async (googleDriveFolderId, modelName, options = {}) => {
  logger.info('Starting full training pipeline...');

  const results = {
    steps: [],
    modelName,
    startTime: new Date(),
  };

  try {
    const fetchResult = await fetchTrainingDocuments(googleDriveFolderId, options);
    results.steps.push({ step: 'fetch', ...fetchResult });

    const parseResult = await parseTrainingDocuments();
    results.steps.push({ step: 'parse', ...parseResult });

    const anonymizeResult = await anonymizeTrainingData(options);
    results.steps.push({ step: 'anonymize', ...anonymizeResult });

    const datasetResult = await createTrainingDataset(options.clinicalEncounters);
    results.steps.push({ step: 'dataset', ...datasetResult });

    const modelfileResult = await createModelfile(modelName, options);
    results.steps.push({ step: 'modelfile', ...modelfileResult });

    const trainResult = await trainModel(modelName);
    results.steps.push({ step: 'train', ...trainResult });

    results.success = true;
    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000;

    logger.info(`Training pipeline completed in ${results.duration}s`);

    return results;
  } catch (error) {
    logger.error('Training pipeline failed:', error);
    results.success = false;
    results.error = error.message;
    results.endTime = new Date();
    return results;
  }
};

export default {
  fetchTrainingDocuments,
  parseTrainingDocuments,
  anonymizeTrainingData,
  createTrainingDataset,
  createModelfile,
  trainModel,
  runFullPipeline,
};
