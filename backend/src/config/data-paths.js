/**
 * Data Paths Configuration
 * Determines where data is stored based on runtime environment.
 * USB-friendly: all paths relative to app root.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect app root directory.
 * In desktop mode: relative to the app's location (USB-friendly).
 * In dev mode: project root.
 */
const detectAppRoot = () => {
  // If explicitly set via env
  if (process.env.APP_ROOT) {
    return path.resolve(process.env.APP_ROOT);
  }

  // Desktop mode: go up from backend/src/config/ to project root
  // backend/src/config/data-paths.js -> ../../.. = project root
  return path.resolve(__dirname, '..', '..', '..');
};

const APP_ROOT = detectAppRoot();

/**
 * All data paths, relative to APP_ROOT/data/
 */
const DATA_DIR = path.join(APP_ROOT, 'data');

const PATHS = {
  root: APP_ROOT,
  data: DATA_DIR,
  pglite: path.join(DATA_DIR, 'pglite'),
  backups: path.join(DATA_DIR, 'backups'),
  uploads: path.join(DATA_DIR, 'uploads'),
  exports: path.join(DATA_DIR, 'exports'),
  logs: path.join(DATA_DIR, 'logs'),
  temp: path.join(DATA_DIR, 'temp'),
};

/**
 * Ensure all data directories exist.
 * Called on first run or startup.
 */
export const ensureDataDirectories = () => {
  for (const [name, dirPath] of Object.entries(PATHS)) {
    if (name === 'root') continue; // Don't create root
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created data directory: ${dirPath}`);
      }
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error.message);
    }
  }
};

/**
 * Check if this is a first run (no PGlite database exists)
 */
export const isFirstRun = () => {
  return !fs.existsSync(PATHS.pglite) ||
    fs.readdirSync(PATHS.pglite).length === 0;
};

/**
 * Get the PGlite data directory path
 */
export const getPGliteDataDir = () => PATHS.pglite;

/**
 * Get path for database backup files
 */
export const getBackupDir = () => PATHS.backups;

/**
 * Get all data paths
 */
export const getDataPaths = () => ({ ...PATHS });

export default {
  APP_ROOT,
  PATHS,
  ensureDataDirectories,
  isFirstRun,
  getPGliteDataDir,
  getBackupDir,
  getDataPaths,
};
