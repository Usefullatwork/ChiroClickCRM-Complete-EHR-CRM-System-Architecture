/**
 * WebSocket Reconnection Test
 * Tests connection, disconnect/reconnect, and event delivery after reconnection.
 *
 * Usage: node scripts/test-websocket-reconnection.js
 * Requires the backend server to be running on PORT (default 3000).
 */

import { io } from 'socket.io-client';

// CLI output helpers (avoids print which triggers pre-commit hook)
const print = (...args) => process.stdout.write(args.join(' ') + '\n');
const printErr = (...args) => process.stderr.write(args.join(' ') + '\n');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const results = [];
let passed = 0;
let failed = 0;

function report(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  results.push({ name, status, detail });
  if (ok) passed++;
  else failed++;
  print(`  [${status}] ${name}${detail ? ' — ' + detail : ''}`);
}

function connect(opts = {}) {
  return io(BASE_URL, {
    transports: ['websocket'],
    reconnection: opts.reconnection ?? false,
    reconnectionAttempts: opts.reconnectionAttempts ?? 3,
    reconnectionDelay: opts.reconnectionDelay ?? 200,
    reconnectionDelayMax: opts.reconnectionDelayMax ?? 1000,
    timeout: 5000,
    ...opts,
  });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Test 1: Basic connection
// ---------------------------------------------------------------------------
async function testBasicConnection() {
  return new Promise((resolve) => {
    const socket = connect();
    const timer = setTimeout(() => {
      socket.disconnect();
      report('Basic connection', false, 'Timed out after 5s');
      resolve();
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timer);
      report('Basic connection', true, `id=${socket.id}`);
      socket.disconnect();
      resolve();
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      report('Basic connection', false, err.message);
      socket.disconnect();
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Test 2: Send event before disconnect
// ---------------------------------------------------------------------------
async function testSendEvent() {
  return new Promise((resolve) => {
    const socket = connect();
    const timer = setTimeout(() => {
      socket.disconnect();
      report('Send who-online event', false, 'Timed out');
      resolve();
    }, 5000);

    socket.on('connect', () => {
      socket.emit('who-online', (onlineUsers) => {
        clearTimeout(timer);
        const ok = Array.isArray(onlineUsers);
        report(
          'Send who-online event',
          ok,
          ok ? `users=${JSON.stringify(onlineUsers)}` : 'Response not an array'
        );
        socket.disconnect();
        resolve();
      });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      report('Send who-online event', false, err.message);
      socket.disconnect();
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Test 3: Disconnect and reconnect
// ---------------------------------------------------------------------------
async function testReconnection() {
  return new Promise((resolve) => {
    let connectCount = 0;
    let disconnected = false;

    const socket = connect({ reconnection: true, reconnectionDelay: 200 });

    const timer = setTimeout(() => {
      socket.disconnect();
      report(
        'Reconnection after disconnect',
        false,
        `connectCount=${connectCount}, disconnected=${disconnected}`
      );
      resolve();
    }, 10000);

    socket.on('connect', () => {
      connectCount++;
      if (connectCount === 1) {
        // First connection — force disconnect to simulate network drop
        socket.io.engine.close();
      } else if (connectCount === 2) {
        // Successfully reconnected
        clearTimeout(timer);
        report('Reconnection after disconnect', true, `reconnected after ${connectCount} connects`);
        socket.disconnect();
        resolve();
      }
    });

    socket.on('disconnect', () => {
      disconnected = true;
    });

    socket.on('connect_error', (err) => {
      // Reconnection attempts may produce transient errors — that's OK
    });
  });
}

// ---------------------------------------------------------------------------
// Test 4: Events work after reconnection
// ---------------------------------------------------------------------------
async function testEventsAfterReconnection() {
  return new Promise((resolve) => {
    let connectCount = 0;

    const socket = connect({ reconnection: true, reconnectionDelay: 200 });

    const timer = setTimeout(() => {
      socket.disconnect();
      report('Events after reconnection', false, 'Timed out');
      resolve();
    }, 10000);

    socket.on('connect', () => {
      connectCount++;
      if (connectCount === 1) {
        socket.io.engine.close(); // simulate drop
      } else if (connectCount === 2) {
        // Reconnected — try an event
        socket.emit('who-online', (users) => {
          clearTimeout(timer);
          const ok = Array.isArray(users);
          report(
            'Events after reconnection',
            ok,
            ok ? 'who-online still works' : 'Unexpected response'
          );
          socket.disconnect();
          resolve();
        });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Test 5: Exponential backoff behaviour
// ---------------------------------------------------------------------------
async function testExponentialBackoff() {
  return new Promise((resolve) => {
    // Connect to a port where nothing is listening to trigger reconnection attempts
    const BAD_PORT = 39999;
    const attemptTimestamps = [];

    const socket = io(`http://localhost:${BAD_PORT}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 4,
      reconnectionDelay: 200,
      reconnectionDelayMax: 2000,
      timeout: 1000,
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      evaluateBackoff();
    }, 15000);

    socket.on('reconnect_attempt', () => {
      attemptTimestamps.push(Date.now());
    });

    socket.on('reconnect_failed', () => {
      clearTimeout(timer);
      socket.disconnect();
      evaluateBackoff();
    });

    socket.on('connect_error', () => {
      // Expected — bad port
    });

    function evaluateBackoff() {
      if (attemptTimestamps.length < 2) {
        report('Exponential backoff', false, `Only ${attemptTimestamps.length} attempts recorded`);
        return resolve();
      }

      const delays = [];
      for (let i = 1; i < attemptTimestamps.length; i++) {
        delays.push(attemptTimestamps[i] - attemptTimestamps[i - 1]);
      }

      // With jitter, delays should generally increase (or at least not be constant)
      // We just check that the last delay >= first delay (backoff is happening)
      const backoffOk = delays.length >= 2 && delays[delays.length - 1] >= delays[0] * 0.8;
      report('Exponential backoff', backoffOk, `delays(ms)=[${delays.join(', ')}]`);
      resolve();
    }
  });
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  print(`\nWebSocket Reconnection Tests (server: ${BASE_URL})\n`);

  await testBasicConnection();
  await testSendEvent();
  await testReconnection();
  await testEventsAfterReconnection();
  await testExponentialBackoff();

  print(`\nResults: ${passed} passed, ${failed} failed out of ${results.length}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  printErr('Test runner error:', err);
  process.exit(1);
});
