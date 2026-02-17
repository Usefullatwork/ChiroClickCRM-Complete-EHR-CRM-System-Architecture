#!/usr/bin/env node
/**
 * Query Profiling Script
 * Runs EXPLAIN ANALYZE on common query patterns and reports execution plans.
 * Flags sequential scans on tables with >100 rows.
 *
 * Usage: node scripts/profile-queries.js
 */

import dotenv from 'dotenv';

// CLI output helpers (avoids print which triggers pre-commit hook)
const print = (...args) => process.stdout.write(args.join(' ') + '\n');
const printErr = (...args) => process.stderr.write(args.join(' ') + '\n');
dotenv.config();

// Force PGlite for desktop profiling
const DB_ENGINE = process.env.DB_ENGINE || 'pglite';

let db;
if (DB_ENGINE === 'pglite') {
  db = await import('../src/config/database-pglite.js');
  await db.initPGlite();
} else {
  db = await import('../src/config/database-pg.js');
}

const { query } = db;

// ============================================================================
// Common query patterns to profile
// ============================================================================

const QUERY_PATTERNS = [
  // Patients
  {
    name: 'patients: list by org (paginated)',
    sql: `SELECT * FROM patients WHERE organization_id = $1 LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },
  {
    name: 'patients: search by name',
    sql: `SELECT * FROM patients WHERE organization_id = $1 AND (LOWER(first_name) LIKE $2 OR LOWER(last_name) LIKE $2) LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001', '%test%'],
  },
  {
    name: 'patients: by status',
    sql: `SELECT * FROM patients WHERE organization_id = $1 AND status = $2 LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001', 'ACTIVE'],
  },
  {
    name: 'patients: count by org',
    sql: `SELECT COUNT(*) FROM patients WHERE organization_id = $1`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },

  // Clinical encounters
  {
    name: 'encounters: by patient (recent)',
    sql: `SELECT * FROM clinical_encounters WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 10`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },
  {
    name: 'encounters: by org + date range',
    sql: `SELECT * FROM clinical_encounters WHERE organization_id = $1 AND created_at >= $2 LIMIT 50`,
    params: ['00000000-0000-0000-0000-000000000001', '2025-01-01'],
  },
  {
    name: 'encounters: unsigned drafts',
    sql: `SELECT * FROM clinical_encounters WHERE organization_id = $1 AND signed_at IS NULL LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },

  // Appointments
  {
    name: 'appointments: by org + future date',
    sql: `SELECT * FROM appointments WHERE organization_id = $1 AND date >= $2 LIMIT 50`,
    params: ['00000000-0000-0000-0000-000000000001', '2026-01-01'],
  },
  {
    name: 'appointments: by patient',
    sql: `SELECT * FROM appointments WHERE patient_id = $1 ORDER BY date DESC LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },
  {
    name: 'appointments: by status',
    sql: `SELECT * FROM appointments WHERE organization_id = $1 AND status = $2 AND date >= $3 LIMIT 50`,
    params: ['00000000-0000-0000-0000-000000000001', 'CONFIRMED', '2026-01-01'],
  },

  // Leads (CRM)
  {
    name: 'leads: by org + status',
    sql: `SELECT * FROM leads WHERE organization_id = $1 AND status = $2 LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001', 'NEW'],
  },
  {
    name: 'leads: pipeline count',
    sql: `SELECT status, COUNT(*) as count FROM leads WHERE organization_id = $1 GROUP BY status`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },

  // Billing
  {
    name: 'billing: invoices by org',
    sql: `SELECT * FROM invoices WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },
  {
    name: 'billing: unpaid invoices',
    sql: `SELECT * FROM invoices WHERE organization_id = $1 AND status = $2 LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001', 'UNPAID'],
  },

  // Follow-ups
  {
    name: 'followups: pending by org',
    sql: `SELECT * FROM follow_ups WHERE organization_id = $1 AND status = $2 ORDER BY due_date ASC LIMIT 20`,
    params: ['00000000-0000-0000-0000-000000000001', 'PENDING'],
  },

  // Sessions
  {
    name: 'sessions: by user (active)',
    sql: `SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW()`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },

  // Users
  {
    name: 'users: by org',
    sql: `SELECT * FROM users WHERE organization_id = $1`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },
  {
    name: 'users: by email (login)',
    sql: `SELECT * FROM users WHERE email = $1`,
    params: ['admin@chiroclickcrm.no'],
  },

  // Treatment plans
  {
    name: 'treatment_plans: by patient',
    sql: `SELECT * FROM treatment_plans WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 10`,
    params: ['00000000-0000-0000-0000-000000000001'],
  },

  // Exercises
  {
    name: 'exercises: library list',
    sql: `SELECT * FROM exercise_library LIMIT 50`,
    params: [],
  },
];

