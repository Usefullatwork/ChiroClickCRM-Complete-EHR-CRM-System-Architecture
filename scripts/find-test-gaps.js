#!/usr/bin/env node

/**
 * Find Test Gaps
 * Scans backend route files and checks for corresponding test coverage.
 * Outputs a report with coverage statistics.
 * Exit 0 always (informational).
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, relative } from 'path';

const BACKEND_DIR = join(process.cwd(), 'backend');
const ROUTES_DIR = join(BACKEND_DIR, 'src', 'routes');
const TESTS_DIR = join(BACKEND_DIR, 'tests');

// HTTP method patterns to match in route files
const ROUTE_REGEX = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
const APP_ROUTE_REGEX = /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

/**
 * Recursively collect all files matching an extension
 */
function collectFiles(dir, extensions) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules') {
          results.push(...collectFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some((ext) => entry.endsWith(ext))) {
          results.push(fullPath);
        }
      } catch {
        // Skip files we can't stat
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return results;
}

/**
 * Extract route definitions from a file
 */
function extractRoutes(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routes = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const regex of [ROUTE_REGEX, APP_ROUTE_REGEX]) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: filePath,
          line: i + 1,
        });
      }
    }
  }

  return routes;
}

/**
 * Check if a route path appears in any test file content
 */
function findTestCoverage(route, testContents) {
  const { method, path } = route;
  const pathVariants = [
    path,
    path.replace(/:[^/]+/g, '[^/]+'), // :id -> regex-ish
    path.replace(/:[^/]+/g, ''),       // :id stripped
  ];

  for (const { file, content } of testContents) {
    const lower = content.toLowerCase();
    // Check if both the HTTP method and a path variant appear in the test
    const hasMethod =
      lower.includes(method.toLowerCase()) ||
      lower.includes(`'${method.toLowerCase()}'`) ||
      lower.includes(`"${method.toLowerCase()}"`);

    const hasPath = pathVariants.some(
      (variant) => content.includes(variant) || content.includes(variant.replace(/\//g, '\\/'))
    );

    if (hasMethod && hasPath) {
      return { covered: true, testFile: file };
    }
  }

  return { covered: false };
}

/**
 * Attempt to find test file by naming convention
 */
function findTestFileByName(routeFile, testFiles) {
  const routeBase = basename(routeFile, '.js')
    .replace('.routes', '')
    .replace('.route', '')
    .replace('Routes', '')
    .replace('Route', '');

  return testFiles.filter((tf) => {
    const testBase = basename(tf).toLowerCase();
    return (
      testBase.includes(routeBase.toLowerCase()) &&
      (testBase.includes('test') || testBase.includes('spec'))
    );
  });
}

function main() {
  // Collect route files
  const routeFiles = collectFiles(ROUTES_DIR, ['.js', '.mjs', '.ts']);
  if (routeFiles.length === 0) {
    process.stdout.write('No route files found in ' + ROUTES_DIR + '\n');
    process.exit(0);
  }

  // Collect test files
  const testFiles = collectFiles(TESTS_DIR, ['.js', '.mjs', '.ts']);
  const testContents = testFiles.map((f) => ({
    file: f,
    content: readFileSync(f, 'utf8'),
  }));

  // Extract all routes
  const allRoutes = [];
  for (const routeFile of routeFiles) {
    const routes = extractRoutes(routeFile);
    allRoutes.push(...routes);
  }

  if (allRoutes.length === 0) {
    process.stdout.write('No route definitions found.\n');
    process.exit(0);
  }

  // Check coverage for each route
  const covered = [];
  const uncovered = [];

  for (const route of allRoutes) {
    const coverage = findTestCoverage(route, testContents);
    if (coverage.covered) {
      covered.push({ ...route, testFile: coverage.testFile });
    } else {
      uncovered.push(route);
    }
  }

  // Also check which route files have corresponding test files
  const routeFileStatus = new Map();
  for (const routeFile of routeFiles) {
    const matchingTests = findTestFileByName(routeFile, testFiles);
    routeFileStatus.set(routeFile, matchingTests);
  }

  // Output report
  const pct = ((covered.length / allRoutes.length) * 100).toFixed(1);

  process.stdout.write('\n=== Test Gap Report ===\n\n');
  process.stdout.write(`Total routes found:      ${allRoutes.length}\n`);
  process.stdout.write(`Routes with coverage:    ${covered.length}\n`);
  process.stdout.write(`Routes without coverage: ${uncovered.length}\n`);
  process.stdout.write(`Coverage:                ${pct}%\n`);

  // Route file to test file mapping
  process.stdout.write('\n--- Route File → Test File Mapping ---\n\n');
  for (const [routeFile, tests] of routeFileStatus) {
    const rel = relative(BACKEND_DIR, routeFile);
    if (tests.length > 0) {
      const testRels = tests.map((t) => relative(BACKEND_DIR, t)).join(', ');
      process.stdout.write(`  [OK] ${rel} → ${testRels}\n`);
    } else {
      process.stdout.write(`  [!!] ${rel} → NO TEST FILE FOUND\n`);
    }
  }

  // Uncovered routes detail
  if (uncovered.length > 0) {
    process.stdout.write('\n--- Uncovered Routes ---\n\n');
    for (const route of uncovered) {
      const rel = relative(BACKEND_DIR, route.file);
      process.stdout.write(`  ${route.method.padEnd(7)} ${route.path.padEnd(45)} ${rel}:${route.line}\n`);
    }
  }

  process.stdout.write('\n');
}

main();
