/**
 * Backend Launcher
 * Spawns the Express backend server as a child process.
 * In production, serves the built frontend as static files.
 */

const { fork } = require('child_process');
const path = require('path');
const http = require('http');

let serverProcess = null;

/**
 * Wait for the backend to be ready by polling the health endpoint
 */
async function waitForBackend(port, maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

/**
 * Launch the backend server
 */
async function launchBackend(port = 3000) {
  const backendDir = path.join(__dirname, '..', 'backend');
  const serverPath = path.join(backendDir, 'src', 'server.js');

  // Set environment
  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
    DESKTOP_MODE: 'true',
    DB_ENGINE: 'pglite',
    CACHE_ENGINE: 'memory',
  };

  console.log(`Starting backend server on port ${port}...`);

  serverProcess = fork(serverPath, [], {
    cwd: backendDir,
    env,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[backend:err] ${data.toString().trim()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    serverProcess = null;
  });

  // Wait for backend to be ready
  const ready = await waitForBackend(port);
  if (ready) {
    console.log('Backend server is ready');
  } else {
    console.error('Backend server failed to start within timeout');
  }

  return serverProcess;
}

/**
 * Stop the backend server
 */
async function stopBackend(proc) {
  const target = proc || serverProcess;
  if (!target) return;

  return new Promise((resolve) => {
    target.on('exit', resolve);
    target.kill('SIGTERM');

    // Force kill after 5 seconds
    setTimeout(() => {
      if (!target.killed) {
        target.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

module.exports = { launchBackend, stopBackend };
