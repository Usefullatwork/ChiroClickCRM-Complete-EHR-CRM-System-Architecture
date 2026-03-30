#!/usr/bin/env node
/**
 * Service Reorg Migration Script
 * Moves 98 flat service files into 4 domain folders and updates all imports.
 *
 * Usage: node scripts/service-reorg.js [--dry-run]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, relative, dirname, basename } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = join(import.meta.dirname, '..');
const SERVICES_DIR = join(ROOT, 'backend', 'src', 'services');

// ─── Domain Mapping ────────────────────────────────────────────────────────
const DOMAIN_MAP = {
  // clinical/ — core EHR workflows, encounters, exercises, outcomes, documents
  'amendments.js': 'clinical',
  'clinicalAgent.js': 'clinical',
  'clinicalDataParser.js': 'clinical',
  'clinicalEvals.js': 'clinical',
  'clinicalNotes.js': 'clinical',
  'clinicalOrchestrator.js': 'clinical',
  'clinicalSettings.js': 'clinical',
  'clinicalValidation.js': 'clinical',
  'clinicalVision.js': 'clinical',
  'clinicalWorkflow.js': 'clinical',
  'complianceValidator.js': 'clinical',
  'diagnosis.js': 'clinical',
  'encounters.js': 'clinical',
  'episodes.js': 'clinical',
  'examinations.js': 'clinical',
  'exerciseDelivery.js': 'clinical',
  'exerciseLibrary.js': 'clinical',
  'exercises.js': 'clinical',
  'guardrails.js': 'clinical',
  'letterGenerator.js': 'clinical',
  'macros.js': 'clinical',
  'neuroexam.js': 'clinical',
  'noteValidator.js': 'clinical',
  'outcomeScoring.js': 'clinical',
  'outcomes.js': 'clinical',
  'pdf-utils.js': 'clinical',
  'pdf.js': 'clinical',
  'pdfGenerator.js': 'clinical',
  'progressTracking.js': 'clinical',
  'questionnaires.js': 'clinical',
  'redFlagEngine.js': 'clinical',
  'reportService.js': 'clinical',
  'structuredExtraction.js': 'clinical',
  'templates.js': 'clinical',
  'treatmentPlans.js': 'clinical',
  'treatments.js': 'clinical',

  // communication/ — email, SMS, push, notifications, delivery
  'appointmentReminders.js': 'communication',
  'automatedComms.js': 'communication',
  'bulkCommunication.js': 'communication',
  'communications.js': 'communication',
  'documentDelivery.js': 'communication',
  'documentParser.js': 'communication',
  'email.js': 'communication',
  'emailService.js': 'communication',
  'notifications.js': 'communication',
  'outlookBridge.js': 'communication',
  'phoneBridge.js': 'communication',
  'pushNotification.js': 'communication',
  'smsService.js': 'communication',
  'websocket.js': 'communication',

  // practice/ — patients, scheduling, billing, mobile, analytics, admin
  'analytics.js': 'practice',
  'appointments.js': 'practice',
  'auditLog.js': 'practice',
  'auditLogs.js': 'practice',
  'autoAccept.js': 'practice',
  'automationTriggers.js': 'practice',
  'backupService.js': 'practice',
  'batchProcessor.js': 'practice',
  'billing.js': 'practice',
  'claims.js': 'practice',
  'excelImport.js': 'practice',
  'financial.js': 'practice',
  'followups.js': 'practice',
  'gdpr.js': 'practice',
  'googleDrive.js': 'practice',
  'kiosk.js': 'practice',
  'kpi.js': 'practice',
  'kpiTracking.js': 'practice',
  'mobileAuth.js': 'practice',
  'mobileClinic.js': 'practice',
  'mobileExercises.js': 'practice',
  'mobilePrograms.js': 'practice',
  'mobileWorkouts.js': 'practice',
  'organizations.js': 'practice',
  'patientPortal.js': 'practice',
  'patients.js': 'practice',
  'portal.js': 'practice',
  'recallEngine.js': 'practice',
  'salt.js': 'practice',
  'scheduling.js': 'practice',
  'search.js': 'practice',
  'smartScheduler.js': 'practice',
  'users.js': 'practice',
  'vcardImport.js': 'practice',

  // training/ — AI training, data curation, RLAIF, journal parsers
  'aiLearning.js': 'training',
  'dataCuration.js': 'training',
  'embeddings.js': 'training',
  'extendedThinking.js': 'training',
  'ollamaTraining.js': 'training',
  'rag.js': 'training',
  'rlaif.js': 'training',
  'sigrunJournalParser.js': 'training',
  'sindreJournalParser.js': 'training',
  'textParser.js': 'training',
  'training.js': 'training',
  'trainingAnonymization.js': 'training',
  'trainingExport.js': 'training',
};

// ai.js shim — delete and redirect imports to ai/index.js
const AI_SHIM = 'ai.js';

// Existing subdirs that stay (not moved, but references to them change from moved files)
const EXISTING_SUBDIRS = ['ai', 'automations', 'crm', 'providers', '__mocks__'];

// Parent dirs that moved files import from (need one more ../ level)
const PARENT_DIRS = ['config', 'db', 'utils', 'auth', 'templates', 'data', 'middleware', 'infrastructure', 'domain', 'fhir'];

// ─── Helpers ───────────────────────────────────────────────────────────────
function log(msg) { process.stdout.write(msg + '\n'); }

function collectJsFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      results.push(...collectJsFiles(full));
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs') || entry.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

// ─── Step 1: Create domain directories ─────────────────────────────────────
log('Step 1: Creating domain directories...');
const domains = [...new Set(Object.values(DOMAIN_MAP))];
for (const domain of domains) {
  const dir = join(SERVICES_DIR, domain);
  if (!existsSync(dir)) {
    log(`  mkdir ${domain}/`);
    if (!DRY_RUN) mkdirSync(dir, { recursive: true });
  }
}

// ─── Step 2: Git mv all flat files ─────────────────────────────────────────
log('\nStep 2: Moving files with git mv...');
let movedCount = 0;
for (const [file, domain] of Object.entries(DOMAIN_MAP)) {
  const src = join(SERVICES_DIR, file);
  const dst = join(SERVICES_DIR, domain, file);
  if (!existsSync(src)) {
    log(`  SKIP (not found): ${file}`);
    continue;
  }
  log(`  ${file} → ${domain}/${file}`);
  if (!DRY_RUN) {
    execSync(`git mv "${src}" "${dst}"`, { cwd: ROOT });
  }
  movedCount++;
}
log(`  Moved ${movedCount} files.`);

// ─── Step 3: Delete ai.js shim ────────────────────────────────────────────
const shimPath = join(SERVICES_DIR, AI_SHIM);
if (existsSync(shimPath)) {
  log('\nStep 3: Removing ai.js shim...');
  if (!DRY_RUN) {
    execSync(`git rm "${shimPath}"`, { cwd: ROOT });
  }
} else {
  log('\nStep 3: ai.js shim already removed, skipping.');
}

// ─── Step 4: Update all imports ────────────────────────────────────────────
log('\nStep 4: Updating imports across codebase...');

// Collect all JS files in backend/
const backendDir = join(ROOT, 'backend');
const allFiles = collectJsFiles(backendDir);
log(`  Scanning ${allFiles.length} files...`);

let filesChanged = 0;

for (const filePath of allFiles) {
  let content = readFileSync(filePath, 'utf8');
  let original = content;
  const fileRelToServices = relative(SERVICES_DIR, filePath);
  const isMovedFile = !fileRelToServices.startsWith('..') && !fileRelToServices.startsWith('__mocks__');

  // Determine if this file is inside one of the new domain folders
  let fileDomain = null;
  for (const domain of domains) {
    if (fileRelToServices.startsWith(domain + '/') || fileRelToServices.startsWith(domain + '\\')) {
      fileDomain = domain;
      break;
    }
  }

  // 4a: For ALL files — update `services/FILENAME.js` references
  // This handles imports from routes, controllers, middleware, tests, etc.
  for (const [file, domain] of Object.entries(DOMAIN_MAP)) {
    // Match patterns like: services/foo.js (with various prefixes)
    // Handles: ../services/foo.js, ../../services/foo.js, src/services/foo.js
    const escaped = file.replace('.', '\\.');
    const pattern = new RegExp(`(services/)${escaped}`, 'g');
    content = content.replace(pattern, `services/${domain}/${file}`);
  }

  // 4b: Handle ai.js shim → ai/index.js redirect
  // services/ai.js → services/ai/index.js (but NOT services/ai/anything.js or services/aiLearning.js)
  content = content.replace(/services\/ai\.js/g, 'services/ai/index.js');

  // 4c: For files inside domain folders — fix relative imports to other domains
  if (fileDomain) {
    // Fix cross-domain relative imports: ./foo.js where foo is in a different domain
    for (const [file, domain] of Object.entries(DOMAIN_MAP)) {
      if (domain === fileDomain) continue; // same domain = no change needed
      const escaped = file.replace('.', '\\.');
      // Match: from './foo.js' — only within import/require statements
      const pattern = new RegExp(`(from\\s+['"])\\.\\/${escaped}(['"])`, 'g');
      content = content.replace(pattern, `$1../${domain}/${file}$2`);
      // Also match dynamic import()
      const dynPattern = new RegExp(`(import\\s*\\(\\s*['"])\\.\\/${escaped}(['"]\\s*\\))`, 'g');
      content = content.replace(dynPattern, `$1../${domain}/${file}$2`);
    }

    // Fix subdir references: ./ai/ → ../ai/, ./providers/ → ../providers/, etc.
    for (const subdir of EXISTING_SUBDIRS) {
      const pattern = new RegExp(`(from\\s+['"])\\.\\/${subdir}\\/`, 'g');
      content = content.replace(pattern, `$1../${subdir}/`);
      const dynPattern = new RegExp(`(import\\s*\\(\\s*['"])\\.\\/${subdir}\\/`, 'g');
      content = content.replace(dynPattern, `$1../${subdir}/`);
      // Also handle require()
      const reqPattern = new RegExp(`(require\\s*\\(\\s*['"])\\.\\/${subdir}\\/`, 'g');
      content = content.replace(reqPattern, `$1../${subdir}/`);
    }

    // Fix parent references: ../config/ → ../../config/, ../db/ → ../../db/, etc.
    for (const parentDir of PARENT_DIRS) {
      const pattern = new RegExp(`(from\\s+['"])\\.\\.\\/(?=${parentDir}\\/)`, 'g');
      content = content.replace(pattern, `$1../../`);
      const dynPattern = new RegExp(`(import\\s*\\(\\s*['"])\\.\\.\\/(?=${parentDir}\\/)`, 'g');
      content = content.replace(dynPattern, `$1../../`);
      const reqPattern = new RegExp(`(require\\s*\\(\\s*['"])\\.\\.\\/(?=${parentDir}\\/)`, 'g');
      content = content.replace(reqPattern, `$1../../`);
    }
  }

  if (content !== original) {
    filesChanged++;
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf8');
    } else {
      log(`  WOULD UPDATE: ${relative(ROOT, filePath)}`);
    }
  }
}

log(`  Updated imports in ${filesChanged} files.`);

// ─── Step 5: Move __mocks__/ai.js → ai/__mocks__/index.js ─────────────────
const mockSrc = join(SERVICES_DIR, '__mocks__', 'ai.js');
const mockDstDir = join(SERVICES_DIR, 'ai', '__mocks__');
const mockDst = join(mockDstDir, 'index.js');
if (existsSync(mockSrc)) {
  log('\nStep 5: Moving __mocks__/ai.js → ai/__mocks__/index.js...');
  if (!DRY_RUN) {
    mkdirSync(mockDstDir, { recursive: true });
    execSync(`git mv "${mockSrc}" "${mockDst}"`, { cwd: ROOT });
  }
} else {
  log('\nStep 5: __mocks__/ai.js not found, skipping.');
}

// ─── Summary ───────────────────────────────────────────────────────────────
log('\n─── Summary ───');
log(`  Files moved: ${movedCount}`);
log(`  Imports updated in: ${filesChanged} files`);
log(`  Domain folders: ${domains.join(', ')}`);
if (DRY_RUN) log('  (DRY RUN — no changes written)');
log('\nDone. Run "cd backend && npm test" to verify.');
