/**
 * Electron Preload Script
 * Secure IPC bridge between renderer and main process.
 * Only exposes specific, safe APIs to the frontend.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),

  // Ollama AI management
  getOllamaStatus: () => ipcRenderer.invoke('ollama:status'),
  startOllama: () => ipcRenderer.invoke('ollama:start'),

  // Backup
  createBackup: () => ipcRenderer.invoke('backup:create'),

  // Listen for events from main process
  onBackupStarted: (callback) => {
    ipcRenderer.on('backup:started', (_, filePath) => callback(filePath));
  },
  onMenuAction: (action, callback) => {
    ipcRenderer.on(`menu:${action}`, () => callback());
  },

  // Platform info
  platform: process.platform,
  isDesktop: true,
});
