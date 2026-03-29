/**
 * Unit Tests for Outlook Bridge Service
 * Tests OAuth flow, email sending, token management, and connection checking
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockAxiosPost,
    get: mockAxiosGet,
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  sendEmail,
  sendTemplateEmail,
  getUserProfile,
  getInboxMessages,
  checkConnection,
  setTokens,
  getTokens,
} = await import('../../../src/services/communication/outlookBridge.js');

// ---- Tests ----

describe('outlookBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset token state
    setTokens({ accessToken: null, refreshToken: null, tokenExpiry: null });
  });

  // ─── getAuthorizationUrl ──────────────────────────────

  describe('getAuthorizationUrl', () => {
    it('should return a Microsoft login URL', () => {
      const url = getAuthorizationUrl();
      expect(url).toContain('login.microsoftonline.com');
      expect(url).toContain('oauth2/v2.0/authorize');
    });

    it('should include required scopes', () => {
      const url = getAuthorizationUrl();
      expect(url).toContain('Mail.Send');
      expect(url).toContain('offline_access');
    });

    it('should include client_id parameter', () => {
      const url = getAuthorizationUrl();
      expect(url).toContain('client_id=');
    });

    it('should include response_type=code', () => {
      const url = getAuthorizationUrl();
      expect(url).toContain('response_type=code');
    });

    it('should include redirect_uri', () => {
      const url = getAuthorizationUrl();
      expect(url).toContain('redirect_uri=');
    });
  });

  // ─── exchangeCodeForToken ──────────────────────────────

  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token', async () => {
      mockAxiosPost.mockResolvedValue({
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        },
      });

      const result = await exchangeCodeForToken('auth-code-123');

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(3600);
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    });

    it('should store tokens after exchange', async () => {
      mockAxiosPost.mockResolvedValue({
        data: {
          access_token: 'stored-token',
          refresh_token: 'stored-refresh',
          expires_in: 3600,
        },
      });

      await exchangeCodeForToken('code');

      const tokens = getTokens();
      expect(tokens.accessToken).toBe('stored-token');
      expect(tokens.refreshToken).toBe('stored-refresh');
    });

    it('should throw on API failure', async () => {
      mockAxiosPost.mockRejectedValue({
        response: { data: { error: 'invalid_grant' } },
        message: 'Request failed',
      });

      await expect(exchangeCodeForToken('bad-code')).rejects.toThrow(
        'Failed to obtain Outlook access token'
      );
    });
  });

  // ─── refreshAccessToken ──────────────────────────────

  describe('refreshAccessToken', () => {
    it('should refresh the access token', async () => {
      setTokens({
        accessToken: 'old',
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() - 1000,
      });
      mockAxiosPost.mockResolvedValue({
        data: {
          access_token: 'refreshed-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        },
      });

      const result = await refreshAccessToken();

      expect(result).toBe(true);
      expect(getTokens().accessToken).toBe('refreshed-token');
    });

    it('should return false when no refresh token available', async () => {
      setTokens({ accessToken: 'old', refreshToken: null, tokenExpiry: null });

      // The throw is inside try/catch, so it returns false rather than propagating
      const result = await refreshAccessToken();
      expect(result).toBe(false);
    });

    it('should clear tokens on refresh failure', async () => {
      setTokens({ accessToken: 'old', refreshToken: 'rf', tokenExpiry: Date.now() });
      mockAxiosPost.mockRejectedValue(new Error('token expired'));

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(getTokens().accessToken).toBeNull();
    });

    it('should keep existing refresh token if new one not returned', async () => {
      setTokens({ accessToken: 'old', refreshToken: 'keep-me', tokenExpiry: Date.now() });
      mockAxiosPost.mockResolvedValue({
        data: {
          access_token: 'new-access',
          expires_in: 3600,
          // No refresh_token in response
        },
      });

      await refreshAccessToken();
      expect(getTokens().refreshToken).toBe('keep-me');
    });
  });

  // ─── sendEmail ──────────────────────────────

  describe('sendEmail', () => {
    beforeEach(() => {
      setTokens({
        accessToken: 'valid-token',
        refreshToken: 'rf',
        tokenExpiry: Date.now() + 600000,
      });
    });

    it('should send email via Graph API', async () => {
      mockAxiosPost.mockResolvedValue({
        headers: { 'request-id': 'msg-123' },
      });

      const result = await sendEmail({
        to: 'patient@example.com',
        subject: 'Time-paminnelse',
        body: '<p>Hei Ola!</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(result.method).toBe('outlook');
    });

    it('should handle array of recipients', async () => {
      mockAxiosPost.mockResolvedValue({ headers: { 'request-id': 'msg-multi' } });

      const result = await sendEmail({
        to: ['a@test.com', 'b@test.com'],
        subject: 'Test',
        body: '<p>Hi</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should handle CC and BCC recipients', async () => {
      mockAxiosPost.mockResolvedValue({ headers: {} });

      const result = await sendEmail({
        to: 'main@test.com',
        subject: 'CC Test',
        body: '<p>Body</p>',
        cc: 'cc@test.com',
        bcc: ['bcc1@test.com', 'bcc2@test.com'],
      });

      expect(result.success).toBe(true);
      const callBody = mockAxiosPost.mock.calls[0][1];
      expect(callBody.message.ccRecipients).toHaveLength(1);
      expect(callBody.message.bccRecipients).toHaveLength(2);
    });

    it('should handle attachments', async () => {
      mockAxiosPost.mockResolvedValue({ headers: {} });

      const result = await sendEmail({
        to: 'to@test.com',
        subject: 'With attachment',
        body: '<p>See attached</p>',
        attachments: [
          { name: 'rapport.pdf', content: 'base64data', contentType: 'application/pdf' },
        ],
      });

      expect(result.success).toBe(true);
      const callBody = mockAxiosPost.mock.calls[0][1];
      expect(callBody.message.attachments).toHaveLength(1);
    });

    it('should throw when not authenticated', async () => {
      setTokens({ accessToken: null, refreshToken: null, tokenExpiry: null });

      await expect(sendEmail({ to: 'test@test.com', subject: 'X', body: 'Y' })).rejects.toThrow(
        'not authenticated'
      );
    });

    it('should throw on API error', async () => {
      mockAxiosPost.mockRejectedValue({
        response: { data: { error: { message: 'Forbidden' } } },
        message: 'Request failed',
      });

      await expect(sendEmail({ to: 'test@test.com', subject: 'X', body: 'Y' })).rejects.toThrow(
        'Outlook email send failed'
      );
    });
  });

  // ─── sendTemplateEmail ──────────────────────────────

  describe('sendTemplateEmail', () => {
    it('should send email with template variables', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosPost.mockResolvedValue({ headers: { 'request-id': 'tpl-1' } });

      const result = await sendTemplateEmail('patient@test.com', 'reminder', {
        subject: 'Paminnelse',
        patient_name: 'Ola Nordmann',
        message: 'Du har time i morgen',
        clinic_name: 'Oslo Kiropraktikk',
      });

      expect(result.success).toBe(true);
    });

    it('should use default subject when not provided', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosPost.mockResolvedValue({ headers: {} });

      const result = await sendTemplateEmail('test@test.com', 'generic', {
        patient_name: 'Kari',
        message: 'Hello',
      });

      expect(result.success).toBe(true);
    });
  });

  // ─── getUserProfile ──────────────────────────────

  describe('getUserProfile', () => {
    it('should return user profile when authenticated', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockResolvedValue({
        data: {
          mail: 'user@clinic.no',
          displayName: 'Dr. Hansen',
          id: 'user-123',
        },
      });

      const result = await getUserProfile();

      expect(result.email).toBe('user@clinic.no');
      expect(result.displayName).toBe('Dr. Hansen');
    });

    it('should return null on error', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockRejectedValue(new Error('Network error'));

      const result = await getUserProfile();
      expect(result).toBeNull();
    });

    it('should use userPrincipalName when mail is null', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockResolvedValue({
        data: { mail: null, userPrincipalName: 'upn@clinic.no', displayName: 'User', id: 'u1' },
      });

      const result = await getUserProfile();
      expect(result.email).toBe('upn@clinic.no');
    });
  });

  // ─── getInboxMessages ──────────────────────────────

  describe('getInboxMessages', () => {
    it('should return inbox messages', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockResolvedValue({
        data: { value: [{ id: 'm1', subject: 'Reply', isRead: false }] },
      });

      const result = await getInboxMessages(5);
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Reply');
    });

    it('should return empty array on error', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockRejectedValue(new Error('Failed'));

      const result = await getInboxMessages();
      expect(result).toEqual([]);
    });
  });

  // ─── checkConnection ──────────────────────────────

  describe('checkConnection', () => {
    it('should return connected when authenticated', async () => {
      setTokens({ accessToken: 'valid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockResolvedValue({
        data: { mail: 'user@test.com', displayName: 'Test', id: '1' },
      });

      const result = await checkConnection();
      expect(result.connected).toBe(true);
      expect(result.authenticated).toBe(true);
    });

    it('should return not connected when not authenticated', async () => {
      setTokens({ accessToken: null, refreshToken: null, tokenExpiry: null });

      const result = await checkConnection();
      expect(result.connected).toBe(false);
      expect(result.message).toBe('Not authenticated');
    });

    it('should return not connected when profile fetch fails', async () => {
      setTokens({ accessToken: 'invalid', refreshToken: 'rf', tokenExpiry: Date.now() + 600000 });
      mockAxiosGet.mockRejectedValue(new Error('Unauthorized'));

      const result = await checkConnection();
      expect(result.connected).toBe(false);
    });
  });

  // ─── setTokens / getTokens ──────────────────────────────

  describe('token management', () => {
    it('should set and get tokens', () => {
      setTokens({
        accessToken: 'acc',
        refreshToken: 'ref',
        tokenExpiry: 9999,
      });

      const tokens = getTokens();
      expect(tokens.accessToken).toBe('acc');
      expect(tokens.refreshToken).toBe('ref');
      expect(tokens.tokenExpiry).toBe(9999);
    });
  });
});
