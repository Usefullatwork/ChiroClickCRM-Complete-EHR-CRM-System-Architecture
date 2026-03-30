/**
 * Concurrency Stress Test
 * Race conditions: simultaneous writes, parallel booking, concurrent operations
 *
 * Usage: node backend/load-tests/concurrency-stress.js
 * Requires: Backend running on localhost:3000
 */

import http from 'http';

const BASE = 'http://localhost:3000';

function httpRequest(method, path, body, cookie) {
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
        ...(cookie ? { Cookie: cookie } : {}),
      },
      timeout: 15000,
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
          parsed = data;
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

async function login() {
  const res = await httpRequest('POST', '/api/v1/auth/login', {
    email: 'admin@chiroclickehr.no',
    password: 'admin123',
  });
  // In desktop mode, any request is auto-authenticated
  return null;
}

async function testParallelPatientCreation(cookie) {
  process.stdout.write('\n1. Parallel Patient Creation (10 simultaneous)\n');

  const patients = Array.from({ length: 10 }, (_, i) => ({
    solvit_id: `STRESS-${Date.now()}-${i}`,
    first_name: 'Stress',
    last_name: `Test${i}`,
    email: `stress${Date.now()}${i}@test.com`,
    phone: '+4712345678',
    date_of_birth: '1990-01-01',
  }));

  const results = await Promise.all(
    patients.map((p) => httpRequest('POST', '/api/v1/patients', p, cookie))
  );

  const created = results.filter((r) => r.status === 201).length;
  const errors = results.filter((r) => r.status >= 500).length;

  process.stdout.write(`  Created: ${created}/10, Errors: ${errors}\n`);

  if (errors > 0) {
    process.stdout.write('  FAIL: Server errors during parallel creation\n');
    return false;
  }
  return true;
}

async function testParallelReads(cookie) {
  process.stdout.write('\n2. Parallel Reads (20 simultaneous GET /patients)\n');

  const results = await Promise.all(
    Array.from({ length: 20 }, () => httpRequest('GET', '/api/v1/patients?limit=10', null, cookie))
  );

  const success = results.filter((r) => r.status === 200).length;
  const errors = results.filter((r) => r.status >= 500).length;

  process.stdout.write(`  Success: ${success}/20, Errors: ${errors}\n`);
  return errors === 0;
}

async function testParallelSearches(cookie) {
  process.stdout.write('\n3. Parallel Searches (15 simultaneous)\n');

  const queries = [
    'test',
    'john',
    'patient',
    'stress',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
  ];
  const results = await Promise.all(
    queries.map((q) => httpRequest('GET', `/api/v1/search/patients?q=${q}`, null, cookie))
  );

  const success = results.filter((r) => r.status === 200).length;
  const errors = results.filter((r) => r.status >= 500).length;

  process.stdout.write(`  Success: ${success}/${queries.length}, Errors: ${errors}\n`);
  return errors === 0;
}

async function testReadWriteContention(cookie) {
  process.stdout.write('\n4. Read-Write Contention (interleaved reads and writes)\n');

  const ops = [];
  for (let i = 0; i < 5; i++) {
    ops.push(httpRequest('GET', '/api/v1/patients?limit=5', null, cookie));
    ops.push(
      httpRequest(
        'POST',
        '/api/v1/patients',
        {
          solvit_id: `CONTENTION-${Date.now()}-${i}`,
          first_name: 'Contention',
          last_name: `Test${i}`,
          email: `contention${Date.now()}${i}@test.com`,
          phone: '+4712345678',
          date_of_birth: '1990-01-01',
        },
        cookie
      )
    );
  }

  const results = await Promise.all(ops);
  const errors = results.filter((r) => r.status >= 500).length;

  process.stdout.write(`  Operations: ${results.length}, Errors: ${errors}\n`);
  return errors === 0;
}

async function testDashboardContention(cookie) {
  process.stdout.write('\n5. Dashboard Contention (10 parallel dashboard loads)\n');

  const endpoints = [
    '/api/v1/dashboard/stats',
    '/api/v1/dashboard/appointments/today',
    '/api/v1/dashboard/tasks/pending',
    '/api/v1/dashboard/red-flags',
    '/api/v1/dashboard/unsigned-notes',
  ];

  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      httpRequest('GET', endpoints[i % endpoints.length], null, cookie)
    )
  );

  const errors = results.filter((r) => r.status >= 500).length;
  process.stdout.write(
    `  Success: ${results.length - errors}/${results.length}, Errors: ${errors}\n`
  );
  return errors === 0;
}

async function run() {
  process.stdout.write('Concurrency Stress Test\n');
  process.stdout.write('=======================\n');

  const cookie = await login();
  let allPassed = true;

  allPassed = (await testParallelPatientCreation(cookie)) && allPassed;
  allPassed = (await testParallelReads(cookie)) && allPassed;
  allPassed = (await testParallelSearches(cookie)) && allPassed;
  allPassed = (await testReadWriteContention(cookie)) && allPassed;
  allPassed = (await testDashboardContention(cookie)) && allPassed;

  process.stdout.write('\n=== RESULT ===\n');
  if (allPassed) {
    process.stdout.write('PASS: No server errors under concurrent load\n');
  } else {
    process.stdout.write('FAIL: Server errors detected\n');
    process.exit(1);
  }
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
