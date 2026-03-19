#!/usr/bin/env node
/**
 * Convert benchmark_cases.jsonl → promptfoo YAML test suite
 *
 * Reads ai-training/evaluation/benchmark_cases.jsonl and generates
 * ai-training/promptfoo/suites/regression.yaml with all 100 cases.
 *
 * Usage: node ai-training/promptfoo/scripts/convert-benchmark.js
 */

const fs = require('fs');
const path = require('path');

const BENCHMARK_FILE = path.join(__dirname, '../../evaluation/benchmark_cases.jsonl');
const OUTPUT_FILE = path.join(__dirname, '../suites/regression.yaml');

function escapeYaml(str) {
  if (!str) return '""';
  // If string contains special chars, wrap in quotes
  if (/[:#\[\]{}&*!|>'"@`,%]/.test(str) || str.includes('\n') || str.startsWith(' ')) {
    return JSON.stringify(str);
  }
  return str;
}

function convertCase(c) {
  const test = {
    description: c.description || c.id,
    vars: {
      prompt_text: c.prompt,
      category: c.category,
      required_keywords: JSON.stringify(c.required_keywords || []),
      forbidden_keywords: JSON.stringify(c.forbidden_keywords || []),
      expect_norwegian: String(c.expect_norwegian !== false),
      min_response_length: String(c.min_response_length || 10),
      max_response_length: String(c.max_response_length || 5000),
    },
    assert: [],
    metadata: {
      id: c.id,
      category: c.category,
      max_tokens: c.max_tokens || 500,
    },
  };

  // Add system prompt as var if present
  if (c.system_prompt) {
    test.vars.system_prompt_text = c.system_prompt;
  }

  // Keywords present assertion
  if (c.required_keywords && c.required_keywords.length > 0) {
    test.assert.push({
      type: 'javascript',
      value: 'file://scripts/custom-assertions.js:keywordsPresent',
    });
  }

  // Keywords absent assertion
  if (c.forbidden_keywords && c.forbidden_keywords.length > 0) {
    test.assert.push({
      type: 'javascript',
      value: 'file://scripts/custom-assertions.js:keywordsAbsent',
    });
  }

  // Norwegian quality assertion
  if (c.expect_norwegian !== false) {
    test.assert.push({
      type: 'javascript',
      value: 'file://scripts/custom-assertions.js:norwegianQuality',
    });
  }

  // Response length assertion
  test.assert.push({
    type: 'javascript',
    value: 'file://scripts/custom-assertions.js:responseLengthRange',
  });

  // Code format assertion for diagnosis cases
  if (c.must_contain_code_format) {
    test.assert.push({
      type: 'javascript',
      value: 'file://scripts/custom-assertions.js:codeFormat',
    });
  }

  // ROUGE-L via promptfoo built-in similarity if reference exists
  if (c.reference_answer) {
    test.assert.push({
      type: 'similar',
      value: c.reference_answer,
      threshold: 0.1,
    });
  }

  return test;
}

function generateYaml(tests) {
  // Group by category for readability
  const grouped = {};
  for (const t of tests) {
    const cat = t.metadata.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  let yaml = `# Auto-generated from benchmark_cases.jsonl
# ${tests.length} test cases across ${Object.keys(grouped).length} categories
# Re-generate with: node ai-training/promptfoo/scripts/convert-benchmark.js

tests:\n`;

  for (const [category, categoryTests] of Object.entries(grouped)) {
    yaml += `  # ── ${category} (${categoryTests.length} cases) ──\n`;

    for (const t of categoryTests) {
      yaml += `  - description: ${escapeYaml(t.description)}\n`;
      yaml += `    vars:\n`;
      for (const [key, val] of Object.entries(t.vars)) {
        yaml += `      ${key}: ${escapeYaml(val)}\n`;
      }
      yaml += `    assert:\n`;
      for (const a of t.assert) {
        yaml += `      - type: ${a.type}\n`;
        yaml += `        value: ${escapeYaml(String(a.value))}\n`;
        if (a.threshold !== undefined) {
          yaml += `        threshold: ${a.threshold}\n`;
        }
      }
      yaml += `    metadata:\n`;
      for (const [key, val] of Object.entries(t.metadata)) {
        yaml += `      ${key}: ${escapeYaml(String(val))}\n`;
      }
      yaml += '\n';
    }
  }

  return yaml;
}

// Main
const lines = fs.readFileSync(BENCHMARK_FILE, 'utf8').trim().split('\n');
const cases = lines.map(l => JSON.parse(l));
const tests = cases.map(convertCase);
const yaml = generateYaml(tests);
fs.writeFileSync(OUTPUT_FILE, yaml, 'utf8');

const categories = {};
cases.forEach(c => { categories[c.category] = (categories[c.category] || 0) + 1; });

process.stdout.write(`Converted ${cases.length} benchmark cases to promptfoo YAML\n`);
process.stdout.write(`Categories: ${JSON.stringify(categories)}\n`);
process.stdout.write(`Output: ${OUTPUT_FILE}\n`);
