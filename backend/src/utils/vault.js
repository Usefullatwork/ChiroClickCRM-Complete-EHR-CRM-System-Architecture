/**
 * Secrets Manager
 * Desktop standalone mode: reads secrets from environment variables
 * Falls back gracefully when secrets are not configured
 */

import logger from './logger.js';

class SecretsManager {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    logger.info('Using environment variables for secrets (standalone desktop mode)');
  }

  /**
   * Get a secret from environment variables
   */
  async get(key, envFallback = null) {
    await this.ensureInitialized();

    const envKeyMap = {
      'encryption_key': 'ENCRYPTION_KEY',
      'jwt_secret': 'JWT_SECRET',
      'database_password': 'DB_PASSWORD',
      'telnyx_api_key': 'TELNYX_API_KEY',
      'helseid_client_secret': 'HELSEID_CLIENT_SECRET',
      'backup_encryption_key': 'BACKUP_ENCRYPTION_KEY'
    };

    const envKey = envKeyMap[key] || envFallback || key.toUpperCase();
    const envValue = process.env[envKey];

    if (!envValue) {
      throw new Error(`Secret '${key}' not found in environment`);
    }

    return envValue;
  }

  /**
   * Get all application secrets
   */
  async getAll() {
    await this.ensureInitialized();
    return {
      encryption_key: process.env.ENCRYPTION_KEY,
      jwt_secret: process.env.JWT_SECRET,
      database_password: process.env.DB_PASSWORD,
    };
  }

  /**
   * Encrypt data using local encryption
   */
  async encryptData(data) {
    const { encrypt } = await import('./encryption.js');
    return encrypt(data);
  }

  /**
   * Decrypt data using local encryption
   */
  async decryptData(ciphertext) {
    const { decrypt } = await import('./encryption.js');
    return decrypt(ciphertext);
  }

  /**
   * Get database credentials from environment
   */
  async getDatabaseCredentials() {
    return {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME
    };
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return { healthy: true, mode: 'environment' };
  }
}

// Export singleton instance
export const secrets = new SecretsManager();

export default secrets;
