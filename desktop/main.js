/**
 * ChiroClickCRM Desktop - Electron Main Process
 * Manages the browser window, backend server, and Ollama AI.
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { launchBackend, stopBackend } = require('./backend-launcher');
const { checkOllama, startOllama } = require('./ollama-manager');
const { isFirstRun, runFirstTimeSetup } = require('./first-run');

const isDev = process.argv.includes('--dev');
const BACKEND_PORT = process.env.PORT || 3000;

let mainWindow = null;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ChiroClickCRM',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false, // Show after ready
  });

  // Show when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In dev mode, load from Vite dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from backend's static serving
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'Fil',
      submenu: [
        {
          label: 'Sikkerhetskopi...',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => mainWindow?.webContents.send('menu:backup'),
        },
        { type: 'separator' },
        { label: 'Avslutt', role: 'quit' },
      ],
    },
    {
      label: 'Rediger',
      submenu: [
        { label: 'Angre', role: 'undo' },
        { label: 'Gjenta', role: 'redo' },
        { type: 'separator' },
        { label: 'Klipp ut', role: 'cut' },
        { label: 'Kopier', role: 'copy' },
        { label: 'Lim inn', role: 'paste' },
        { label: 'Velg alt', role: 'selectAll' },
      ],
    },
    {
      label: 'Vis',
      submenu: [
        { label: 'Last inn på nytt', role: 'reload' },
        { label: 'Full skjerm', role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'Developer Tools', role: 'toggleDevTools' },
        ] : []),
      ],
    },
    {
      label: 'Hjelp',
      submenu: [
        {
          label: 'Om ChiroClickCRM',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Om ChiroClickCRM',
              message: 'ChiroClickCRM v2.0.0',
              detail: 'Standalone Desktop Edition\nNorsk EHR-CRM for kiropraktorer\n\nOffline-first. Dine data. Din maskin.',
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

ipcMain.handle('app:getInfo', () => ({
  version: app.getVersion(),
  platform: process.platform,
  desktopMode: true,
  backendPort: BACKEND_PORT,
  isDev,
}));

ipcMain.handle('ollama:status', async () => {
  return await checkOllama();
});

ipcMain.handle('ollama:start', async () => {
  return await startOllama();
});

ipcMain.handle('backup:create', async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Lagre sikkerhetskopi',
    defaultPath: `chiroclickcrm-backup-${new Date().toISOString().split('T')[0]}.sql`,
    filters: [{ name: 'SQL Backup', extensions: ['sql'] }],
  });
  if (filePath) {
    mainWindow.webContents.send('backup:started', filePath);
    return filePath;
  }
  return null;
});

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(async () => {
  // Set environment for desktop mode
  process.env.DESKTOP_MODE = 'true';
  process.env.DB_ENGINE = 'pglite';
  process.env.CACHE_ENGINE = 'memory';
  process.env.NODE_ENV = isDev ? 'development' : 'production';
  process.env.PORT = String(BACKEND_PORT);

  // Check for first run
  if (await isFirstRun()) {
    // Show splash/loading while setting up
    const splash = new BrowserWindow({
      width: 500,
      height: 350,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
    });
    splash.loadURL(`data:text/html,
      <html><body style="font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d9488;color:white;border-radius:12px;margin:0">
        <h1 style="font-size:2em;margin:0">ChiroClickCRM</h1>
        <p style="opacity:0.8">Setter opp database...</p>
        <div style="width:200px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;margin-top:20px">
          <div style="width:0%;height:100%;background:white;border-radius:2px;animation:load 3s ease-in-out infinite"></div>
        </div>
        <style>@keyframes load{0%{width:0}50%{width:80%}100%{width:100%}}</style>
      </body></html>
    `);

    await runFirstTimeSetup();
    splash.close();
  }

  // Launch backend server
  if (!isDev) {
    backendProcess = await launchBackend(BACKEND_PORT);
  }

  createMenu();
  createWindow();
});

app.on('window-all-closed', async () => {
  await stopBackend(backendProcess);
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Graceful shutdown
app.on('before-quit', async () => {
  await stopBackend(backendProcess);
});
