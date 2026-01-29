/**
 * Jest Configuration
 * Test configuration for ChiroClickCRM backend
 */

export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  injectGlobals: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  transform: {},
  testTimeout: 30000,
  verbose: true,
  // Workaround for ESM
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Force exit after tests complete (handles open database connections)
  forceExit: true,
  // Detect open handles for debugging
  detectOpenHandles: false
};
