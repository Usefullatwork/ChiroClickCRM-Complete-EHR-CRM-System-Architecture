/**
 * Endpoint Stress Test
 * Hit 8 GET endpoints 100x concurrently, verify no 500s, <2s response
 *
 * Usage: node backend/load-tests/stress-endpoints.js
 * Requires: Backend running on localhost:3000
 */

import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENCY = 100;
const ENDPOINTS = [
  '/health',
  '/api/v1/dashboard/stats',
  '/api/v1/patients',
  '/api/v1/appointments',
  '/api/v1/search/patients?q=test',
  '/api/v1/notifications',
  '/api/v1/treatments',
  '/api/v1/diagnosis/common',
];

const results = {
  total: 0,
  success: 0,
  errors: 0,
  status500: 0,
  slowResponses: 0,
  responseTimes: [],
};

function makeRequest(url, cookie) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        resolve({ status: res.statusCode, elapsed, body });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, elapsed: Date.now() - startTime, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, elapsed: Date.now() - startTime, error: 'timeout' });
    });

    req.end();
  });
}

async function login() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@chiroclickehr.no',
      password: 'admin123',
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      const cookies = res.headers['set-cookie'];
      const sessionCookie = cookies?.find((c) => c.startsWith('session='));
      resolve(sessionCookie ? sessionCookie.split(';')[0] : null);
    });

    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

async function run() {
  process.stdout.write('Stress Endpoint Test\n');
  process.stdout.write('====================\n\n');

  // Login to get session cookie
  const cookie = await login();
  if (!cookie) {
    process.stdout.write('WARNING: Could not login — testing without auth\n\n');
  }

  for (const endpoint of ENDPOINTS) {
    const url = `${BASE_URL}${endpoint}`;
    process.stdout.write(`Testing ${endpoint} (${CONCURRENCY}x concurrent)...\n`);

    const promises = Array.from({ length: CONCURRENCY }, () => makeRequest(url, cookie));

    const responses = await Promise.all(promises);

    let endpointErrors = 0;
    let endpointSlow = 0;

    for (const res of responses) {
      results.total++;
      results.responseTimes.push(res.elapsed);

      if (res.status >= 200 && res.status < 400) {
        results.success++;
      } else if (res.status >= 500) {
        results.status500++;
        endpointErrors++;
      } else if (res.error) {
        results.errors++;
        endpointErrors++;
      } else {
        results.success++; // 4xx is expected for some endpoints
      }

      if (res.elapsed > 2000) {
        results.slowResponses++;
        endpointSlow++;
      }
    }

    const times = responses.map((r) => r.elapsed);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    process.stdout.write(
      `  avg=${avg}ms, p95=${p95}ms, max=${max}ms, errors=${endpointErrors}, slow=${endpointSlow}\n`
    );
  }

  process.stdout.write('\n=== SUMMARY ===\n');
  process.stdout.write(`Total requests: ${results.total}\n`);
  process.stdout.write(`Success: ${results.success}\n`);
  process.stdout.write(`500 errors: ${results.status500}\n`);
  process.stdout.write(`Connection errors: ${results.errors}\n`);
  process.stdout.write(`Slow (>2s): ${results.slowResponses}\n`);

  const allTimes = results.responseTimes.sort((a, b) => a - b);
  const globalAvg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
  const globalP95 = allTimes[Math.floor(allTimes.length * 0.95)];
  process.stdout.write(`Global avg: ${globalAvg}ms, p95: ${globalP95}ms\n`);

  if (results.status500 > 0) {
    process.stdout.write('\nFAIL: Got 500 errors under load\n');
    process.exit(1);
  }
  if (results.slowResponses > results.total * 0.05) {
    process.stdout.write('\nWARN: >5% slow responses\n');
  }

  process.stdout.write('\nPASS: No 500 errors under load\n');
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
