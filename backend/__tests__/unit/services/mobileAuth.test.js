/**
 * Unit Tests for Mobile Auth, Exercises, and Programs Services
 * Tests OTP flow, token refresh, exercise sync, program delivery
 */

import { jest } from '@jest/globals';

// ── Shared mock functions (declared outside factories for resetMocks: true) ──
const mockQuery = jest.fn();

// ── Mock: database ──
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ── Mock: logger ──
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock: crypto (deterministic tokens) ──
jest.unstable_mockModule('crypto', () => {
  const actual = {
    createHash: () => ({
      update: () => ({
        digest: () => 'mocked-hash-value',
      }),
    }),
    randomBytes: () => ({
      toString: () => 'mocked-random-token-hex',
    }),
  };
  return { default: actual, ...actual };
});

// ── Mock: jsonwebtoken ──
const mockJwtSign = jest.fn().mockReturnValue('mocked-access-token');
const mockJwtVerify = jest.fn();
const mockJwtDecode = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: mockJwtSign,
    verify: mockJwtVerify,
    decode: mockJwtDecode,
  },
  sign: mockJwtSign,
  verify: mockJwtVerify,
  decode: mockJwtDecode,
}));

// ── Mock: google-auth-library (lazy-loaded social auth) ──
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-id-123',
        email: 'test@gmail.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
      }),
    }),
  })),
}));

// ── Mock: jwks-rsa (lazy-loaded for Apple auth) ──
jest.unstable_mockModule('jwks-rsa', () => ({
  default: jest.fn().mockReturnValue({
    getSigningKey: jest.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    }),
  }),
}));

// ── Import modules AFTER mocking ──
const {
  sendOTP,
  verifyOTP,
  verifyAccessToken,
  refreshAccessToken,
  revokeToken,
  revokeAllUserTokens,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserById,
  updateProfile,
  normalizePhoneNumber,
} = await import('../../../src/services/mobileAuth.js');

const { listExercises, getExerciseById, getCategories } =
  await import('../../../src/services/mobileExercises.js');

const { listPrograms, getProgramDetails, enrollInProgram, getMyPrograms } =
  await import('../../../src/services/mobilePrograms.js');

// ── Helpers ──
const mockUser = {
  id: 'user-uuid-1',
  phone_number: '+4712345678',
  phone_verified: true,
  display_name: 'Ola Nordmann',
  avatar_url: null,
  preferred_language: 'nb',
  notification_time: '08:00',
  notification_enabled: true,
  created_at: '2026-01-01T00:00:00Z',
};

