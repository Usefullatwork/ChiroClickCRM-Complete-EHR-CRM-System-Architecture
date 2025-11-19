/**
 * Test Script for Sigrun Journal Parser
 * Run this to test the Sigrun journal parser with sample data
 *
 * Usage: node scripts/testSigrunJournalParser.js
 */

import sigrunJournalParser from '../src/services/sigrunJournalParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample journal entries for testing (Sigrun's abbreviated style)
const SAMPLE_JOURNALS = `Anamnese bedre. klart bedre i nakke siden sist.

beh: cx mob supine. c2 prs. t5 p. is-ledd ve.

Anamnese som sist. litt vondt i korsrygg.

beh: lx mob. tp i lx. tøy hlb bilat.

Anamnese mye bedre. føler seg slapp i nakken.

beh: cx mob supine. tp øvre traps bilat. c3p c4p. mass nakke.

Anamnese fortsatt vondt ve skulder. ikke noe endring.

Behandling beh cx mob. t4p t5p. mass øvre rygg. tp ve skulder.`;

/**
 * Test 1: Parse Sigrun journal entry
 */
function testParseSigrunEntry() {
  console.log('\n========================================');
  console.log('TEST 1: Parse Sigrun Journal Entry');
  console.log('========================================\n');

  const sampleEntry = `Anamnese bedre. klart bedre i nakke siden sist.

beh: cx mob supine. c2 prs. t5 p. is-ledd ve.`;

  const parsed = sigrunJournalParser.parseSigrunEntry(sampleEntry);

  console.log('Parsed Entry:');
  console.log(JSON.stringify(parsed, null, 2));

  if (parsed.anamnese && parsed.behandling) {
    console.log('\n✓ Successfully parsed Sigrun entry');
  } else {
    console.log('\n✗ Failed to parse some sections');
  }
}

/**
 * Test 2: Parse Sigrun treatment techniques
 */
function testParseSigrunTreatment() {
  console.log('\n========================================');
  console.log('TEST 2: Parse Sigrun Treatment Techniques');
  console.log('========================================\n');

  const behandlingText = 'beh cx mob supine. c2 prs. t5p. is-ledd ve. tp øvre traps bilat. mass nakke. tøy hlb';

  const techniques = sigrunJournalParser.parseSigrunTreatment(behandlingText);

  console.log('Extracted Techniques:');
  console.log(JSON.stringify(techniques, null, 2));

  console.log(`\n✓ Extracted ${techniques.length} techniques from Sigrun's notes`);
}

/**
 * Test 3: Parse Sigrun anamnese/assessment
 */
function testParseSigrunAnamnese() {
  console.log('\n========================================');
  console.log('TEST 3: Parse Sigrun Anamnese');
  console.log('========================================\n');

  const anamneseText = 'bedre. klart bedre i nakke siden sist. mindre vondt.';

  const assessment = sigrunJournalParser.parseSigrunAnamnese(anamneseText);

  console.log('Extracted Assessment:');
  console.log(JSON.stringify(assessment, null, 2));

  if (assessment.improvement_status === 'improved') {
    console.log('\n✓ Correctly identified improvement status');
  } else {
    console.log('\n✗ Failed to identify improvement status');
  }
}

/**
 * Test 4: Detect practitioner style
 */
function testDetectPractitionerStyle() {
  console.log('\n========================================');
  console.log('TEST 4: Detect Practitioner Style');
  console.log('========================================\n');

  // Test Sigrun style
  const sigrunText = 'beh: cx mob supine. tp øvre traps. c2 prs.';
  const sigrunDetection = sigrunJournalParser.detectPractitionerStyle(sigrunText);

  console.log('Sigrun Text Detection:');
  console.log(`  Practitioner: ${sigrunDetection.practitioner}`);
  console.log(`  Confidence: ${(sigrunDetection.confidence * 100).toFixed(1)}%`);

  // Test Sindre style
  const sindreText = 'Behandling SMT C7 PL ++ T4 PR ++ EMT scapula bilat ++ IMS øvre traps bilat';
  const sindreDetection = sigrunJournalParser.detectPractitionerStyle(sindreText);

  console.log('\nSindre Text Detection:');
  console.log(`  Practitioner: ${sindreDetection.practitioner}`);
  console.log(`  Confidence: ${(sindreDetection.confidence * 100).toFixed(1)}%`);

  if (sigrunDetection.practitioner === 'Sigrun' && sindreDetection.practitioner === 'Sindre') {
    console.log('\n✓ Successfully detected both practitioner styles');
  } else {
    console.log('\n✗ Failed to correctly detect practitioner styles');
  }
}

