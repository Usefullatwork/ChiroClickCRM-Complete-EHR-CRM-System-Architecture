/**
 * Jest Global Test Setup
 * Configuration for test environment
 *
 * Note: Using require() for Jest setup compatibility
 */

// Set test environment before anything else
process.env.NODE_ENV = 'test';
process.env.DESKTOP_MODE = 'true';
process.env.CACHE_ENGINE = 'memory';
process.env.DB_ENGINE = 'pglite';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/chiroclickcrm_test';

// Load dotenv for test environment
import('dotenv').then((dotenv) => {
  dotenv.config({ path: '.env.test' });
});
