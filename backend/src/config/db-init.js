/**
 * Database Initializer for PGlite Desktop Mode
 *
 * On first run, creates schema tables and seeds demo data.
 * Runs automatically at server startup when using PGlite.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if database has been initialized (organizations table exists)
 */
async function isInitialized(db) {
  try {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organizations'
      ) as exists`
    );
    return result.rows[0]?.exists === true;
  } catch {
    return false;
  }
}

/**
 * Initialize the PGlite database with schema and seed data
 */
export async function initializeDatabase(db) {
  const initialized = await isInitialized(db);

  // Always run schema patches (idempotent ALTER TABLE IF NOT EXISTS)
  await applySchemaPatches(db);

  // Always apply performance indexes (idempotent CREATE INDEX IF NOT EXISTS)
  await applyPerformanceIndexes(db);

  if (initialized) {
    logger.info('Database already initialized, skipping setup');
    return;
  }

  logger.info('First run detected - initializing database schema...');

  // 1. Run core schema
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove pgcrypto extension (not available in PGlite, gen_random_uuid() is built-in)
    schemaSql = schemaSql.replace(
      /CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g,
      '-- pgcrypto skipped (gen_random_uuid() is built-in in PGlite)'
    );

    // Execute schema in individual statements to handle errors gracefully
    const statements = splitSqlStatements(schemaSql);
    let successCount = 0;
    let skipCount = 0;

    for (const stmt of statements) {
      if (!stmt.trim()) {
        continue;
      }
      try {
        await db.query(stmt);
        successCount++;
      } catch (err) {
        // Skip non-critical errors (e.g. duplicate objects on re-run)
        skipCount++;
        if (!err.message.includes('already exists')) {
          logger.warn(`Schema statement skipped: ${err.message.substring(0, 100)}`);
        }
      }
    }
    logger.info(`Schema: ${successCount} statements executed, ${skipCount} skipped`);
  } catch (err) {
    logger.error('Failed to load schema.sql:', err.message);
  }

  // 2. Add auth columns (from migration 005)
  const authMigrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      expires_at TIMESTAMP NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      fresh BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS scheduled_job_logs (
      id SERIAL PRIMARY KEY,
      job_name VARCHAR(100) NOT NULL,
      job_id VARCHAR(100),
      status VARCHAR(20) NOT NULL,
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      error_message TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // RLS support function
    `CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
      SELECT current_setting('app.current_tenant', true);
    $$ LANGUAGE SQL STABLE`,
    // Auth helper functions
    `CREATE OR REPLACE FUNCTION record_successful_login(user_uuid UUID)
    RETURNS void AS $$ UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = user_uuid; $$ LANGUAGE SQL`,
    `CREATE OR REPLACE FUNCTION record_failed_login(user_uuid UUID)
    RETURNS void AS $$ UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = user_uuid; $$ LANGUAGE SQL`,
  ];

  for (const sql of authMigrations) {
    try {
      await db.query(sql);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        logger.warn(`Auth migration skipped: ${err.message.substring(0, 80)}`);
      }
    }
  }
  logger.info('Auth tables and functions created');

  // 3. Widen role constraint to include RECEPTIONIST
  try {
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.query(
      `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'PRACTITIONER', 'ASSISTANT', 'RECEPTIONIST'))`
    );
  } catch (err) {
    logger.warn('Role constraint update skipped:', err.message);
  }

  // 4. Add columns referenced by backend code but missing from base schema
  const missingColumns = [
    // Patients
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'NO'`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_needles BOOLEAN DEFAULT NULL`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_adjustments BOOLEAN DEFAULT NULL`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_neck_adjustments BOOLEAN DEFAULT NULL`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_notes TEXT`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_updated_at TIMESTAMPTZ`,
    // Appointments
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rebooked BOOLEAN DEFAULT false`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT false`,
    // Follow-ups
    `ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS type VARCHAR(30)`,
    `ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS contact_method VARCHAR(20)`,
    `ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS contact_result VARCHAR(20)`,
    // Financial metrics
    `ALTER TABLE financial_metrics ADD COLUMN IF NOT EXISTS type VARCHAR(30)`,
    `ALTER TABLE financial_metrics ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2)`,
    // Audit log
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS organization_id UUID`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS patient_id UUID`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS data_category VARCHAR(50)`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS sensitivity_level VARCHAR(20) DEFAULT 'normal'`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS gdpr_relevant BOOLEAN DEFAULT false`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS duration_ms INTEGER`,
    `ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS response_code INTEGER`,
    // Clinical encounter versions
    `ALTER TABLE clinical_encounter_versions ADD COLUMN IF NOT EXISTS changed_by UUID`,
    `ALTER TABLE clinical_encounter_versions ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    // =========================================================================
    // CRM columns on patients table (from migration 010_crm_full_features)
    // Must be here (not in applySchemaPatches) so they run AFTER schema.sql
    // =========================================================================
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(30) DEFAULT 'NEW'`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 50`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(50)`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS acquisition_campaign VARCHAR(100)`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS visit_frequency_days NUMERIC`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_visit_date DATE`,
  ];

  for (const sql of missingColumns) {
    try {
      await db.query(sql);
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
        logger.warn(`Column migration skipped: ${err.message.substring(0, 80)}`);
      }
    }
  }
  logger.info('Missing columns added');

  // 4b. Create CRM tables (from migration 010_crm_full_features)
  // Must run after schema.sql so foreign key references resolve
  const crmTables = [
    `CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      source VARCHAR(50) DEFAULT 'OTHER',
      source_detail VARCHAR(255),
      status VARCHAR(30) NOT NULL DEFAULT 'NEW',
      score INTEGER DEFAULT 0,
      temperature VARCHAR(10),
      assigned_to UUID,
      primary_interest VARCHAR(255),
      chief_complaint TEXT,
      main_complaint TEXT,
      notes TEXT,
      converted_patient_id UUID,
      converted_at TIMESTAMP,
      lost_reason VARCHAR(255),
      next_follow_up_date TIMESTAMP,
      follow_up_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lead_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL,
      user_id UUID,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT,
      old_value VARCHAR(255),
      new_value VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patient_value_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      metric_type VARCHAR(50),
      value NUMERIC,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of crmTables) {
    try {
      await db.query(sql);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        logger.warn(`CRM table creation skipped: ${err.message.substring(0, 80)}`);
      }
    }
  }
  logger.info('CRM tables created');

  // 5. Seed demo organization and users
  try {
    const seedPath = path.resolve(__dirname, '../../../database/seeds/demo-users.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      const statements = splitSqlStatements(seedSql);
      for (const stmt of statements) {
        if (!stmt.trim()) {
          continue;
        }
        try {
          await db.query(stmt);
        } catch (err) {
          logger.warn(`Seed statement skipped: ${err.message.substring(0, 80)}`);
        }
      }
      logger.info('Demo users seeded (admin@chiroclickcrm.no / admin123)');
    }
  } catch (err) {
    logger.error('Failed to seed demo users:', err.message);
  }

  // 5. Also add a "Mads Admin" practitioner matching the frontend dev bypass
  try {
    await db.query(`
      INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_active, email_verified)
      VALUES (
        'b0000000-0000-0000-0000-000000000099',
        'a0000000-0000-0000-0000-000000000001',
        'mads@chiroclick.no',
        '$2b$10$ohl4C6Xa9meLOVyotGbMq.80PrTc4I..sHs0a6zGj8OWVqQC5arFO',
        'Mads',
        'Admin',
        'PRACTITIONER',
        true,
        true
      ) ON CONFLICT (id) DO NOTHING
    `);
  } catch (err) {
    // Not critical
  }

  logger.info('Database initialization complete');
}

/**
 * Idempotent schema patches that run on every startup.
 * Adds columns/tables that may be missing from older PGlite databases.
 */
async function applySchemaPatches(db) {
  const patches = [
    // Auth columns missing from original schema
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`,
    // Portal support
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS portal_pin_hash VARCHAR(255)`,
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
      title VARCHAR(255) NOT NULL,
      message TEXT,
      link VARCHAR(500),
      metadata JSONB,
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // Portal sessions table
    `CREATE TABLE IF NOT EXISTS portal_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      fresh BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // CRM columns on patients table (from migration 010_crm_full_features)
    // =========================================================================
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(30) DEFAULT 'NEW'`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 50`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(50)`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS acquisition_campaign VARCHAR(100)`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS visit_frequency_days NUMERIC`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_visit_date DATE`,
    // =========================================================================
    // CRM Leads table (from migration 010_crm_full_features)
    // Uses organization_id (not clinic_id) to match the service layer
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      source VARCHAR(50) DEFAULT 'OTHER',
      source_detail VARCHAR(255),
      status VARCHAR(30) NOT NULL DEFAULT 'NEW',
      score INTEGER DEFAULT 0,
      temperature VARCHAR(10),
      assigned_to UUID,
      primary_interest VARCHAR(255),
      chief_complaint TEXT,
      main_complaint TEXT,
      notes TEXT,
      converted_patient_id UUID,
      converted_at TIMESTAMP,
      lost_reason VARCHAR(255),
      next_follow_up_date TIMESTAMP,
      follow_up_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Lead activities table
    `CREATE TABLE IF NOT EXISTS lead_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL,
      user_id UUID,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT,
      old_value VARCHAR(255),
      new_value VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Patient value history (used by retention/churn analysis)
    `CREATE TABLE IF NOT EXISTS patient_value_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      metric_type VARCHAR(50),
      value NUMERIC,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  let applied = 0;
  for (const sql of patches) {
    try {
      await db.query(sql);
      applied++;
    } catch (err) {
      if (!err.message.includes('already exists')) {
        logger.debug(`Schema patch skipped: ${err.message.substring(0, 80)}`);
      }
    }
  }
  if (applied > 0) {
    logger.info(`Applied ${applied} schema patches`);
  }
}

