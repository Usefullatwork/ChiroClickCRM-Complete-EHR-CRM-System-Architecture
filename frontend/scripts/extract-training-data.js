/**
 * Training Data Extraction Script
 *
 * Extracts text from .docx files in the training data folder
 * and saves them as readable .txt files for AI training.
 *
 * Usage: node scripts/extract-training-data.js
 *
 * Prerequisites: npm install mammoth
 */

import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  inputDir: 'D:\\PROGAMMVARE - EHR - Øvelse - Behandling\\EHR  --- CMR\\Build folder EHR\\TRENINGS DATA OF UTVIKLINGSHULL',
  outputDir: 'D:\\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\\training-data-extracted',
  supportedExtensions: ['.docx', '.doc']
};

// Statistics tracking
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  files: []
};

/**
 * Recursively find all files with supported extensions
 */
async function findFiles(dir, files = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden folders
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await findFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.supportedExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Extract text from a .docx file using mammoth
 */
async function extractDocx(inputPath) {
  try {
    const result = await mammoth.extractRawText({ path: inputPath });
    return {
      success: true,
      text: result.value,
      messages: result.messages
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create output directory structure mirroring input
 */
async function ensureOutputDir(inputPath) {
  const relativePath = path.relative(CONFIG.inputDir, inputPath);
  const outputPath = path.join(CONFIG.outputDir, relativePath);
  const outputDir = path.dirname(outputPath);

  await fs.mkdir(outputDir, { recursive: true });

  // Change extension to .txt
  return outputPath.replace(/\.(docx|doc)$/i, '.txt');
}

/**
 * Process a single file
 */
async function processFile(inputPath) {
  stats.total++;
  const relativePath = path.relative(CONFIG.inputDir, inputPath);

  console.log(`[${stats.total}] Processing: ${relativePath}`);

  try {
    // Extract text
    const result = await extractDocx(inputPath);

    if (!result.success) {
      console.error(`  ✗ Failed: ${result.error}`);
      stats.failed++;
      stats.files.push({ path: relativePath, status: 'failed', error: result.error });
      return;
    }

    // Skip empty files
    if (!result.text || result.text.trim().length < 10) {
      console.log(`  ⊘ Skipped: Empty or too short`);
      stats.skipped++;
      stats.files.push({ path: relativePath, status: 'skipped', reason: 'empty' });
      return;
    }

    // Write output
    const outputPath = await ensureOutputDir(inputPath);

    // Add metadata header
    const header = [
      '=' .repeat(80),
      `SOURCE: ${path.basename(inputPath)}`,
      `EXTRACTED: ${new Date().toISOString()}`,
      `CHARACTERS: ${result.text.length}`,
      '=' .repeat(80),
      '',
      ''
    ].join('\n');

    await fs.writeFile(outputPath, header + result.text, 'utf8');

    console.log(`  ✓ Saved: ${path.basename(outputPath)} (${result.text.length} chars)`);
    stats.success++;
    stats.files.push({
      path: relativePath,
      status: 'success',
      outputPath: path.relative(CONFIG.outputDir, outputPath),
      chars: result.text.length
    });

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    stats.failed++;
    stats.files.push({ path: relativePath, status: 'error', error: error.message });
  }
}

/**
 * Generate summary report
 */
async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    inputDir: CONFIG.inputDir,
    outputDir: CONFIG.outputDir,
    summary: {
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      skipped: stats.skipped
    },
    files: stats.files
  };

  const reportPath = path.join(CONFIG.outputDir, 'extraction-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // Also create a readable summary
  const summaryPath = path.join(CONFIG.outputDir, 'README.md');
  const summary = `# Training Data Extraction Summary

## Extraction Details
- **Date:** ${new Date().toLocaleString('no-NO')}
- **Source:** \`${CONFIG.inputDir}\`
- **Output:** \`${CONFIG.outputDir}\`

## Statistics
| Metric | Count |
|--------|-------|
| Total Files | ${stats.total} |
| Successfully Extracted | ${stats.success} |
| Failed | ${stats.failed} |
| Skipped (empty) | ${stats.skipped} |

## Successfully Extracted Files

${stats.files
  .filter(f => f.status === 'success')
  .map(f => `- \`${f.outputPath}\` (${f.chars} chars)`)
  .join('\n')}

## Categories Found

### SOPE/SOAP Analysis
${stats.files.filter(f => f.path.toLowerCase().includes('sope') || f.path.toLowerCase().includes('analyse')).map(f => `- ${f.path}`).join('\n') || '(none)'}

### VNG/Vestibular
${stats.files.filter(f => f.path.toLowerCase().includes('vng') || f.path.toLowerCase().includes('svimmel') || f.path.toLowerCase().includes('vertigo')).map(f => `- ${f.path}`).join('\n') || '(none)'}

### Examination Forms
${stats.files.filter(f => f.path.toLowerCase().includes('undersøkelse') || f.path.toLowerCase().includes('undersokelse')).map(f => `- ${f.path}`).join('\n') || '(none)'}

### Chiropractor Cases
${stats.files.filter(f => f.path.includes('Ny -') || f.path.includes('Ny-') || f.path.toLowerCase().includes('kiropraktor')).map(f => `- ${f.path}`).join('\n') || '(none)'}
`;

  await fs.writeFile(summaryPath, summary, 'utf8');

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Training Data Extraction Script                        ║');
  console.log('║     Converting .docx files to readable text               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Input:  ${CONFIG.inputDir}`);
  console.log(`Output: ${CONFIG.outputDir}`);
  console.log('');

  // Create output directory
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create output directory:', error.message);
    process.exit(1);
  }

  // Find all docx files
  console.log('Scanning for .docx files...');
  const files = await findFiles(CONFIG.inputDir);
  console.log(`Found ${files.length} files to process.\n`);

  if (files.length === 0) {
    console.log('No .docx files found. Exiting.');
    process.exit(0);
  }

  // Process each file
  console.log('─'.repeat(60));
  for (const file of files) {
    await processFile(file);
  }
  console.log('─'.repeat(60));

  // Generate report
  console.log('\nGenerating extraction report...');
  await generateReport();

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    EXTRACTION COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`  ✓ Success: ${stats.success}`);
  console.log(`  ✗ Failed:  ${stats.failed}`);
  console.log(`  ⊘ Skipped: ${stats.skipped}`);
  console.log(`  ─ Total:   ${stats.total}`);
  console.log('');
  console.log(`Reports saved to: ${CONFIG.outputDir}`);
  console.log('  - extraction-report.json (detailed)');
  console.log('  - README.md (summary)');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
