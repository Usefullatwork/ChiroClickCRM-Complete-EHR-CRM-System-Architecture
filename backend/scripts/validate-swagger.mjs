/**
 * Swagger Coverage Validator
 * Compares registered Express routes against Swagger-documented paths.
 * Reports any undocumented routes.
 *
 * Usage: node scripts/validate-swagger.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesDir = join(__dirname, '..', 'src', 'routes');

// Extract @swagger paths from JSDoc comments in route files
function extractSwaggerPaths(fileContent) {
  const paths = [];
  const swaggerBlockRegex = /\/\*\*\s*\n\s*\*\s*@swagger\s*\n([\s\S]*?)\*\//g;
  let match;

  while ((match = swaggerBlockRegex.exec(fileContent)) !== null) {
    const block = match[1];
    // Extract the path line (first non-empty, non-asterisk-only line after @swagger)
    const pathMatch = block.match(/^\s*\*\s*(\/[^\s:]+):\s*$/m);
    if (pathMatch) {
      const path = pathMatch[1];
      // Extract method
      const methodMatch = block.match(/^\s*\*\s+(get|post|put|patch|delete|options|head):\s*$/m);
      if (methodMatch) {
        paths.push({ path, method: methodMatch[1].toUpperCase() });
      }
    }
  }

  return paths;
}

// Extract route registrations from route files
function extractRouteRegistrations(fileContent, routePrefix) {
  const routes = [];
  // Match: router.get('/', ...), router.post('/path', ...), etc.
  const routeRegex = /router\.(get|post|put|patch|delete|options|head)\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = routeRegex.exec(fileContent)) !== null) {
    const method = match[1].toUpperCase();
    let path = match[2];

    // Convert Express params to Swagger format: :id -> {id}
    path = path.replace(/:([a-zA-Z_]+)/g, '{$1}');

    // Build full path
    const fullPath = routePrefix + (path === '/' ? '' : path);
    routes.push({ method, path: fullPath });
  }

  return routes;
}

// Map route file names to their mount prefixes
function getRoutePrefix(filename) {
  const prefixMap = {
    'auth.js': '/auth',
    'patients.js': '/patients',
    'encounters.js': '/encounters',
    'appointments.js': '/appointments',
    'billing.js': '/billing',
    'exercises.js': '/exercises',
    'diagnosis.js': '/diagnosis',
    'treatments.js': '/treatments',
    'outcomes.js': '/outcomes',
    'kpi.js': '/kpi',
    'financial.js': '/financial',
    'organizations.js': '/organizations',
    'users.js': '/users',
    'crm.js': '/crm',
    'gdpr.js': '/gdpr',
    'followups.js': '/followups',
    'training.js': '/training',
    'ai.js': '/ai',
    'macros.js': '/macros',
    'notifications.js': '/notifications',
    'scheduler.js': '/scheduler',
    'spineTemplates.js': '/spine-templates',
    'clinicalSettings.js': '/clinical-settings',
    'treatmentPlans.js': '/treatment-plans',
    'pdf.js': '/pdf',
    'letters.js': '/letters',
    'patientPortal.js': '/portal',
    'kiosk.js': '/kiosk',
    'bulkCommunication.js': '/bulk-communication',
    'automations.js': '/automations',
    'neuroexam.js': '/neuroexam',
    'vestibular.js': '/vestibular',
    'templates.js': '/templates',
  };
  return prefixMap[filename] || '/' + filename.replace('.js', '');
}

// Main validation
function validate() {
  const routeFiles = readdirSync(routesDir).filter(f => f.endsWith('.js'));

  let totalRoutes = 0;
  let documentedRoutes = 0;
  let undocumentedRoutes = [];
  const fileStats = [];

  for (const file of routeFiles) {
    const content = readFileSync(join(routesDir, file), 'utf8');
    const prefix = getRoutePrefix(file);

    const swaggerPaths = extractSwaggerPaths(content);
    const registeredRoutes = extractRouteRegistrations(content, prefix);

    // Build a set of documented method+path
    const documentedSet = new Set(
      swaggerPaths.map(p => `${p.method} ${p.path}`)
    );

    const fileUndocumented = [];
    for (const route of registeredRoutes) {
      totalRoutes++;
      const key = `${route.method} ${route.path}`;
      if (documentedSet.has(key)) {
        documentedRoutes++;
      } else {
        fileUndocumented.push(route);
        undocumentedRoutes.push({ file, ...route });
      }
    }

    fileStats.push({
      file,
      total: registeredRoutes.length,
      documented: registeredRoutes.length - fileUndocumented.length,
      undocumented: fileUndocumented,
    });
  }

  // Report
  console.log('='.repeat(70));
  console.log('SWAGGER DOCUMENTATION COVERAGE REPORT');
  console.log('='.repeat(70));
  console.log(`\nTotal routes found: ${totalRoutes}`);
  console.log(`Documented routes:  ${documentedRoutes}`);
  console.log(`Undocumented:       ${undocumentedRoutes.length}`);
  console.log(`Coverage:           ${((documentedRoutes / totalRoutes) * 100).toFixed(1)}%\n`);

  // Per-file breakdown
  console.log('-'.repeat(70));
  console.log('PER-FILE BREAKDOWN');
  console.log('-'.repeat(70));

  for (const stat of fileStats) {
    const pct = stat.total > 0
      ? ((stat.documented / stat.total) * 100).toFixed(0)
      : 'N/A';
    const icon = stat.undocumented.length === 0 ? 'OK' : '!!';
    console.log(`[${icon}] ${stat.file.padEnd(30)} ${stat.documented}/${stat.total} (${pct}%)`);

    if (stat.undocumented.length > 0) {
      for (const route of stat.undocumented) {
        console.log(`     MISSING: ${route.method} ${route.path}`);
      }
    }
  }

  // Exit code
  if (undocumentedRoutes.length > 0) {
    console.log(`\n${undocumentedRoutes.length} undocumented route(s) found.`);
    // Don't exit with error — this is informational
  } else {
    console.log('\nAll routes are documented!');
  }
}

validate();
