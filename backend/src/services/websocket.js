/**
 * WebSocket Service
 * Real-time updates via socket.io
 */
import { Server } from 'socket.io';
import { validateSession } from '../auth/sessions.js';
import logger from '../utils/logger.js';

let io = null;
const connectedUsers = new Map(); // userId -> Set<socketId>
const patientViewers = new Map(); // patientId -> Map<userId, { name, socketId }>

/**
 * Initialize WebSocket server
 * @param {import('http').Server} httpServer
 */
export function initializeWebSocket(httpServer) {
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware - validate session cookie on handshake
  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        // Allow connection in dev mode without auth
        if (process.env.DEV_SKIP_AUTH === 'true') {
          socket.user = {
            id: 'dev-user',
            organizationId: 'a0000000-0000-0000-0000-000000000001',
            role: 'ADMIN',
          };
          return next();
        }
        return next(new Error('Authentication required'));
      }

      // Parse session cookie
      const sessionMatch = cookies.match(/session=([^;]+)/);
      if (!sessionMatch) {
        if (process.env.DEV_SKIP_AUTH === 'true') {
          socket.user = {
            id: 'dev-user',
            organizationId: 'a0000000-0000-0000-0000-000000000001',
            role: 'ADMIN',
          };
          return next();
        }
        return next(new Error('Session required'));
      }

      const result = await validateSession(sessionMatch[1]);
      if (!result) {
        return next(new Error('Invalid session'));
      }

      socket.user = result.user;
      socket.organizationId = result.user.organizationId;
      next();
    } catch (error) {
      logger.error('WebSocket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const orgId = socket.user?.organizationId || socket.organizationId;

    logger.info(`WebSocket connected: ${userId} (org: ${orgId})`);

    // Join org room
    if (orgId) {
      socket.join(`org:${orgId}`);
    }

    // Track connected users
    if (userId) {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);
    }

    // Track which patient this socket is currently viewing
    let currentViewingPatient = null;

    // Patient presence: user starts viewing a patient
    socket.on('patient:viewing', ({ patientId, userName }) => {
      if (!patientId || !userId) {
        return;
      }

      // Leave previous patient if any
      if (currentViewingPatient && currentViewingPatient !== patientId) {
        removePatientViewer(currentViewingPatient, userId, orgId);
      }

      currentViewingPatient = patientId;

      if (!patientViewers.has(patientId)) {
        patientViewers.set(patientId, new Map());
      }
      patientViewers.get(patientId).set(userId, {
        name: userName || 'Ukjent bruker',
        socketId: socket.id,
      });

      // Notify others in the org viewing the same patient
      socket.to(`org:${orgId}`).emit('patient:user-joined', {
        patientId,
        userId,
        userName: userName || 'Ukjent bruker',
      });
    });

    // Patient presence: user leaves a patient view
    socket.on('patient:leaving', ({ patientId }) => {
      if (!patientId || !userId) {
        return;
      }
      currentViewingPatient = null;
      removePatientViewer(patientId, userId, orgId);
    });

    // Client requests who's viewing a specific patient
    socket.on('patient:who-viewing', ({ patientId }, callback) => {
      if (typeof callback !== 'function') {
        return;
      }
      const viewers = patientViewers.get(patientId);
      if (!viewers) {
        return callback([]);
      }
      const result = [];
      for (const [uid, data] of viewers) {
        if (uid !== userId) {
          result.push({ userId: uid, name: data.name });
        }
      }
      callback(result);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${userId} (${reason})`);
      if (userId && connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
        }
      }
      // Clean up patient viewing on disconnect
      if (currentViewingPatient) {
        removePatientViewer(currentViewingPatient, userId, orgId);
      }
    });

    // Client can request who's online
    socket.on('who-online', (callback) => {
      if (typeof callback === 'function') {
        callback([...connectedUsers.keys()]);
      }
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

/**
 * Remove a user from patient viewers and notify org
 */
function removePatientViewer(patientId, userId, orgId) {
  const viewers = patientViewers.get(patientId);
  if (viewers) {
    viewers.delete(userId);
    if (viewers.size === 0) {
      patientViewers.delete(patientId);
    }
  }
  // Notify org
  if (io && orgId) {
    io.to(`org:${orgId}`).emit('patient:user-left', { patientId, userId });
  }
}

/**
 * Broadcast event to entire organization
 */
export function broadcastToOrg(orgId, event, data) {
  if (!io) {
    return;
  }
  io.to(`org:${orgId}`).emit(event, data);
}

/**
 * Send event to specific user
 */
export function sendToUser(userId, event, data) {
  if (!io) {
    return;
  }
  const sockets = connectedUsers.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

/**
 * Get count of connected users for an org
 */
export function getOnlineCount(orgId) {
  if (!io) {
    return 0;
  }
  const room = io.sockets.adapter.rooms.get(`org:${orgId}`);
  return room ? room.size : 0;
}

/**
 * Get the io instance (for advanced usage)
 */
export function getIO() {
  return io;
}
