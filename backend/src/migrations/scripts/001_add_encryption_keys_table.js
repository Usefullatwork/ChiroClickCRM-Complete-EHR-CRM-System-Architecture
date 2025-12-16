/**
 * Migration: Add encryption_keys table
 * Supports key rotation for GDPR compliance
 */

export const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS encryption_keys (
      id SERIAL PRIMARY KEY,
      key_version INTEGER UNIQUE NOT NULL,
      encrypted_key TEXT NOT NULL,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      rotated_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_encryption_keys_active
    ON encryption_keys(is_active) WHERE is_active = true;

    CREATE INDEX IF NOT EXISTS idx_encryption_keys_version
    ON encryption_keys(key_version);

    COMMENT ON TABLE encryption_keys IS 'Stores versioned encryption keys for GDPR-compliant key rotation';
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS encryption_keys;
  `);
};
