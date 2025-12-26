/**
 * Redis Caching Layer
 * Provides high-performance caching for frequently accessed data
 * Reduces database load and improves response times
 */

import logger from './logger.js';

// ============================================================================
// REDIS CLIENT CONFIGURATION
// ============================================================================

class RedisClient {
    constructor(options = {}) {
        this.host = options.host || process.env.REDIS_HOST || 'localhost';
        this.port = options.port || parseInt(process.env.REDIS_PORT || '6379');
        this.password = options.password || process.env.REDIS_PASSWORD;
        this.db = options.db || parseInt(process.env.REDIS_DB || '0');
        this.keyPrefix = options.keyPrefix || 'chiroclickcrm:';

        // Connection state
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;

        // Default TTLs (in seconds)
        this.defaultTTL = {
            session: 3600,           // 1 hour
            patient: 300,            // 5 minutes
            encounter: 300,          // 5 minutes
            template: 3600,          // 1 hour
            macro: 600,              // 10 minutes
            userPrefs: 1800,         // 30 minutes
            dashboard: 60,           // 1 minute (frequently updated)
            appointment: 120,        // 2 minutes
            rateLimit: 900           // 15 minutes (rate limiting windows)
        };
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.isConnected && this.client) {
            return this.client;
        }

        try {
            // Dynamic import for Redis (ioredis)
            const Redis = (await import('ioredis')).default;

            this.client = new Redis({
                host: this.host,
                port: this.port,
                password: this.password || undefined,
                db: this.db,
                keyPrefix: this.keyPrefix,
                retryStrategy: (times) => {
                    if (times > this.maxReconnectAttempts) {
                        logger.error('Redis max reconnect attempts reached');
                        return null;
                    }
                    const delay = Math.min(times * 100, 3000);
                    return delay;
                },
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                }
            });