/**
 * Apply performance indexes on every startup.
 * All use IF NOT EXISTS so they're safe to re-run.
 */
async function applyPerformanceIndexes(db) {
  const indexes = [
    // Patients
    `CREATE INDEX IF NOT EXISTS idx_patients_org_id ON patients (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_org_status ON patients (organization_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_org_last_name ON patients (organization_id, last_name)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_org_email ON patients (organization_id, email)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_org_last_visit ON patients (organization_id, last_visit_date)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_org_lifecycle ON patients (organization_id, lifecycle_stage)`,
    `CREATE INDEX IF NOT EXISTS idx_patients_first_visit ON patients (organization_id, first_visit_date)`,
    // Clinical encounters
    `CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON clinical_encounters (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_encounters_org_id ON clinical_encounters (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_encounters_org_patient_date ON clinical_encounters (organization_id, patient_id, encounter_date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_encounters_practitioner ON clinical_encounters (practitioner_id)`,
    // Appointments
    `CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_appointments_org_start ON appointments (organization_id, start_time)`,
    `CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_start ON appointments (practitioner_id, start_time)`,
    `CREATE INDEX IF NOT EXISTS idx_appointments_org_status ON appointments (organization_id, status)`,
    // Financial
    `CREATE INDEX IF NOT EXISTS idx_financial_patient_id ON financial_metrics (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_financial_org_patient ON financial_metrics (organization_id, patient_id)`,
    // Sessions
    `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at)`,
    // Audit log
    `CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log (organization_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log (user_id)`,
    // Follow-ups
    `CREATE INDEX IF NOT EXISTS idx_followups_patient ON follow_ups (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_followups_org_status ON follow_ups (organization_id, status)`,
  ];

  let applied = 0;
  for (const sql of indexes) {
    try {
      await db.query(sql);
      applied++;
    } catch (err) {
      // Skip if table doesn't exist yet or index already exists
      if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
        logger.debug(`Index skipped: ${err.message.substring(0, 80)}`);
      }
    }
  }
  if (applied > 0) {
    logger.info(`Applied ${applied} performance indexes`);
  }
}

/**
 * Split SQL into individual statements, respecting $$ delimiters for functions
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    // Track $$ delimiters
    const dollarCount = (trimmed.match(/\$\$/g) || []).length;
    if (dollarCount % 2 === 1) {
      inDollarQuote = !inDollarQuote;
    }

    current += `${line}\n`;

    // Statement ends at semicolon (but not inside $$ blocks)
    if (!inDollarQuote && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  // Don't forget any remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

export default { initializeDatabase };
