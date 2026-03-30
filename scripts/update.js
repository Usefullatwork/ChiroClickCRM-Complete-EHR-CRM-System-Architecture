#!/usr/bin/env node
/**
 * System Basics V2 -- Unified Updater
 *
 * Checks ALL connected skill sources and updates everything with one command.
 * Sources: GitHub repos, Claude Code plugins, local skills, MCPs, npm packages
 *
 * Usage:
 *   npx system-basics update              Check + apply all updates
 *   npx system-basics update --check      Check only, don't apply
 *   npx system-basics update --force      Skip confirmation
 *   npx system-basics update --verbose    Show detailed output
 *   npx system-basics update skills       Only update skills
 *   npx system-basics update agents       Only update agents
 *   npx system-basics update plugins      Only update plugins
 *   npx system-basics update npm          Only update npm packages
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const readline = require('readline');

const discoverSources = require('./discover-sources');
const { checkAllSources, fetchJson, githubHeaders } = require('./version-checker');

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------

const PROJECT_DIR = path.resolve(__dirname, '..');
const HOME_DIR = require('os').homedir();
const CONFIG_PATH = path.join(PROJECT_DIR, '.system-basics.json');

// -------------------------------------------------------------------------
// CLI argument parsing
// -------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    check: false,
    force: false,
    verbose: false,
    filter: null, // 'skills', 'agents', 'plugins', 'npm', 'mcp'
    help: false,
  };

  for (const arg of args) {
    if (arg === '--check' || arg === '-c') flags.check = true;
    else if (arg === '--force' || arg === '-f') flags.force = true;
    else if (arg === '--verbose' || arg === '-v') flags.verbose = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === 'update') continue; // skip the subcommand itself
    else if (['skills', 'agents', 'plugins', 'npm', 'mcp'].includes(arg)) {
      flags.filter = arg;
    }
  }

  return flags;
}

// -------------------------------------------------------------------------
// Output helpers
// -------------------------------------------------------------------------

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

function write(text) {
  process.stdout.write(text);
}

function statusColor(status) {
  switch (status) {
    case 'OK': return GREEN;
    case 'UPDATE': return YELLOW;
    case 'NEW': return CYAN;
    case 'ERROR': return RED;
    case 'CHECK': return MAGENTA;
    default: return DIM;
  }
}

function printHelp() {
  write(`
${BOLD}System Basics V2 -- Unified Updater${RESET}

${BOLD}Usage:${RESET}
  node scripts/update.js [options] [filter]
  npx system-basics update [options] [filter]

${BOLD}Options:${RESET}
  --check, -c     Check for updates only (don't apply)
  --force, -f     Apply updates without confirmation
  --verbose, -v   Show detailed version info
  --help, -h      Show this help

${BOLD}Filters:${RESET}
  skills           Only check/update skill repos
  agents           Only check/update agent repos
  plugins          Only check/update Claude Code plugins
  npm              Only check/update npm packages
  mcp              Only check/update MCP servers

${BOLD}Environment:${RESET}
  GITHUB_TOKEN     GitHub personal access token (raises rate limit from 60 to 5000/hr)
  GH_TOKEN         Same as GITHUB_TOKEN

${BOLD}Examples:${RESET}
  node scripts/update.js --check           See what's available
  node scripts/update.js --force           Update everything, no prompts
  node scripts/update.js plugins           Only update plugins
  node scripts/update.js npm --check       Check npm packages only

`);
}

// -------------------------------------------------------------------------
// Config management
// -------------------------------------------------------------------------

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (err) {
      return createDefaultConfig();
    }
  }
  return createDefaultConfig();
}

function createDefaultConfig() {
  return {
    version: '1.0.0',
    autoSync: false,
    syncInterval: 'weekly',
    lastSync: null,
    lastCheck: null,
    sources: {},
    updateLog: [],
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

// -------------------------------------------------------------------------
// Table rendering
// -------------------------------------------------------------------------

function renderTable(results) {
  const nameWidth = 35;
  const verWidth = 15;
  const latestWidth = 15;
  const statusWidth = 8;
  const totalWidth = nameWidth + verWidth + latestWidth + statusWidth + 6;

  const line = '\u2500'.repeat(totalWidth);

  write(`\n${BOLD}  ${'Source'.padEnd(nameWidth)} ${'Local'.padEnd(verWidth)} ${'Latest'.padEnd(latestWidth)} Status${RESET}\n`);
  write(`  ${line}\n`);

  let updateCount = 0;
  let newCount = 0;
  let okCount = 0;
  let errorCount = 0;
  let checkCount = 0;

  for (const r of results) {
    const name = r.name.padEnd(nameWidth);
    const local = (r.localVersion || r.localSha?.slice(0, 12) || '-').padEnd(verWidth);
    const remote = (r.remoteVersion || '-').padEnd(latestWidth);
    const color = statusColor(r.status);
    const status = `${color}${r.status}${RESET}`;

    // Add type indicator
    const typeHint = r.type === 'plugin' ? ' (plugin)' :
      r.type === 'npm' ? ' (npm)' :
      r.type === 'mcp' ? ' (mcp)' : '';

    write(`  ${name}${local} ${remote} ${status}${DIM}${typeHint}${RESET}\n`);

    switch (r.status) {
      case 'UPDATE': updateCount++; break;
      case 'NEW': newCount++; break;
      case 'OK': okCount++; break;
      case 'ERROR': errorCount++; break;
      case 'CHECK': checkCount++; break;
    }
  }

  write(`  ${line}\n`);

  const parts = [];
  if (updateCount > 0) parts.push(`${YELLOW}${updateCount} update${updateCount > 1 ? 's' : ''} available${RESET}`);
  if (newCount > 0) parts.push(`${CYAN}${newCount} new${RESET}`);
  if (okCount > 0) parts.push(`${GREEN}${okCount} up to date${RESET}`);
  if (checkCount > 0) parts.push(`${MAGENTA}${checkCount} needs check${RESET}`);
  if (errorCount > 0) parts.push(`${RED}${errorCount} error${errorCount > 1 ? 's' : ''}${RESET}`);

  write(`  ${parts.join(', ')}\n\n`);

  return { updateCount, newCount, okCount, errorCount, checkCount };
}

function renderVerboseDetails(results) {
  const updatable = results.filter((r) => r.status === 'UPDATE' || r.status === 'NEW');
  if (updatable.length === 0) return;

  write(`${BOLD}  Update details:${RESET}\n\n`);

  for (const r of updatable) {
    write(`  ${BOLD}${r.name}${RESET} (${r.type})\n`);

    if (r.updateInfo) {
      if (r.updateInfo.from && r.updateInfo.to) {
        write(`    Version: ${r.updateInfo.from} -> ${YELLOW}${r.updateInfo.to}${RESET}\n`);
      }
      if (r.updateInfo.fromSha && r.updateInfo.toSha) {
        write(`    Commit:  ${r.updateInfo.fromSha} -> ${YELLOW}${r.updateInfo.toSha}${RESET}\n`);
      }
      if (r.updateInfo.commitMessage) {
        write(`    Latest:  ${DIM}${r.updateInfo.commitMessage}${RESET}\n`);
      }
      if (r.updateInfo.commitDate) {
        write(`    Date:    ${DIM}${r.updateInfo.commitDate}${RESET}\n`);
      }
      if (r.updateInfo.command) {
        write(`    Command: ${CYAN}${r.updateInfo.command}${RESET}\n`);
      }
      if (r.updateInfo.remoteFileCount) {
        write(`    Files:   ${r.updateInfo.remoteFileCount} tracked files\n`);
      }
    }

    if (r.remoteCommit) {
      write(`    HEAD:    ${DIM}${r.remoteCommit.shortSha} - ${r.remoteCommit.message}${RESET}\n`);
    }

    write('\n');
  }
}

// -------------------------------------------------------------------------
// Update actions
// -------------------------------------------------------------------------

/**
 * Download a single file from a GitHub repo.
 *
 * @param {string} repo    "owner/name"
 * @param {string} branch  Branch name
 * @param {string} remotePath  Path within the repo
 * @param {string} localPath   Absolute local file path
 * @returns {Promise<boolean>}
 */
