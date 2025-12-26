/**
 * HashiCorp Vault Integration
 * Secure secrets management for production environments
 * Replaces .env-based secrets storage for sensitive data
 */

import logger from './logger.js';

// ============================================================================
// VAULT CLIENT CONFIGURATION
// ============================================================================

class VaultClient {
    constructor(options = {}) {
        this.endpoint = options.endpoint || process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
        this.token = options.token || process.env.VAULT_TOKEN;
        this.namespace = options.namespace || process.env.VAULT_NAMESPACE;
        this.secretsPath = options.secretsPath || 'secret/data/chiroclickcrm';
        this.kvVersion = options.kvVersion || 2; // KV secrets engine version

        // Cache for secrets (with TTL)
        this.cache = new Map();
        this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes default

        // Retry configuration
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;

        // Connection status
        this.isConnected = false;
        this.lastHealthCheck = null;
    }

    /**
     * Make authenticated request to Vault API
     */
    async request(method, path, body = null) {
        const url = `${this.endpoint}/v1${path}`;
        const headers = {
            'X-Vault-Token': this.token,
            'Content-Type': 'application/json'
        };

        if (this.namespace) {
            headers['X-Vault-Namespace'] = this.namespace;
        }

        const options = {
            method,
            headers,
            ...(body && { body: JSON.stringify(body) })
        };

        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Vault API error: ${response.status} - ${errorBody}`);
                }

                return await response.json();
            } catch (error) {
                lastError = error;
                logger.warn(`Vault request attempt ${attempt} failed`, {
                    path,
                    error: error.message
                });

                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep helper for retries
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check - verify Vault connectivity
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.endpoint}/v1/sys/health`, {
                method: 'GET',
                headers: { 'X-Vault-Token': this.token }
            });

            const health = await response.json();
            this.isConnected = !health.sealed && health.initialized;
            this.lastHealthCheck = new Date();

