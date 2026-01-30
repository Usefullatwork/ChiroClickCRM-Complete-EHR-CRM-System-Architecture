/**
 * Import Training Data to Modelfiles
 *
 * Usage: node import-training.js
 *
 * Reads training-expansion.jsonl and adds examples to the appropriate Modelfiles
 */

const fs = require('fs');
const path = require('path');

const MODELFILE_MAP = {
  'fast': 'Modelfile-fast',
  'norwegian': 'Modelfile-norwegian',
  'medical': 'Modelfile-medical',
  'no': 'Modelfile'
};

function loadTrainingData(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function formatAsMessage(example) {
  // Escape quotes in the response
  const prompt = example.prompt.replace(/"/g, '\\"');
  const response = example.response.replace(/"/g, '\\"');

  return `\nMESSAGE user "${prompt}"\nMESSAGE assistant "${response}"\n`;
}

function appendToModelfile(modelType, examples) {
  const filename = MODELFILE_MAP[modelType];
  if (!filename) {
    console.log(`Unknown model type: ${modelType}`);
    return;
  }

  const filepath = path.join(__dirname, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`Modelfile not found: ${filepath}`);
    return;
  }

  // Read current content
  let content = fs.readFileSync(filepath, 'utf-8');

  // Find position before LICENSE (if exists)
  const licensePos = content.indexOf('LICENSE """');

  // Format new examples
  const newContent = examples.map(formatAsMessage).join('');

  if (licensePos > -1) {
    // Insert before LICENSE
    content = content.slice(0, licensePos) +
              `# ============================================================================\n# IMPORTED TRAINING DATA\n# ============================================================================\n` +
              newContent + '\n' +
              content.slice(licensePos);
  } else {
    // Append to end
    content += `\n# ============================================================================\n# IMPORTED TRAINING DATA\n# ============================================================================\n` + newContent;
  }

  fs.writeFileSync(filepath, content);
  console.log(`Added ${examples.length} examples to ${filename}`);
}

// Main
console.log('Importing training data...\n');

const trainingFile = path.join(__dirname, 'training-expansion.jsonl');
const examples = loadTrainingData(trainingFile);

// Group by model
const byModel = {};
for (const example of examples) {
  const model = example.model || 'no';
  if (!byModel[model]) byModel[model] = [];
  byModel[model].push(example);
}

// Import each group
for (const [model, modelExamples] of Object.entries(byModel)) {
  appendToModelfile(model, modelExamples);
}

console.log('\nDone! Now rebuild the models:');
console.log('  ollama create chiro-fast -f Modelfile-fast');
console.log('  ollama create chiro-norwegian -f Modelfile-norwegian');
console.log('  ollama create chiro-medical -f Modelfile-medical');
console.log('  ollama create chiro-no -f Modelfile');
