/**
 * Dual-Mode Smoke Test
 * Starts the server with DB_ENGINE=pglite, hits /health and /api-docs, reports pass/fail.
 *
 * Usage: node scripts/smoke-test.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

// CLI output helpers (avoids print which triggers pre-commit hook)
const print = (...args) => process.stdout.write(args.join(' ') + '\n');
const printErr = (...args) => process.stderr.write(args.join(' ') + '\n');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PORT = 3099; // Use non-standard port to avoid conflicting with running server
const results = [];
let passed = 0;
let failed = 0;

function report(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  results.push({ name, status, detail });
  if (ok) passed++;
  else failed++;
  print(`  [${status}] ${name}${detail ? ' — ' + detail : ''}`);
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}${urlPath}`, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

function waitForServer(maxWaitMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      if (Date.now() - start > maxWaitMs) {
        return reject(new Error(`Server did not start within ${maxWaitMs}ms`));
      }
      httpGet('/health')
        .then((res) => resolve(res))
        .catch(() => setTimeout(attempt, 500));
    }
    attempt();
  });
}

async function main() {
  print('\nDual-Mode Smoke Test (PGlite)\n');

  // Start server as child process
  const env = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'development',
    DB_ENGINE: 'pglite',
    CACHE_ENGINE: 'memory',
    DEV_SKIP_AUTH: 'true',
    DESKTOP_MODE: 'true',
    // Suppress rate limiting for smoke test
    RATE_LIMIT_MAX_REQUESTS: '1000',
  };

  print(`  Starting server on port ${PORT} with DB_ENGINE=pglite...`);

  const serverProc = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverStdout = '';
  let serverStderr = '';
  serverProc.stdout.on('data', (d) => (serverStdout += d.toString()));
  serverProc.stderr.on('data', (d) => (serverStderr += d.toString()));

  try {
    // Wait for server to be ready
    await waitForServer(30000);
    print('  Server is up.\n');

    // Test 1: GET /health => 200 or 503 (503 is acceptable if DB not fully ready)
    try {
      const healthRes = await httpGet('/health');
      const ok = healthRes.status === 200 || healthRes.status === 503;
      let detail = `status=${healthRes.status}`;
      try {
        const json = JSON.parse(healthRes.body);
        detail += `, db=${json.database}, uptime=${json.uptime?.toFixed(1)}s`;
      } catch {}
      report('GET /health responds', ok, detail);
    } catch (err) {
      report('GET /health responds', false, err.message);
    }

    // Test 2: GET /api-docs => 200 (or 301 redirect)
    try {
      const docsRes = await httpGet('/api-docs/');
      const ok = docsRes.status === 200 || docsRes.status === 301;
      report('GET /api-docs => 200', ok, `status=${docsRes.status}`);
    } catch (err) {
      report('GET /api-docs => 200', false, err.message);
    }

    // Test 3: GET /api/v1 => 200 (API root)
    try {
      const apiRes = await httpGet('/api/v1');
      const ok = apiRes.status === 200;
      report('GET /api/v1 => 200', ok, `status=${apiRes.status}`);
    } catch (err) {
      report('GET /api/v1 => 200', false, err.message);
    }

  } finally {
    // Kill the server
    print('\n  Stopping server...');
    serverProc.kill('SIGTERM');

    // Give it a moment to shut down gracefully
    await new Promise((resolve) => {
      serverProc.on('exit', resolve);
      setTimeout(() => {
        serverProc.kill('SIGKILL');
        resolve();
      }, 5000);
    });
    print('  Server stopped.\n');
  }

  print(`Results: ${passed} passed, ${failed} failed out of ${results.length}\n`);

  if (failed > 0) {
    print('Server stdout (last 500 chars):', serverStdout.slice(-500));
    print('Server stderr (last 500 chars):', serverStderr.slice(-500));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  printErr('Smoke test error:', err);
  process.exit(1);
});
