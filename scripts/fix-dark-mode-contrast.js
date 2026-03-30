#!/usr/bin/env node
/**
 * fix-dark-mode-contrast.js
 *
 * Adds dark:text-{color}-{shade} overrides to all text-gray-{400,500,600}
 * and text-slate-{400,500,600} classes that lack them.
 * Also fixes existing too-faint dark overrides (dark:text-gray-500/600).
 *
 * Mapping (WCAG 2.1 AA compliant on dark backgrounds):
 *   text-gray-400  → dark:text-gray-300
 *   text-gray-500  → dark:text-gray-400
 *   text-gray-600  → dark:text-gray-300
 *   text-slate-400 → dark:text-slate-300
 *   text-slate-500 → dark:text-slate-400
 *   text-slate-600 → dark:text-slate-300
 *
 * Fix existing:
 *   dark:text-gray-500  → dark:text-gray-300
 *   dark:text-gray-600  → dark:text-gray-300
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, relative } from 'path';
import { globSync } from 'fs';

// Use glob from node:fs or fallback to manual recursive
import { readdirSync, statSync } from 'fs';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const SRC = resolve(args[0] || 'frontend/src');
const DRY_RUN = process.argv.includes('--dry-run');

// Mapping: base class → dark override to add
const ADD_DARK = {
  'text-gray-400': 'dark:text-gray-300',
  'text-gray-500': 'dark:text-gray-400',
  'text-gray-600': 'dark:text-gray-300',
  'text-slate-400': 'dark:text-slate-300',
  'text-slate-500': 'dark:text-slate-400',
  'text-slate-600': 'dark:text-slate-300',
};

// Fix existing too-faint dark overrides
const FIX_EXISTING = {
  'dark:text-gray-500': 'dark:text-gray-300',
  'dark:text-gray-600': 'dark:text-gray-300',
};

function findFiles(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
      results.push(...findFiles(full, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function findTestFiles(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...findTestFiles(full, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e)) && entry.name.includes('.test.')) {
      results.push(full);
    }
  }
  return results;
}

let totalFiles = 0;
let totalChanges = 0;
const changedFiles = [];

// Process source files
const srcFiles = findFiles(SRC, ['.jsx', '.js', '.tsx', '.ts']);
// Also include test files that may render text classes
const testDir = resolve(SRC, '__tests__');
let testFiles = [];
try {
  testFiles = findTestFiles(SRC, ['.jsx', '.js', '.tsx', '.ts']);
} catch { /* no __tests__ dir */ }

const allFiles = [...srcFiles, ...testFiles];

for (const file of allFiles) {
  let content = readFileSync(file, 'utf8');
  let original = content;
  let fileChanges = 0;

  // Pass 1: Fix existing too-faint dark overrides
  for (const [from, to] of Object.entries(FIX_EXISTING)) {
    // Only fix if it's a standalone class (word boundary)
    const regex = new RegExp(`(?<=\\s|"|'|\`)${escapeRegex(from)}(?=\\s|"|'|\`|$)`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, to);
      fileChanges += matches.length;
    }
  }

  // Pass 2: Add missing dark overrides
  for (const [base, dark] of Object.entries(ADD_DARK)) {
    // Match the base class NOT preceded by "dark:" and NOT already followed by a dark:text- override
    // Pattern: standalone `text-gray-400` that doesn't have a `dark:text-gray-` or `dark:text-slate-` within
    // the same "class group" (i.e., before the next quote or backtick)

    // Simple approach: find `text-gray-400` not preceded by `dark:` and not followed by ` dark:text-gray-`
    const palette = base.includes('slate') ? 'slate' : 'gray';

    // Negative lookbehind for `dark:` and negative lookahead for ` dark:text-{palette}-`
    const regex = new RegExp(
      `(?<!dark:)${escapeRegex(base)}(?!.*dark:text-${palette}-)(?=\\s|"|'|\`|\\$|\\)|})`,
      'g'
    );

    // We need a smarter approach - check within the same className string context
    // Instead, let's do line-by-line replacement
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip if line already has a dark:text- override for this palette
      if (line.includes(`dark:text-${palette}-`)) continue;
      // Skip if this is inside a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      // Find standalone base class (not preceded by dark:)
      const lineRegex = new RegExp(`(?<!dark:)\\b${escapeRegex(base)}\\b`, 'g');
      if (lineRegex.test(line)) {
        // Replace: add dark override after the base class
        lines[i] = line.replace(
          new RegExp(`(?<!dark:)(${escapeRegex(base)})`, 'g'),
          `$1 ${dark}`
        );
        if (lines[i] !== line) {
          fileChanges += (lines[i].match(new RegExp(escapeRegex(dark), 'g')) || []).length -
                        (line.match(new RegExp(escapeRegex(dark), 'g')) || []).length;
        }
      }
    }
    content = lines.join('\n');
  }

  if (content !== original) {
    totalFiles++;
    totalChanges += fileChanges;
    changedFiles.push({ file: relative(process.cwd(), file), changes: fileChanges });

    if (!DRY_RUN) {
      writeFileSync(file, content, 'utf8');
    }
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Dark mode contrast fix complete:`);
console.log(`  Files modified: ${totalFiles}`);
console.log(`  Total changes:  ${totalChanges}`);
console.log('');
if (changedFiles.length > 0) {
  console.log('Changed files:');
  for (const { file, changes } of changedFiles.sort((a, b) => b.changes - a.changes)) {
    console.log(`  ${String(changes).padStart(4)} changes  ${file}`);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
