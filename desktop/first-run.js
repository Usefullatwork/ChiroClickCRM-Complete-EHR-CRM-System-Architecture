/**
 * First Run Setup
 * Initializes the PGlite database with schema and seed data on first launch.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PGLITE_DIR = path.join(DATA_DIR, 'pglite');

/**
 * Check if this is the first time the app is running
 */
async function isFirstRun() {
  return !fs.existsSync(PGLITE_DIR) || fs.readdirSync(PGLITE_DIR).length === 0;
}

/**
 * Run first-time database setup
 * Uses the migration runner which handles PGlite initialization
 */
async function runFirstTimeSetup() {
  console.log('First run detected - initializing database...');

  // Ensure data directories exist
  const dirs = ['data', 'data/pglite', 'data/backups', 'data/uploads', 'data/exports', 'data/logs', 'data/temp'];
  for (const dir of dirs) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created: ${fullPath}`);
    }
  }

  // Set environment for PGlite
  process.env.DESKTOP_MODE = 'true';
  process.env.DB_ENGINE = 'pglite';
  process.env.CACHE_ENGINE = 'memory';

  // Run migrations using the migration runner
  try {
    const migrationRunner = path.join(__dirname, '..', 'database', 'migrations', 'run.js');
    // Fork the migration runner as a child process
    const { fork } = require('child_process');

    await new Promise((resolve, reject) => {
      const child = fork(migrationRunner, [], {
        env: {
          ...process.env,
          DESKTOP_MODE: 'true',
          DB_ENGINE: 'pglite',
          PGLITE_DATA_DIR: PGLITE_DIR,
        },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      child.stdout?.on('data', (data) => console.log(`[migrate] ${data.toString().trim()}`));
      child.stderr?.on('data', (data) => console.error(`[migrate:err] ${data.toString().trim()}`));

      child.on('exit', (code) => {
        if (code === 0) {
          console.log('Database setup completed successfully');
          resolve();
        } else {
          reject(new Error(`Migration runner exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  } catch (error) {
    console.error('First-run setup failed:', error.message);
    // Don't throw - app can still start, user may need to run migrations manually
  }

  console.log('First-run setup complete');
}

module.exports = { isFirstRun, runFirstTimeSetup };
