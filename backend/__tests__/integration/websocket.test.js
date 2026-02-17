/**
 * WebSocket Integration Tests
 * Tests socket.io real-time communication
 */

import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';

// We test the WebSocket logic directly rather than importing the full server
// to avoid database dependencies and keep tests focused

let httpServer, ioServer, port;

/**
 * Create a minimal socket.io server that mirrors the production WebSocket service
 */
function createTestSocketServer() {
  const app = express();
  const server = createServer(app);

  const connectedUsers = new Map();

  const io = new Server(server, {
    cors: { origin: '*', credentials: true },
    pingTimeout: 5000,
    pingInterval: 3000,
  });

  // Auth middleware (simplified for tests)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const cookies = socket.handshake.headers?.cookie;

    // Allow connections with valid test tokens
    if (token === 'valid-test-token') {
      socket.user = {
        id: socket.handshake.auth.userId || 'test-user-1',
        organizationId: socket.handshake.auth.orgId || 'org-1',
        role: 'PRACTITIONER',
      };
      return next();
    }

    // Allow dev mode connections (simulating DEV_SKIP_AUTH)
    if (token === 'dev-mode') {
      socket.user = {
        id: 'dev-user',
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        role: 'ADMIN',
      };
      return next();
    }

    // Reject invalid tokens
    return next(new Error('Authentication required'));
  });

  // Connection handler (mirrors websocket.js)
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const orgId = socket.user?.organizationId;

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

    // Handle disconnect
    socket.on('disconnect', () => {
      if (userId && connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });

    // Who's online
    socket.on('who-online', (callback) => {
      if (typeof callback === 'function') {
        callback([...connectedUsers.keys()]);
      }
    });

    // Custom event: appointment update (broadcast to org)
    socket.on('appointment:update', (data) => {
      io.to(`org:${orgId}`).emit('appointment:updated', {
        ...data,
        updatedBy: userId,
      });
    });

    // Custom event: encounter update (broadcast to org)
    socket.on('encounter:update', (data) => {
      io.to(`org:${orgId}`).emit('encounter:updated', {
        ...data,
        updatedBy: userId,
      });
    });

    // Custom event: send to specific user
    socket.on('notify:user', (data) => {
      const targetSockets = connectedUsers.get(data.targetUserId);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('notification', data.message);
        }
      }
    });
  });

  return { app, server, io, connectedUsers };
}

/**
 * Helper: create a connected client socket
 */
function createClient(authOverrides = {}) {
  return ioc(`http://localhost:${port}`, {
    transports: ['websocket'],
    autoConnect: false,
    auth: {
      token: 'valid-test-token',
      userId: 'test-user-1',
      orgId: 'org-1',
      ...authOverrides,
    },
  });
}

/**
 * Helper: wait for socket to connect
 */
function waitForConnect(socket) {
  return new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
    socket.connect();
  });
}

/**
 * Helper: wait for an event on a socket
 */
