/**
 * Generate Training Data Script
 * Processes clinical notes and generates structured training data
 * Usage: node src/scripts/generateTrainingData.js <input_file> <output_dir>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  parseClinicalCase,
  classifyCase,
  convertToTrainingExample,
  convertToJSONL
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
    const categoryRegex = /(?:Kategori \d+:|KATEGORI \d+:)([^]*?)(?=(?:Kategori \d+:|KATEGORI \d+:)|$)/gi;
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
    average_findings: 0
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

    console.log('🔬 Generating Training Data from Clinical Notes');
    console.log('================================================\n');
    console.log(`Input file: ${inputFile}`);
    console.log(`Output directory: ${outputDir}\n`);

    // Read input file
    console.log('📖 Reading input file...');
    const rawText = await fs.readFile(inputFile, 'utf-8');
    console.log(`   Read ${rawText.length} characters\n`);

    // Split into cases
    console.log('✂️  Splitting into individual cases...');
    const cases = splitIntoCases(rawText);
    console.log(`   Found ${cases.length} clinical cases\n`);

    // Parse each case
    console.log('🧪 Parsing clinical cases...');
    const trainingExamples = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < cases.length; i++) {
      const caseText = cases[i];
      console.log(`   Processing case ${i + 1}/${cases.length}...`);

      try {
        const example = convertToTrainingExample(caseText);
        if (example) {
          trainingExamples.push(example);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to parse case ${i + 1}:`, error.message);
        failCount++;
      }
    }

    console.log(`\n   ✅ Successfully parsed: ${successCount}`);
    console.log(`   ❌ Failed to parse: ${failCount}\n`);

    // Generate statistics
    console.log('📊 Generating statistics...');
    const stats = generateStatistics(trainingExamples);
    console.log('   Statistics:');
    console.log(`   - Total cases: ${stats.total_cases}`);
    console.log(`   - Cases with follow-up: ${stats.with_followup}`);
    console.log(`   - Cases with positive outcome: ${stats.with_positive_outcome}`);
    console.log(`   - Average symptoms per case: ${stats.average_symptoms}`);
    console.log(`   - Average findings per case: ${stats.average_findings}`);
    console.log('\n   By Region:');
    for (const [region, count] of Object.entries(stats.by_region)) {
      console.log(`     - ${region}: ${count}`);
    }
    console.log('\n   By Pathology:');
    for (const [pathology, count] of Object.entries(stats.by_pathology)) {
      console.log(`     - ${pathology}: ${count}`);
    }
    console.log('');

    // Create output directory
    console.log('📁 Creating output directory...');
    await fs.mkdir(outputDir, { recursive: true });

    // Save structured JSON
    console.log('💾 Saving structured training data...');
    await fs.writeFile(
      path.join(outputDir, 'training_data.json'),
      JSON.stringify(trainingExamples, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved: ${outputDir}/training_data.json\n`);

    // Save JSONL format for fine-tuning
    console.log('💾 Saving JSONL format for fine-tuning...');
    const jsonl = convertToJSONL(trainingExamples);
    await fs.writeFile(
      path.join(outputDir, 'training_data.jsonl'),
      jsonl,
      'utf-8'
    );
    console.log(`   ✅ Saved: ${outputDir}/training_data.jsonl\n`);

    // Save statistics
    console.log('💾 Saving statistics...');
    await fs.writeFile(
      path.join(outputDir, 'statistics.json'),
      JSON.stringify(stats, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved: ${outputDir}/statistics.json\n`);

    // Save by category
    console.log('💾 Saving cases by category...');
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
      console.log(`   ✅ Saved: ${outputDir}/${filename} (${examples.length} cases)`);
    }

    console.log('\n✨ Training data generation complete!');
    console.log('================================================\n');
    console.log('Next steps:');
    console.log('1. Review the generated files in:', outputDir);
    console.log('2. Use training_data.jsonl for model fine-tuning');
    console.log('3. Import structured data into your database');
    console.log('4. Update AI prompts with category-specific examples\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
