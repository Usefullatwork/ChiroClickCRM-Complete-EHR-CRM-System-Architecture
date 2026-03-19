/**
 * Payload Fuzzing Test
 * Edge inputs: empty strings, huge strings, negative numbers, future dates, emoji, null fields
 *
 * Usage: node backend/load-tests/payload-fuzzing.js
 * Requires: Backend running on localhost:3000
 */

import http from 'http';

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
      res.on('end', () => resolve({ status: res.statusCode }));
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

const FUZZ_CASES = [
  {
    name: 'Empty strings',
    body: { first_name: '', last_name: '', email: '', phone: '' },
    expectNot500: true,
  },
  {
    name: '10K char first_name',
    body: {
      first_name: 'A'.repeat(10000),
      last_name: 'Test',
      email: 'test@test.com',
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-1`,
    },
    expectNot500: true,
  },
  {
    name: 'Negative numbers in phone',
    body: {
      first_name: 'Fuzz',
      last_name: 'Test',
      email: 'fuzz@test.com',
      phone: '-1234567890',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-2`,
    },
    expectNot500: true,
  },
  {
    name: 'Future date of birth',
    body: {
      first_name: 'Future',
      last_name: 'Test',
      email: 'future@test.com',
      phone: '+4712345678',
      date_of_birth: '2099-01-01',
      solvit_id: `FUZZ-${Date.now()}-3`,
    },
    expectNot500: true,
  },
  {
    name: 'Emoji in name',
    body: {
      first_name: '🎉💥🔥',
      last_name: '😀Test',
      email: `emoji${Date.now()}@test.com`,
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-4`,
    },
    expectNot500: true,
  },
  {
    name: 'Null fields',
    body: { first_name: null, last_name: null, email: null },
    expectNot500: true,
  },
  {
    name: 'Undefined/missing required fields',
    body: {},
    expectNot500: true,
  },
  {
    name: 'Array instead of string',
    body: { first_name: ['a', 'b'], last_name: { nested: true } },
    expectNot500: true,
  },
  {
    name: 'SQL injection in search',
    isSearch: true,
    query: "'; DROP TABLE patients; --",
    expectNot500: true,
  },
  {
    name: 'XSS in search',
    isSearch: true,
    query: '<script>alert(1)</script>',
    expectNot500: true,
  },
  {
    name: 'Unicode control characters',
    body: {
      first_name: 'Test\x00\x01\x02\x03',
      last_name: 'Control',
      email: `ctrl${Date.now()}@test.com`,
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-5`,
    },
    expectNot500: true,
  },
  {
    name: 'Norwegian characters (æøå)',
    body: {
      first_name: 'Ærlig',
      last_name: 'Østby',
      email: `norsk${Date.now()}@test.com`,
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-6`,
    },
    expectNot500: true,
  },
  {
    name: 'Very long email',
    body: {
      first_name: 'Long',
      last_name: 'Email',
      email: 'a'.repeat(250) + '@test.com',
      phone: '+4712345678',
      date_of_birth: '1990-01-01',
      solvit_id: `FUZZ-${Date.now()}-7`,
    },
    expectNot500: true,
  },
  {
    name: 'Nested JSON 50 levels deep',
    body: buildNestedObject(50),
    expectNot500: true,
  },
  {
    name: 'Prototype pollution attempt',
    body: { __proto__: { isAdmin: true }, constructor: { prototype: { isAdmin: true } } },
    expectNot500: true,
  },
  {
    name: 'Date as number',
    body: {
      first_name: 'DateNum',
      last_name: 'Test',
      date_of_birth: 12345,
      solvit_id: `FUZZ-${Date.now()}-8`,
    },
    expectNot500: true,
  },
  {
    name: 'Boolean where string expected',
    body: { first_name: true, last_name: false },
    expectNot500: true,
  },
  {
    name: 'HTML entities',
    body: {
      first_name: '&lt;script&gt;alert(1)&lt;/script&gt;',
      last_name: '&amp;',
      email: `entity${Date.now()}@test.com`,
      solvit_id: `FUZZ-${Date.now()}-9`,
    },
    expectNot500: true,
  },
];

function buildNestedObject(depth) {
  let obj = { value: 'deep' };
  for (let i = 0; i < depth; i++) {
    obj = { nested: obj };
  }
  return obj;
}

async function run() {
  process.stdout.write('Payload Fuzzing Test\n');
  process.stdout.write('====================\n\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of FUZZ_CASES) {
    let result;

    if (testCase.isSearch) {
      result = await httpRequest(
        'GET',
        `/api/v1/search/patients?q=${encodeURIComponent(testCase.query)}`
      );
    } else {
      result = await httpRequest('POST', '/api/v1/patients', testCase.body);
    }

    const is500 = result.status >= 500;
    const isOk = !is500 || !testCase.expectNot500;

    if (isOk) {
      passed++;
      process.stdout.write(`  PASS: ${testCase.name} → ${result.status}\n`);
    } else {
      failed++;
      process.stdout.write(`  FAIL: ${testCase.name} → ${result.status} (expected non-500)\n`);
    }
  }

  process.stdout.write(`\n=== RESULTS ===\n`);
  process.stdout.write(`Passed: ${passed}/${FUZZ_CASES.length}\n`);
  process.stdout.write(`Failed: ${failed}/${FUZZ_CASES.length}\n`);

  if (failed > 0) {
    process.stdout.write('\nFAIL: Some payloads caused 500 errors\n');
    process.exit(1);
  } else {
    process.stdout.write('\nPASS: All fuzz payloads handled gracefully\n');
  }
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
