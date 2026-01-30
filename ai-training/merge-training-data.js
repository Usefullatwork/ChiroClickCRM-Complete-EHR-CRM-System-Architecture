/**
 * Merge Medical Dictionary with Clinical Training Data
 * Creates unified bilingual training files for Ollama models
 */

const fs = require('fs');
const path = require('path');

const AI_TRAINING_DIR = __dirname;
const OUTPUT_DIR = path.join(AI_TRAINING_DIR, 'merged');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Merging training data files...\n');

// Read existing training files
const files = {
  clinical: path.join(AI_TRAINING_DIR, 'training-data.jsonl'),
  dictionary: path.join(AI_TRAINING_DIR, 'medical-dictionary-training.jsonl'),
  alpaca: path.join(AI_TRAINING_DIR, 'training-data-alpaca.json')
};

let allPairs = [];
let stats = {
  clinical: 0,
  dictionary: 0,
  total: 0,
  norwegian: 0,
  english: 0
};

// Read clinical training data
if (fs.existsSync(files.clinical)) {
  const lines = fs.readFileSync(files.clinical, 'utf-8').split('\n').filter(l => l.trim());
  lines.forEach(line => {
    try {
      const pair = JSON.parse(line);
      allPairs.push(pair);
      stats.clinical++;

      // Detect language
      if (pair.prompt && /[æøåÆØÅ]/.test(pair.prompt + pair.completion)) {
        stats.norwegian++;
      } else {
        stats.english++;
      }
    } catch (e) {}
  });
  console.log(`✓ Loaded ${stats.clinical} clinical training pairs`);
}

// Read medical dictionary
if (fs.existsSync(files.dictionary)) {
  const lines = fs.readFileSync(files.dictionary, 'utf-8').split('\n').filter(l => l.trim());
  lines.forEach(line => {
    try {
      const pair = JSON.parse(line);
      allPairs.push(pair);
      stats.dictionary++;

      if (pair.prompt && /[æøåÆØÅ]/.test(pair.prompt + pair.completion)) {
        stats.norwegian++;
      } else {
        stats.english++;
      }
    } catch (e) {}
  });
  console.log(`✓ Loaded ${stats.dictionary} medical dictionary pairs`);
}

stats.total = allPairs.length;
console.log(`\nTotal training pairs: ${stats.total}`);
console.log(`  Norwegian: ${stats.norwegian}`);
console.log(`  English: ${stats.english}`);

// Write merged JSONL
const mergedJsonl = path.join(OUTPUT_DIR, 'chiro-complete-training.jsonl');
fs.writeFileSync(mergedJsonl, allPairs.map(p => JSON.stringify(p)).join('\n'));
console.log(`\n✓ Written: ${mergedJsonl}`);

// Write merged Alpaca format
const alpacaData = allPairs.map(pair => ({
  instruction: pair.prompt,
  input: '',
  output: pair.completion
}));
const mergedAlpaca = path.join(OUTPUT_DIR, 'chiro-complete-alpaca.json');
fs.writeFileSync(mergedAlpaca, JSON.stringify(alpacaData, null, 2));
console.log(`✓ Written: ${mergedAlpaca}`);

// Separate by language for targeted training
const norwegianPairs = allPairs.filter(p => /[æøåÆØÅ]/.test(p.prompt + p.completion));
const englishPairs = allPairs.filter(p => !/[æøåÆØÅ]/.test(p.prompt + p.completion));

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'chiro-no-training.jsonl'),
  norwegianPairs.map(p => JSON.stringify(p)).join('\n')
);
console.log(`✓ Written: chiro-no-training.jsonl (${norwegianPairs.length} pairs)`);

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'chiro-en-training.jsonl'),
  englishPairs.map(p => JSON.stringify(p)).join('\n')
);
console.log(`✓ Written: chiro-en-training.jsonl (${englishPairs.length} pairs)`);

// Create enhanced system prompts with medical terminology
const medicalTerms = {
  icpc2: [
    'L01 Neck symptom', 'L02 Back symptom', 'L03 Low back symptom',
    'L83 Neck syndrome', 'L84 Back syndrome without radiation',
    'L86 Back syndrome with radiation', 'L92 Shoulder syndrome'
  ],
  anatomy: [
    'cervical spine', 'thoracic spine', 'lumbar spine', 'sacrum',
    'vertebral disc', 'facet joint', 'foramen', 'nerve root'
  ],
  tests: [
    'SLR/Lasègue', 'FABER/Patrick', 'Kemp test', 'Dix-Hallpike',
    'Romberg', 'VOR-HIT', 'Epley maneuver'
  ],
  vestibular: [
    'BPPV', 'nystagmus', 'vertigo', 'VNG', 'caloric test',
    'semicircular canal', 'otoconia', 'vestibular neuritis'
  ]
};

const systemPromptEnhancement = `
Medical Terminology Reference:
- ICPC-2 Codes: ${medicalTerms.icpc2.join(', ')}
- Anatomy: ${medicalTerms.anatomy.join(', ')}
- Clinical Tests: ${medicalTerms.tests.join(', ')}
- Vestibular: ${medicalTerms.vestibular.join(', ')}
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'system-prompt-enhancement.txt'),
  systemPromptEnhancement
);
console.log(`✓ Written: system-prompt-enhancement.txt`);

console.log('\n========================================');
console.log('TRAINING DATA MERGE COMPLETE');
console.log('========================================');
console.log(`\nTo rebuild models with enhanced data:`);
console.log(`  cd ${OUTPUT_DIR}`);
console.log(`  ollama create chiro-no -f ../Modelfile`);
console.log(`  ollama create chiro-en -f ../Modelfile-en`);
console.log('\nBoth models now share bilingual medical terminology.');
