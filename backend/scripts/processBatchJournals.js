#!/usr/bin/env node
/**
 * Batch Journal Processing Script
 * Process large journal files and create training datasets
 *
 * Usage:
 *   node scripts/processBatchJournals.js --input journals.txt --output training_data
 *   node scripts/processBatchJournals.js --input sindre.txt --practitioner sindre
 *   node scripts/processBatchJournals.js --input journals/ --format all --anonymize
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sindreParser from '../src/services/sindreJournalParser.js';
import sigrunParser from '../src/services/sigrunJournalParser.js';
import * as trainingAnonymization from '../src/services/trainingAnonymization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const parseArgs = () => {
  const args = {
    input: null,
    output: 'training_data',
    practitioner: 'auto', // auto, sindre, sigrun, both
    format: 'jsonl', // jsonl, json, csv, all
    anonymize: false,
    verbose: false,
    stats: true
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const nextArg = process.argv[i + 1];

    switch (arg) {
      case '--input':
      case '-i':
        args.input = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        args.output = nextArg;
        i++;
        break;
      case '--practitioner':
      case '-p':
        args.practitioner = nextArg.toLowerCase();
        i++;
        break;
      case '--format':
      case '-f':
        args.format = nextArg.toLowerCase();
        i++;
        break;
      case '--anonymize':
      case '-a':
        args.anonymize = true;
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--no-stats':
        args.stats = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return args;
};

// Print help message
const printHelp = () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║        Batch Journal Processing Script                     ║
╚════════════════════════════════════════════════════════════╝

Process chiropractic journals and create AI training datasets.

USAGE:
  node scripts/processBatchJournals.js [OPTIONS]

OPTIONS:
  -i, --input <path>          Input file or directory (required)
  -o, --output <path>         Output file path (default: training_data)
  -p, --practitioner <type>   Practitioner: auto, sindre, sigrun, both (default: auto)
  -f, --format <format>       Output format: jsonl, json, csv, all (default: jsonl)
  -a, --anonymize             Anonymize PII data (GDPR compliant)
  -v, --verbose               Verbose output
  --no-stats                  Don't show statistics
  -h, --help                  Show this help

EXAMPLES:
  # Process single file, auto-detect practitioner
  node scripts/processBatchJournals.js -i journals.txt

  # Process Sindre's journals, export as JSONL for Ollama
  node scripts/processBatchJournals.js -i sindre.txt -p sindre -f jsonl

  # Process directory of files, anonymize, all formats
  node scripts/processBatchJournals.js -i ./journals/ -f all -a

  # Process both practitioners separately
  node scripts/processBatchJournals.js -i journals.txt -p both -o combined

OUTPUT FORMATS:
  jsonl   - JSONL format for Ollama training (one JSON object per line)
  json    - Single JSON file with all examples
  csv     - CSV format for spreadsheet analysis
  all     - Export all formats

ANONYMIZATION:
  When --anonymize is used, all PII will be removed:
  - Names → [NAVN]
  - Addresses → [ADRESSE]
  - Phone numbers → [TELEFON]
  - National IDs → [PERSONNUMMER]
  - Dates generalized to month/year only
  `);
};

/**
 * Read journal file(s)
 */
const readJournalFiles = (inputPath) => {
  const stats = fs.statSync(inputPath);

  if (stats.isFile()) {
    return [{
      path: inputPath,
      content: fs.readFileSync(inputPath, 'utf-8'),
      name: path.basename(inputPath)
    }];
  } else if (stats.isDirectory()) {
    const files = fs.readdirSync(inputPath)
      .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
      .map(f => {
        const filePath = path.join(inputPath, f);
        return {
          path: filePath,
          content: fs.readFileSync(filePath, 'utf-8'),
          name: f
        };
      });
    return files;
  } else {
    throw new Error('Input must be a file or directory');
  }
};

/**
 * Process journal content
 */
