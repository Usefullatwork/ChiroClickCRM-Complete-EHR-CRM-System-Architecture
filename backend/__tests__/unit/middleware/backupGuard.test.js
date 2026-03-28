/**
 * Unit Tests for Backup Guard Middleware
 * Tests request blocking during active backup operations
 */

import { jest } from '@jest/globals';

const mockGetIsBackingUp = jest.fn().mockReturnValue(false);

jest.unstable_mockModule('../../../src/services/backupService.js', () => ({
  getIsBackingUp: mockGetIsBackingUp,
  default: { getIsBackingUp: mockGetIsBackingUp },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const backupGuardModule = await import('../../../src/middleware/backupGuard.js');
const backupGuard = backupGuardModule.default || backupGuardModule.backupGuard;

function createMockRes() {
  const res = {
    statusCode: 200,
    json: jest.fn().mockReturnThis(),
    status: jest.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    set: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('Backup Guard Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsBackingUp.mockReturnValue(false);
  });

  it('should return 503 with Retry-After header when isBackingUp is true', () => {
    mockGetIsBackingUp.mockReturnValue(true);

    const req = { method: 'GET', path: '/api/v1/patients' };
    const res = createMockRes();
    const next = jest.fn();

    backupGuard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.set).toHaveBeenCalledWith('Retry-After', '5');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ServiceUnavailable' }));
  });

  it('should call next() when isBackingUp is false', () => {
    mockGetIsBackingUp.mockReturnValue(false);

    const req = { method: 'GET', path: '/api/v1/patients' };
    const res = createMockRes();
    const next = jest.fn();

    backupGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
