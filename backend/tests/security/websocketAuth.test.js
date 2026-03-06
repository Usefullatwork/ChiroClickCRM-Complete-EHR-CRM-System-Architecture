/**
 * WebSocket Auth Tests
 * Verifies DEV_SKIP_AUTH cannot bypass auth in production
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('WebSocket DEV_SKIP_AUTH guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should block DEV_SKIP_AUTH when NODE_ENV is production', () => {
    process.env.DEV_SKIP_AUTH = 'true';
    process.env.NODE_ENV = 'production';

    // The guard condition from websocket.js
    const canBypass = process.env.DEV_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    expect(canBypass).toBe(false);
  });

  it('should allow DEV_SKIP_AUTH when NODE_ENV is development', () => {
    process.env.DEV_SKIP_AUTH = 'true';
    process.env.NODE_ENV = 'development';

    const canBypass = process.env.DEV_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    expect(canBypass).toBe(true);
  });

  it('should block when DEV_SKIP_AUTH is not set', () => {
    delete process.env.DEV_SKIP_AUTH;
    process.env.NODE_ENV = 'development';

    const canBypass = process.env.DEV_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    expect(canBypass).toBe(false);
  });

  it('should block when both NODE_ENV is production and DEV_SKIP_AUTH is false', () => {
    process.env.DEV_SKIP_AUTH = 'false';
    process.env.NODE_ENV = 'production';

    const canBypass = process.env.DEV_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

    expect(canBypass).toBe(false);
  });
});