const processJournals = (content, practitionerType, verbose) => {
  const results = {
    sindre: null,
    sigrun: null,
    combined: []
  };

  if (practitionerType === 'auto') {
    const detection = sigrunParser.detectPractitionerStyle(content);
    if (verbose) {
      console.log(`  Detected: ${detection.practitioner} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`);
    }
    practitionerType = detection.practitioner.toLowerCase();
  }

  if (practitionerType === 'sindre' || practitionerType === 'both') {
    if (verbose) console.log('  Processing as Sindre journals...');
    results.sindre = sindreParser.createSindreTrainingDataset(content);
    results.combined.push(...results.sindre.examples);
  }

  if (practitionerType === 'sigrun' || practitionerType === 'both') {
    if (verbose) console.log('  Processing as Sigrun journals...');
    results.sigrun = sigrunParser.createSigrunTrainingDataset(content);
    results.combined.push(...results.sigrun.examples);
  }

  if (practitionerType === 'unknown') {
    console.warn('  ⚠ Could not detect practitioner style, trying both...');
    results.sindre = sindreParser.createSindreTrainingDataset(content);
    results.sigrun = sigrunParser.createSigrunTrainingDataset(content);
    // Use whichever produced more examples
    if (results.sindre.examples.length > results.sigrun.examples.length) {
      results.combined = results.sindre.examples;
    } else {
      results.combined = results.sigrun.examples;
    }
  }

  return results;
};

/**
 * Anonymize training examples
 */
const anonymizeExamples = (examples, verbose) => {
  if (verbose) console.log('  Anonymizing data...');

  return examples.map(example => {
    return {
      ...example,
      prompt: trainingAnonymization.anonymizeSOAPNote(example.prompt, {
        preserveDates: false,
        aggressive: true
      }),
      response: trainingAnonymization.anonymizeSOAPNote(example.response, {
        preserveDates: false,
        aggressive: true
      })
    };
  });
};

/**
 * Export as JSONL (Ollama format)
 */
const exportJSONL = (examples, outputPath) => {
  const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
  const filePath = outputPath.endsWith('.jsonl') ? outputPath : `${outputPath}.jsonl`;
  fs.writeFileSync(filePath, jsonlContent);
  return filePath;
};

/**
 * Export as JSON
 */
const exportJSON = (examples, outputPath, includeStats = true) => {
  const data = {
    examples,
    metadata: {
      total: examples.length,
      generated_at: new Date().toISOString(),
      version: '1.0'
    }
  };

  if (includeStats) {
    data.metadata.statistics = calculateStatistics(examples);
  }

  const filePath = outputPath.endsWith('.json') ? outputPath : `${outputPath}.json`;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
};

/**
 * Export as CSV
 */
const exportCSV = (examples, outputPath) => {
  const headers = ['type', 'practitioner', 'prompt', 'response', 'metadata'];
  const rows = [headers.join(',')];

  examples.forEach(ex => {
    const row = [
      `"${ex.type || ''}"`,
      `"${ex.practitioner || ''}"`,
      `"${(ex.prompt || '').replace(/"/g, '""')}"`,
      `"${(ex.response || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(ex.metadata || {}).replace(/"/g, '""')}"`
    ];
    rows.push(row.join(','));
  });

  const filePath = outputPath.endsWith('.csv') ? outputPath : `${outputPath}.csv`;
  fs.writeFileSync(filePath, rows.join('\n'));
  return filePath;
};

/**
 * Calculate statistics
 */
const calculateStatistics = (examples) => {
  const stats = {
    total_examples: examples.length,
    by_type: {},
    by_practitioner: {},
    avg_prompt_length: 0,
    avg_response_length: 0
  };

  let totalPromptLength = 0;
  let totalResponseLength = 0;

  examples.forEach(ex => {
    // Count by type
    const type = ex.type || 'unknown';
    stats.by_type[type] = (stats.by_type[type] || 0) + 1;

    // Count by practitioner
    const practitioner = ex.practitioner || 'unknown';
    stats.by_practitioner[practitioner] = (stats.by_practitioner[practitioner] || 0) + 1;

    // Calculate lengths
    totalPromptLength += (ex.prompt || '').length;
    totalResponseLength += (ex.response || '').length;
  });

  stats.avg_prompt_length = Math.round(totalPromptLength / examples.length);
  stats.avg_response_length = Math.round(totalResponseLength / examples.length);

  return stats;
};

/**
 * Print statistics
 */
