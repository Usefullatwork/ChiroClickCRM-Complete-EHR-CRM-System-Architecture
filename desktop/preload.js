/**
 * Electron Preload Script
 * Secure IPC bridge between renderer and main process.
 * Uses contextBridge to expose only specific, safe APIs to the frontend.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App version
  getVersion: () => ipcRenderer.invoke('get-app-version'),

  // Open URL in default system browser
  openExternal: (url) => ipcRenderer.invoke('open-external-link', url),

  // Get the path to the data directory
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Restart the backend server process
  restartBackend: () => ipcRenderer.invoke('restart-backend'),

  // Check if Ollama AI is running and list available models
  checkOllama: () => ipcRenderer.invoke('check-ollama-status'),

  // Listen for backend lifecycle events from the main process
  onBackendReady: (callback) => {
    ipcRenderer.on('backend-ready', () => callback());
  },
  onBackendError: (callback) => {
    ipcRenderer.on('backend-error', (_, message) => callback(message));
  },

  // Platform identifier
  platform: process.platform,
});