function downloadGitHubFile(repo, branch, remotePath, localPath) {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${remotePath}`;
    const headers = { 'User-Agent': 'system-basics-v2-updater/1.0' };

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    https.get(url, { headers, timeout: 10000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect (raw.githubusercontent.com sometimes redirects)
        https.get(res.headers.location, { headers: { 'User-Agent': headers['User-Agent'] }, timeout: 10000 }, (res2) => {
          if (res2.statusCode !== 200) {
            reject(new Error(`HTTP ${res2.statusCode} downloading ${remotePath}`));
            return;
          }
          const chunks = [];
          res2.on('data', (chunk) => chunks.push(chunk));
          res2.on('end', () => {
            const dir = path.dirname(localPath);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(localPath, Buffer.concat(chunks));
            resolve(true);
          });
        }).on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} downloading ${remotePath}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const dir = path.dirname(localPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localPath, Buffer.concat(chunks));
        resolve(true);
      });
    }).on('error', reject);
  });
}

/**
 * Sync files from a GitHub repo tree into a local directory.
 * Only downloads files whose SHA differs from what we last recorded.
 *
 * @param {Object} source      Source descriptor
 * @param {Object} config      System basics config (for tracking SHAs)
 * @returns {Promise<{downloaded: number, skipped: number, errors: string[]}>}
 */
async function syncGitHubSource(source, config) {
  const result = { downloaded: 0, skipped: 0, errors: [] };

  if (!source.repo) {
    result.errors.push('No repo specified');
    return result;
  }

  const branch = source.branch || 'main';
  const paths = source.paths || [];
  const installBase = source.installPath || '';

  // Get the full tree from GitHub
  const url = `https://api.github.com/repos/${source.repo}/git/trees/${branch}?recursive=1`;
  let treeData;
  try {
    treeData = await fetchJson(url, githubHeaders());
  } catch (err) {
    result.errors.push(`Failed to fetch tree: ${err.message}`);
    return result;
  }

  // Filter to only blobs in the tracked paths
  let files = (treeData.tree || []).filter((item) => item.type === 'blob');
  if (paths.length > 0) {
    files = files.filter((item) => paths.some((p) => item.path.startsWith(p)));
  }

  // Track previous SHAs from config
  const sourceKey = source.name;
  const prevFiles = (config.sources[sourceKey] && config.sources[sourceKey].files) || {};

  for (const file of files) {
    // Determine local path
    let localRelPath;
    if (installBase && paths.length > 0) {
      // Map repo path into install path
      // e.g., repo path ".claude/skills/foo/SKILL.md" stays as-is for skills+agents type
      localRelPath = file.path;
    } else if (installBase) {
      // Single install path: strip matching prefix from repo path
      const matchingPath = paths.find((p) => file.path.startsWith(p));
      if (matchingPath) {
        localRelPath = path.join(installBase, file.path.slice(matchingPath.length));
      } else {
        localRelPath = path.join(installBase, file.path);
      }
    } else {
      localRelPath = file.path;
    }

    const localAbsPath = path.join(PROJECT_DIR, localRelPath);

    // Skip if SHA hasn't changed
    if (prevFiles[file.path] === file.sha) {
      result.skipped++;
      continue;
    }

    try {
      await downloadGitHubFile(source.repo, branch, file.path, localAbsPath);
      result.downloaded++;

      // Record the new SHA
      if (!config.sources[sourceKey]) {
        config.sources[sourceKey] = { files: {} };
      }
      config.sources[sourceKey].files[file.path] = file.sha;
    } catch (err) {
      result.errors.push(`${file.path}: ${err.message}`);
    }
  }

  // Update source metadata in config
  if (!config.sources[sourceKey]) {
    config.sources[sourceKey] = { files: {} };
  }
  config.sources[sourceKey].lastSync = new Date().toISOString();
  config.sources[sourceKey].remoteSha = source.remoteCommit?.sha || null;

  return result;
}