// =============================================================================
// MOBILE AUTH SERVICE
// =============================================================================
describe('Mobile Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-assign implementations that resetMocks clears
    mockJwtSign.mockReturnValue('mocked-access-token');
  });

  // ─── normalizePhoneNumber (pure function) ───
  describe('normalizePhoneNumber', () => {
    it('should add +47 prefix to 8-digit Norwegian numbers', () => {
      expect(normalizePhoneNumber('12345678')).toBe('+4712345678');
    });

    it('should keep existing + prefix intact', () => {
      expect(normalizePhoneNumber('+4712345678')).toBe('+4712345678');
    });

    it('should convert 00-prefix international format', () => {
      expect(normalizePhoneNumber('004712345678')).toBe('+4712345678');
    });

    it('should strip non-digit characters except +', () => {
      expect(normalizePhoneNumber('+47 123 45 678')).toBe('+4712345678');
    });
  });

  // ─── sendOTP ───
  describe('sendOTP', () => {
    it('should send OTP when rate limit not exceeded', async () => {
      // Rate limit check: under 5
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        // Insert OTP
        .mockResolvedValueOnce({ rows: [] });

      const result = await sendOTP('12345678');

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresIn).toBe(600);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw when rate limit exceeded (5+ OTPs per hour)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      await expect(sendOTP('12345678')).rejects.toThrow(
        'Too many OTP requests. Please try again later.'
      );
    });
  });

  // ─── verifyOTP ───
  describe('verifyOTP', () => {
    it('should verify OTP and return tokens for existing user', async () => {
      mockQuery
        // Find valid OTP
        .mockResolvedValueOnce({ rows: [{ id: 'otp-1', attempts: 0 }] })
        // Mark OTP verified
        .mockResolvedValueOnce({ rows: [] })
        // Find existing mobile user
        .mockResolvedValueOnce({ rows: [mockUser] })
        // Update phone_verified + last_active
        .mockResolvedValueOnce({ rows: [] })
        // Insert refresh token (from generateTokens)
        .mockResolvedValueOnce({ rows: [] });

      const result = await verifyOTP('+4712345678', '123456');

      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe('user-uuid-1');
      expect(result.tokens.accessToken).toBe('mocked-access-token');
      expect(result.tokens.refreshToken).toBe('mocked-random-token-hex');
    });

    it('should create new user when phone not registered', async () => {
      const newUser = { ...mockUser, id: 'new-user-1' };
      mockQuery
        // Find valid OTP
        .mockResolvedValueOnce({ rows: [{ id: 'otp-2', attempts: 0 }] })
        // Mark OTP verified
        .mockResolvedValueOnce({ rows: [] })
        // Find mobile user — none
        .mockResolvedValueOnce({ rows: [] })
        // Create new user
        .mockResolvedValueOnce({ rows: [newUser] })
        // Initialize streak
        .mockResolvedValueOnce({ rows: [] })
        // Insert refresh token
        .mockResolvedValueOnce({ rows: [] });

      const result = await verifyOTP('+4712345678', '654321');

      expect(result.isNewUser).toBe(true);
      expect(result.user.id).toBe('new-user-1');
    });

    it('should throw on invalid or expired OTP', async () => {
      mockQuery
        // No matching OTP
        .mockResolvedValueOnce({ rows: [] })
        // Increment attempts
        .mockResolvedValueOnce({ rows: [] });

      await expect(verifyOTP('+4712345678', '000000')).rejects.toThrow(
        'Invalid or expired OTP code'
      );
    });
  });

  // ─── verifyAccessToken ───
  describe('verifyAccessToken', () => {
    it('should return decoded payload for valid mobile token', () => {
      const payload = { userId: 'u-1', type: 'mobile', phone: '+4712345678' };
      mockJwtVerify.mockReturnValue(payload);

      const result = verifyAccessToken('valid-token');
      expect(result).toEqual(payload);
    });

    it('should throw for non-mobile token type', () => {
      mockJwtVerify.mockReturnValue({ userId: 'u-1', type: 'web' });

      expect(() => verifyAccessToken('web-token')).toThrow('Invalid or expired access token');
    });

    it('should throw for expired token', () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => verifyAccessToken('expired-token')).toThrow('Invalid or expired access token');
    });
  });

  // ─── refreshAccessToken ───
  describe('refreshAccessToken', () => {
    it('should issue new access token for valid refresh token', async () => {
      mockQuery
        // Lookup refresh token + user join
        .mockResolvedValueOnce({
          rows: [{ mobile_user_id: 'u-1', phone_number: '+4712345678' }],
        })
        // Update last_active
        .mockResolvedValueOnce({ rows: [] });

      const result = await refreshAccessToken('some-refresh-token');

      expect(result.accessToken).toBe('mocked-access-token');
      expect(result.expiresIn).toBe(900);
    });

    it('should throw for invalid or expired refresh token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(refreshAccessToken('bad-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  // ─── revokeToken / revokeAllUserTokens ───
  describe('token revocation', () => {
    it('revokeToken should revoke a single refresh token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await revokeToken('refresh-token-to-revoke');
      expect(result).toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('revokeAllUserTokens should revoke all tokens for user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await revokeAllUserTokens('user-uuid-1');
      expect(result).toEqual({ success: true });
    });
  });

  // ─── device token management ───
  describe('device tokens', () => {
    it('registerDeviceToken should return success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await registerDeviceToken('user-uuid-1', 'expo-push-token');
      expect(result).toEqual({ success: true });
    });

    it('unregisterDeviceToken should return success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await unregisterDeviceToken('user-uuid-1', 'expo-push-token');
      expect(result).toEqual({ success: true });
    });
  });

  // ─── getUserById ───
  describe('getUserById', () => {
    it('should return sanitized user when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await getUserById('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
      expect(result.phoneNumber).toBe('+4712345678');
      // Ensures sanitization maps snake_case to camelCase
      expect(result.displayName).toBe('Ola Nordmann');
    });

    it('should return null when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getUserById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── updateProfile ───
  describe('updateProfile', () => {
    it('should update allowed fields and return sanitized user', async () => {
      const updated = { ...mockUser, display_name: 'Ny Navn' };
      mockQuery.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateProfile('user-uuid-1', { displayName: 'Ny Navn' });
      expect(result.displayName).toBe('Ny Navn');
    });

    it('should throw when no valid fields provided', async () => {
      await expect(updateProfile('user-uuid-1', { hackerField: 'evil' })).rejects.toThrow(
        'No valid fields to update'
      );
    });
  });
});

// =============================================================================
// MOBILE EXERCISES SERVICE
// =============================================================================
describe('Mobile Exercises Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listExercises', () => {
    it('should return exercises with default pagination', async () => {
      const exercises = [
        { id: 'ex-1', name: 'Bridge', category: 'strength' },
        { id: 'ex-2', name: 'Cat-Cow', category: 'mobility' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: exercises });

      const result = await listExercises({});

      expect(result.exercises).toHaveLength(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should apply category filter when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await listExercises({ category: 'strength' });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('category = $1');
      expect(mockQuery.mock.calls[0][1]).toContain('strength');
    });

    it('should apply search filter with ILIKE', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await listExercises({ search: 'bridge' });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('ILIKE');
      expect(mockQuery.mock.calls[0][1]).toContain('%bridge%');
    });
  });

  describe('getExerciseById', () => {
    it('should return exercise when found', async () => {
      const ex = { id: 'ex-1', name: 'Bridge', is_active: true };
      mockQuery.mockResolvedValueOnce({ rows: [ex] });

      const result = await getExerciseById('ex-1');
      expect(result).toEqual(ex);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getExerciseById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories with counts', async () => {
      const categories = [
        { category: 'mobility', count: 15 },
        { category: 'strength', count: 22 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: categories });

      const result = await getCategories();
      expect(result).toEqual(categories);
    });
  });
});

