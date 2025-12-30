/**
 * Secure Key Management using Hashicorp Vault or AWS Secrets Manager
 * CRITICAL: Prevents encryption keys from being stored in .env files
 *
 * Supports:
 * - Hashicorp Vault (recommended for on-premise/hybrid)
 * - AWS Secrets Manager (if using AWS)
 * - Azure Key Vault (if using Azure)
 * - Fallback to environment variables (ONLY for development)
 */

import Vault from 'node-vault';

const SECRET_PROVIDER = process.env.SECRET_PROVIDER || 'vault'; // 'vault', 'aws', 'azure', 'env'

let secretsCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Initialize Vault client
 */
let vaultClient = null;
if (SECRET_PROVIDER === 'vault') {
  vaultClient = Vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN
  });
}

/**
 * AWS Secrets Manager client (lazy loaded)
 */
let awsSecretsClient = null;
const getAWSSecretsClient = async () => {
  if (!awsSecretsClient && SECRET_PROVIDER === 'aws') {
    const { SecretsManagerClient } = await import('@aws-sdk/client-secrets-manager');
    awsSecretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'eu-north-1'
    });
  }
  return awsSecretsClient;
};

/**
 * Azure Key Vault client (lazy loaded)
 */
let azureKeyVaultClient = null;
const getAzureKeyVaultClient = async () => {
  if (!azureKeyVaultClient && SECRET_PROVIDER === 'azure') {
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');

    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    const credential = new DefaultAzureCredential();
    azureKeyVaultClient = new SecretClient(vaultUrl, credential);
  }
  return azureKeyVaultClient;
};

/**
 * Get secret from Hashicorp Vault
 */
const getFromVault = async (path) => {
  try {
    const result = await vaultClient.read(path);
    return result.data.data || result.data;
  } catch (error) {
    console.error('Vault error:', error.message);
    throw new Error(`Failed to read secret from Vault: ${path}`);
  }
};

/**
 * Get secret from AWS Secrets Manager
 */
const getFromAWS = async (secretName) => {
  try {
    const { GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = await getAWSSecretsClient();

    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('AWS Secrets Manager error:', error.message);
    throw new Error(`Failed to read secret from AWS: ${secretName}`);
  }
};

/**
 * Get secret from Azure Key Vault
 */
const getFromAzure = async (secretName) => {
  try {
    const client = await getAzureKeyVaultClient();
    const secret = await client.getSecret(secretName);

    // Azure stores as string, try to parse as JSON
    try {
      return JSON.parse(secret.value);
    } catch {
      return secret.value;
    }
  } catch (error) {
    console.error('Azure Key Vault error:', error.message);
    throw new Error(`Failed to read secret from Azure: ${secretName}`);
  }
};

/**
 * Fallback to environment variables (development only)
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
 * @param {string} path - Secret path/name
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

  let secretValue;

  try {
    switch (SECRET_PROVIDER) {
      case 'vault':
        secretValue = await getFromVault(path);
        break;

      case 'aws':
        secretValue = await getFromAWS(path);
        break;

      case 'azure':
        secretValue = await getFromAzure(path);
        break;

      case 'env':
        console.warn('⚠️  WARNING: Using environment variables for secrets. NOT recommended for production!');
        secretValue = getFromEnv(path);
        break;

      default:
        throw new Error(`Unknown secret provider: ${SECRET_PROVIDER}`);
    }

    // Cache the secret
    if (useCache) {
      secretsCache.set(path, {
        value: secretValue,
        timestamp: Date.now()
      });
    }

    return secretValue;
  } catch (error) {
    console.error(`Failed to get secret: ${path}`, error);

    // If production, fail hard. If development, try env fallback
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn(`Falling back to environment variable for: ${path}`);
      return getFromEnv(path);
    }
  }
};

/**
 * Get encryption key for database fields
 */
export const getEncryptionKey = async () => {
  const secrets = await getSecret('secret/data/chiroclickcrm');
  return secrets.encryption_key || secrets.ENCRYPTION_KEY;
};

/**
 * Get database credentials
 */
export const getDatabaseCredentials = async () => {
  const secrets = await getSecret('secret/data/chiroclickcrm/database');
  return {
    host: secrets.host || secrets.DB_HOST,
    port: secrets.port || secrets.DB_PORT || 5432,
    database: secrets.database || secrets.DB_NAME,
    user: secrets.user || secrets.DB_USER,
    password: secrets.password || secrets.DB_PASSWORD
  };
};

/**
 * Get JWT secrets
 */
export const getJWTSecrets = async () => {
  const secrets = await getSecret('secret/data/chiroclickcrm/jwt');
  return {
    accessTokenSecret: secrets.access_token_secret || secrets.JWT_ACCESS_SECRET,
    refreshTokenSecret: secrets.refresh_token_secret || secrets.JWT_REFRESH_SECRET,
    expiresIn: secrets.expires_in || '15m',
    refreshExpiresIn: secrets.refresh_expires_in || '7d'
  };
};

/**
 * Get external API keys
 */
export const getAPIKeys = async (service) => {
  const secrets = await getSecret(`secret/data/chiroclickcrm/api/${service}`);
  return secrets;
};

/**
 * Clear secrets cache (useful for rotation)
 */
export const clearSecretsCache = () => {
  secretsCache.clear();
  console.log('✅ Secrets cache cleared');
};

/**
 * Rotate secrets (for scheduled rotation)
 */
export const rotateSecrets = async () => {
  console.log('🔄 Rotating secrets...');
  clearSecretsCache();

  // Pre-fetch critical secrets to warm cache
  try {
    await getEncryptionKey();
    await getDatabaseCredentials();
    await getJWTSecrets();
    console.log('✅ Secrets rotated successfully');
  } catch (error) {
    console.error('❌ Secret rotation failed:', error);
    throw error;
  }
};

/**
 * Health check for secret provider
 */
export const healthCheck = async () => {
  try {
    switch (SECRET_PROVIDER) {
      case 'vault':
        await vaultClient.health();
        break;

      case 'aws':
        const client = await getAWSSecretsClient();
        // AWS doesn't have a health check, so we just verify client exists
        if (!client) throw new Error('AWS client not initialized');
        break;

      case 'azure':
        const azClient = await getAzureKeyVaultClient();
        if (!azClient) throw new Error('Azure client not initialized');
        break;

      case 'env':
        // Always healthy if using env
        break;
    }

    return {
      healthy: true,
      provider: SECRET_PROVIDER
    };
  } catch (error) {
    return {
      healthy: false,
      provider: SECRET_PROVIDER,
      error: error.message
    };
  }
};

/**
 * Initialize secrets on startup
 */
export const initializeSecrets = async () => {
  console.log(`🔐 Initializing secrets from: ${SECRET_PROVIDER}`);

  if (process.env.NODE_ENV === 'production' && SECRET_PROVIDER === 'env') {
    console.error('❌ CRITICAL: Using environment variables in production is NOT secure!');
    console.error('   Please configure Vault, AWS Secrets Manager, or Azure Key Vault');
    process.exit(1);
  }

  const health = await healthCheck();
  if (!health.healthy) {
    console.error(`❌ Secret provider health check failed: ${health.error}`);
    throw new Error('Secret provider not available');
  }

  console.log(`✅ Secrets initialized from ${SECRET_PROVIDER}`);
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