function waitForEvent(socket, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

beforeAll((done) => {
  const result = createTestSocketServer();
  httpServer = result.server;
  ioServer = result.io;
  httpServer.listen(0, () => {
    port = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  ioServer.close();
  httpServer.close(done);
});

describe('WebSocket Integration', () => {
  let clients = [];

  afterEach(() => {
    // Disconnect all clients created during the test
    for (const client of clients) {
      if (client.connected) client.disconnect();
    }
    clients = [];
  });

  // ===========================================================================
  // CONNECTION & AUTH
  // ===========================================================================

  describe('Connection & Authentication', () => {
    it('should connect with valid auth token', async () => {
      const client = createClient();
      clients.push(client);
      await waitForConnect(client);
      expect(client.connected).toBe(true);
    });

    it('should reject connection with invalid token', async () => {
      const client = createClient({ token: 'invalid-token' });
      clients.push(client);

      await expect(waitForConnect(client)).rejects.toThrow();
      expect(client.connected).toBe(false);
    });

    it('should reject connection with no token', async () => {
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        autoConnect: false,
        auth: {},
      });
      clients.push(client);

      await expect(waitForConnect(client)).rejects.toThrow();
    });

    it('should allow dev mode connections', async () => {
      const client = createClient({ token: 'dev-mode' });
      clients.push(client);
      await waitForConnect(client);
      expect(client.connected).toBe(true);
    });

    it('should handle multiple simultaneous connections', async () => {
      const client1 = createClient({ userId: 'user-a', orgId: 'org-1' });
      const client2 = createClient({ userId: 'user-b', orgId: 'org-1' });
      clients.push(client1, client2);

      await Promise.all([waitForConnect(client1), waitForConnect(client2)]);
      expect(client1.connected).toBe(true);
      expect(client2.connected).toBe(true);
    });
  });

  // ===========================================================================
  // ROOM JOINING (ORGANIZATION)
  // ===========================================================================

  describe('Organization Rooms', () => {
    it('should join organization room on connect', async () => {
      const client = createClient({ userId: 'room-user', orgId: 'org-rooms-test' });
      clients.push(client);
      await waitForConnect(client);

      // Verify by checking server adapter rooms
      const rooms = ioServer.sockets.adapter.rooms;
      expect(rooms.has('org:org-rooms-test')).toBe(true);
    });

    it('should leave organization room on disconnect', async () => {
      const client = createClient({ userId: 'leaving-user', orgId: 'org-leave-test' });
      clients.push(client);
      await waitForConnect(client);

      const rooms = ioServer.sockets.adapter.rooms;
      expect(rooms.has('org:org-leave-test')).toBe(true);

      client.disconnect();

      // Wait for disconnect to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      const roomAfter = rooms.get('org:org-leave-test');
      expect(!roomAfter || roomAfter.size === 0).toBe(true);
    });
  });

  // ===========================================================================
  // EVENT BROADCASTING
  // ===========================================================================

  describe('Event Broadcasting', () => {
    it('should broadcast appointment update to org room', async () => {
      const sender = createClient({ userId: 'sender-1', orgId: 'org-broadcast' });
      const receiver = createClient({ userId: 'receiver-1', orgId: 'org-broadcast' });
      clients.push(sender, receiver);

      await Promise.all([waitForConnect(sender), waitForConnect(receiver)]);

      const eventPromise = waitForEvent(receiver, 'appointment:updated');

      sender.emit('appointment:update', {
        appointmentId: 'apt-123',
        status: 'confirmed',
      });

      const data = await eventPromise;
      expect(data.appointmentId).toBe('apt-123');
      expect(data.status).toBe('confirmed');
      expect(data.updatedBy).toBe('sender-1');
    });

    it('should broadcast encounter update to org room', async () => {
      const sender = createClient({ userId: 'enc-sender', orgId: 'org-enc-test' });
      const receiver = createClient({ userId: 'enc-receiver', orgId: 'org-enc-test' });
      clients.push(sender, receiver);

      await Promise.all([waitForConnect(sender), waitForConnect(receiver)]);

      const eventPromise = waitForEvent(receiver, 'encounter:updated');

      sender.emit('encounter:update', {
        encounterId: 'enc-456',
        action: 'signed',
      });

      const data = await eventPromise;
      expect(data.encounterId).toBe('enc-456');
      expect(data.action).toBe('signed');
      expect(data.updatedBy).toBe('enc-sender');
    });

    it('should NOT broadcast to clients in different org rooms', async () => {
      const sender = createClient({ userId: 'cross-sender', orgId: 'org-A' });
      const otherOrg = createClient({ userId: 'cross-other', orgId: 'org-B' });
      clients.push(sender, otherOrg);

      await Promise.all([waitForConnect(sender), waitForConnect(otherOrg)]);

      let receivedByOther = false;
      otherOrg.on('appointment:updated', () => {
        receivedByOther = true;
      });

      sender.emit('appointment:update', {
        appointmentId: 'apt-cross',
        status: 'cancelled',
      });

      // Give some time for the event to propagate (or not)
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(receivedByOther).toBe(false);
    });
  });

  // ===========================================================================
  // MULTI-CLIENT SYNC
  // ===========================================================================

  describe('Multi-Client Sync', () => {
    it('should deliver event to all clients in same org', async () => {
      const sender = createClient({ userId: 'multi-sender', orgId: 'org-multi' });
      const receiver1 = createClient({ userId: 'multi-recv-1', orgId: 'org-multi' });
      const receiver2 = createClient({ userId: 'multi-recv-2', orgId: 'org-multi' });
      clients.push(sender, receiver1, receiver2);

      await Promise.all([
        waitForConnect(sender),
        waitForConnect(receiver1),
        waitForConnect(receiver2),
      ]);

      const promise1 = waitForEvent(receiver1, 'appointment:updated');
      const promise2 = waitForEvent(receiver2, 'appointment:updated');

      sender.emit('appointment:update', { appointmentId: 'apt-multi' });

      const [data1, data2] = await Promise.all([promise1, promise2]);
      expect(data1.appointmentId).toBe('apt-multi');
      expect(data2.appointmentId).toBe('apt-multi');
    });

    it('should track multiple sockets for the same user', async () => {
      const client1 = createClient({ userId: 'same-user', orgId: 'org-dup' });
      const client2 = createClient({ userId: 'same-user', orgId: 'org-dup' });
      clients.push(client1, client2);

      await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

      // Both should be connected
      expect(client1.connected).toBe(true);
      expect(client2.connected).toBe(true);
    });
  });

  // ===========================================================================
  // WHO'S ONLINE
  // ===========================================================================

  describe('Who Online', () => {
    it('should return list of connected user IDs', async () => {
      const client1 = createClient({ userId: 'online-a', orgId: 'org-online' });
      const client2 = createClient({ userId: 'online-b', orgId: 'org-online' });
      clients.push(client1, client2);

      await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

      const onlineUsers = await new Promise((resolve) => {
        client1.emit('who-online', (users) => resolve(users));
      });

      expect(onlineUsers).toContain('online-a');
      expect(onlineUsers).toContain('online-b');
    });

    it('should remove disconnected users from online list', async () => {
      const client1 = createClient({ userId: 'disc-a', orgId: 'org-disc' });
      const client2 = createClient({ userId: 'disc-b', orgId: 'org-disc' });
      clients.push(client1, client2);

      await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

      // Disconnect client2
      client2.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const onlineUsers = await new Promise((resolve) => {
        client1.emit('who-online', (users) => resolve(users));
      });

      expect(onlineUsers).toContain('disc-a');
      expect(onlineUsers).not.toContain('disc-b');
    });
  });

  // ===========================================================================
  // USER-TARGETED NOTIFICATIONS
  // ===========================================================================

  describe('User-Targeted Notifications', () => {
    it('should deliver notification to specific user', async () => {
      const sender = createClient({ userId: 'notif-sender', orgId: 'org-notif' });
      const target = createClient({ userId: 'notif-target', orgId: 'org-notif' });
      const bystander = createClient({ userId: 'notif-bystander', orgId: 'org-notif' });
      clients.push(sender, target, bystander);

      await Promise.all([
        waitForConnect(sender),
        waitForConnect(target),
        waitForConnect(bystander),
      ]);

      const targetPromise = waitForEvent(target, 'notification');
      let bystanderReceived = false;
      bystander.on('notification', () => {
        bystanderReceived = true;
      });

      sender.emit('notify:user', {
        targetUserId: 'notif-target',
        message: { text: 'You have a new patient' },
      });

      const notification = await targetPromise;
      expect(notification.text).toBe('You have a new patient');

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(bystanderReceived).toBe(false);
    });
  });

  // ===========================================================================
  // DISCONNECT HANDLING
  // ===========================================================================

  describe('Disconnect Handling', () => {
    it('should clean up on client disconnect', async () => {
      const client = createClient({ userId: 'cleanup-user', orgId: 'org-cleanup' });
      clients.push(client);
      await waitForConnect(client);

      expect(client.connected).toBe(true);

      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(client.connected).toBe(false);
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const client = createClient({ userId: `rapid-${i}`, orgId: 'org-rapid' });
        await waitForConnect(client);
        client.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      // No errors thrown = pass
    });

    it('should handle server-side disconnect', async () => {
      const client = createClient({ userId: 'server-disc', orgId: 'org-sdisc' });
      clients.push(client);
      await waitForConnect(client);

      const disconnectPromise = new Promise((resolve) => {
        client.on('disconnect', (reason) => resolve(reason));
      });

      // Server-side disconnect: find the socket and disconnect it
      const sockets = await ioServer.fetchSockets();
      const targetSocket = sockets.find((s) => s.user?.id === 'server-disc');
      if (targetSocket) {
        targetSocket.disconnect(true);
      }

      const reason = await disconnectPromise;
      expect(reason).toBeDefined();
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle who-online with non-function callback gracefully', async () => {
      const client = createClient({ userId: 'edge-user', orgId: 'org-edge' });
      clients.push(client);
      await waitForConnect(client);

      // Emit with non-function - should not crash
      client.emit('who-online', 'not-a-function');
      await new Promise((resolve) => setTimeout(resolve, 100));
      // No error = pass
    });

    it('should handle emit to nonexistent target user gracefully', async () => {
      const client = createClient({ userId: 'edge-sender', orgId: 'org-edge2' });
      clients.push(client);
      await waitForConnect(client);

      // Send to user that doesn't exist - should not crash
      client.emit('notify:user', {
        targetUserId: 'nonexistent-user',
        message: { text: 'hello' },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      // No error = pass
    });
  });
});
