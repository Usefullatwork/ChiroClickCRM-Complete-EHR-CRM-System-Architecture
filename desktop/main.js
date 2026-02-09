/**
 * ChiroClickCRM Desktop - Electron Main Process
 * Manages the browser window, backend server lifecycle, and application menus.
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const ElectronStore = require('electron-store');

// ============================================================================
// Settings Store - persists window position/size across sessions
// ============================================================================

const store = new ElectronStore({
  name: 'chiroclickcrm-settings',
  defaults: {
    windowBounds: { x: undefined, y: undefined, width: 1280, height: 800 },
    maximized: false,
  },
});

const BACKEND_PORT = 3000;
let mainWindow = null;
let backendProcess = null;

// ============================================================================
// Backend Server Management
// ============================================================================

/**
 * Poll the backend health endpoint until it responds 200 or retries are exhausted.
 * @param {number} port - Port to check
 * @param {number} maxRetries - Maximum number of attempts (default 30)
 * @param {number} interval - Milliseconds between attempts (default 500)
 * @returns {Promise<boolean>} true if backend is healthy
 */
function waitForBackendHealth(port, maxRetries = 30, interval = 500) {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < maxRetries) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });

      req.on('error', () => {
        if (attempts < maxRetries) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });

      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts < maxRetries) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });
    };

    check();
  });
}

/**
 * Start the backend by forking the Express server as a child process.
 */
function startBackend() {
  const backendDir = path.join(__dirname, '..', 'backend');
  const serverPath = path.join(backendDir, 'src', 'server.js');

  const env = {
    ...process.env,
    DESKTOP_MODE: 'true',
    NODE_ENV: 'production',
    PORT: String(BACKEND_PORT),
    DB_ENGINE: 'pglite',
    CACHE_ENGINE: 'memory',
  };

  console.log(`[desktop] Starting backend server on port ${BACKEND_PORT}...`);

  backendProcess = fork(serverPath, [], {
    cwd: backendDir,
    env,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[backend:err] ${data.toString().trim()}`);
  });

  backendProcess.on('exit', (code) => {
    console.log(`[desktop] Backend process exited with code ${code}`);
    backendProcess = null;
  });

  backendProcess.on('error', (err) => {
    console.error(`[desktop] Failed to start backend: ${err.message}`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-error', err.message);
    }
  });

  return backendProcess;
}

/**
 * Kill the backend process gracefully, then force-kill after timeout.
 */
function stopBackend() {
  return new Promise((resolve) => {
    if (!backendProcess) {
      resolve();
      return;
    }

    const proc = backendProcess;
    backendProcess = null;

    proc.on('exit', () => resolve());

    proc.kill('SIGTERM');

    // Force kill after 5 seconds if still alive
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

// ============================================================================
// Window Management
// ============================================================================

function createWindow() {
  // Restore saved window bounds
  const { x, y, width, height } = store.get('windowBounds');
  const wasMaximized = store.get('maximized');

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1024,
    minHeight: 700,
    title: 'ChiroClickCRM',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (wasMaximized) {
    mainWindow.maximize();
  }

  // Show when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window position and size on move/resize
  const saveBounds = () => {
    if (!mainWindow) return;
    const isMax = mainWindow.isMaximized();
    store.set('maximized', isMax);
    if (!isMax) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  };

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// Application Menu
// ============================================================================

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Data',
              defaultPath: `chiroclickcrm-export-${new Date().toISOString().split('T')[0]}.sql`,
              filters: [
                { name: 'SQL Backup', extensions: ['sql'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            if (filePath && mainWindow) {
              mainWindow.webContents.send('menu:export-data', filePath);
            }
          },
        },
        {
          label: 'Import Data...',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Data',
              filters: [
                { name: 'SQL Backup', extensions: ['sql'] },
                { name: 'All Files', extensions: ['*'] },
              ],
              properties: ['openFile'],
            });
            if (filePaths.length > 0 && mainWindow) {
              mainWindow.webContents.send('menu:import-data', filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        { label: 'Quit', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { label: 'Toggle DevTools', role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        { label: 'Full Screen', role: 'togglefullscreen', accelerator: 'F11' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ChiroClickCRM',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ChiroClickCRM',
              message: `ChiroClickCRM v${app.getVersion()}`,
              detail: 'Standalone Desktop Edition\nEHR-CRM for Chiropractors\n\nOffline-first. Your data. Your machine.',
            });
          },
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/ChiroClick/chiroclickcrm/wiki');
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Updates',
              message: 'You are running the latest version.',
              detail: `Version ${app.getVersion()}`,
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ============================================================================
// IPC Handlers
// ============================================================================

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external-link', (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-data-path', () => {
  return path.join(__dirname, '..', 'data');
});

ipcMain.handle('restart-backend', async () => {
  console.log('[desktop] Restarting backend...');
  await stopBackend();
  startBackend();
  const ready = await waitForBackendHealth(BACKEND_PORT);
  if (ready && mainWindow) {
    mainWindow.webContents.send('backend-ready');
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }
  return ready;
});

ipcMain.handle('check-ollama-status', async () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            running: true,
            models: (parsed.models || []).map((m) => m.name),
          });
        } catch {
          resolve({ running: true, models: [] });
        }
      });
    });

    req.on('error', () => {
      resolve({ running: false, models: [] });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ running: false, models: [] });
    });
  });
});

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(async () => {
  // Set up menu
  createMenu();

  // Create the main window (hidden until ready-to-show)
  createWindow();

  // Start the backend server
  startBackend();

  // Wait for the backend to become healthy
  const healthy = await waitForBackendHealth(BACKEND_PORT);

  if (healthy) {
    console.log('[desktop] Backend is healthy, loading application...');
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-ready');
    }
  } else {
    console.error('[desktop] Backend failed to start within timeout');
    if (mainWindow) {
      mainWindow.webContents.send('backend-error', 'Backend server failed to start. Please restart the application.');
      mainWindow.loadURL(`data:text/html,
        <html>
        <body style="font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0">
          <h1 style="color:#ef4444">Backend Failed to Start</h1>
          <p>The backend server did not respond within the timeout period.</p>
          <p>Please close the application and try again.</p>
          <p style="font-size:0.85em;opacity:0.6;margin-top:2em">Check the console logs for more details.</p>
        </body>
        </html>
      `);
    }
  }
});

app.on('window-all-closed', async () => {
  await stopBackend();
  app.quit();
});

app.on('activate', () => {
  // macOS: re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }
});

// Graceful shutdown
app.on('before-quit', async (event) => {
  if (backendProcess) {
    event.preventDefault();
    await stopBackend();
    app.quit();
  }
});