/**
 * Apply updates for a set of checked sources.
 *
 * @param {Array<Object>} results  Checked source results
 * @param {Object} config          System basics config
 * @param {Object} flags           CLI flags
 * @returns {Promise<void>}
 */
async function applyUpdates(results, config, flags) {
  const updatable = results.filter((r) => r.status === 'UPDATE' || r.status === 'NEW');

  if (updatable.length === 0) {
    write(`${GREEN}  Everything is up to date.${RESET}\n\n`);
    return;
  }

  // Group by action type
  const githubSources = updatable.filter((r) =>
    r.repo && ['skills+agents', 'skill', 'agents', 'framework'].includes(r.type)
  );
  const npmSources = updatable.filter((r) => r.package && r.type === 'npm');
  const pluginSources = updatable.filter((r) => r.type === 'plugin');
  const mcpSources = updatable.filter((r) => r.type === 'mcp' && r.package);

  // Apply GitHub-based skill/agent updates
  if (githubSources.length > 0) {
    write(`${BOLD}  Syncing ${githubSources.length} GitHub source(s)...${RESET}\n\n`);

    for (const source of githubSources) {
      write(`    ${source.name}: `);
      try {
        const syncResult = await syncGitHubSource(source, config);
        if (syncResult.errors.length > 0) {
          write(`${YELLOW}${syncResult.downloaded} downloaded, ${syncResult.errors.length} error(s)${RESET}\n`);
          for (const err of syncResult.errors) {
            write(`      ${RED}${err}${RESET}\n`);
          }
        } else {
          write(`${GREEN}${syncResult.downloaded} updated, ${syncResult.skipped} unchanged${RESET}\n`);
        }

        config.updateLog.push({
          timestamp: new Date().toISOString(),
          source: source.name,
          action: 'sync',
          downloaded: syncResult.downloaded,
          skipped: syncResult.skipped,
          errors: syncResult.errors,
        });
      } catch (err) {
        write(`${RED}FAILED: ${err.message}${RESET}\n`);
        config.updateLog.push({
          timestamp: new Date().toISOString(),
          source: source.name,
          action: 'sync',
          error: err.message,
        });
      }
    }

    write('\n');
  }

  // Show npm update commands
  if (npmSources.length > 0 || mcpSources.length > 0) {
    const allNpm = [...npmSources, ...mcpSources];
    write(`${BOLD}  npm packages to update:${RESET}\n\n`);

    for (const source of allNpm) {
      const from = source.localVersion || 'unknown';
      const to = source.remoteVersion || 'latest';
      write(`    ${CYAN}npm install -g ${source.package}@${to}${RESET}`);
      write(`  ${DIM}(${from} -> ${to})${RESET}\n`);

      config.updateLog.push({
        timestamp: new Date().toISOString(),
        source: source.name,
        action: 'npm-update-suggested',
        from: from,
        to: to,
        command: `npm install -g ${source.package}@${to}`,
      });
    }

    write(`\n    ${DIM}Run the commands above to update npm packages.${RESET}\n\n`);
  }

  // Show plugin update instructions
  if (pluginSources.length > 0) {
    write(`${BOLD}  Claude Code plugins to update:${RESET}\n\n`);

    for (const source of pluginSources) {
      write(`    ${CYAN}claude plugins update ${source.pluginId || source.name}${RESET}\n`);

      config.updateLog.push({
        timestamp: new Date().toISOString(),
        source: source.name,
        action: 'plugin-update-suggested',
        command: `claude plugins update ${source.pluginId || source.name}`,
      });
    }

    write(`\n    ${DIM}Run the commands above in your terminal to update plugins.${RESET}\n\n`);
  }
}

