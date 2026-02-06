/**
 * Secrets Management - Environment Variables
 * Desktop standalone mode: reads all secrets from .env
 * Future SaaS mode can swap this for Vault/AWS/Azure
 */

let secretsCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get secret from environment variables
 */
const getFromEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} not found`);
  }
  return value;
};

/**
 * Main function to get secrets
 * @param {string} path - Secret key name (maps to env var)
 * @param {Object} options - Options
 * @returns {Promise<any>} Secret value
 */
export const getSecret = async (path, options = {}) => {
  const { useCache = true, cacheTTL = CACHE_TTL } = options;

  // Check cache first
  if (useCache && secretsCache.has(path)) {
    const cached = secretsCache.get(path);
    if (Date.now() - cached.timestamp < cacheTTL) {
      return cached.value;
    }
    secretsCache.delete(path);
  }

  const secretValue = getFromEnv(path);

  // Cache the secret
  if (useCache) {
    secretsCache.set(path, {
      value: secretValue,
      timestamp: Date.now()
    });
  }

  return secretValue;
};

/**
 * Get encryption key for database fields
 */
export const getEncryptionKey = async () => {
  return process.env.ENCRYPTION_KEY;
};

/**
 * Get database credentials
 */
export const getDatabaseCredentials = async () => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'chiroclickcrm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };
};

/**
 * Get JWT secrets
 */
export const getJWTSecrets = async () => {
  return {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  };
};

/**
 * Get external API keys
 */
export const getAPIKeys = async (service) => {
  const key = process.env[`${service.toUpperCase()}_API_KEY`];
  return key ? { apiKey: key } : null;
};

/**
 * Clear secrets cache
 */
export const clearSecretsCache = () => {
  secretsCache.clear();
};

/**
 * Rotate secrets (no-op in env mode)
 */
export const rotateSecrets = async () => {
  clearSecretsCache();
};

/**
 * Health check
 */
export const healthCheck = async () => {
  return { healthy: true, provider: 'env' };
};

/**
 * Initialize secrets on startup
 */
export const initializeSecrets = async () => {
  // Nothing to initialize in env mode
};

export default {
  getSecret,
  getEncryptionKey,
  getDatabaseCredentials,
  getJWTSecrets,
  getAPIKeys,
  clearSecretsCache,
  rotateSecrets,
  healthCheck,
  initializeSecrets
};
