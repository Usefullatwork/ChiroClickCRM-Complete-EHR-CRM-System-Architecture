#!/usr/bin/env node

/**
 * Endpoint Benchmark
 * Measures p50, p95, p99 latencies for key API endpoints.
 * Compares against baseline and flags regressions > 20%.
 * Exit 1 if any regression > 20%, else exit 0.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
const ITERATIONS = 100;
const REGRESSION_THRESHOLD = 0.20; // 20%
const BASELINE_PATH = join(process.cwd(), 'benchmarks', 'baseline.json');

const ENDPOINTS = [
  { method: 'GET', path: '/health', auth: false },
  { method: 'GET', path: '/api/v1/health/detailed', auth: false },
  { method: 'GET', path: '/api/v1/patients', auth: true },
];

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr, p) {
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

/**
 * Benchmark a single endpoint
 */
async function benchmarkEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const headers = {};
  if (endpoint.auth && AUTH_COOKIE) {
    headers['Cookie'] = AUTH_COOKIE;
  }

  const timings = [];
  let errors = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, { method: endpoint.method, headers });
      const elapsed = performance.now() - start;
      timings.push(Math.round(elapsed * 100) / 100);
      if (!res.ok && res.status !== 401) {
        errors++;
      }
    } catch {
      const elapsed = performance.now() - start;
      timings.push(Math.round(elapsed * 100) / 100);
      errors++;
    }
  }

  timings.sort((a, b) => a - b);

  return {
    method: endpoint.method,
    path: endpoint.path,
    iterations: ITERATIONS,
    errors,
    p50: percentile(timings, 50),
    p95: percentile(timings, 95),
    p99: percentile(timings, 99),
    min: timings[0],
    max: timings[timings.length - 1],
    mean: Math.round((timings.reduce((a, b) => a + b, 0) / timings.length) * 100) / 100,
  };
}

/**
 * Format results as a table
 */
function printTable(results, comparisons) {
  const header = 'Endpoint'.padEnd(35) +
    'p50'.padStart(8) +
    'p95'.padStart(8) +
    'p99'.padStart(8) +
    'mean'.padStart(8) +
    'errs'.padStart(6) +
    (comparisons ? '  regression'.padStart(12) : '');

  process.stdout.write('\n' + header + '\n');
  process.stdout.write('-'.repeat(header.length) + '\n');

  for (const r of results) {
    const label = `${r.method} ${r.path}`.padEnd(35);
    let line = label +
      `${r.p50}ms`.padStart(8) +
      `${r.p95}ms`.padStart(8) +
      `${r.p99}ms`.padStart(8) +
      `${r.mean}ms`.padStart(8) +
      `${r.errors}`.padStart(6);

    if (comparisons) {
      const comp = comparisons.find((c) => c.path === r.path && c.method === r.method);
      if (comp) {
        const pctChange = ((r.p95 - comp.baselineP95) / comp.baselineP95 * 100).toFixed(1);
        const indicator = comp.regressed ? ' !! ' : '    ';
        line += `${indicator}${pctChange > 0 ? '+' : ''}${pctChange}%`.padStart(12);
      }
    }

    process.stdout.write(line + '\n');
  }
  process.stdout.write('\n');
}

async function main() {
  process.stdout.write(`Benchmarking ${BASE_URL} (${ITERATIONS} iterations per endpoint)\n`);

  const results = [];
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`  Testing ${endpoint.method} ${endpoint.path}...`);
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);
    process.stdout.write(` p95=${result.p95}ms\n`);
  }

  // Load baseline if exists
  let comparisons = null;
  let hasRegression = false;

  if (existsSync(BASELINE_PATH)) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    comparisons = [];

    for (const result of results) {
      const base = baseline.results.find(
        (b) => b.method === result.method && b.path === result.path
      );
      if (base) {
        const change = (result.p95 - base.p95) / base.p95;
        const regressed = change > REGRESSION_THRESHOLD;
        if (regressed) hasRegression = true;
        comparisons.push({
          method: result.method,
          path: result.path,
          baselineP95: base.p95,
          currentP95: result.p95,
          change,
          regressed,
        });
      }
    }

    process.stdout.write(`Compared against baseline from ${baseline.timestamp}\n`);
  } else {
    // Save as baseline
    const baselineDir = dirname(BASELINE_PATH);
    if (!existsSync(baselineDir)) {
      mkdirSync(baselineDir, { recursive: true });
    }
    const baselineData = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      iterations: ITERATIONS,
      results,
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(baselineData, null, 2));
    process.stdout.write(`No baseline found. Saved current results as baseline: ${BASELINE_PATH}\n`);
  }

  printTable(results, comparisons);

  if (hasRegression) {
    process.stdout.write('FAIL: One or more endpoints regressed >20% from baseline.\n');
    process.exit(1);
  }

  if (comparisons) {
    process.stdout.write('PASS: No regressions detected.\n');
  }
}

main();