// -------------------------------------------------------------------------
// User confirmation
// -------------------------------------------------------------------------

function confirm(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

// -------------------------------------------------------------------------
// Filter sources by CLI flag
// -------------------------------------------------------------------------

function filterSources(sources, filter) {
  if (!filter) return sources;

  switch (filter) {
    case 'skills':
      return sources.filter((s) =>
        s.type === 'skill' || s.type === 'skills+agents' || s.type === 'local-skill'
      );
    case 'agents':
      return sources.filter((s) =>
        s.type === 'agents' || s.type === 'skills+agents'
      );
    case 'plugins':
      return sources.filter((s) => s.type === 'plugin');
    case 'npm':
      return sources.filter((s) => s.type === 'npm' || s.package);
    case 'mcp':
      return sources.filter((s) => s.type === 'mcp');
    default:
      return sources;
  }
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

async function main() {
  const flags = parseArgs(process.argv);

  if (flags.help) {
    printHelp();
    return;
  }

  write(`\n${BOLD}  System Basics V2 -- Unified Updater${RESET}\n`);
  write(`  ${DIM}Checking all connected skill sources...${RESET}\n`);

  // Load config
  const config = loadConfig();

  // Discover sources
  write(`\n  ${DIM}Discovering sources...${RESET}`);
  let sources = discoverSources(PROJECT_DIR, HOME_DIR);
  write(` found ${sources.length}\n`);

  // Apply filter
  sources = filterSources(sources, flags.filter);
  if (flags.filter) {
    write(`  ${DIM}Filtered to ${sources.length} ${flags.filter} source(s)${RESET}\n`);
  }

  if (sources.length === 0) {
    write(`\n  ${YELLOW}No sources found matching filter "${flags.filter || 'all'}".${RESET}\n\n`);
    return;
  }

  // Check versions
  write(`  ${DIM}Checking versions (${sources.length} sources)...${RESET}\n`);

  const results = await checkAllSources(sources);

  // Sort: UPDATE first, then NEW, then CHECK, then ERROR, then OK
  const statusOrder = { UPDATE: 0, NEW: 1, CHECK: 2, ERROR: 3, OK: 4, UNKNOWN: 5 };
  results.sort((a, b) => (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5));

  // Render table
  const counts = renderTable(results);

  // Verbose details
  if (flags.verbose) {
    renderVerboseDetails(results);
  }

  // Show errors if any
  const errorResults = results.filter((r) => r.status === 'ERROR');
  if (errorResults.length > 0 && !flags.verbose) {
    write(`  ${RED}Errors:${RESET}\n`);
    for (const r of errorResults) {
      write(`    ${r.name}: ${r.error}\n`);
    }
    write('\n');
  }

  // Record check time
  config.lastCheck = new Date().toISOString();

  // Check-only mode
  if (flags.check) {
    saveConfig(config);
    write(`  ${DIM}Check-only mode. Run without --check to apply updates.${RESET}\n\n`);
    return;
  }

  // Nothing to update
  if (counts.updateCount === 0 && counts.newCount === 0) {
    saveConfig(config);
    return;
  }

  // Confirm unless --force
  if (!flags.force) {
    const shouldProceed = await confirm(
      `  Apply ${counts.updateCount} update(s) and install ${counts.newCount} new source(s)? (y/N) `
    );
    if (!shouldProceed) {
      write(`\n  ${DIM}Cancelled.${RESET}\n\n`);
      saveConfig(config);
      return;
    }
    write('\n');
  }

  // Apply updates
  await applyUpdates(results, config, flags);

  // Update config
  config.lastSync = new Date().toISOString();

  // Trim update log to last 100 entries
  if (config.updateLog.length > 100) {
    config.updateLog = config.updateLog.slice(-100);
  }

  saveConfig(config);

  write(`  ${GREEN}Done.${RESET} Config saved to .system-basics.json\n\n`);
}

main().catch((err) => {
  process.stderr.write(`\n${RED}  Fatal error: ${err.message}${RESET}\n`);
  if (err.stack) {
    process.stderr.write(`  ${DIM}${err.stack}${RESET}\n`);
  }
  process.exit(1);
});