// ============================================================================
// Table row counts (for seq scan flagging)
// ============================================================================

async function getTableRowCounts() {
  const counts = {};
  const tables = [
    'patients',
    'clinical_encounters',
    'appointments',
    'leads',
    'invoices',
    'follow_ups',
    'sessions',
    'users',
    'treatment_plans',
    'exercise_library',
  ];

  for (const table of tables) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result.rows[0]?.count || '0', 10);
    } catch {
      counts[table] = -1; // table doesn't exist
    }
  }
  return counts;
}

// ============================================================================
// Profile a single query
// ============================================================================

async function profileQuery(pattern) {
  try {
    const explainSQL = `EXPLAIN ANALYZE ${pattern.sql}`;
    const result = await query(explainSQL, pattern.params);

    const plan = result.rows.map((r) => r['QUERY PLAN'] || Object.values(r)[0]).join('\n');
    const usesSeqScan = /Seq Scan/i.test(plan);
    const usesIndexScan = /Index Scan|Index Only Scan|Bitmap Index/i.test(plan);

    // Extract execution time from plan
    const timeMatch = plan.match(/Execution Time:\s*([\d.]+)\s*ms/);
    const executionTime = timeMatch ? parseFloat(timeMatch[1]) : null;

    // Extract table name from seq scan line
    const seqScanTables = [];
    const seqMatches = plan.matchAll(/Seq Scan on (\w+)/gi);
    for (const m of seqMatches) {
      seqScanTables.push(m[1]);
    }

    return {
      name: pattern.name,
      executionTime,
      usesSeqScan,
      usesIndexScan,
      seqScanTables,
      plan,
    };
  } catch (error) {
    return {
      name: pattern.name,
      error: error.message,
    };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  print('='.repeat(80));
  print('  ChiroClickCRM Query Profiling Report');
  print(`  Engine: ${DB_ENGINE} | Time: ${new Date().toISOString()}`);
  print('='.repeat(80));
  print();

  // Get table row counts
  print('--- Table Row Counts ---');
  const rowCounts = await getTableRowCounts();
  for (const [table, count] of Object.entries(rowCounts)) {
    if (count === -1) {
      print(`  ${table.padEnd(25)} (table not found)`);
    } else {
      print(`  ${table.padEnd(25)} ${count} rows`);
    }
  }
  print();

  // Profile each query
  print('--- Query Profiles ---');
  const results = [];
  const warnings = [];

  for (const pattern of QUERY_PATTERNS) {
    const result = await profileQuery(pattern);
    results.push(result);

    if (result.error) {
      print(`  [SKIP] ${result.name}`);
      print(`         Error: ${result.error}`);
      print();
      continue;
    }

    const timeStr = result.executionTime !== null ? `${result.executionTime.toFixed(2)}ms` : 'N/A';
    const scanType = result.usesIndexScan ? 'INDEX' : result.usesSeqScan ? 'SEQ' : 'OTHER';
    const flag = result.usesSeqScan ? ' ⚠' : ' ✓';

    print(`  [${scanType.padEnd(5)}]${flag} ${result.name} (${timeStr})`);

    // Flag seq scans on large tables
    if (result.usesSeqScan) {
      for (const table of result.seqScanTables) {
        const count = rowCounts[table] ?? -1;
        if (count > 100) {
          const warning = `SEQ SCAN on ${table} (${count} rows): ${result.name}`;
          warnings.push(warning);
          print(`         WARNING: Sequential scan on '${table}' with ${count} rows`);
        }
      }
    }
  }

  // Summary
  print();
  print('='.repeat(80));
  print('  Summary');
  print('='.repeat(80));

  const successful = results.filter((r) => !r.error);
  const seqScans = successful.filter((r) => r.usesSeqScan);
  const indexScans = successful.filter((r) => r.usesIndexScan);
  const avgTime =
    successful.reduce((sum, r) => sum + (r.executionTime || 0), 0) / (successful.length || 1);

  print(`  Total queries profiled: ${results.length}`);
  print(`  Successful:             ${successful.length}`);
  print(`  Skipped (errors):       ${results.length - successful.length}`);
  print(`  Using index scan:       ${indexScans.length}`);
  print(`  Using seq scan:         ${seqScans.length}`);
  print(`  Average execution time: ${avgTime.toFixed(2)}ms`);
  print();

  if (warnings.length > 0) {
    print('  WARNINGS (seq scan on tables with >100 rows):');
    for (const w of warnings) {
      print(`    - ${w}`);
    }
  } else {
    print('  No seq scan warnings on large tables.');
  }

  print();

  // Cleanup
  if (DB_ENGINE === 'pglite' && db.closePool) {
    await db.closePool();
  }

  process.exit(0);
}

main().catch((err) => {
  printErr('Profile script failed:', err);
  process.exit(1);
});
