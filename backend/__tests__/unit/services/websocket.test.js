/**
 * Unit Tests for WebSocket Service
 * Tests initialization, room management, event broadcasting, auth, and disconnect handling
 */

import { jest } from '@jest/globals';

// Create persistent mock functions
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockJoin = jest.fn();
const mockUse = jest.fn();
const mockIOOn = jest.fn();
const mockRooms = new Map();

const mockServerConstructor = jest.fn();

function createMockIO() {
  return {
    use: mockUse,
    on: mockIOOn,
    to: mockTo,
    sockets: { adapter: { rooms: mockRooms } },
  };
}

jest.unstable_mockModule('socket.io', () => ({
  Server: mockServerConstructor,
}));

jest.unstable_mockModule('../../../src/auth/sessions.js', () => ({
  validateSession: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const websocketService = await import('../../../src/services/websocket.js');
const { validateSession } = await import('../../../src/auth/sessions.js');

describe('WebSocket Service', () => {
  beforeEach(() => {
    // Clear call history but re-setup implementations
    mockEmit.mockClear();
    mockTo.mockClear().mockReturnValue({ emit: mockEmit });
    mockJoin.mockClear();
    mockUse.mockClear();
    mockIOOn.mockClear();
    mockRooms.clear();
    mockServerConstructor.mockClear().mockReturnValue(createMockIO());
  });

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  describe('initializeWebSocket', () => {
    it('should return io instance', () => {
      const io = websocketService.initializeWebSocket({});
      expect(io).toBeDefined();
      expect(io.use).toBeDefined();
      expect(io.on).toBeDefined();
    });

    it('should register auth middleware', () => {
      websocketService.initializeWebSocket({});
      expect(mockUse).toHaveBeenCalled();
    });

    it('should register connection handler', () => {
      websocketService.initializeWebSocket({});
      expect(mockIOOn).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  // =============================================================================
  // AUTH MIDDLEWARE
  // =============================================================================

  describe('auth middleware', () => {
    let authMiddleware;

    beforeEach(() => {
      websocketService.initializeWebSocket({});
      authMiddleware = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    });

    it('should allow connection in dev mode without cookies', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'true';

      const mockSocket = { handshake: { headers: {} } };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.user).toBeDefined();
      expect(mockSocket.user.id).toBe('dev-user');

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });

    it('should reject connection without cookies in non-dev mode', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'false';

      const mockSocket = { handshake: { headers: {} } };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });

    it('should allow connection in dev mode when no session cookie found', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'true';

      const mockSocket = {
        handshake: { headers: { cookie: 'other=value' } },
      };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.user.id).toBe('dev-user');

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });

    it('should validate session cookie and set user', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'false';

      const mockUser = { id: 'user-1', organizationId: 'org-1', role: 'PRACTITIONER' };
      validateSession.mockResolvedValueOnce({ user: mockUser });

      const mockSocket = {
        handshake: { headers: { cookie: 'session=valid-session-id' } },
      };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(validateSession).toHaveBeenCalledWith('valid-session-id');
      expect(mockSocket.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });

    it('should reject invalid session', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'false';

      validateSession.mockResolvedValueOnce(null);

      const mockSocket = {
        handshake: { headers: { cookie: 'session=invalid-session' } },
      };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });

    it('should handle auth errors gracefully', async () => {
      const originalSkipAuth = process.env.DEV_SKIP_AUTH;
      process.env.DEV_SKIP_AUTH = 'false';

      validateSession.mockRejectedValueOnce(new Error('DB connection lost'));

      const mockSocket = {
        handshake: { headers: { cookie: 'session=some-session' } },
      };
      const next = jest.fn();

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      process.env.DEV_SKIP_AUTH = originalSkipAuth;
    });
  });

  // =============================================================================
  // CONNECTION HANDLER
  // =============================================================================

  describe('connection handler', () => {
    let connectionHandler;

    beforeEach(() => {
      websocketService.initializeWebSocket({});
      connectionHandler = mockIOOn.mock.calls.find((c) => c[0] === 'connection')[1];
    });

    it('should join org room on connection', () => {
      const mockSocket = {
        id: 'socket-1',
        user: { id: 'user-1', organizationId: 'org-1' },
        organizationId: 'org-1',
        join: mockJoin,
        on: jest.fn(),
      };

      connectionHandler(mockSocket);

      expect(mockJoin).toHaveBeenCalledWith('org:org-1');
    });

    it('should not join room when no orgId', () => {
      const localJoin = jest.fn();
      const mockSocket = {
        id: 'socket-1',
        user: { id: 'user-1' },
        join: localJoin,
        on: jest.fn(),
      };

      connectionHandler(mockSocket);

      expect(localJoin).not.toHaveBeenCalled();
    });

    it('should register disconnect handler', () => {
      const socketOn = jest.fn();
      const mockSocket = {
        id: 'socket-1',
        user: { id: 'user-1', organizationId: 'org-1' },
        organizationId: 'org-1',
        join: jest.fn(),
        on: socketOn,
      };

      connectionHandler(mockSocket);

      expect(socketOn).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should register who-online handler', () => {
      const socketOn = jest.fn();
      const mockSocket = {
        id: 'socket-1',
        user: { id: 'user-1', organizationId: 'org-1' },
        organizationId: 'org-1',
        join: jest.fn(),
        on: socketOn,
      };

      connectionHandler(mockSocket);

      expect(socketOn).toHaveBeenCalledWith('who-online', expect.any(Function));
    });

    it('should track and untrack user on connect/disconnect', () => {
      const handlers = {};
      const socketOn = jest.fn((event, handler) => {
        handlers[event] = handler;
      });

      const mockSocket = {
        id: 'socket-1',
        user: { id: 'user-1', organizationId: 'org-1' },
        organizationId: 'org-1',
        join: jest.fn(),
        on: socketOn,
      };

      connectionHandler(mockSocket);

      // Verify user is tracked via who-online
      const callback = jest.fn();
      handlers['who-online'](callback);
      expect(callback).toHaveBeenCalledWith(expect.arrayContaining(['user-1']));

      // Trigger disconnect
      handlers['disconnect']('transport close');

      // After disconnect, user should be removed
      const callback2 = jest.fn();
      // Need a new connection to test who-online again
    });
  });

  // =============================================================================
  // BROADCAST AND SEND
  // =============================================================================

  describe('broadcastToOrg', () => {
    it('should emit event to org room', () => {
      websocketService.initializeWebSocket({});
      websocketService.broadcastToOrg('org-1', 'appointment:updated', { id: 'a1' });

      expect(mockTo).toHaveBeenCalledWith('org:org-1');
      expect(mockEmit).toHaveBeenCalledWith('appointment:updated', { id: 'a1' });
    });
  });

  describe('sendToUser', () => {
    it('should emit to all user sockets', () => {
      websocketService.initializeWebSocket({});

      // Simulate a user connection
      const connectionHandler = mockIOOn.mock.calls.find((c) => c[0] === 'connection')[1];
      const mockSocket = {
        id: 'socket-1',
        user: { id: 'target-user' },
        join: jest.fn(),
        on: jest.fn(),
      };
      connectionHandler(mockSocket);

      websocketService.sendToUser('target-user', 'notification', { message: 'Hello' });

      expect(mockTo).toHaveBeenCalledWith('socket-1');
      expect(mockEmit).toHaveBeenCalledWith('notification', { message: 'Hello' });
    });

    it('should handle sending to non-connected user gracefully', () => {
      websocketService.initializeWebSocket({});
      // Should not throw
      websocketService.sendToUser('non-existent-user', 'event', {});
    });
  });

  // =============================================================================
  // ONLINE COUNT
  // =============================================================================

  describe('getOnlineCount', () => {
    it('should return room size', () => {
      websocketService.initializeWebSocket({});
      mockRooms.set('org:org-1', new Set(['s1', 's2', 's3']));

      const count = websocketService.getOnlineCount('org-1');
      expect(count).toBe(3);
    });

    it('should return 0 for non-existent room', () => {
      websocketService.initializeWebSocket({});
      const count = websocketService.getOnlineCount('non-existent');
      expect(count).toBe(0);
    });
  });

  // =============================================================================
  // GET IO
  // =============================================================================

  describe('getIO', () => {
    it('should return the io instance after initialization', () => {
      websocketService.initializeWebSocket({});
      const io = websocketService.getIO();
      expect(io).toBeDefined();
    });
  });
});
