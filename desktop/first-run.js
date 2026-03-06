/**
 * First Run Check
 * Checks if the PGlite database directory exists. If not, this is the first
 * launch and the database will be initialized automatically by the backend's
 * db-init.js when PGlite starts.
 */

const fs = require('fs');
const path = require('path');

let dataDir = path.join(__dirname, '..', 'data');

/**
 * Set the data directory (called from main.js for packaged apps).
 */
function setDataDir(dir) {
  dataDir = dir;
}

/**
 * Check if this is the first time the app is running.
 * Returns true if the PGlite data directory does not exist or is empty.
 */
function isFirstRun() {
  const pgliteDir = path.join(dataDir, 'pglite');
  if (!fs.existsSync(pgliteDir)) {
    return true;
  }
  try {
    const contents = fs.readdirSync(pgliteDir);
    return contents.length === 0;
  } catch {
    return true;
  }
}

/**
 * Ensure all required data directories exist for the application.
 */
function ensureDataDirectories() {
  const subdirs = ['pglite', 'backups', 'uploads', 'exports', 'logs', 'temp'];

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const sub of subdirs) {
    const fullPath = path.join(dataDir, sub);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Get an HTML string for a splash screen to display while the database initializes.
 */
function getSplashHTML() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  background: #0d9488;
  color: white;
  border-radius: 12px;
  user-select: none;
">
  <h1 style="font-size: 2em; margin: 0 0 0.5em 0;">ChiroClickEHR</h1>
  <p style="opacity: 0.85; margin: 0;">Initializing database...</p>
  <div style="
    width: 200px;
    height: 4px;
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
    margin-top: 24px;
    overflow: hidden;
  ">
    <div style="
      width: 0%;
      height: 100%;
      background: white;
      border-radius: 2px;
      animation: load 2.5s ease-in-out infinite;
    "></div>
  </div>
  <style>
    @keyframes load {
      0%   { width: 0%; }
      50%  { width: 80%; }
      100% { width: 100%; }
    }
  </style>
</body>
</html>`;
}

module.exports = { isFirstRun, ensureDataDirectories, getSplashHTML, setDataDir };
