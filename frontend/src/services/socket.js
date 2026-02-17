/**
 * Socket.io Client Service
 * Singleton WebSocket connection with React hooks
 */
import { io } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import logger from '../utils/logger';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

let socket = null;

/**
 * Initialize socket connection
 */
export function connectSocket() {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  socket.on('connect', () => {
    logger.info('WebSocket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    logger.info('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    logger.warn('WebSocket connection error:', error.message);
  });

  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Hook: Subscribe to a socket event
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function useSocketEvent(event, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handler = (...args) => callbackRef.current(...args);
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [event]);
}

/**
 * Hook: Get socket connection status
 */
export function useSocketStatus() {
  const [connected, setConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return connected;
}

/**
 * Hook: Get online users
 */
export function useOnlineUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit('who-online', (onlineUsers) => {
      setUsers(onlineUsers || []);
    });
  }, []);

  return users;
}
