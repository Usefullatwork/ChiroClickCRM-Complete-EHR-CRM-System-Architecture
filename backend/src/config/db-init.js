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
    // Scheduled job logs columns (scheduler.js writes duration_ms, result, executed_at)
    // =========================================================================
    `ALTER TABLE scheduled_job_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER`,
    `ALTER TABLE scheduled_job_logs ADD COLUMN IF NOT EXISTS result JSONB`,
    `ALTER TABLE scheduled_job_logs ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP DEFAULT NOW()`,
    // =========================================================================
    // CRM / lifecycle columns on patients table
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
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS avg_visit_value DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit_date DATE`,
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_completion_rate DECIMAL(5,2)`,
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
    // =========================================================================
    // Additional CRM tables (from migration 010_crm_full_features)
    // Uses organization_id (not clinic_id) to match the service layer
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      referrer_patient_id UUID,
      referrer_name VARCHAR(200),
      referrer_email VARCHAR(255),
      referrer_phone VARCHAR(50),
      referred_patient_id UUID,
      referred_lead_id UUID,
      referred_name VARCHAR(200),
      referred_email VARCHAR(255),
      referred_phone VARCHAR(50),
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      reward_type VARCHAR(30),
      reward_amount DECIMAL(10,2),
      reward_description VARCHAR(255),
      reward_issued BOOLEAN DEFAULT false,
      reward_issued_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      converted_at TIMESTAMP,
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS surveys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      survey_type VARCHAR(30) NOT NULL DEFAULT 'NPS',
      questions JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      auto_send BOOLEAN DEFAULT false,
      send_after_days INTEGER DEFAULT 1,
      send_time TIME DEFAULT '10:00:00',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS survey_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL,
      patient_id UUID,
      appointment_id UUID,
      nps_score INTEGER,
      nps_category VARCHAR(10),
      satisfaction_score INTEGER,
      responses JSONB NOT NULL DEFAULT '{}'::jsonb,
      feedback_text TEXT,
      would_recommend BOOLEAN,
      requires_follow_up BOOLEAN DEFAULT false,
      follow_up_completed BOOLEAN DEFAULT false,
      follow_up_notes TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      sent_at TIMESTAMP,
      opened_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      preferred_practitioner_id UUID,
      preferred_days JSONB DEFAULT '[]'::jsonb,
      preferred_time_start TIME,
      preferred_time_end TIME,
      service_type VARCHAR(100),
      duration_minutes INTEGER DEFAULT 30,
      priority VARCHAR(10) DEFAULT 'NORMAL',
      status VARCHAR(20) DEFAULT 'ACTIVE',
      last_notified_at TIMESTAMP,
      notification_count INTEGER DEFAULT 0,
      booked_appointment_id UUID,
      notes TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS communication_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID,
      lead_id UUID,
      user_id UUID,
      channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
      direction VARCHAR(10) NOT NULL DEFAULT 'OUTBOUND',
      subject VARCHAR(255),
      message TEXT,
      template_used VARCHAR(100),
      contact_value VARCHAR(255),
      status VARCHAR(20) DEFAULT 'SENT',
      external_id VARCHAR(255),
      delivered_at TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      replied_at TIMESTAMP,
      call_duration_seconds INTEGER,
      call_outcome VARCHAR(50),
      call_recording_url VARCHAR(500),
      campaign_id UUID,
      campaign_name VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      campaign_type VARCHAR(30) NOT NULL DEFAULT 'RECALL',
      channels JSONB DEFAULT '["SMS"]'::jsonb,
      target_segment JSONB,
      target_count INTEGER DEFAULT 0,
      sms_template TEXT,
      email_subject VARCHAR(255),
      email_template TEXT,
      status VARCHAR(20) DEFAULT 'DRAFT',
      scheduled_at TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      is_ab_test BOOLEAN DEFAULT false,
      ab_variant VARCHAR(1),
      ab_parent_id UUID,
      stats JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"replied":0,"converted":0,"unsubscribed":0,"bounced":0}'::jsonb,
      cost_per_message DECIMAL(10,4),
      total_cost DECIMAL(10,2),
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      trigger_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
      trigger_config JSONB DEFAULT '{}'::jsonb,
      actions JSONB NOT NULL DEFAULT '[]'::jsonb,
      conditions JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      max_runs_per_patient INTEGER DEFAULT 1,
      total_runs INTEGER DEFAULT 0,
      successful_runs INTEGER DEFAULT 0,
      failed_runs INTEGER DEFAULT 0,
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL,
      patient_id UUID,
      lead_id UUID,
      trigger_type VARCHAR(50),
      trigger_data JSONB,
      status VARCHAR(20) DEFAULT 'PENDING',
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      actions_completed JSONB DEFAULT '[]'::jsonb,
      error_message TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
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
      logger.info('Demo users seeded (admin@chiroclickehr.no / admin123)');
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
    // CRM patient columns are in initializeDatabase missingColumns (avoid duplication)
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
    // =========================================================================
    // Additional CRM tables (patches for existing PGlite databases)
    // Uses organization_id (not clinic_id) to match the service layer
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      referrer_patient_id UUID,
      referrer_name VARCHAR(200),
      referrer_email VARCHAR(255),
      referrer_phone VARCHAR(50),
      referred_patient_id UUID,
      referred_lead_id UUID,
      referred_name VARCHAR(200),
      referred_email VARCHAR(255),
      referred_phone VARCHAR(50),
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      reward_type VARCHAR(30),
      reward_amount DECIMAL(10,2),
      reward_description VARCHAR(255),
      reward_issued BOOLEAN DEFAULT false,
      reward_issued_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      converted_at TIMESTAMP,
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS surveys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      survey_type VARCHAR(30) NOT NULL DEFAULT 'NPS',
      questions JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      auto_send BOOLEAN DEFAULT false,
      send_after_days INTEGER DEFAULT 1,
      send_time TIME DEFAULT '10:00:00',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS survey_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL,
      patient_id UUID,
      appointment_id UUID,
      nps_score INTEGER,
      nps_category VARCHAR(10),
      satisfaction_score INTEGER,
      responses JSONB NOT NULL DEFAULT '{}'::jsonb,
      feedback_text TEXT,
      would_recommend BOOLEAN,
      requires_follow_up BOOLEAN DEFAULT false,
      follow_up_completed BOOLEAN DEFAULT false,
      follow_up_notes TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      sent_at TIMESTAMP,
      opened_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      preferred_practitioner_id UUID,
      preferred_days JSONB DEFAULT '[]'::jsonb,
      preferred_time_start TIME,
      preferred_time_end TIME,
      service_type VARCHAR(100),
      duration_minutes INTEGER DEFAULT 30,
      priority VARCHAR(10) DEFAULT 'NORMAL',
      status VARCHAR(20) DEFAULT 'ACTIVE',
      last_notified_at TIMESTAMP,
      notification_count INTEGER DEFAULT 0,
      booked_appointment_id UUID,
      notes TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS communication_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID,
      lead_id UUID,
      user_id UUID,
      channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
      direction VARCHAR(10) NOT NULL DEFAULT 'OUTBOUND',
      subject VARCHAR(255),
      message TEXT,
      template_used VARCHAR(100),
      contact_value VARCHAR(255),
      status VARCHAR(20) DEFAULT 'SENT',
      external_id VARCHAR(255),
      delivered_at TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      replied_at TIMESTAMP,
      call_duration_seconds INTEGER,
      call_outcome VARCHAR(50),
      call_recording_url VARCHAR(500),
      campaign_id UUID,
      campaign_name VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      campaign_type VARCHAR(30) NOT NULL DEFAULT 'RECALL',
      channels JSONB DEFAULT '["SMS"]'::jsonb,
      target_segment JSONB,
      target_count INTEGER DEFAULT 0,
      sms_template TEXT,
      email_subject VARCHAR(255),
      email_template TEXT,
      status VARCHAR(20) DEFAULT 'DRAFT',
      scheduled_at TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      is_ab_test BOOLEAN DEFAULT false,
      ab_variant VARCHAR(1),
      ab_parent_id UUID,
      stats JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"replied":0,"converted":0,"unsubscribed":0,"bounced":0}'::jsonb,
      cost_per_message DECIMAL(10,4),
      total_cost DECIMAL(10,2),
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      trigger_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
      trigger_config JSONB DEFAULT '{}'::jsonb,
      actions JSONB NOT NULL DEFAULT '[]'::jsonb,
      conditions JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      max_runs_per_patient INTEGER DEFAULT 1,
      total_runs INTEGER DEFAULT 0,
      successful_runs INTEGER DEFAULT 0,
      failed_runs INTEGER DEFAULT 0,
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL,
      patient_id UUID,
      lead_id UUID,
      trigger_type VARCHAR(50),
      trigger_data JSONB,
      status VARCHAR(20) DEFAULT 'PENDING',
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      actions_completed JSONB DEFAULT '[]'::jsonb,
      error_message TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // Missing columns on organizations table (queried by organizations service)
    // =========================================================================
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Norway'`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active'`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_practitioners INTEGER DEFAULT 50`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_patients INTEGER DEFAULT 10000`,
    `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`,
    // =========================================================================
    // Missing columns on users table (queried by users service)
    // =========================================================================
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    // =========================================================================
    // Clinical Templates tables (from migration 003_add_clinical_templates)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS template_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(50) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      name_no VARCHAR(255) NOT NULL,
      parent_category_id UUID,
      sort_order INTEGER DEFAULT 0,
      icon VARCHAR(50),
      color VARCHAR(20),
      soap_section VARCHAR(20),
      body_region VARCHAR(50),
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS clinical_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      template_name VARCHAR(255),
      template_text TEXT,
      language VARCHAR(5) DEFAULT 'NO',
      soap_section VARCHAR(20),
      body_region VARCHAR(50),
      template_type VARCHAR(30),
      template_data JSONB DEFAULT '{}',
      keywords TEXT[],
      is_system BOOLEAN DEFAULT false,
      is_favorite BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      usage_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_by UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // Patch existing clinical_templates tables that may have migration-style columns
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100)`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100)`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(255)`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS template_text TEXT`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'NO'`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false`,
    `ALTER TABLE clinical_templates ADD COLUMN IF NOT EXISTS created_by UUID`,
    `CREATE TABLE IF NOT EXISTS template_phrases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      phrase_en TEXT NOT NULL,
      phrase_no TEXT NOT NULL,
      context_tags TEXT[],
      body_region VARCHAR(50),
      variables JSONB DEFAULT '[]',
      usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS clinical_tests_library (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(100) NOT NULL,
      test_name_en VARCHAR(255) NOT NULL,
      test_name_no VARCHAR(255) NOT NULL,
      test_category VARCHAR(50),
      body_region VARCHAR(50),
      system VARCHAR(50),
      description_en TEXT,
      description_no TEXT,
      procedure_en TEXT,
      procedure_no TEXT,
      positive_finding_en TEXT,
      positive_finding_no TEXT,
      negative_finding_en TEXT,
      negative_finding_no TEXT,
      indicates_conditions TEXT[],
      sensitivity DECIMAL(5,2),
      specificity DECIMAL(5,2),
      result_type VARCHAR(30),
      result_options JSONB DEFAULT '{}',
      measurement_unit VARCHAR(20),
      normal_range JSONB,
      reference_citations TEXT[],
      video_url TEXT,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_template_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      organization_id UUID,
      favorite_template_ids UUID[],
      frequently_used JSONB DEFAULT '[]',
      custom_templates JSONB DEFAULT '[]',
      preferred_language VARCHAR(5) DEFAULT 'NO',
      ui_preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS template_usage_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      user_id UUID,
      template_id UUID,
      encounter_id UUID,
      patient_id UUID,
      used_at TIMESTAMP DEFAULT NOW(),
      soap_section VARCHAR(20),
      template_content_used TEXT,
      was_modified BOOLEAN DEFAULT false,
      modified_content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Exercise Library table (used by exerciseLibrary.js and exercises.js)
    // Unified schema supporting both column naming conventions
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS exercise_library (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      code VARCHAR(100),
      name VARCHAR(255),
      name_norwegian VARCHAR(255),
      name_no VARCHAR(255),
      name_en VARCHAR(255),
      description TEXT,
      description_norwegian TEXT,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      body_region VARCHAR(100),
      difficulty_level VARCHAR(30) DEFAULT 'beginner',
      difficulty VARCHAR(30),
      instructions TEXT,
      instructions_norwegian TEXT,
      instructions_no TEXT,
      instructions_en TEXT,
      sets_default INTEGER DEFAULT 3,
      reps_default INTEGER DEFAULT 10,
      hold_seconds INTEGER,
      default_sets INTEGER DEFAULT 3,
      default_reps INTEGER DEFAULT 10,
      default_hold_seconds INTEGER,
      default_rest_seconds INTEGER,
      default_frequency VARCHAR(50),
      frequency_per_day INTEGER,
      frequency_per_week INTEGER,
      duration_weeks INTEGER,
      image_url TEXT,
      video_url TEXT,
      thumbnail_url TEXT,
      contraindications TEXT,
      precautions TEXT,
      common_errors TEXT,
      equipment_needed TEXT,
      requires_supervision BOOLEAN DEFAULT false,
      source VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      is_system BOOLEAN DEFAULT false,
      is_global BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      tags JSONB DEFAULT '[]',
      created_by UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Neurological Examinations tables (from migration 002_neurological_exam)
    // Simplified for PGlite (no generated columns, triggers, views, or functions)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS neurological_examinations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      patient_id UUID,
      encounter_id UUID,
      practitioner_id UUID,
      exam_date TIMESTAMP NOT NULL DEFAULT NOW(),
      exam_type VARCHAR(50) DEFAULT 'COMPREHENSIVE',
      test_results JSONB NOT NULL DEFAULT '{}',
      cluster_scores JSONB DEFAULT '{}',
      red_flags JSONB DEFAULT '[]',
      has_red_flags BOOLEAN DEFAULT false,
      bppv_diagnosis JSONB,
      narrative_text TEXT,
      narrative_generated_at TIMESTAMP,
      referral_recommended BOOLEAN DEFAULT false,
      referral_specialty VARCHAR(100),
      referral_urgency VARCHAR(20),
      referral_sent_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'IN_PROGRESS',
      completed_at TIMESTAMP,
      reviewed_by UUID,
      reviewed_at TIMESTAMP,
      version INTEGER DEFAULT 1,
      previous_version_id UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS neuro_exam_test_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      examination_id UUID,
      cluster_id VARCHAR(50) NOT NULL,
      test_id VARCHAR(100) NOT NULL,
      is_positive BOOLEAN NOT NULL,
      positive_criteria TEXT[],
      measured_value VARCHAR(100),
      side VARCHAR(10),
      is_red_flag BOOLEAN DEFAULT false,
      requires_referral BOOLEAN DEFAULT false,
      clinician_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS vestibular_findings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      examination_id UUID,
      spontaneous_nystagmus_present BOOLEAN,
      spontaneous_nystagmus_direction VARCHAR(20),
      spontaneous_nystagmus_velocity DECIMAL(5,2),
      fixation_suppression BOOLEAN,
      gaze_evoked_horizontal JSONB,
      gaze_evoked_vertical JSONB,
      rebound_nystagmus BOOLEAN,
      saccade_accuracy_horizontal VARCHAR(20),
      saccade_accuracy_vertical VARCHAR(20),
      saccade_latency_ms INTEGER,
      pursuit_gain_horizontal DECIMAL(3,2),
      pursuit_gain_vertical DECIMAL(3,2),
      saccadic_pursuit BOOLEAN,
      hit_right_positive BOOLEAN,
      hit_left_positive BOOLEAN,
      catch_up_saccades TEXT[],
      caloric_performed BOOLEAN DEFAULT false,
      caloric_unilateral_weakness DECIMAL(5,2),
      caloric_affected_side VARCHAR(10),
      caloric_directional_preponderance DECIMAL(5,2),
      dva_lines_lost INTEGER,
      dva_affected_side VARCHAR(10),
      hints_result VARCHAR(20),
      hints_hearing_loss_ipsilateral BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bppv_treatments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      examination_id UUID,
      patient_id UUID,
      practitioner_id UUID,
      canal_affected VARCHAR(30) NOT NULL,
      side_affected VARCHAR(10) NOT NULL,
      variant VARCHAR(30),
      treatment_maneuver VARCHAR(50) NOT NULL,
      repetitions INTEGER DEFAULT 1,
      treatment_date TIMESTAMP NOT NULL DEFAULT NOW(),
      pre_treatment_nystagmus BOOLEAN,
      post_treatment_nystagmus BOOLEAN,
      pre_treatment_vertigo_vas INTEGER,
      post_treatment_vertigo_vas INTEGER,
      immediate_resolution BOOLEAN,
      follow_up_required BOOLEAN DEFAULT true,
      follow_up_date DATE,
      home_exercises_prescribed BOOLEAN,
      brandt_daroff_prescribed BOOLEAN,
      sleeping_position_instructions TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Clinical Macros tables (used by macros.js service)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS clinical_macros (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      macro_name VARCHAR(255) NOT NULL,
      macro_text TEXT NOT NULL,
      shortcut_key VARCHAR(20),
      soap_section VARCHAR(20),
      is_favorite BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      usage_count INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_by UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_macro_favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      macro_id UUID,
      user_id UUID,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Appointment reminders (appointmentReminders.js + cron every 15min)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS appointment_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      appointment_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      reminder_type VARCHAR(20) NOT NULL DEFAULT 'SMS',
      channel VARCHAR(10),
      hours_before INTEGER,
      scheduled_send_at TIMESTAMP,
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'PENDING',
      failure_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // AI suggestions (promptBuilder.js INSERT, aiAnalytics.js SELECT/UPDATE)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_suggestions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      encounter_id UUID,
      patient_id UUID,
      provider_id UUID,
      suggestion_type VARCHAR(50) NOT NULL,
      soap_section VARCHAR(20),
      input_text TEXT,
      suggested_text TEXT NOT NULL,
      model_name VARCHAR(100),
      model_version VARCHAR(50),
      confidence_score DECIMAL(3,2),
      confidence_level VARCHAR(20),
      has_red_flags BOOLEAN DEFAULT false,
      red_flags JSONB,
      requires_review BOOLEAN DEFAULT true,
      feedback_status VARCHAR(30) DEFAULT 'PENDING',
      feedback_text TEXT,
      modified_text TEXT,
      feedback_at TIMESTAMP,
      feedback_by UUID,
      was_helpful BOOLEAN,
      helpfulness_rating INTEGER,
      time_saved_seconds INTEGER,
      accuracy_rating INTEGER,
      request_duration_ms INTEGER,
      tokens_used INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // AI performance metrics (aiAnalytics.js aggregation endpoint)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_performance_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      period_type VARCHAR(20) NOT NULL,
      model_name VARCHAR(100),
      total_suggestions INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      modified_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      pending_count INTEGER DEFAULT 0,
      avg_confidence_score DECIMAL(3,2),
      avg_helpfulness_rating DECIMAL(3,2),
      avg_accuracy_rating DECIMAL(3,2),
      avg_latency_ms NUMERIC,
      total_time_saved_minutes INTEGER DEFAULT 0,
      red_flags_detected INTEGER DEFAULT 0,
      red_flags_confirmed INTEGER DEFAULT 0,
      red_flags_false_positive INTEGER DEFAULT 0,
      metrics_by_model JSONB,
      metrics_by_type JSONB,
      metrics_by_provider JSONB,
      approval_rate DECIMAL(5,2),
      accuracy_rate DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // AI API usage tracking (budgetTracker.js INSERT, aiAnalytics.js SELECT)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_api_usage (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(20) NOT NULL DEFAULT 'claude',
      model VARCHAR(100) NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
      task_type VARCHAR(50),
      duration_ms INTEGER,
      organization_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Communication queue (automatedComms.js + cron every 30min)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS communication_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      patient_id UUID,
      type VARCHAR(20) NOT NULL DEFAULT 'SMS',
      content TEXT NOT NULL,
      subject TEXT,
      template_id UUID,
      trigger_type VARCHAR(50),
      scheduled_at TIMESTAMP DEFAULT NOW(),
      priority VARCHAR(20) DEFAULT 'normal',
      status VARCHAR(20) DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      processed_at TIMESTAMP,
      notes TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Scheduled communications (smartScheduler.js + cron every 30min)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS scheduled_communications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      communication_type VARCHAR(20) NOT NULL DEFAULT 'sms',
      template_id UUID,
      custom_message TEXT,
      scheduled_date DATE NOT NULL,
      scheduled_time TIME DEFAULT '10:00:00',
      trigger_type VARCHAR(50),
      trigger_appointment_id UUID,
      trigger_days_after INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      conflict_detected_at TIMESTAMP,
      conflict_appointment_id UUID,
      conflict_resolution VARCHAR(30),
      resolved_by UUID,
      resolved_at TIMESTAMP,
      sent_at TIMESTAMP,
      created_by UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Workflow scheduled actions (automations/engine.js + actionExecutor.js)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS workflow_scheduled_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_id UUID NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      action_config JSONB NOT NULL,
      scheduled_for TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      completed_at TIMESTAMP,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // Scheduler decisions (smartScheduler.js conflict resolution)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS scheduler_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      scheduled_communication_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      decision_type VARCHAR(30) NOT NULL,
      original_date DATE NOT NULL,
      suggested_new_date DATE,
      conflict_reason TEXT,
      new_appointment_date DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      decision VARCHAR(30),
      decided_by UUID,
      decided_at TIMESTAMP,
      decision_note TEXT,
      notified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      priority INTEGER DEFAULT 5
    )`,
    // =========================================================================
    // Patient communication preferences (reminder + comms processing)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS patient_communication_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL UNIQUE,
      organization_id UUID,
      sms_enabled BOOLEAN DEFAULT true,
      email_enabled BOOLEAN DEFAULT true,
      reminder_enabled BOOLEAN DEFAULT true,
      exercise_reminder_enabled BOOLEAN DEFAULT true,
      recall_enabled BOOLEAN DEFAULT true,
      marketing_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // AI feedback (aiLearning.js, aiRetraining.js, dataCuration.js — cron jobs)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      encounter_id UUID,
      user_id UUID,
      suggestion_type VARCHAR(50) NOT NULL,
      soap_section VARCHAR(20),
      original_suggestion TEXT NOT NULL,
      user_correction TEXT,
      accepted BOOLEAN NOT NULL DEFAULT false,
      correction_type VARCHAR(20),
      confidence_score DECIMAL(4,3),
      user_rating INTEGER,
      feedback_notes TEXT,
      template_id UUID,
      context_data JSONB,
      time_to_decision INTEGER,
      was_helpful BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Portal documents (documentDelivery.js, patientPortal.js — v2.1)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS portal_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      document_id UUID,
      title VARCHAR(255) NOT NULL,
      download_token VARCHAR(64) UNIQUE NOT NULL,
      token_expires_at TIMESTAMP NOT NULL,
      downloaded_at TIMESTAMP,
      created_by UUID,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Patient messages (patientPortal.js, portal.js — v2.1)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS patient_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      sender_type VARCHAR(20) NOT NULL,
      sender_id UUID,
      subject VARCHAR(255),
      body TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      parent_message_id UUID,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Portal booking requests (patientPortal.js — v2.1)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS portal_booking_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      preferred_date DATE,
      preferred_time_slot VARCHAR(20),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      handled_by UUID,
      appointment_id UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Patient Anamnesis (migration 039)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS anamnesis_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_code VARCHAR(50) UNIQUE NOT NULL,
      template_name VARCHAR(200) NOT NULL,
      specialty VARCHAR(100),
      sections JSONB NOT NULL,
      version INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patient_anamnesis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      encounter_id UUID,
      template_id UUID,
      completed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      chief_complaint TEXT NOT NULL,
      chief_complaint_duration VARCHAR(100),
      symptom_onset_date DATE,
      onset_type VARCHAR(50),
      pre_onset_illness_trauma TEXT,
      aggravating_factors TEXT[],
      relieving_factors TEXT[],
      time_of_day_worst VARCHAR(100),
      time_of_day_best VARCHAR(100),
      has_headache BOOLEAN DEFAULT false,
      headache_details TEXT,
      has_dizziness BOOLEAN DEFAULT false,
      dizziness_details TEXT,
      has_other_pain BOOLEAN DEFAULT false,
      other_pain_locations TEXT[],
      sensory_disturbances JSONB,
      motor_weakness JSONB,
      spasms_cramps JSONB,
      coordination_issues BOOLEAN DEFAULT false,
      coordination_details TEXT,
      energy_level INTEGER,
      sleep_quality INTEGER,
      sleep_issues TEXT,
      digestion_issues TEXT,
      weight_change VARCHAR(50),
      weight_change_amount_kg DECIMAL(5,2),
      previous_treatment TEXT,
      previous_treatment_effectiveness TEXT,
      medications TEXT[],
      radiological_findings TEXT,
      past_medical_history TEXT,
      past_surgeries TEXT,
      family_history TEXT,
      occupation VARCHAR(200),
      work_posture_description TEXT,
      work_hours_per_week INTEGER,
      exercise_frequency VARCHAR(100),
      exercise_types TEXT[],
      diet_description TEXT,
      ergonomic_issues TEXT,
      patient_concerns TEXT,
      treatment_goals TEXT,
      additional_information TEXT,
      intake_method VARCHAR(50) DEFAULT 'clinician_interview',
      completed_by UUID,
      review_status VARCHAR(50) DEFAULT 'pending',
      reviewed_by UUID,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // Tier 1 — Dialogue Messages to GP/Specialists (migration 042)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS dialogue_message_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_code VARCHAR(50) UNIQUE NOT NULL,
      template_name VARCHAR(200) NOT NULL,
      scenario VARCHAR(100) NOT NULL,
      urgency_level VARCHAR(20),
      subject_template TEXT NOT NULL,
      greeting_template TEXT NOT NULL,
      opening_template TEXT,
      anamnesis_section_template TEXT,
      examination_findings_template TEXT,
      treatment_plan_template TEXT,
      prognosis_template TEXT,
      request_or_recommendation_template TEXT,
      follow_up_template TEXT,
      closing_template TEXT NOT NULL,
      required_variables TEXT[],
      optional_variables TEXT[],
      clinical_indications TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patient_dialogue_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      encounter_id UUID,
      anamnesis_id UUID,
      template_id UUID,
      message_type VARCHAR(50) NOT NULL,
      recipient_name VARCHAR(200),
      recipient_specialty VARCHAR(100),
      recipient_organization VARCHAR(200),
      subject TEXT NOT NULL,
      message_body TEXT NOT NULL,
      diagnosis VARCHAR(200),
      red_flags_mentioned TEXT[],
      investigations_requested TEXT[],
      medications_requested TEXT[],
      status VARCHAR(50) DEFAULT 'draft',
      sent_via VARCHAR(50),
      sent_at TIMESTAMP,
      sent_by UUID,
      response_received BOOLEAN DEFAULT false,
      response_date TIMESTAMP,
      response_summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // =========================================================================
    // Tier 1 — Appointment Imports (migration 026)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS appointment_imports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      source VARCHAR(50) NOT NULL,
      import_date TIMESTAMPTZ DEFAULT NOW(),
      total_rows INT,
      appointments_created INT,
      appointments_updated INT,
      patients_created INT,
      errors INT,
      raw_data JSONB,
      error_log JSONB,
      imported_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — AI Daily Metrics / Model Versions / Retraining (migration 011/044)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_daily_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      date DATE NOT NULL,
      suggestion_type VARCHAR(50) NOT NULL,
      total_suggestions INTEGER DEFAULT 0,
      accepted_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      modified_count INTEGER DEFAULT 0,
      ignored_count INTEGER DEFAULT 0,
      avg_confidence DECIMAL(4,3),
      avg_rating DECIMAL(3,2),
      avg_decision_time_ms INTEGER,
      acceptance_rate DECIMAL(5,2),
      modification_rate DECIMAL(5,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(organization_id, date, suggestion_type)
    )`,
    `CREATE TABLE IF NOT EXISTS ai_model_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      model_name VARCHAR(100) NOT NULL,
      version VARCHAR(100) NOT NULL,
      base_model VARCHAR(100),
      training_data_hash VARCHAR(64),
      training_samples_count INTEGER,
      parameters JSONB,
      baseline_metrics JSONB,
      is_active BOOLEAN DEFAULT false,
      is_default BOOLEAN DEFAULT false,
      deployed_at TIMESTAMP WITH TIME ZONE,
      deployed_by UUID,
      retired_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS ai_retraining_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      trigger_type VARCHAR(50) NOT NULL,
      trigger_reason TEXT,
      suggestion_types_affected TEXT[],
      training_samples_count INTEGER,
      feedback_samples_used INTEGER,
      date_range_start TIMESTAMP WITH TIME ZONE,
      date_range_end TIMESTAMP WITH TIME ZONE,
      previous_model_version VARCHAR(100),
      new_model_version VARCHAR(100),
      model_version VARCHAR(100),
      previous_version VARCHAR(100),
      status VARCHAR(20) DEFAULT 'pending',
      test_results JSONB,
      error_message TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — AI Training Data Pipeline (migration 061)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_training_data (
      id SERIAL PRIMARY KEY,
      source VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      instruction TEXT NOT NULL,
      input TEXT,
      output TEXT NOT NULL,
      quality_score NUMERIC(3,2),
      approved BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — AI Learning Data / Model Registry (migration 033)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS ai_learning_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      encounter_id UUID,
      learning_type VARCHAR(50) NOT NULL,
      ai_suggestion JSONB,
      ai_model VARCHAR(100),
      ai_confidence DECIMAL(5,4),
      outcome_data JSONB NOT NULL,
      outcome_success BOOLEAN,
      vas_improvement INTEGER,
      treatment_effectiveness VARCHAR(20),
      practitioner_id UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS ai_model_registry (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      model_name VARCHAR(100) NOT NULL,
      model_version VARCHAR(50) NOT NULL,
      base_model VARCHAR(100),
      training_examples_count INTEGER,
      training_started_at TIMESTAMP,
      training_completed_at TIMESTAMP,
      training_duration_seconds INTEGER,
      validation_accuracy DECIMAL(5,4),
      test_accuracy DECIMAL(5,4),
      is_active BOOLEAN DEFAULT false,
      deployed_at TIMESTAMP,
      deprecated_at TIMESTAMP,
      model_path TEXT,
      model_size_bytes BIGINT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Clinical Encounter Versions (migration 013)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS clinical_encounter_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      encounter_id UUID NOT NULL,
      version_number INTEGER NOT NULL,
      patient_id UUID NOT NULL,
      practitioner_id UUID NOT NULL,
      encounter_date TIMESTAMP NOT NULL,
      subjective TEXT,
      objective TEXT,
      assessment TEXT,
      plan TEXT,
      evaluation TEXT,
      icpc_codes VARCHAR(10)[],
      icd10_codes VARCHAR(10)[],
      treatment_codes TEXT[],
      region_treated VARCHAR(100),
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      change_reason VARCHAR(255),
      change_type VARCHAR(50),
      is_signed BOOLEAN DEFAULT false,
      signed_at TIMESTAMP,
      signed_by UUID,
      previous_version_id UUID,
      changes_summary JSONB,
      UNIQUE(encounter_id, version_number)
    )`,
    // =========================================================================
    // Tier 1 — Clinical Note Amendments (migration 028)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS clinical_note_amendments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      note_id UUID NOT NULL,
      version INTEGER DEFAULT 1,
      amendment_text TEXT NOT NULL,
      reason VARCHAR(500),
      amended_by UUID,
      amended_at TIMESTAMP DEFAULT NOW(),
      amendment_hash VARCHAR(128),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Encounter Amendments (migration 017)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS encounter_amendments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      encounter_id UUID NOT NULL,
      organization_id UUID NOT NULL,
      author_id UUID NOT NULL,
      amendment_type VARCHAR(50) NOT NULL DEFAULT 'ADDENDUM',
      reason TEXT,
      content TEXT NOT NULL,
      affected_sections JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      signed_at TIMESTAMPTZ,
      signed_by UUID
    )`,
    // =========================================================================
    // Tier 1 — Encounter Anatomy Findings (migration 072)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS encounter_anatomy_findings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      encounter_id UUID NOT NULL,
      body_region VARCHAR(50) NOT NULL,
      finding_type VARCHAR(30) NOT NULL DEFAULT 'palpation',
      laterality VARCHAR(10) DEFAULT 'bilateral',
      severity VARCHAR(20) DEFAULT 'moderate',
      direction VARCHAR(20),
      note_text TEXT,
      is_positive BOOLEAN DEFAULT true,
      source VARCHAR(20) DEFAULT 'manual',
      confirmed BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Treatment Plans (migration 058)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS treatment_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      organization_id UUID NOT NULL,
      practitioner_id UUID NOT NULL,
      title VARCHAR(200) NOT NULL,
      condition_description TEXT,
      diagnosis_code VARCHAR(20),
      frequency VARCHAR(100),
      total_sessions INTEGER,
      completed_sessions INTEGER DEFAULT 0,
      start_date DATE NOT NULL,
      target_end_date DATE,
      goals JSONB DEFAULT '[]',
      status VARCHAR(20) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS treatment_plan_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id UUID NOT NULL,
      encounter_id UUID,
      session_number INTEGER NOT NULL,
      scheduled_date DATE,
      completed_date DATE,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS treatment_plan_milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id UUID NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      target_date DATE,
      outcome_measure VARCHAR(20),
      target_score NUMERIC(5,2),
      actual_score NUMERIC(5,2),
      status VARCHAR(20) DEFAULT 'pending',
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Letter Templates & Generation (migration 045)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS letter_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      template_type VARCHAR(50) NOT NULL,
      template_name VARCHAR(100) NOT NULL,
      template_name_en VARCHAR(100),
      template_content TEXT NOT NULL,
      variables JSONB DEFAULT '[]',
      language VARCHAR(5) DEFAULT 'NO',
      category VARCHAR(50),
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      is_system BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,
      last_used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID
    )`,
    `CREATE TABLE IF NOT EXISTS generated_letters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      patient_id UUID NOT NULL,
      encounter_id UUID,
      letter_type VARCHAR(50) NOT NULL,
      letter_title VARCHAR(200),
      content TEXT NOT NULL,
      template_id UUID,
      metadata JSONB DEFAULT '{}',
      recipient_name VARCHAR(200),
      recipient_institution VARCHAR(200),
      recipient_address TEXT,
      status VARCHAR(20) DEFAULT 'DRAFT',
      sent_at TIMESTAMP WITH TIME ZONE,
      sent_method VARCHAR(50),
      signed_at TIMESTAMP WITH TIME ZONE,
      signed_by UUID,
      signature_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID
    )`,
    `CREATE TABLE IF NOT EXISTS letter_variable_definitions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      variable_name VARCHAR(50) NOT NULL UNIQUE,
      variable_label_no VARCHAR(100) NOT NULL,
      variable_label_en VARCHAR(100),
      description TEXT,
      data_type VARCHAR(20) DEFAULT 'TEXT',
      default_value TEXT,
      is_system BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Exercise Programs & Prescriptions (migration 023)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS exercise_programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      name_no TEXT NOT NULL,
      name_en TEXT,
      description_no TEXT,
      description_en TEXT,
      target_condition VARCHAR(100),
      body_region VARCHAR(50),
      difficulty VARCHAR(20) DEFAULT 'beginner',
      exercises JSONB NOT NULL DEFAULT '[]',
      duration_weeks INTEGER DEFAULT 6,
      phases INTEGER DEFAULT 1,
      is_template BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      is_global BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS patient_exercise_programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      patient_id UUID NOT NULL,
      program_id UUID,
      encounter_id UUID,
      prescribed_by UUID,
      program_name TEXT NOT NULL,
      program_description TEXT,
      custom_exercises JSONB,
      custom_duration_weeks INTEGER,
      status VARCHAR(20) DEFAULT 'active',
      current_phase INTEGER DEFAULT 1,
      start_date DATE DEFAULT CURRENT_DATE,
      end_date DATE,
      overall_compliance_percent DECIMAL(5,2),
      last_activity_date DATE,
      clinician_notes TEXT,
      patient_feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS patient_exercise_prescriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      patient_id UUID NOT NULL,
      encounter_id UUID,
      prescribed_by UUID,
      exercise_id UUID,
      exercise_code VARCHAR(50) NOT NULL,
      exercise_name TEXT NOT NULL,
      exercise_instructions TEXT,
      sets INTEGER,
      reps INTEGER,
      hold_seconds INTEGER,
      rest_seconds INTEGER,
      frequency VARCHAR(50) DEFAULT 'daily',
      duration_weeks INTEGER DEFAULT 6,
      custom_instructions TEXT,
      progression_notes TEXT,
      start_date DATE DEFAULT CURRENT_DATE,
      end_date DATE,
      specific_days TEXT[],
      status VARCHAR(20) DEFAULT 'active',
      discontinue_reason TEXT,
      discontinued_at TIMESTAMPTZ,
      discontinued_by UUID,
      compliance_log JSONB DEFAULT '{}',
      patient_rating INTEGER,
      patient_feedback TEXT,
      clinician_rating INTEGER,
      clinician_notes TEXT,
      reminder_enabled BOOLEAN DEFAULT false,
      reminder_time TIME,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS exercise_favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      exercise_id UUID NOT NULL,
      organization_id UUID,
      usage_count INTEGER DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS patient_exercise_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id UUID,
      patient_id UUID,
      exercise_name VARCHAR(100) NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW(),
      sets_completed INTEGER,
      reps_completed INTEGER,
      duration_minutes INTEGER,
      difficulty_rating INTEGER,
      pain_during INTEGER,
      pain_after INTEGER,
      notes TEXT,
      performed_at VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // =========================================================================
    // Tier 1 — Questionnaires & Responses (migration 034)
    // =========================================================================
    `CREATE TABLE IF NOT EXISTS questionnaires (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      full_name TEXT,
      description TEXT,
      language VARCHAR(10) DEFAULT 'NO',
      version VARCHAR(20),
      questions JSONB NOT NULL,
      scoring_method VARCHAR(50),
      min_score DECIMAL(5,2),
      max_score DECIMAL(5,2),
      score_interpretation JSONB,
      target_body_region VARCHAR(100),
      estimated_minutes INTEGER DEFAULT 5,
      indicated_for TEXT[],
      clinical_cutoff_scores JSONB,
      psychometric_properties JSONB,
      reference_citation TEXT,
      educational_link VARCHAR(500),
      is_system BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS questionnaire_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      patient_id UUID,
      encounter_id UUID,
      questionnaire_id UUID,
      responses JSONB NOT NULL,
      total_score DECIMAL(5,2),
      percentage_score DECIMAL(5,2),
      severity_level VARCHAR(50),
      previous_score DECIMAL(5,2),
      score_change DECIMAL(5,2),
      change_percentage DECIMAL(5,2),
      clinically_significant_change BOOLEAN DEFAULT false,
      administered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      administered_by UUID,
      completion_time_seconds INTEGER,
      days_since_onset INTEGER,
      treatment_phase VARCHAR(50),
      clinician_notes TEXT,
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
    // Appointment reminders
    `CREATE INDEX IF NOT EXISTS idx_reminders_org ON appointment_reminders (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled ON appointment_reminders (status, scheduled_send_at)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_apt_hours ON appointment_reminders (appointment_id, hours_before)`,
    // AI suggestions
    `CREATE INDEX IF NOT EXISTS idx_ai_suggestions_org_type ON ai_suggestions (organization_id, suggestion_type)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_suggestions_model ON ai_suggestions (model_name, feedback_status)`,
    // AI API usage
    `CREATE INDEX IF NOT EXISTS idx_ai_api_usage_provider ON ai_api_usage (provider)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_api_usage_org ON ai_api_usage (organization_id)`,
    // Communication queue
    `CREATE INDEX IF NOT EXISTS idx_comm_queue_status ON communication_queue (status, scheduled_at)`,
    // Scheduled communications
    `CREATE INDEX IF NOT EXISTS idx_sched_comms_org_status ON scheduled_communications (organization_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_sched_comms_date ON scheduled_communications (scheduled_date)`,
    // Workflow scheduled actions
    `CREATE INDEX IF NOT EXISTS idx_sched_actions_time ON workflow_scheduled_actions (scheduled_for)`,
    // AI feedback
    `CREATE INDEX IF NOT EXISTS idx_ai_feedback_encounter ON ai_feedback (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback (suggestion_type)`,
    // Portal documents
    `CREATE INDEX IF NOT EXISTS idx_portal_docs_org ON portal_documents (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_portal_docs_patient ON portal_documents (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_portal_docs_token ON portal_documents (download_token)`,
    // Patient messages
    `CREATE INDEX IF NOT EXISTS idx_messages_org ON patient_messages (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_patient ON patient_messages (patient_id)`,
    // Portal booking requests
    `CREATE INDEX IF NOT EXISTS idx_booking_req_org ON portal_booking_requests (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_booking_req_patient ON portal_booking_requests (patient_id)`,
    // --- Tier 1 Indexes ---
    // Patient anamnesis
    `CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_patient ON patient_anamnesis (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_encounter ON patient_anamnesis (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_date ON patient_anamnesis (completed_date)`,
    // Dialogue messages
    `CREATE INDEX IF NOT EXISTS idx_dialogue_messages_patient ON patient_dialogue_messages (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dialogue_messages_encounter ON patient_dialogue_messages (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dialogue_messages_type ON patient_dialogue_messages (message_type)`,
    `CREATE INDEX IF NOT EXISTS idx_dialogue_messages_status ON patient_dialogue_messages (status)`,
    // Appointment imports
    `CREATE INDEX IF NOT EXISTS idx_appt_imports_org ON appointment_imports (organization_id)`,
    // AI daily metrics
    `CREATE INDEX IF NOT EXISTS idx_ai_metrics_org_date ON ai_daily_metrics (organization_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_metrics_type ON ai_daily_metrics (suggestion_type)`,
    // AI model versions
    `CREATE INDEX IF NOT EXISTS idx_model_versions_org ON ai_model_versions (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_model_versions_active ON ai_model_versions (is_active)`,
    // AI retraining events
    `CREATE INDEX IF NOT EXISTS idx_retraining_org ON ai_retraining_events (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_retraining_status ON ai_retraining_events (status)`,
    `CREATE INDEX IF NOT EXISTS idx_retraining_created ON ai_retraining_events (created_at)`,
    // AI training data
    `CREATE INDEX IF NOT EXISTS idx_training_data_source ON ai_training_data (source)`,
    `CREATE INDEX IF NOT EXISTS idx_training_data_category ON ai_training_data (category)`,
    `CREATE INDEX IF NOT EXISTS idx_training_data_approved ON ai_training_data (approved)`,
    // AI learning data
    `CREATE INDEX IF NOT EXISTS idx_ai_learning_org ON ai_learning_data (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_learning_type ON ai_learning_data (learning_type)`,
    // AI model registry
    `CREATE INDEX IF NOT EXISTS idx_ai_models_org ON ai_model_registry (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_model_registry (is_active)`,
    // Clinical encounter versions
    `CREATE INDEX IF NOT EXISTS idx_encounter_versions_encounter ON clinical_encounter_versions (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_encounter_versions_created ON clinical_encounter_versions (created_at)`,
    // Clinical note amendments
    `CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_org ON clinical_note_amendments (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_note ON clinical_note_amendments (note_id)`,
    // Encounter amendments
    `CREATE INDEX IF NOT EXISTS idx_amendments_encounter_id ON encounter_amendments (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_amendments_organization_id ON encounter_amendments (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_amendments_created_at ON encounter_amendments (created_at)`,
    // Encounter anatomy findings
    `CREATE INDEX IF NOT EXISTS idx_eaf_encounter_id ON encounter_anatomy_findings (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_eaf_body_region ON encounter_anatomy_findings (body_region)`,
    // Treatment plans
    `CREATE INDEX IF NOT EXISTS idx_tp_patient ON treatment_plans (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tp_org ON treatment_plans (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tp_status ON treatment_plans (status)`,
    `CREATE INDEX IF NOT EXISTS idx_tps_plan ON treatment_plan_sessions (plan_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tpm_plan ON treatment_plan_milestones (plan_id)`,
    // Letter templates
    `CREATE INDEX IF NOT EXISTS idx_letter_templates_org_type ON letter_templates (organization_id, template_type)`,
    `CREATE INDEX IF NOT EXISTS idx_letter_templates_active ON letter_templates (is_active)`,
    // Generated letters
    `CREATE INDEX IF NOT EXISTS idx_generated_letters_org ON generated_letters (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_generated_letters_patient ON generated_letters (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_generated_letters_type ON generated_letters (letter_type)`,
    `CREATE INDEX IF NOT EXISTS idx_generated_letters_status ON generated_letters (status)`,
    // Exercise programs
    `CREATE INDEX IF NOT EXISTS idx_exercise_programs_org ON exercise_programs (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_programs_condition ON exercise_programs (target_condition)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_programs_region ON exercise_programs (body_region)`,
    // Patient exercise programs
    `CREATE INDEX IF NOT EXISTS idx_patient_programs_org ON patient_exercise_programs (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_programs_patient ON patient_exercise_programs (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_programs_status ON patient_exercise_programs (status)`,
    // Patient exercise prescriptions
    `CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_org ON patient_exercise_prescriptions (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_patient ON patient_exercise_prescriptions (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_status ON patient_exercise_prescriptions (status)`,
    // Questionnaires
    `CREATE INDEX IF NOT EXISTS idx_questionnaires_code ON questionnaires (code)`,
    `CREATE INDEX IF NOT EXISTS idx_questionnaires_org ON questionnaires (organization_id)`,
    // Questionnaire responses
    `CREATE INDEX IF NOT EXISTS idx_responses_patient ON questionnaire_responses (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_responses_encounter ON questionnaire_responses (encounter_id)`,
    `CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON questionnaire_responses (questionnaire_id)`,
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
