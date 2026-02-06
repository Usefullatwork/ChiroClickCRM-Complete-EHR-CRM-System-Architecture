/**
 * Environment Setup - runs before modules are loaded
 */

process.env.NODE_ENV = 'test';
process.env.DESKTOP_MODE = 'true';
process.env.CACHE_ENGINE = 'memory';
process.env.DB_ENGINE = 'pglite';
process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.JWT_SECRET = 'test_jwt_secret';
