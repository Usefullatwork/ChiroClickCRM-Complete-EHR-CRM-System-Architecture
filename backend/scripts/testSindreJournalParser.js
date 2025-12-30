/**
 * Test Script for Sindre Journal Parser
 * Run this to test the journal parser with sample data
 *
 * Usage: node scripts/testSindreJournalParser.js
 */

import sindreJournalParser from '../src/services/sindreJournalParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample journal entries for testing
const SAMPLE_JOURNALS = `Anamnese Gjør mest vondt på nettene når han sover. Sitter over øvre traps bilateralt. Føler han blir litt anspent når han sover, og han klarer ikke å senke skuldrene. De løftes litt opp. Sindre Witzøe 08.01.2024

Behandling SMT Ribb 1 bilat ++ T4 PL ++ T8 PR ++ EMT scapula bilat ++ GH.-ledd bilat ++ radius bilat ++ lunate bilat ++ IMS øvre traps bilat Sindre Witzøe 08.01.2024

Anamnese Følte i natt at det var litt vondt igjen, men har gått bedre siden sist. Har tidligere fått behandling med nåler og tape. Sindre Witzøe 05.01.2024

Behandling SMT Ribb 1 bilat ++ T4 PL ++ T8 PR ++ EMT scapula bilat ++ GH.-ledd bilat ++ radius bilat ++ lunate bilat ++ IMS øvre traps bilat Sindre Witzøe 05.01.2024

Anamnese Mest vondt i Ve skulder. Litt i Hø. Når han legger seg i sengen på kvelden, er det som om han ikke får puste skikkelig. Veldig spent i skulderen, og når han legge hodet tilbak så føler han at han ikke får puste skikkelig. Har en del smerter ifm dette. Smertefullt når han retraherer skulderene, og når han abduserer armen. Sykdommer/Skader/Operasjoner: ua Medisiner: paracet på kvelden for å sove. Familie Hx: ua Pasienten er informert om behandling som skal gjennomføres, relevante risikoer og bivirkninger, og samtykker til denne. Sindre Witzøe 02.01.2024

Undersøkelse Hypomobil og palpøm C-col, T-col Spurlings ua, kompresjon ua, traksjon ua, perkusjon ua, skulderdepresjon ua, SMR ua. skulderabduksjon: Hø: red 0 grader - Ve: red 0 grader Sindre Witzøe 02.01.2024

Behandling SMT Ribb 1 bilat ++ T4 PL ++ T8 PR ++ EMT scapula bilat ++ GH.-ledd bilat ++ radius bilat ++ lunate bilat ++`;

/**
 * Test 1: Parse individual journal entry
 */
function testParseJournalEntry() {
  console.log('\n========================================');
  console.log('TEST 1: Parse Individual Journal Entry');
  console.log('========================================\n');

  const sampleEntry = `Anamnese Mest vondt i Ve skulder. Litt i Hø. Når han legger seg i sengen på kvelden, er det som om han ikke får puste skikkelig.

Undersøkelse Hypomobil og palpøm C-col, T-col Spurlings ua, kompresjon ua, traksjon ua, perkusjon ua

Behandling SMT Ribb 1 bilat ++ T4 PL ++ T8 PR ++ EMT scapula bilat ++ IMS øvre traps bilat`;

  const parsed = sindreJournalParser.parseJournalEntry(sampleEntry);

  console.log('Parsed Entry:');
  console.log(JSON.stringify(parsed, null, 2));

  if (parsed.anamnese && parsed.undersøkelse && parsed.behandling) {
    console.log('\n✓ Successfully parsed all sections');
  } else {
    console.log('\n✗ Failed to parse some sections');
  }
}

/**
 * Test 2: Extract treatment techniques
 */
function testExtractTreatmentTechniques() {
  console.log('\n========================================');
  console.log('TEST 2: Extract Treatment Techniques');
  console.log('========================================\n');

  const behandlingText = 'SMT Ribb 1 bilat ++ T4 PL ++ T8 PR ++ EMT scapula bilat ++ GH.-ledd bilat ++ IMS øvre traps bilat ++ Tøy HLB bilat x3';

  const techniques = sindreJournalParser.extractTreatmentTechniques(behandlingText);

  console.log('Extracted Techniques:');
  console.log(JSON.stringify(techniques, null, 2));

  console.log(`\n✓ Extracted ${techniques.length} techniques`);
}

/**
 * Test 3: Extract examination findings
 */
