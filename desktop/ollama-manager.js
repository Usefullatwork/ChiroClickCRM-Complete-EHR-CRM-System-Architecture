/**
 * Ollama Manager
 * Manages the Ollama AI service for local model inference.
 * Checks status, starts if needed, manages model lifecycle.
 */

const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Check if Ollama is running and what models are available
 */
async function checkOllama() {
  try {
    const response = await httpGet(`${OLLAMA_URL}/api/tags`);
    const data = JSON.parse(response);
    const models = (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at,
    }));

    // Check for ChiroClick-specific models
    const chiroModels = models.filter(m =>
      m.name.startsWith('chiro-') || m.name.includes('chiro')
    );

    return {
      running: true,
      models,
      chiroModels,
      hasRequiredModels: chiroModels.length > 0,
    };
  } catch {
    return {
      running: false,
      models: [],
      chiroModels: [],
      hasRequiredModels: false,
    };
  }
}

/**
 * Attempt to start Ollama service
 */
async function startOllama() {
  return new Promise((resolve) => {
    // Try to start Ollama in the background
    const cmd = process.platform === 'win32' ? 'ollama serve' : 'ollama serve &';

    const proc = exec(cmd, { timeout: 10000 });

    proc.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to start Ollama: ${err.message}. Install from https://ollama.ai`,
      });
    });

    // Wait a bit then check if it started
    setTimeout(async () => {
      const status = await checkOllama();
      resolve({
        success: status.running,
        error: status.running ? null : 'Ollama did not start. Install from https://ollama.ai',
      });
    }, 3000);
  });
}

/**
 * Simple HTTP GET helper
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

module.exports = { checkOllama, startOllama };
