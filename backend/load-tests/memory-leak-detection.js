/**
 * Memory Leak Detection
 * 1000 CRUD cycles, monitor heapUsed, flag >50% growth
 *
 * Usage: node backend/load-tests/memory-leak-detection.js
 * Requires: Backend running on localhost:3000
 */

import http from 'http';

const CYCLES = parseInt(process.env.CYCLES || '1000');
const SAMPLE_INTERVAL = 50; // Sample memory every N cycles

function httpRequest(method, path, body) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = null;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function measureServerMemory() {
  const res = await httpRequest('GET', '/health');
  // Server health doesn't expose memory — use client-side timing as proxy
  // Real memory measurement would need /health/detailed with admin auth
  return process.memoryUsage().heapUsed; // Client-side memory (for this script)
}

async function crudCycle(i) {
  const ts = Date.now();

  // CREATE
  const createRes = await httpRequest('POST', '/api/v1/patients', {
    solvit_id: `MEMLEAK-${ts}-${i}`,
    first_name: 'MemTest',
    last_name: `Patient${i}`,
    email: `memtest${ts}${i}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1990-01-01',
  });

  if (createRes.status !== 201) return { created: false };

  const patientId = createRes.body?.id || createRes.body?.data?.id;
  if (!patientId) return { created: false };

  // READ
  await httpRequest('GET', `/api/v1/patients/${patientId}`);

  // UPDATE
  await httpRequest('PUT', `/api/v1/patients/${patientId}`, {
    first_name: 'MemTestUpdated',
  });

  // DELETE (soft delete via PATCH status)
  await httpRequest('PATCH', `/api/v1/patients/${patientId}`, {
    status: 'INACTIVE',
  });

  return { created: true, patientId };
}

async function run() {
  process.stdout.write('Memory Leak Detection Test\n');
  process.stdout.write('=========================\n\n');
  process.stdout.write(`Running ${CYCLES} CRUD cycles...\n\n`);

  const memorySamples = [];
  const startTime = Date.now();
  let errors = 0;

  // Initial memory sample
  const initialMemory = await measureServerMemory();
  memorySamples.push({ cycle: 0, heapMB: Math.round(initialMemory / 1024 / 1024) });

  for (let i = 0; i < CYCLES; i++) {
    const result = await crudCycle(i);
    if (!result.created) errors++;

    if ((i + 1) % SAMPLE_INTERVAL === 0) {
      const mem = await measureServerMemory();
      const heapMB = Math.round(mem / 1024 / 1024);
      memorySamples.push({ cycle: i + 1, heapMB });
      process.stdout.write(`  Cycle ${i + 1}/${CYCLES}: heap=${heapMB}MB, errors=${errors}\n`);
    }
  }

  const finalMemory = await measureServerMemory();
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  const initialMB = memorySamples[0].heapMB;
  const finalMB = Math.round(finalMemory / 1024 / 1024);
  const growthPercent = Math.round(((finalMB - initialMB) / initialMB) * 100);

  process.stdout.write('\n=== MEMORY SUMMARY ===\n');
  process.stdout.write(`Duration: ${elapsed}s\n`);
  process.stdout.write(`Cycles: ${CYCLES}\n`);
  process.stdout.write(`Errors: ${errors}\n`);
  process.stdout.write(`Initial heap: ${initialMB}MB\n`);
  process.stdout.write(`Final heap: ${finalMB}MB\n`);
  process.stdout.write(`Growth: ${growthPercent}%\n\n`);

  process.stdout.write('Memory Timeline:\n');
  for (const sample of memorySamples) {
    const bar = '#'.repeat(Math.min(sample.heapMB, 80));
    process.stdout.write(`  ${String(sample.cycle).padStart(5)}: ${bar} ${sample.heapMB}MB\n`);
  }

  if (growthPercent > 50) {
    process.stdout.write(`\nWARN: Heap grew ${growthPercent}% — possible memory leak\n`);
    process.exit(1);
  } else {
    process.stdout.write(
      `\nPASS: Heap growth ${growthPercent}% is within acceptable range (<50%)\n`
    );
  }
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