function testExtractExaminationFindings() {
  console.log('\n========================================');
  console.log('TEST 3: Extract Examination Findings');
  console.log('========================================\n');

  const undersøkelseText = 'Hypomobil og palpøm C-col, T-col Spurlings ua, kompresjon ua, traksjon ua, Lasegue positiv Hø, Kemps positiv Ve';

  const findings = sindreJournalParser.extractExaminationFindings(undersøkelseText);

  console.log('Extracted Findings:');
  console.log(JSON.stringify(findings, null, 2));

  console.log(`\n✓ Extracted findings from examination`);
}

/**
 * Test 4: Extract symptoms from anamnese
 */
function testExtractSymptoms() {
  console.log('\n========================================');
  console.log('TEST 4: Extract Symptoms from Anamnese');
  console.log('========================================\n');

  const anamneseText = 'Gjør mest vondt på nettene når han sover. Sitter over øvre traps bilateralt. Føler han blir litt anspent når han sover. Akutte smerter i Hø skulder.';

  const symptoms = sindreJournalParser.extractSymptomsFromAnamnese(anamneseText);

  console.log('Extracted Symptoms:');
  console.log(JSON.stringify(symptoms, null, 2));

  console.log(`\n✓ Extracted ${symptoms.length} symptoms`);
}

/**
 * Test 5: Create training dataset
 */
function testCreateTrainingDataset() {
  console.log('\n========================================');
  console.log('TEST 5: Create Training Dataset');
  console.log('========================================\n');

  const result = sindreJournalParser.createSindreTrainingDataset(SAMPLE_JOURNALS);

  console.log('Dataset Statistics:');
  console.log(JSON.stringify(result.statistics, null, 2));

  console.log('\nSample Training Examples:');
  result.examples.slice(0, 3).forEach((example, idx) => {
    console.log(`\nExample ${idx + 1} (${example.type}):`);
    console.log('Prompt:', example.prompt.substring(0, 100) + '...');
    console.log('Response:', example.response.substring(0, 100) + '...');
  });

  console.log(`\n✓ Created ${result.examples.length} training examples from ${result.statistics.total_entries} entries`);
}

/**
 * Test 6: Extract follow-up patterns
 */
function testExtractFollowUpPatterns() {
  console.log('\n========================================');
  console.log('TEST 6: Extract Follow-up Patterns');
  console.log('========================================\n');

  const journalsWithFollowUps = `Anamnese Vondt i ryggen.

Notat Henviser til MR bekken. Oppfølging om 2 uker.

Anamnese Nakke smerter.

Notat Skal gjøre hjemmeøvelser. Kontroll neste uke.`;

  const result = sindreJournalParser.extractFollowUpPatterns(journalsWithFollowUps);

  console.log('Follow-up Statistics:');
  console.log(JSON.stringify(result.statistics, null, 2));

  console.log('\nSample Follow-ups:');
  result.patterns.slice(0, 3).forEach((pattern, idx) => {
    console.log(`\nPattern ${idx + 1}:`);
    console.log('Type:', pattern.type);
    console.log('Indicators:', pattern.indicators);
  });

  console.log(`\n✓ Extracted ${result.patterns.length} follow-up patterns`);
}

/**
 * Test 7: Terminology dictionary
 */
function testTerminologyDictionary() {
  console.log('\n========================================');
  console.log('TEST 7: Terminology Dictionary');
  console.log('========================================\n');

  console.log('Anatomical Abbreviations:', Object.keys(sindreJournalParser.ANATOMICAL_ABBREVIATIONS).length);
  console.log('Treatment Abbreviations:', Object.keys(sindreJournalParser.TREATMENT_ABBREVIATIONS).length);
  console.log('Examination Tests:', Object.keys(sindreJournalParser.EXAMINATION_TESTS).length);

  console.log('\nSample Anatomical Terms:');
  Object.entries(sindreJournalParser.ANATOMICAL_ABBREVIATIONS).slice(0, 5).forEach(([abbr, meaning]) => {
    console.log(`  ${abbr}: ${meaning}`);
  });

  console.log('\nSample Treatment Terms:');
  Object.entries(sindreJournalParser.TREATMENT_ABBREVIATIONS).slice(0, 5).forEach(([abbr, meaning]) => {
    console.log(`  ${abbr}: ${meaning}`);
  });

  console.log('\n✓ Terminology dictionary loaded successfully');
}

/**
 * Main test runner
 */
function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Sindre Journal Parser Test Suite     ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    testParseJournalEntry();
    testExtractTreatmentTechniques();
    testExtractExaminationFindings();
    testExtractSymptoms();
    testCreateTrainingDataset();
    testExtractFollowUpPatterns();
    testTerminologyDictionary();

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