            return {
                healthy: this.isConnected,
                sealed: health.sealed,
                initialized: health.initialized,
                version: health.version,
                clusterName: health.cluster_name
            };
        } catch (error) {
            this.isConnected = false;
            logger.error('Vault health check failed', { error: error.message });
            return { healthy: false, error: error.message };
        }
    }

    /**
     * Read secret from Vault
     * @param {string} key - Secret key within the secrets path
     * @param {boolean} useCache - Whether to use cached value
     */
    async getSecret(key, useCache = true) {
        const cacheKey = `${this.secretsPath}/${key}`;

        // Check cache first
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.value;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const path = this.kvVersion === 2
                ? `${this.secretsPath}`
                : this.secretsPath.replace('/data/', '/');

            const response = await this.request('GET', path);

            // KV v2 has data nested under data.data
            const secretData = this.kvVersion === 2
                ? response.data?.data
                : response.data;

            if (!secretData || !(key in secretData)) {
                throw new Error(`Secret key '${key}' not found`);
            }

            const value = secretData[key];

            // Cache the result
            this.cache.set(cacheKey, { value, timestamp: Date.now() });

            return value;
        } catch (error) {
            logger.error('Failed to read secret from Vault', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Read all secrets from the configured path
     */
    async getAllSecrets(useCache = true) {
        const cacheKey = this.secretsPath;

        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.value;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const response = await this.request('GET', this.secretsPath);
            const secretData = this.kvVersion === 2
                ? response.data?.data
                : response.data;

            this.cache.set(cacheKey, { value: secretData, timestamp: Date.now() });

            return secretData;
        } catch (error) {
            logger.error('Failed to read secrets from Vault', { error: error.message });
            throw error;
        }
    }

    /**
     * Write secret to Vault
     * @param {string} key - Secret key
     * @param {any} value - Secret value
     */
    async setSecret(key, value) {
        try {
            // First read existing secrets
            let existingSecrets = {};
            try {
                existingSecrets = await this.getAllSecrets(false);
            } catch (e) {
                // Path might not exist yet
            }

            const updatedSecrets = { ...existingSecrets, [key]: value };

            const body = this.kvVersion === 2
                ? { data: updatedSecrets }
                : updatedSecrets;

            await this.request('POST', this.secretsPath, body);

            // Invalidate cache
            this.cache.delete(this.secretsPath);
            this.cache.delete(`${this.secretsPath}/${key}`);

            logger.info('Secret written to Vault', { key });
        } catch (error) {
            logger.error('Failed to write secret to Vault', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Delete a secret from Vault
     */
    async deleteSecret(key) {
        try {
            // Read, remove key, write back
            const secrets = await this.getAllSecrets(false);
            delete secrets[key];

            const body = this.kvVersion === 2
                ? { data: secrets }
                : secrets;

            await this.request('POST', this.secretsPath, body);

            // Invalidate cache
            this.cache.delete(this.secretsPath);
            this.cache.delete(`${this.secretsPath}/${key}`);

            logger.info('Secret deleted from Vault', { key });
        } catch (error) {
            logger.error('Failed to delete secret from Vault', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Generate dynamic database credentials
     * Requires Vault database secrets engine configured
     */
    async getDatabaseCredentials(role = 'chiroclickcrm-app') {
        try {
            const response = await this.request('GET', `/database/creds/${role}`);

            return {
                username: response.data.username,
                password: response.data.password,
                leaseDuration: response.lease_duration,
                leaseId: response.lease_id
            };
        } catch (error) {
            logger.error('Failed to get database credentials', { role, error: error.message });
            throw error;
        }
    }

    /**
     * Renew lease for dynamic credentials
     */
    async renewLease(leaseId, increment = 3600) {
        try {
            const response = await this.request('POST', '/sys/leases/renew', {
                lease_id: leaseId,
                increment
            });

            return {
                leaseId: response.lease_id,
                leaseDuration: response.lease_duration
            };
        } catch (error) {
            logger.error('Failed to renew lease', { leaseId, error: error.message });
            throw error;
        }
    }

    /**
     * Transit encryption - encrypt data using Vault's transit engine
     */
    async encrypt(keyName, plaintext) {
        try {
            const response = await this.request('POST', `/transit/encrypt/${keyName}`, {
                plaintext: Buffer.from(plaintext).toString('base64')
            });

            return response.data.ciphertext;
        } catch (error) {
            logger.error('Transit encryption failed', { keyName, error: error.message });
            throw error;
        }
    }

    /**
     * Transit decryption
     */
    async decrypt(keyName, ciphertext) {
        try {
            const response = await this.request('POST', `/transit/decrypt/${keyName}`, {
                ciphertext
            });

            return Buffer.from(response.data.plaintext, 'base64').toString();
        } catch (error) {
            logger.error('Transit decryption failed', { keyName, error: error.message });
            throw error;
        }
    }

    /**
     * Clear the secrets cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('Vault secrets cache cleared');
    }
}

// ============================================================================
// SECRETS MANAGER - FALLBACK TO ENV IF VAULT UNAVAILABLE
// ============================================================================

class SecretsManager {
    constructor() {
        this.vaultClient = null;
        this.useVault = process.env.USE_VAULT === 'true' || process.env.NODE_ENV === 'production';
        this.initialized = false;
    }

    /**
     * Initialize the secrets manager
     */
    async initialize() {
        if (this.initialized) return;

        if (this.useVault) {
            try {
                this.vaultClient = new VaultClient();
                const health = await this.vaultClient.healthCheck();

                if (health.healthy) {
                    logger.info('✓ Vault connection established', { version: health.version });
                    this.initialized = true;
                    return;
                } else {
                    logger.warn('Vault not healthy, falling back to environment variables', health);
                }
            } catch (error) {
                logger.warn('Vault initialization failed, falling back to environment variables', {
                    error: error.message
                });
            }
        }

        // Fallback mode
        this.vaultClient = null;
        this.initialized = true;
        logger.info('Using environment variables for secrets (development mode)');
    }

    /**
     * Get a secret - from Vault or environment
     */
    async get(key, envFallback = null) {
        await this.ensureInitialized();

        // Map common secret keys to their environment variable names
        const envKeyMap = {
            'encryption_key': 'ENCRYPTION_KEY',
            'jwt_secret': 'JWT_SECRET',
            'database_password': 'DB_PASSWORD',
            'clerk_secret': 'CLERK_SECRET_KEY',
            'telnyx_api_key': 'TELNYX_API_KEY',
            'helseid_client_secret': 'HELSEID_CLIENT_SECRET',
            'backup_encryption_key': 'BACKUP_ENCRYPTION_KEY'
        };

        if (this.vaultClient) {
            try {
                return await this.vaultClient.getSecret(key);
            } catch (error) {
                logger.warn(`Vault secret '${key}' not found, trying env fallback`);
            }
        }

        // Environment variable fallback
        const envKey = envKeyMap[key] || envFallback || key.toUpperCase();
        const envValue = process.env[envKey];

        if (!envValue) {
            throw new Error(`Secret '${key}' not found in Vault or environment`);
        }

        return envValue;
    }

    /**
     * Get all application secrets
     */
    async getAll() {
        await this.ensureInitialized();

        if (this.vaultClient) {
            try {
                return await this.vaultClient.getAllSecrets();
            } catch (error) {
                logger.warn('Could not get all secrets from Vault');
            }
        }

        // Return mapped environment variables
        return {
            encryption_key: process.env.ENCRYPTION_KEY,
            jwt_secret: process.env.JWT_SECRET,
            database_password: process.env.DB_PASSWORD,
            clerk_secret: process.env.CLERK_SECRET_KEY
        };
    }

    /**
     * Encrypt sensitive data using Vault Transit (if available)
     */
    async encryptData(data, keyName = 'chiroclickcrm-data') {
        await this.ensureInitialized();

        if (this.vaultClient) {
            try {
                return await this.vaultClient.encrypt(keyName, data);
            } catch (error) {
                logger.warn('Vault transit encryption unavailable, using local encryption');
            }
        }

        // Fallback to local encryption
        const { encrypt } = await import('./encryption.js');
        return encrypt(data);
    }

    /**
     * Decrypt data
     */
    async decryptData(ciphertext, keyName = 'chiroclickcrm-data') {
        await this.ensureInitialized();

        // Check if it's a Vault ciphertext (starts with vault:)
        if (ciphertext.startsWith('vault:') && this.vaultClient) {
            return await this.vaultClient.decrypt(keyName, ciphertext);
        }

        // Local decryption
        const { decrypt } = await import('./encryption.js');
        return decrypt(ciphertext);
    }

    /**
     * Get database credentials (dynamic if Vault available)
     */
    async getDatabaseCredentials() {
        await this.ensureInitialized();

        if (this.vaultClient) {
            try {
                return await this.vaultClient.getDatabaseCredentials();
            } catch (error) {
                logger.warn('Dynamic database credentials unavailable');
            }
        }

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
        if (this.vaultClient) {
            return await this.vaultClient.healthCheck();
        }
        return { healthy: true, mode: 'environment' };
    }
}

// Export singleton instance
export const secrets = new SecretsManager();
export const VaultClient = VaultClient;

export default secrets;
