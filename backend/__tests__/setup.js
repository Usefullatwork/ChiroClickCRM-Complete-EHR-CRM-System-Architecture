/**
 * Jest Global Test Setup
 * Configuration for test environment
 *
 * Note: Using require() for Jest setup compatibility
 */

// Set test environment before anything else
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chiroclickcrm_test';

// Load dotenv for test environment
import('dotenv').then(dotenv => {
  dotenv.config({ path: '.env.test' });
});