            // Event handlers
            this.client.on('connect', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('✓ Redis connected', { host: this.host, port: this.port });
            });

            this.client.on('error', (error) => {
                logger.error('Redis error', { error: error.message });
            });

            this.client.on('close', () => {
                this.isConnected = false;
                logger.warn('Redis connection closed');
            });

            this.client.on('reconnecting', () => {
                this.reconnectAttempts++;
                logger.info('Redis reconnecting...', { attempt: this.reconnectAttempts });
            });

            // Wait for connection
            await this.client.ping();

            return this.client;
        } catch (error) {
            logger.error('Redis connection failed', { error: error.message });
            // Don't throw - allow app to work without cache
            return null;
        }
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     */
    async get(key) {
        if (!this.client) return null;

        try {
            const value = await this.client.get(key);
            if (value === null) return null;

            // Try to parse as JSON
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logger.warn('Redis get error', { key, error: error.message });
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     */
    async set(key, value, ttl = 300) {
        if (!this.client) return false;

        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            await this.client.setex(key, ttl, serialized);
            return true;
        } catch (error) {
            logger.warn('Redis set error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async del(key) {
        if (!this.client) return false;

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.warn('Redis del error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern) {
        if (!this.client) return 0;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;

            // Remove prefix from keys (ioredis adds it automatically)
            const cleanKeys = keys.map(k => k.replace(this.keyPrefix, ''));
            await this.client.del(...cleanKeys);
            return keys.length;
        } catch (error) {
            logger.warn('Redis delPattern error', { pattern, error: error.message });
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        if (!this.client) return false;

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            return false;
        }
    }

    /**
     * Increment a counter
     */
    async incr(key, ttl = null) {
        if (!this.client) return null;

        try {
            const value = await this.client.incr(key);
            if (ttl && value === 1) {
                await this.client.expire(key, ttl);
            }
            return value;
        } catch (error) {
            logger.warn('Redis incr error', { key, error: error.message });
            return null;
        }
    }

    /**
     * Get or set with callback (cache-aside pattern)
     */
    async getOrSet(key, fetchFn, ttl = 300) {
        // Try cache first
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch fresh data
        const freshData = await fetchFn();

        // Cache the result
        if (freshData !== null && freshData !== undefined) {
            await this.set(key, freshData, ttl);
        }

        return freshData;
    }

    /**
     * Hash operations - useful for storing objects
     */
    async hset(key, field, value) {
        if (!this.client) return false;

        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            await this.client.hset(key, field, serialized);
            return true;
        } catch (error) {
            logger.warn('Redis hset error', { key, field, error: error.message });
            return false;
        }
    }

    async hget(key, field) {
        if (!this.client) return null;

        try {
            const value = await this.client.hget(key, field);
            if (value === null) return null;

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            return null;
        }
    }

    async hgetall(key) {
        if (!this.client) return null;

        try {
            const hash = await this.client.hgetall(key);
            if (!hash || Object.keys(hash).length === 0) return null;

            // Try to parse each value as JSON
            const result = {};
            for (const [field, value] of Object.entries(hash)) {
                try {
                    result[field] = JSON.parse(value);
                } catch {
                    result[field] = value;
                }
            }
            return result;
        } catch (error) {
            return null;
        }
    }

    /**
     * List operations - useful for queues
     */
    async lpush(key, value) {
        if (!this.client) return false;

        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            await this.client.lpush(key, serialized);
            return true;
        } catch (error) {
            return false;
        }
    }

    async rpop(key) {
        if (!this.client) return null;

        try {
            const value = await this.client.rpop(key);
            if (value === null) return null;

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Set TTL on existing key
     */
    async expire(key, ttl) {
        if (!this.client) return false;

        try {
            await this.client.expire(key, ttl);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get TTL of a key
     */
    async ttl(key) {
        if (!this.client) return -1;

        try {
            return await this.client.ttl(key);
        } catch (error) {
            return -1;
        }
    }

    /**
     * Flush all keys (dangerous - use carefully)
     */
    async flushDb() {
        if (!this.client) return false;

        try {
            await this.client.flushdb();
            logger.warn('Redis database flushed');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.client) {
            return { healthy: false, error: 'Not connected' };
        }

        try {
            const pong = await this.client.ping();
            const info = await this.client.info('memory');

            return {
                healthy: pong === 'PONG',
                connected: this.isConnected,
                memory: this.parseRedisInfo(info)
            };
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    /**
     * Parse Redis INFO output
     */
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const result = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = value;
            }
        }
        return {
            usedMemory: result.used_memory_human,
            maxMemory: result.maxmemory_human,
            connectedClients: result.connected_clients
        };
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis disconnected');
        }
    }
}

// ============================================================================
// CACHE HELPERS FOR COMMON OPERATIONS
// ============================================================================

class CacheService {
    constructor(redis) {
        this.redis = redis;
    }

    // Patient cache
    async getPatient(patientId, orgId) {
        return await this.redis.get(`patient:${orgId}:${patientId}`);
    }

    async setPatient(patientId, orgId, data) {
        return await this.redis.set(
            `patient:${orgId}:${patientId}`,
            data,
            this.redis.defaultTTL.patient
        );
    }

    async invalidatePatient(patientId, orgId) {
        return await this.redis.del(`patient:${orgId}:${patientId}`);
    }

    // Encounter cache
    async getEncounter(encounterId) {
        return await this.redis.get(`encounter:${encounterId}`);
    }

    async setEncounter(encounterId, data) {
        return await this.redis.set(
            `encounter:${encounterId}`,
            data,
            this.redis.defaultTTL.encounter
        );
    }

    async invalidateEncounter(encounterId) {
        return await this.redis.del(`encounter:${encounterId}`);
    }

    // Patient encounters list
    async getPatientEncounters(patientId) {
        return await this.redis.get(`patient:${patientId}:encounters`);
    }

    async setPatientEncounters(patientId, data) {
        return await this.redis.set(
            `patient:${patientId}:encounters`,
            data,
            this.redis.defaultTTL.encounter
        );
    }

    // Templates/Macros cache
    async getMacros(orgId) {
        return await this.redis.get(`macros:${orgId}`);
    }

    async setMacros(orgId, data) {
        return await this.redis.set(
            `macros:${orgId}`,
            data,
            this.redis.defaultTTL.macro
        );
    }

    async invalidateMacros(orgId) {
        return await this.redis.del(`macros:${orgId}`);
    }

    // Dashboard cache
    async getDashboard(userId, orgId) {
        return await this.redis.get(`dashboard:${orgId}:${userId}`);
    }

    async setDashboard(userId, orgId, data) {
        return await this.redis.set(
            `dashboard:${orgId}:${userId}`,
            data,
            this.redis.defaultTTL.dashboard
        );
    }

    // Appointments for date
    async getAppointments(orgId, date) {
        return await this.redis.get(`appointments:${orgId}:${date}`);
    }

    async setAppointments(orgId, date, data) {
        return await this.redis.set(
            `appointments:${orgId}:${date}`,
            data,
            this.redis.defaultTTL.appointment
        );
    }

    async invalidateAppointments(orgId, date) {
        return await this.redis.del(`appointments:${orgId}:${date}`);
    }

    // User session
    async getSession(sessionId) {
        return await this.redis.get(`session:${sessionId}`);
    }

    async setSession(sessionId, data, ttl) {
        return await this.redis.set(
            `session:${sessionId}`,
            data,
            ttl || this.redis.defaultTTL.session
        );
    }

    async invalidateSession(sessionId) {
        return await this.redis.del(`session:${sessionId}`);
    }

    // Rate limiting
    async checkRateLimit(key, limit, windowSeconds) {
        const count = await this.redis.incr(`ratelimit:${key}`, windowSeconds);
        return {
            allowed: count <= limit,
            current: count,
            limit,
            remaining: Math.max(0, limit - count)
        };
    }

    // Invalidate all cache for an organization
    async invalidateOrganization(orgId) {
        const patterns = [
            `patient:${orgId}:*`,
            `appointments:${orgId}:*`,
            `dashboard:${orgId}:*`,
            `macros:${orgId}`
        ];

        let count = 0;
        for (const pattern of patterns) {
            count += await this.redis.delPattern(pattern);
        }
        return count;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let redisInstance = null;
let cacheInstance = null;

export const getRedis = async () => {
    if (!redisInstance) {
        redisInstance = new RedisClient();
        await redisInstance.connect();
    }
    return redisInstance;
};

export const getCache = async () => {
    if (!cacheInstance) {
        const redis = await getRedis();
        cacheInstance = new CacheService(redis);
    }
    return cacheInstance;
};

export { RedisClient, CacheService };
export default getRedis;
