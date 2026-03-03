#!/usr/bin/env node

/**
 * Model Health Check
 * Tests Ollama model availability and response quality.
 * Exit 0 if all tested models healthy, 1 if any failed.
 */

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const MODEL_TESTS = [
  {
    name: 'chiro-no-sft-dpo-v6',
    prompt: 'Skriv en kort SOAP subjektiv for nakkesmerter',
    validate: (text) => {
      const lower = text.toLowerCase();
      const keywords = ['smerte', 'nakke', 'pasient', 'plager', 'stiv', 'hodepine', 'ømhet', 'bevegelse'];
      return keywords.some((kw) => lower.includes(kw));
    },
    required: true,
  },
  {
    name: 'chiro-fast',
    prompt: 'Fullfør: Pasienten klager over',
    validate: (text) => text.trim().length > 5,
    required: false,
  },
];

async function checkOllamaStatus() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { ok: true, models };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function testModel(modelConfig, availableModels) {
  const { name, prompt, validate, required } = modelConfig;
  const isAvailable = availableModels.some((m) => m.startsWith(name));

  if (!isAvailable) {
    return {
      name,
      healthy: !required,
      responseMs: 0,
      outputLength: 0,
      skipped: true,
      reason: required ? 'Model not found (REQUIRED)' : 'Model not found (optional)',
    };
  }

  const start = performance.now();
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: name,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 100 },
      }),
    });

    if (!res.ok) {
      const elapsed = Math.round(performance.now() - start);
      return { name, healthy: false, responseMs: elapsed, outputLength: 0, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const elapsed = Math.round(performance.now() - start);
    const output = data.response || '';
    const healthy = validate(output);

    return {
      name,
      healthy,
      responseMs: elapsed,
      outputLength: output.length,
      ...(healthy ? {} : { reason: 'Validation failed — response did not contain expected keywords' }),
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return { name, healthy: false, responseMs: elapsed, outputLength: 0, error: err.message };
  }
}

async function main() {
  const ollamaStatus = await checkOllamaStatus();

  if (!ollamaStatus.ok) {
    const result = {
      models: MODEL_TESTS.map((m) => ({
        name: m.name,
        healthy: false,
        responseMs: 0,
        outputLength: 0,
        error: 'Ollama unreachable',
      })),
      ollamaStatus: 'unreachable',
      ollamaError: ollamaStatus.error,
      timestamp: new Date().toISOString(),
    };
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(1);
  }

  const results = [];
  for (const modelConfig of MODEL_TESTS) {
    const result = await testModel(modelConfig, ollamaStatus.models);
    results.push(result);
  }

  const output = {
    models: results,
    ollamaStatus: 'healthy',
    availableModels: ollamaStatus.models,
    timestamp: new Date().toISOString(),
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  const anyFailed = results.some((r) => !r.healthy && !r.skipped);
  const requiredMissing = results.some((r) => !r.healthy && r.skipped && r.reason?.includes('REQUIRED'));
  process.exit(anyFailed || requiredMissing ? 1 : 0);
}

main();
