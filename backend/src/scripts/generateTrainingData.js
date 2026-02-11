/**
 * Generate Training Data Script
 * Processes clinical notes and generates structured training data
 * Usage: node src/scripts/generateTrainingData.js <input_file> <output_dir>
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import {
  parseClinicalCase,
  classifyCase,
  convertToTrainingExample,
  convertToJSONL,
} from '../services/clinicalDataParser.js';

/**
 * Split input text into individual cases
 */
const splitIntoCases = (text) => {
  // Split by "Pasient X" or "Eksempel X" headers
  const cases = [];
  const regex = /(?:Pasient \d+|Eksempel \d+)[^:]*:([^]*?)(?=(?:Pasient \d+|Eksempel \d+)|$)/gi;

  const matches = text.matchAll(regex);
  for (const match of matches) {
    if (match[1] && match[1].trim().length > 100) {
      cases.push(match[1].trim());
    }
  }

  // If no matches, try category-based split
  if (cases.length === 0) {
    const categoryRegex =
      /(?:Kategori \d+:|KATEGORI \d+:)([^]*?)(?=(?:Kategori \d+:|KATEGORI \d+:)|$)/gi;
    const categoryMatches = text.matchAll(categoryRegex);

    for (const match of categoryMatches) {
      // Further split by individual examples within category
      const innerCases = match[1].split(/(?=Eksempel \d+:|Anamnese:)/gi);
      for (const innerCase of innerCases) {
        if (innerCase.trim().length > 100) {
          cases.push(innerCase.trim());
        }
      }
    }
  }

  return cases;
};

/**
 * Generate statistics from parsed data
 */
const generateStatistics = (trainingExamples) => {
  const stats = {
    total_cases: trainingExamples.length,
    by_region: {},
    by_pathology: {},
    with_followup: 0,
    with_positive_outcome: 0,
    average_symptoms: 0,
    average_findings: 0,
  };

  for (const example of trainingExamples) {
    if (!example) continue;

    // Count by region
    for (const region of example.metadata.classification.region) {
      stats.by_region[region] = (stats.by_region[region] || 0) + 1;
    }

    // Count by pathology
    for (const pathology of example.metadata.classification.pathology) {
      stats.by_pathology[pathology] = (stats.by_pathology[pathology] || 0) + 1;
    }

    // Follow-up and outcomes
    if (example.metadata.has_followup) {
      stats.with_followup++;
      if (example.metadata.outcome?.status === 'improved') {
        stats.with_positive_outcome++;
      }
    }

    // Average counts
    stats.average_symptoms += example.input.symptoms.length;
    stats.average_findings +=
      (example.output.objective.positive_findings?.length || 0) +
      (example.output.objective.negative_findings?.length || 0);
  }

  if (trainingExamples.length > 0) {
    stats.average_symptoms = (stats.average_symptoms / trainingExamples.length).toFixed(2);
    stats.average_findings = (stats.average_findings / trainingExamples.length).toFixed(2);
  }

  return stats;
};

/**
 * Main function
 */
const main = async () => {
  try {
    const args = process.argv.slice(2);
    const inputFile = args[0] || 'clinical_notes.txt';
    const outputDir = args[1] || './training_output';

    logger.info('Generating Training Data from Clinical Notes');
    logger.info('================================================');
    logger.info(`Input file: ${inputFile}`);
    logger.info(`Output directory: ${outputDir}`);

    // Read input file
    logger.info('Reading input file...');
    const rawText = await fs.readFile(inputFile, 'utf-8');
    logger.info(`Read ${rawText.length} characters`);

    // Split into cases
    logger.info('Splitting into individual cases...');
    const cases = splitIntoCases(rawText);
    logger.info(`Found ${cases.length} clinical cases`);

    // Parse each case
    logger.info('Parsing clinical cases...');
    const trainingExamples = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < cases.length; i++) {
      const caseText = cases[i];
      logger.info(`Processing case ${i + 1}/${cases.length}...`);

      try {
        const example = convertToTrainingExample(caseText);
        if (example) {
          trainingExamples.push(example);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        logger.error(`Failed to parse case ${i + 1}`, { error: error.message });
        failCount++;
      }
    }

    logger.info(`Successfully parsed: ${successCount}`);
    logger.info(`Failed to parse: ${failCount}`);

    // Generate statistics
    logger.info('Generating statistics...');
    const stats = generateStatistics(trainingExamples);
    logger.info('Statistics', {
      total_cases: stats.total_cases,
      with_followup: stats.with_followup,
      with_positive_outcome: stats.with_positive_outcome,
      average_symptoms: stats.average_symptoms,
      average_findings: stats.average_findings,
      by_region: stats.by_region,
      by_pathology: stats.by_pathology,
    });

    // Create output directory
    logger.info('Creating output directory...');
    await fs.mkdir(outputDir, { recursive: true });

    // Save structured JSON
    logger.info('Saving structured training data...');
    await fs.writeFile(
      path.join(outputDir, 'training_data.json'),
      JSON.stringify(trainingExamples, null, 2),
      'utf-8'
    );
    logger.info(`Saved: ${outputDir}/training_data.json`);

    // Save JSONL format for fine-tuning
    logger.info('Saving JSONL format for fine-tuning...');
    const jsonl = convertToJSONL(trainingExamples);
    await fs.writeFile(path.join(outputDir, 'training_data.jsonl'), jsonl, 'utf-8');
    logger.info(`Saved: ${outputDir}/training_data.jsonl`);

    // Save statistics
    logger.info('Saving statistics...');
    await fs.writeFile(
      path.join(outputDir, 'statistics.json'),
      JSON.stringify(stats, null, 2),
      'utf-8'
    );
    logger.info(`Saved: ${outputDir}/statistics.json`);

    // Save by category
    logger.info('Saving cases by category...');
    const byCategory = {};
    for (const example of trainingExamples) {
      const category = example.metadata.classification.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(example);
    }

    for (const [category, examples] of Object.entries(byCategory)) {
      const filename = `training_data_${category.toLowerCase().replace(/\s+/g, '_')}.json`;
      await fs.writeFile(
        path.join(outputDir, filename),
        JSON.stringify(examples, null, 2),
        'utf-8'
      );
      logger.info(`Saved: ${outputDir}/${filename} (${examples.length} cases)`);
    }

    logger.info('Training data generation complete');
  } catch (error) {
    logger.error('Error generating training data', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
