#!/usr/bin/env node
/**
 * Replace console.log/warn/error with logger calls in frontend source files.
 *
 * Mapping:
 *   console.log(...)   → logger.debug(...)
 *   console.warn(...)  → logger.warn(...)
 *   console.error(...) → logger.error(...)
 *
 * Skips:
 *   - logger.js itself (needs raw console access)
 *   - Files with /* eslint-disable no-console * / (intentional)
 *   - Test files (__tests__/)
 *   - node_modules
 *
 * Usage: node scripts/replace-console-log.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const SKIP_FILES = ['utils/logger.js'];
const SKIP_DIRS = ['__tests__', 'node_modules', '__mocks__'];

const dryRun = process.argv.includes('--dry-run');

function getAllJSFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        results.push(...getAllJSFiles(fullPath));
      }
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function shouldSkip(filePath) {
  const rel = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
  return SKIP_FILES.some(s => rel === s || rel.endsWith(s));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  let removedEslintDisable = false;

  // Remove eslint-disable no-console directive (we're replacing console with logger)
  if (content.includes('eslint-disable no-console')) {
    content = content.replace(/\/\*\s*eslint-disable\s+no-console\s*\*\/\s*\n?/g, '');
    content = content.replace(/\/\/\s*eslint-disable-next-line\s+no-console\s*\n?/g, '');
    removedEslintDisable = true;
  }

  let changes = 0;

  // Check if file already imports logger
  const hasLoggerImport = /import\s+(?:logger|{[^}]*logger[^}]*})\s+from/.test(content);

  // Replace console.log → logger.debug
  content = content.replace(/console\.log\(/g, () => { changes++; return 'logger.debug('; });

  // Replace console.warn → logger.warn
  content = content.replace(/console\.warn\(/g, () => { changes++; return 'logger.warn('; });

  // Replace console.error → logger.error
  content = content.replace(/console\.error\(/g, () => { changes++; return 'logger.error('; });

  if (changes === 0) {
    return { file: filePath, changes: 0 };
  }

  // Add logger import if not present
  if (!hasLoggerImport) {
    const rel = path.relative(path.dirname(filePath), SRC_DIR).replace(/\\/g, '/');
    const importPath = rel ? `${rel}/utils/logger` : './utils/logger';

    // Insert after last import statement
    const importRegex = /^(import\s+.+?;\s*\n)/gm;
    let lastImportEnd = 0;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }

    if (lastImportEnd > 0) {
      const importLine = `import logger from '${importPath}';\n`;
      content = content.slice(0, lastImportEnd) + importLine + content.slice(lastImportEnd);
    } else {
      // No existing imports — add at top (after any comments/directives)
      const importLine = `import logger from '${importPath}';\n\n`;
      // Find first non-comment, non-empty line
      const firstCodeLine = content.search(/^(?!\/\/|\/\*|\s*\*|\s*$)/m);
      if (firstCodeLine > 0) {
        content = content.slice(0, firstCodeLine) + importLine + content.slice(firstCodeLine);
      } else {
        content = importLine + content;
      }
    }
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return {
    file: path.relative(SRC_DIR, filePath).replace(/\\/g, '/'),
    changes,
    addedImport: !hasLoggerImport
  };
}

// Main
const files = getAllJSFiles(SRC_DIR);
let totalChanges = 0;
let filesModified = 0;

process.stdout.write(`${dryRun ? '[DRY RUN] ' : ''}Scanning ${files.length} files...\n\n`);

for (const file of files) {
  if (shouldSkip(file)) {
    continue;
  }

  const result = processFile(file);
  if (result.changes > 0) {
    process.stdout.write(`  ${result.file}: ${result.changes} replacements${result.addedImport ? ' (+import)' : ''}${result.skipped ? ` [SKIPPED: ${result.skipped}]` : ''}\n`);
    totalChanges += result.changes;
    filesModified++;
  }
}

process.stdout.write(`\n${dryRun ? '[DRY RUN] ' : ''}Done: ${totalChanges} replacements across ${filesModified} files\n`);