// =============================================================================
// MOBILE PROGRAMS SERVICE
// =============================================================================
describe('Mobile Programs Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPrograms', () => {
    it('should return public active programs', async () => {
      const programs = [{ id: 'prog-1', name: 'Rehab Program', is_active: true }];
      mockQuery.mockResolvedValueOnce({ rows: programs });

      const result = await listPrograms({});
      expect(result).toEqual(programs);
    });

    it('should apply type and difficulty filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await listPrograms({ type: 'rehabilitation', difficulty: 'beginner' });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('program_type = $1');
      expect(sql).toContain('difficulty_level = $2');
    });
  });

  describe('getProgramDetails', () => {
    it('should return program with weeks, exercises, and enrollment', async () => {
      mockQuery
        // Program query
        .mockResolvedValueOnce({
          rows: [{ id: 'prog-1', name: 'Rehab', created_by_name: 'Dr. Smith' }],
        })
        // Weeks + exercises
        .mockResolvedValueOnce({
          rows: [{ id: 'week-1', week_number: 1, exercises: [] }],
        })
        // Enrollment check
        .mockResolvedValueOnce({ rows: [] });

      const result = await getProgramDetails('prog-1', 'user-1');

      expect(result.id).toBe('prog-1');
      expect(result.weeks).toHaveLength(1);
      expect(result.isEnrolled).toBe(false);
      expect(result.enrollment).toBeNull();
    });

    it('should return null when program not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getProgramDetails('nonexistent', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('enrollInProgram', () => {
    it('should create enrollment when not already enrolled', async () => {
      const enrollment = { id: 'enr-1', mobile_user_id: 'user-1', program_id: 'prog-1' };
      mockQuery
        // Check existing enrollment
        .mockResolvedValueOnce({ rows: [] })
        // Insert enrollment
        .mockResolvedValueOnce({ rows: [enrollment] });

      const result = await enrollInProgram('prog-1', 'user-1');
      expect(result.id).toBe('enr-1');
    });

    it('should throw when already enrolled', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'enr-existing', status: 'active' }],
      });

      await expect(enrollInProgram('prog-1', 'user-1')).rejects.toThrow(
        'Already enrolled in this program'
      );
    });
  });

  describe('getMyPrograms', () => {
    it('should return enrolled programs for user', async () => {
      const enrolled = [{ id: 'enr-1', name: 'Rehab Program', status: 'active' }];
      mockQuery.mockResolvedValueOnce({ rows: enrolled });

      const result = await getMyPrograms('user-1');
      expect(result).toEqual(enrolled);
    });
  });
});
