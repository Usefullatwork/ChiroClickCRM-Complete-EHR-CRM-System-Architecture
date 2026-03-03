-- Migration: 071_audit_archive_manifest
-- Tracks audit log archival runs for compliance auditing
-- Norwegian healthcare law requires 10-year retention of audit logs.
-- This table records each archival run so we can prove chain-of-custody
-- and locate archived data when needed for audits or legal requests.

CREATE TABLE IF NOT EXISTS audit_archive_manifest (
  id SERIAL PRIMARY KEY,
  archive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  rows_archived INTEGER NOT NULL DEFAULT 0,
  oldest_record_date TIMESTAMP WITH TIME ZONE,
  newest_record_date TIMESTAMP WITH TIME ZONE,
  encrypted BOOLEAN DEFAULT false,
  checksum VARCHAR(64), -- SHA-256 of archive file
  archived_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_archive_manifest_date
  ON audit_archive_manifest(archive_date DESC);

COMMENT ON TABLE audit_archive_manifest IS 'Tracks audit log archival runs for GDPR/Norwegian healthcare compliance';
COMMENT ON COLUMN audit_archive_manifest.checksum IS 'SHA-256 hash of the archive file for integrity verification';
COMMENT ON COLUMN audit_archive_manifest.encrypted IS 'Whether the archive file is AES-256-CBC encrypted';