const printStatistics = (results) => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          Processing Statistics         ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (results.sindre) {
    console.log('📊 Sindre Statistics:');
    console.log(`   Total Entries: ${results.sindre.statistics.total_entries}`);
    console.log(`   Total Examples: ${results.sindre.statistics.total_examples}`);
    console.log('   Example Types:');
    Object.entries(results.sindre.statistics.example_types).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
    console.log('');
  }

  if (results.sigrun) {
    console.log('📊 Sigrun Statistics:');
    console.log(`   Total Entries: ${results.sigrun.statistics.total_entries}`);
    console.log(`   Total Examples: ${results.sigrun.statistics.total_examples}`);
    console.log('   Example Types:');
    Object.entries(results.sigrun.statistics.example_types).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
    console.log('');
  }

  if (results.combined.length > 0) {
    const stats = calculateStatistics(results.combined);
    console.log('📊 Combined Statistics:');
    console.log(`   Total Examples: ${stats.total_examples}`);
    console.log(`   Avg Prompt Length: ${stats.avg_prompt_length} chars`);
    console.log(`   Avg Response Length: ${stats.avg_response_length} chars`);
    console.log('   By Type:');
    Object.entries(stats.by_type).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
    console.log('   By Practitioner:');
    Object.entries(stats.by_practitioner).forEach(([practitioner, count]) => {
      console.log(`     - ${practitioner}: ${count}`);
    });
  }
};

/**
 * Main processing function
 */
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Chiropractic Journal Batch Processor                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const args = parseArgs();

  // Validate input
  if (!args.input) {
    console.error('❌ Error: --input is required\n');
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(args.input)) {
    console.error(`❌ Error: Input path does not exist: ${args.input}\n`);
    process.exit(1);
  }

  try {
    // Read files
    console.log(`📂 Reading files from: ${args.input}`);
    const files = readJournalFiles(args.input);
    console.log(`   Found ${files.length} file(s)\n`);

    // Process each file
    const allResults = {
      sindre: { examples: [], statistics: { total_entries: 0, total_examples: 0, example_types: {} } },
      sigrun: { examples: [], statistics: { total_entries: 0, total_examples: 0, example_types: {} } },
      combined: []
    };

    for (const file of files) {
      console.log(`📄 Processing: ${file.name}`);
      const results = processJournals(file.content, args.practitioner, args.verbose);

      // Merge results
      if (results.sindre) {
        allResults.sindre.examples.push(...results.sindre.examples);
        allResults.sindre.statistics.total_entries += results.sindre.statistics.total_entries;
        allResults.sindre.statistics.total_examples += results.sindre.statistics.total_examples;
      }
      if (results.sigrun) {
        allResults.sigrun.examples.push(...results.sigrun.examples);
        allResults.sigrun.statistics.total_entries += results.sigrun.statistics.total_entries;
        allResults.sigrun.statistics.total_examples += results.sigrun.statistics.total_examples;
      }
      allResults.combined.push(...results.combined);

      console.log(`   ✓ Extracted ${results.combined.length} training examples\n`);
    }

    // Anonymize if requested
    if (args.anonymize) {
      console.log('🔒 Anonymizing data...');
      allResults.combined = anonymizeExamples(allResults.combined, args.verbose);
      console.log('   ✓ Data anonymized\n');
    }

    // Export in requested formats
    console.log('💾 Exporting data...');
    const exportedFiles = [];

    if (args.format === 'jsonl' || args.format === 'all') {
      const file = exportJSONL(allResults.combined, args.output);
      exportedFiles.push(file);
      console.log(`   ✓ JSONL: ${file}`);
    }

    if (args.format === 'json' || args.format === 'all') {
      const file = exportJSON(allResults.combined, args.output, args.stats);
      exportedFiles.push(file);
      console.log(`   ✓ JSON: ${file}`);
    }

    if (args.format === 'csv' || args.format === 'all') {
      const file = exportCSV(allResults.combined, args.output);
      exportedFiles.push(file);
      console.log(`   ✓ CSV: ${file}`);
    }

    // Print statistics
    if (args.stats) {
      printStatistics(allResults);
    }

    // Success summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       Processing Complete! ✓           ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📋 Summary:');
    console.log(`   Files Processed: ${files.length}`);
    console.log(`   Training Examples: ${allResults.combined.length}`);
    console.log(`   Output Files: ${exportedFiles.length}`);
    console.log(`   Anonymized: ${args.anonymize ? 'Yes' : 'No'}\n`);

    console.log('🚀 Next Steps:');
    console.log('   1. Review the exported files');
    if (args.format === 'jsonl' || args.format === 'all') {
      console.log(`   2. Train with Ollama: ollama create chiro-model -f Modelfile`);
      console.log(`   3. Use training data: ${args.output}.jsonl`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processJournals, anonymizeExamples, exportJSONL, exportJSON, exportCSV };
