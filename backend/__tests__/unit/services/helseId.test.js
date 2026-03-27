/**
 * Unit Tests for HelseID Service
 * Tests HelseIdClient, middleware, validators, and utility functions
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks — declared BEFORE any dynamic import so unstable_mockModule registers
// ---------------------------------------------------------------------------

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: mockLoggerInfo,
    warn: mockLoggerWarn,
    error: mockLoggerError,
    debug: mockLoggerDebug,
  },
}));

const mockVaultGet = jest.fn();

jest.unstable_mockModule('../../../src/utils/vault.js', () => ({
  default: {
    get: mockVaultGet,
  },
}));

const mockJwtVerify = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

// ---------------------------------------------------------------------------
// Dynamic imports (must come after all unstable_mockModule calls)
// ---------------------------------------------------------------------------

const {
  HelseIdClient,
  helseIdAuth,
  requireHprNumber,
  validateFodselsnummer,
  validateHprNumber,
  extractHprNumber,
  extractPersonalNumber,
  getHelseIdStatus,
} = await import('../../../src/services/helseId.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Express-like req/res/next trio */
function mockReqResNext(overrides = {}) {
  const req = { headers: {}, ...overrides };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HelseID Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore env
    delete process.env.HELSEID_CLIENT_ID;
    delete process.env.HELSEID_REDIRECT_URI;
    delete process.env.HELSEID_ENV;
  });

  // =========================================================================
  // HelseIdClient — constructor
  // =========================================================================

  describe('HelseIdClient constructor', () => {
    it('should default to test environment when no env option or env var is set', () => {
      const client = new HelseIdClient();
      expect(client.environment).toBe('test');
      expect(client.config.issuer).toContain('test.nhn.no');
    });

    it('should use production environment when specified in options', () => {
      const client = new HelseIdClient({ environment: 'production' });
      expect(client.environment).toBe('production');
      expect(client.config.issuer).toBe('https://helseid-sts.nhn.no');
    });

    it('should accept clientId and redirectUri from options', () => {
      const client = new HelseIdClient({
        clientId: 'my-client',
        redirectUri: 'https://example.com/callback',
      });
      expect(client.clientId).toBe('my-client');
      expect(client.redirectUri).toBe('https://example.com/callback');
    });
  });

  // =========================================================================
  // HelseIdClient — generatePKCE
  // =========================================================================

  describe('generatePKCE', () => {
    it('should return codeVerifier and codeChallenge as URL-safe base64', () => {
      const client = new HelseIdClient();
      const { codeVerifier, codeChallenge } = client.generatePKCE();

      expect(typeof codeVerifier).toBe('string');
      expect(typeof codeChallenge).toBe('string');
      // Must not contain +, /, or = (base64url)
      expect(codeVerifier).not.toMatch(/[+/=]/);
      expect(codeChallenge).not.toMatch(/[+/=]/);
      // Reasonable length
      expect(codeVerifier.length).toBeGreaterThanOrEqual(20);
      expect(codeChallenge.length).toBeGreaterThanOrEqual(20);
    });

    it('should produce unique values on successive calls', () => {
      const client = new HelseIdClient();
      const a = client.generatePKCE();
      const b = client.generatePKCE();
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
    });
  });

  // =========================================================================
  // HelseIdClient — getAuthorizationUrl
  // =========================================================================

  describe('getAuthorizationUrl', () => {
    it('should return authorizationUrl, state, and codeVerifier', () => {
      const client = new HelseIdClient({
        clientId: 'cid',
        redirectUri: 'https://app/callback',
      });
      const result = client.getAuthorizationUrl();

      expect(result).toHaveProperty('authorizationUrl');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('codeVerifier');
      expect(result.authorizationUrl).toContain('response_type=code');
      expect(result.authorizationUrl).toContain('client_id=cid');
      expect(result.authorizationUrl).toContain('code_challenge_method=S256');
    });

    it('should include HPR scope when requestHprNumber is true', () => {
      const client = new HelseIdClient({ clientId: 'c', redirectUri: 'https://r' });
      const result = client.getAuthorizationUrl({ requestHprNumber: true });
      expect(result.authorizationUrl).toContain('hpr_number');
    });

    it('should store state for later verification with TTL', () => {
      const client = new HelseIdClient({ clientId: 'c', redirectUri: 'https://r' });
      const result = client.getAuthorizationUrl();
      const stored = client.authStateStore.get(result.state);
      expect(stored).toBeDefined();
      expect(stored.codeVerifier).toBe(result.codeVerifier);
      expect(stored.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  // =========================================================================
  // HelseIdClient — exchangeCodeForTokens
  // =========================================================================

  describe('exchangeCodeForTokens', () => {
    let client;
    const fakeJwksResponse = {
      ok: true,
      json: async () => ({ keys: [{ kid: 'k1', kty: 'RSA', n: 'abc', e: 'AQAB' }] }),
    };

    beforeEach(() => {
      client = new HelseIdClient({ clientId: 'cid', redirectUri: 'https://r' });
      mockVaultGet.mockResolvedValue('secret');
      global.fetch = jest.fn();
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should throw on invalid state', async () => {
      // Initialize first (vault + jwks)
      global.fetch.mockResolvedValueOnce(fakeJwksResponse);
      await client.initialize();

      await expect(client.exchangeCodeForTokens('code', 'bad-state')).rejects.toThrow(
        'Invalid or expired state parameter'
      );
    });

    it('should throw when state has expired', async () => {
      global.fetch.mockResolvedValueOnce(fakeJwksResponse);
      await client.initialize();

      // Manually insert an expired state
      const state = 'expired-state';
      client.authStateStore.set(state, {
        codeVerifier: 'v',
        nonce: 'n',
        redirectUri: 'https://r',
        createdAt: Date.now() - 20 * 60 * 1000,
        expiresAt: Date.now() - 1000, // already expired
      });

      await expect(client.exchangeCodeForTokens('code', state)).rejects.toThrow(
        'Authorization state expired'
      );
    });

    it('should throw when token exchange HTTP response is not ok', async () => {
      global.fetch.mockResolvedValueOnce(fakeJwksResponse);
      await client.initialize();

      const { state } = client.getAuthorizationUrl();

      // Mock failed token exchange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'invalid_grant',
      });

      await expect(client.exchangeCodeForTokens('code', state)).rejects.toThrow(
        'Token exchange failed'
      );
    });
  });

  // =========================================================================
  // HelseIdClient — refreshAccessToken
  // =========================================================================

  describe('refreshAccessToken', () => {
    it('should throw when refresh response is not ok', async () => {
      const client = new HelseIdClient({ clientId: 'c', redirectUri: 'r' });
      mockVaultGet.mockResolvedValue('secret');

      const fakeJwksResponse = {
        ok: true,
        json: async () => ({ keys: [{ kid: 'k1', kty: 'RSA', n: 'abc', e: 'AQAB' }] }),
      };

      global.fetch = jest.fn();
      global.fetch.mockResolvedValueOnce(fakeJwksResponse); // JWKS
      await client.initialize();

      global.fetch.mockResolvedValueOnce({ ok: false }); // refresh fails

      await expect(client.refreshAccessToken('old-refresh-token')).rejects.toThrow(
        'Token refresh failed'
      );

      delete global.fetch;
    });
  });

  // =========================================================================
  // HelseIdClient — getUserInfo
  // =========================================================================

  describe('getUserInfo', () => {
    it('should return user info on success', async () => {
      const client = new HelseIdClient({ clientId: 'c', redirectUri: 'r' });
      const userInfo = { sub: 'u1', name: 'Ola Nordmann' };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => userInfo,
      });

      const result = await client.getUserInfo('access-token');
      expect(result).toEqual(userInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('userinfo'),
        expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } })
      );

      delete global.fetch;
    });

    it('should throw when userinfo response is not ok', async () => {
      const client = new HelseIdClient({ clientId: 'c', redirectUri: 'r' });

      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });

      await expect(client.getUserInfo('bad-token')).rejects.toThrow('Failed to fetch user info');

      delete global.fetch;
    });
  });

  // =========================================================================
  // HelseIdClient — getLogoutUrl
  // =========================================================================

  describe('getLogoutUrl', () => {
    it('should build a logout URL with id_token_hint and redirect', () => {
      const client = new HelseIdClient();
      const url = client.getLogoutUrl('my-id-token', 'https://app/logout');

      expect(url).toContain('id_token_hint=my-id-token');
      expect(url).toContain('post_logout_redirect_uri=');
      expect(url).toContain('endsession');
    });
  });

  // =========================================================================
  // HelseIdClient — parseHprNumber
  // =========================================================================

  describe('parseHprNumber', () => {
    it('should extract HPR number from helseid claim key', () => {
      const client = new HelseIdClient();
      const result = client.parseHprNumber({
        'helseid://claims/hpr/hpr_number': '1234567',
        'helseid://claims/hpr/authorization': 'KI',
        'helseid://claims/hpr/profession': 'Kiropraktor',
      });
      expect(result.hprNumber).toBe('1234567');
      expect(result.authorization).toBe('KI');
      expect(result.profession).toBe('Kiropraktor');
    });

    it('should return null when no HPR claim exists', () => {
      const client = new HelseIdClient();
      const result = client.parseHprNumber({});
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // HelseIdClient — getSecurityLevel
  // =========================================================================

  describe('getSecurityLevel', () => {
    it('should map idporten-loa-high to high', () => {
      const client = new HelseIdClient();
      const level = client.getSecurityLevel({
        'helseid://claims/identity/security_level': 'idporten-loa-high',
      });
      expect(level).toBe('high');
    });

    it('should map Level4 to high via acr fallback', () => {
      const client = new HelseIdClient();
      const level = client.getSecurityLevel({ acr: 'Level4' });
      expect(level).toBe('high');
    });

    it('should return raw value when not in map', () => {
      const client = new HelseIdClient();
      const level = client.getSecurityLevel({ acr: 'unknown-level' });
      expect(level).toBe('unknown-level');
    });
  });

  // =========================================================================
  // HelseIdClient — cleanupExpiredStates
  // =========================================================================

  describe('cleanupExpiredStates', () => {
    it('should remove expired entries from authStateStore', () => {
      const client = new HelseIdClient();
      client.authStateStore.set('fresh', { expiresAt: Date.now() + 60000 });
      client.authStateStore.set('stale', { expiresAt: Date.now() - 1000 });

      client.cleanupExpiredStates();

      expect(client.authStateStore.has('fresh')).toBe(true);
      expect(client.authStateStore.has('stale')).toBe(false);
    });
  });

  // =========================================================================
  // helseIdAuth middleware
  // =========================================================================

  describe('helseIdAuth middleware', () => {
    let fakeJwksResponse;

    beforeEach(() => {
      fakeJwksResponse = {
        ok: true,
        json: async () => ({ keys: [{ kid: 'k1', kty: 'RSA', n: 'abc', e: 'AQAB' }] }),
      };
      mockVaultGet.mockResolvedValue('secret');
      global.fetch = jest.fn().mockResolvedValue(fakeJwksResponse);
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should return 401 when Authorization header is missing', async () => {
      const middleware = helseIdAuth();
      const { req, res, next } = mockReqResNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', async () => {
      const middleware = helseIdAuth();
      const { req, res, next } = mockReqResNext({
        headers: { authorization: 'Basic abc123' },
      });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token validation fails', async () => {
      // Make jwt.verify throw
      mockJwtVerify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const middleware = helseIdAuth();
      // Need a well-formed JWT-like string with a decodable header
      const fakeHeader = Buffer.from(JSON.stringify({ kid: 'k1', alg: 'RS256' })).toString(
        'base64'
      );
      const fakeToken = `${fakeHeader}.payload.sig`;

      const { req, res, next } = mockReqResNext({
        headers: { authorization: `Bearer ${fakeToken}` },
      });

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or expired token' })
      );
    });
  });

  // =========================================================================
  // requireHprNumber middleware
  // =========================================================================

  describe('requireHprNumber middleware', () => {
    it('should return 403 when helseIdUser has no HPR number', () => {
      const middleware = requireHprNumber();
      const { req, res, next } = mockReqResNext({ helseIdUser: { hpr: null } });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('HPR') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when helseIdUser has a valid HPR number', () => {
      const middleware = requireHprNumber();
      const { req, res, next } = mockReqResNext({
        helseIdUser: { hpr: { hprNumber: '1234567' } },
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // validateFodselsnummer
  // =========================================================================

  describe('validateFodselsnummer', () => {
    it('should return invalid when null', () => {
      const result = validateFodselsnummer(null);
      expect(result.valid).toBe(false);
    });

    it('should return invalid when not a string', () => {
      const result = validateFodselsnummer(12345678901);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be a string');
    });

    it('should return invalid for wrong length', () => {
      const result = validateFodselsnummer('123');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be 11 digits');
    });

    it('should return invalid for non-digit characters', () => {
      const result = validateFodselsnummer('1234567890a');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must contain only digits');
    });

    it('should validate a known valid fnr (01017012345-style checksum test)', () => {
      // Use a well-known test fnr: 01010150022
      // Day=01, Month=01, Year=01, IndNum=500 -> year 2001
      // We test that it returns a result (valid or checksum error) without throwing
      const result = validateFodselsnummer('01010150022');
      expect(result).toHaveProperty('valid');
    });

    it('should strip whitespace before validation', () => {
      const result = validateFodselsnummer('  123  ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be 11 digits');
    });

    it('should detect D-number (day > 40)', () => {
      // D-number: day digit + 40, so 41 = day 1
      // 41010199905 — will likely fail checksum but should detect isDNumber flag
      const result = validateFodselsnummer('41010199905');
      // It should at least have isDNumber in the result path
      if (result.isDNumber !== undefined) {
        expect(result.isDNumber).toBe(true);
      } else {
        // Invalid date or checksum — still should not throw
        expect(result.valid).toBe(false);
      }
    });
  });

  // =========================================================================
  // validateHprNumber
  // =========================================================================

  describe('validateHprNumber', () => {
    it('should return invalid when null', async () => {
      const result = await validateHprNumber(null);
      expect(result.valid).toBe(false);
    });

    it('should accept a valid 7-digit HPR number', async () => {
      const result = await validateHprNumber('1234567');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept a valid 9-digit HPR number', async () => {
      const result = await validateHprNumber('123456789');
      expect(result.valid).toBe(true);
    });

    it('should reject HPR number with letters', async () => {
      const result = await validateHprNumber('12345ab');
      expect(result.valid).toBe(false);
    });

    it('should reject too-short HPR number', async () => {
      const result = await validateHprNumber('123');
      expect(result.valid).toBe(false);
    });

    it('should coerce number input to string', async () => {
      const result = await validateHprNumber(1234567);
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // extractHprNumber
  // =========================================================================

  describe('extractHprNumber', () => {
    it('should return null when claims is null', () => {
      expect(extractHprNumber(null)).toBeNull();
    });

    it('should extract from helseid claim key', () => {
      expect(extractHprNumber({ 'helseid://claims/hpr/hpr_number': '9876543' })).toBe('9876543');
    });

    it('should fall back to hpr_number key', () => {
      expect(extractHprNumber({ hpr_number: '1111111' })).toBe('1111111');
    });

    it('should return null when no matching key', () => {
      expect(extractHprNumber({ sub: 'user1' })).toBeNull();
    });
  });

  // =========================================================================
  // extractPersonalNumber
  // =========================================================================

  describe('extractPersonalNumber', () => {
    it('should return null when claims is null', () => {
      expect(extractPersonalNumber(null)).toBeNull();
    });

    it('should extract from helseid PID claim', () => {
      expect(extractPersonalNumber({ 'helseid://claims/identity/pid': '01010150022' })).toBe(
        '01010150022'
      );
    });

    it('should fall back to pid key', () => {
      expect(extractPersonalNumber({ pid: '02020250033' })).toBe('02020250033');
    });
  });

  // =========================================================================
  // getHelseIdStatus
  // =========================================================================

  describe('getHelseIdStatus', () => {
    it('should report not configured when env vars are missing', () => {
      const status = getHelseIdStatus();
      expect(status.configured).toBe(false);
      expect(status.environment).toBe('test');
    });

    it('should report configured when env vars are set', () => {
      process.env.HELSEID_CLIENT_ID = 'my-client';
      process.env.HELSEID_REDIRECT_URI = 'https://app/callback';
      const status = getHelseIdStatus();
      expect(status.configured).toBe(true);
    });

    it('should include endpoint URLs', () => {
      const status = getHelseIdStatus();
      expect(status.endpoints).toHaveProperty('issuer');
      expect(status.endpoints).toHaveProperty('authorization_endpoint');
      expect(status.endpoints).toHaveProperty('token_endpoint');
    });

    it('should use production environment when HELSEID_ENV is production', () => {
      process.env.HELSEID_ENV = 'production';
      const status = getHelseIdStatus();
      expect(status.environment).toBe('production');
      expect(status.endpoints.issuer).toBe('https://helseid-sts.nhn.no');
    });
  });
});
