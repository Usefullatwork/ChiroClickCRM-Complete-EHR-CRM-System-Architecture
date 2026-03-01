/**
 * Socket Service Tests
 * Tests for WebSocket singleton, hooks (useSocketEvent, useSocketStatus, useOnlineUsers)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// We need to reset module state between tests since socket.js uses a module-level singleton
let connectSocket, disconnectSocket, getSocket, useSocketEvent, useSocketStatus, useOnlineUsers;

describe('Socket Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockReset();
    mockSocket.off.mockReset();
    mockSocket.emit.mockReset();
    mockSocket.disconnect.mockReset();

    // Re-import to reset module singleton
    vi.resetModules();
    const mod = await import('../../services/socket.js');
    connectSocket = mod.connectSocket;
    disconnectSocket = mod.disconnectSocket;
    getSocket = mod.getSocket;
    useSocketEvent = mod.useSocketEvent;
    useSocketStatus = mod.useSocketStatus;
    useOnlineUsers = mod.useOnlineUsers;
  });

  // ============================================================================
  // connectSocket
  // ============================================================================

  describe('connectSocket', () => {
    it('should create a socket connection and return the socket', () => {
      const result = connectSocket();

      expect(result).toBe(mockSocket);
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should return existing socket if already connected', () => {
      mockSocket.connected = true;
      // First call sets up the singleton
      const first = connectSocket();
      // Since socket.connected is true on the first call, it returns existing
      expect(first).toBe(mockSocket);
    });

    it('should create a new socket when not connected', () => {
      mockSocket.connected = false;
      const result = connectSocket();
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // disconnectSocket
  // ============================================================================

  describe('disconnectSocket', () => {
    it('should disconnect and null out the socket', () => {
      connectSocket();
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(getSocket()).toBeNull();
    });

    it('should do nothing if no socket exists', () => {
      // No connectSocket() call first
      disconnectSocket();
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // getSocket
  // ============================================================================

  describe('getSocket', () => {
    it('should return null before connection', () => {
      expect(getSocket()).toBeNull();
    });

    it('should return the socket instance after connection', () => {
      connectSocket();
      expect(getSocket()).toBe(mockSocket);
    });

    it('should return null after disconnection', () => {
      connectSocket();
      disconnectSocket();
      expect(getSocket()).toBeNull();
    });
  });

  // ============================================================================
  // useSocketEvent
  // ============================================================================

  describe('useSocketEvent', () => {
    it('should subscribe to the event on mount', () => {
      connectSocket();
      const callback = vi.fn();

      renderHook(() => useSocketEvent('test-event', callback));

      expect(mockSocket.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    });

    it('should unsubscribe from the event on unmount', () => {
      connectSocket();
      const callback = vi.fn();

      const { unmount } = renderHook(() => useSocketEvent('test-event', callback));

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', expect.any(Function));
    });

    it('should do nothing if socket is not initialized', () => {
      // No connectSocket() call
      const callback = vi.fn();

      renderHook(() => useSocketEvent('test-event', callback));

      // on should not have been called for 'test-event' (no socket)
      // (mock might still have calls from other sources, so check specifically)
      const testEventCalls = mockSocket.on.mock.calls.filter((call) => call[0] === 'test-event');
      expect(testEventCalls.length).toBe(0);
    });

    it('should call latest callback when event fires', () => {
      connectSocket();
      const callback = vi.fn();

      renderHook(() => useSocketEvent('message', callback));

      // Find the handler registered for 'message'
      const messageCall = mockSocket.on.mock.calls.find((call) => call[0] === 'message');
      expect(messageCall).toBeDefined();

      // Simulate the event firing
      const handler = messageCall[1];
      handler('test-data');

      expect(callback).toHaveBeenCalledWith('test-data');
    });
  });

  // ============================================================================
  // useSocketStatus
  // ============================================================================

  describe('useSocketStatus', () => {
    it('should return false initially when socket is not connected', () => {
      connectSocket();
      mockSocket.connected = false;

      const { result } = renderHook(() => useSocketStatus());

      expect(result.current).toBe(false);
    });

    it('should update to true when connect event fires', () => {
      connectSocket();

      const { result } = renderHook(() => useSocketStatus());

      // Find the connect handler registered by useSocketStatus
      const connectCalls = mockSocket.on.mock.calls.filter((call) => call[0] === 'connect');
      // The last connect handler is from useSocketStatus (earlier ones are from connectSocket)
      const statusConnectHandler = connectCalls[connectCalls.length - 1]?.[1];

      if (statusConnectHandler) {
        act(() => {
          statusConnectHandler();
        });

        expect(result.current).toBe(true);
      }
    });

    it('should update to false when disconnect event fires', () => {
      connectSocket();
      mockSocket.connected = true;

      const { result } = renderHook(() => useSocketStatus());

      // Find the disconnect handler registered by useSocketStatus
      const disconnectCalls = mockSocket.on.mock.calls.filter((call) => call[0] === 'disconnect');
      const statusDisconnectHandler = disconnectCalls[disconnectCalls.length - 1]?.[1];

      if (statusDisconnectHandler) {
        act(() => {
          statusDisconnectHandler();
        });

        expect(result.current).toBe(false);
      }
    });

    it('should clean up event listeners on unmount', () => {
      connectSocket();

      const { unmount } = renderHook(() => useSocketStatus());

      unmount();

      const offCalls = mockSocket.off.mock.calls;
      const connectOff = offCalls.find((call) => call[0] === 'connect');
      const disconnectOff = offCalls.find((call) => call[0] === 'disconnect');

      expect(connectOff).toBeDefined();
      expect(disconnectOff).toBeDefined();
    });
  });

  // ============================================================================
  // useOnlineUsers
  // ============================================================================

  describe('useOnlineUsers', () => {
    it('should emit who-online on mount', () => {
      connectSocket();

      renderHook(() => useOnlineUsers());

      expect(mockSocket.emit).toHaveBeenCalledWith('who-online', expect.any(Function));
    });

    it('should return user array from who-online callback', () => {
      connectSocket();

      // Make emit call the callback with user data
      mockSocket.emit.mockImplementation((event, cb) => {
        if (event === 'who-online') {
          cb([
            { id: 'u1', name: 'Dr. Hansen' },
            { id: 'u2', name: 'Dr. Olsen' },
          ]);
        }
      });

      const { result } = renderHook(() => useOnlineUsers());

      expect(result.current).toEqual([
        { id: 'u1', name: 'Dr. Hansen' },
        { id: 'u2', name: 'Dr. Olsen' },
      ]);
    });

    it('should return empty array when who-online returns null', () => {
      connectSocket();

      mockSocket.emit.mockImplementation((event, cb) => {
        if (event === 'who-online') {
          cb(null);
        }
      });

      const { result } = renderHook(() => useOnlineUsers());

      expect(result.current).toEqual([]);
    });

    it('should return empty array when socket is not initialized', () => {
      // No connectSocket() call
      const { result } = renderHook(() => useOnlineUsers());

      expect(result.current).toEqual([]);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
