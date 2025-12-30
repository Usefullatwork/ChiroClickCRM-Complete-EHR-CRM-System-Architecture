/**
 * Migration: Add performance indexes for audit_logs
 * Improves query performance for GDPR compliance reporting
 */

export const up = async (client) => {
  await client.query(`
    -- Index for querying by user
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id);

    -- Index for querying by timestamp range
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
    ON audit_logs(timestamp DESC);

    -- Index for querying by resource type
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type
    ON audit_logs(resource_type);

    -- Composite index for common GDPR report queries
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp
    ON audit_logs(user_id, timestamp DESC);

    -- Index for patient data access queries
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id
    ON audit_logs(resource_id) WHERE resource_type = 'patient';
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP INDEX IF EXISTS idx_audit_logs_user_id;
    DROP INDEX IF EXISTS idx_audit_logs_timestamp;
    DROP INDEX IF EXISTS idx_audit_logs_resource_type;
    DROP INDEX IF EXISTS idx_audit_logs_user_timestamp;
    DROP INDEX IF EXISTS idx_audit_logs_resource_id;
  `);
};
