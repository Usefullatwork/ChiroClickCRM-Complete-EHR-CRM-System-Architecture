/**
 * Environment Setup - runs before modules are loaded
 */

process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.JWT_SECRET = 'test_jwt_secret';