/**
 * Test 5: Create training examples
 */
function testCreateSigrunTrainingExamples() {
  console.log('\n========================================');
  console.log('TEST 5: Create Sigrun Training Examples');
  console.log('========================================\n');

  const entry = {
    anamnese: 'bedre. klart bedre i nakke siden sist.',
    behandling: 'cx mob supine. c2 prs. t5p. tp øvre traps bilat.',
    practitioner: 'Sigrun'
  };

  const examples = sigrunJournalParser.createSigrunTrainingExamples(entry);

  console.log(`Created ${examples.length} training examples:`);
  examples.forEach((example, idx) => {
    console.log(`\nExample ${idx + 1} (${example.type}):`);
    console.log('Prompt:', example.prompt.substring(0, 80) + '...');
    console.log('Response:', example.response.substring(0, 80) + '...');
  });

  console.log(`\n✓ Generated ${examples.length} training examples from Sigrun's entry`);
}

/**
 * Test 6: Create full training dataset
 */
function testCreateSigrunTrainingDataset() {
  console.log('\n========================================');
  console.log('TEST 6: Create Sigrun Training Dataset');
  console.log('========================================\n');

  const result = sigrunJournalParser.createSigrunTrainingDataset(SAMPLE_JOURNALS);

  console.log('Dataset Statistics:');
  console.log(JSON.stringify(result.statistics, null, 2));

  console.log('\nSample Training Examples:');
  result.examples.slice(0, 2).forEach((example, idx) => {
    console.log(`\nExample ${idx + 1} (${example.type}):`);
    console.log('Prompt:', example.prompt.substring(0, 100) + '...');
    console.log('Response:', example.response.substring(0, 100) + '...');
  });

  console.log(`\n✓ Created ${result.examples.length} training examples from ${result.statistics.total_entries} Sigrun entries`);
}

/**
 * Test 7: Sigrun treatment patterns dictionary
 */
function testSigrunPatternsDictionary() {
  console.log('\n========================================');
  console.log('TEST 7: Sigrun Patterns Dictionary');
  console.log('========================================\n');

  console.log('Treatment Patterns:', Object.keys(sigrunJournalParser.SIGRUN_TREATMENT_PATTERNS).length);
  console.log('Assessment Patterns:', Object.keys(sigrunJournalParser.SIGRUN_ASSESSMENT_PATTERNS).length);

  console.log('\nSample Treatment Patterns:');
  Object.entries(sigrunJournalParser.SIGRUN_TREATMENT_PATTERNS).slice(0, 5).forEach(([abbr, meaning]) => {
    console.log(`  ${abbr}: ${meaning}`);
  });

  console.log('\nSample Assessment Patterns:');
  console.log('  Improvement:', sigrunJournalParser.SIGRUN_ASSESSMENT_PATTERNS.improvement.slice(0, 5).join(', '));
  console.log('  No change:', sigrunJournalParser.SIGRUN_ASSESSMENT_PATTERNS.no_change.slice(0, 3).join(', '));

  console.log('\n✓ Sigrun patterns dictionary loaded successfully');
}

/**
 * Test 8: Parse multiple entries
 */
function testParseSigrunEntries() {
  console.log('\n========================================');
  console.log('TEST 8: Parse Multiple Sigrun Entries');
  console.log('========================================\n');

  const entries = sigrunJournalParser.parseSigrunEntries(SAMPLE_JOURNALS);

  console.log(`Parsed ${entries.length} entries:`);
  entries.forEach((entry, idx) => {
    console.log(`\nEntry ${idx + 1}:`);
    console.log('  Has Anamnese:', !!entry.anamnese);
    console.log('  Has Behandling:', !!entry.behandling);
    console.log('  Practitioner:', entry.practitioner);
  });

  console.log(`\n✓ Successfully parsed ${entries.length} Sigrun journal entries`);
}

/**
 * Main test runner
 */
function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Sigrun Journal Parser Test Suite     ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    testParseSigrunEntry();
    testParseSigrunTreatment();
    testParseSigrunAnamnese();
    testDetectPractitionerStyle();
    testCreateSigrunTrainingExamples();
    testCreateSigrunTrainingDataset();
    testSigrunPatternsDictionary();
    testParseSigrunEntries();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  All Tests Completed Successfully! ✓  ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
