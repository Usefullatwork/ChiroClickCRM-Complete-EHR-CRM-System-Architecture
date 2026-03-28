#!/usr/bin/env node
/**
 * System Basics V2 -- Source Discovery
 *
 * Discovers all connected skill, plugin, and MCP sources for the current
 * project and user environment.  Returns an array of source descriptors
 * that the updater can iterate over.
 *
 * Source types:
 *   registry   -- Known GitHub repos from skill-registry.json
 *   plugin     -- Claude Code plugins from ~/.claude/plugins/
 *   mcp        -- MCP servers from .mcp.json
 *   npm        -- npm packages used as MCPs or CLIs
 *   local-skill -- Local skills with their own package.json
 */

const fs = require('fs');
const path = require('path');

/**
 * Discover all connected sources.
 *
 * @param {string} projectDir  Absolute path to the project root
 * @param {string} homeDir     Absolute path to the user home directory
 * @returns {Array<Object>}    Array of source descriptors
 */
function discoverSources(projectDir, homeDir) {
  const sources = [];

  // -----------------------------------------------------------------------
  // 1. Skill registry (known GitHub repos)
  // -----------------------------------------------------------------------
  const registryPath = path.join(__dirname, 'skill-registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      for (const entry of registry.registries || []) {
        const source = {
          name: entry.name,
          type: entry.type,
          origin: 'registry',
          repo: entry.repo || null,
          branch: entry.branch || 'main',
          package: entry.package || null,
          pluginId: entry.pluginId || null,
          description: entry.description || '',
          paths: entry.paths || [],
          installPath: entry.installPath || null,
          versionFile: entry.versionFile || null,
          localVersion: null,
          localSha: null,
        };

        // Try to read local version info
        if (entry.versionFile) {
          const vfPath = path.join(projectDir, entry.versionFile);
          if (fs.existsSync(vfPath)) {
            source.localVersion = fs.readFileSync(vfPath, 'utf8').trim();
          }
        }

        // Check if the install path exists locally
        if (entry.installPath) {
          const installFull = path.join(projectDir, entry.installPath);
          source.installed = fs.existsSync(installFull);
        } else if (entry.paths && entry.paths.length > 0) {
          // For multi-path sources check if at least one path exists
          source.installed = entry.paths.some((p) =>
            fs.existsSync(path.join(projectDir, p))
          );
        } else {
          source.installed = false;
        }

        sources.push(source);
      }
    } catch (err) {
      process.stderr.write(`Warning: Failed to read skill registry: ${err.message}\n`);
    }
  }

  // -----------------------------------------------------------------------
  // 2. Claude Code plugins (from installed_plugins.json)
  // -----------------------------------------------------------------------
  const pluginsPath = path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json');
  if (fs.existsSync(pluginsPath)) {
    try {
      const pluginsData = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));
      const plugins = pluginsData.plugins || {};

      for (const [pluginId, installs] of Object.entries(plugins)) {
        // Skip if already represented in the registry
        const alreadyInRegistry = sources.some(
          (s) => s.pluginId === pluginId
        );
        if (alreadyInRegistry) {
          // Enrich the existing registry entry with installed version info
          const existing = sources.find((s) => s.pluginId === pluginId);
          if (existing && installs.length > 0) {
            existing.localVersion = installs[0].version;
            existing.localSha = installs[0].gitCommitSha || null;
            existing.installed = true;
            existing.installPath = installs[0].installPath || existing.installPath;
            existing.lastUpdated = installs[0].lastUpdated || null;
          }
          continue;
        }

        // Parse plugin ID: "name@marketplace"
        const atIdx = pluginId.indexOf('@');
        const pluginName = atIdx > 0 ? pluginId.slice(0, atIdx) : pluginId;
        const marketplace = atIdx > 0 ? pluginId.slice(atIdx + 1) : 'unknown';

        const install = installs[0] || {};
        sources.push({
          name: pluginName,
          type: 'plugin',
          origin: 'claude-plugins',
          repo: null,
          branch: null,
          package: null,
          pluginId: pluginId,
          marketplace: marketplace,
          description: `Claude Code plugin (${marketplace})`,
          paths: [],
          installPath: install.installPath || null,
          versionFile: null,
          localVersion: install.version || null,
          localSha: install.gitCommitSha || null,
          lastUpdated: install.lastUpdated || null,
          installed: true,
        });
      }
    } catch (err) {
      process.stderr.write(`Warning: Failed to read installed plugins: ${err.message}\n`);
    }
  }

  // -----------------------------------------------------------------------
  // 3. Enabled plugins from global settings (marks enabled/disabled)
  // -----------------------------------------------------------------------
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const enabled = settings.enabledPlugins || {};

      for (const source of sources) {
        if (source.pluginId && enabled.hasOwnProperty(source.pluginId)) {
          source.enabled = enabled[source.pluginId];
        }
      }
    } catch (err) {
      // Non-fatal
    }
  }

  // -----------------------------------------------------------------------
  // 4. MCP servers from .mcp.json (project-level)
  // -----------------------------------------------------------------------
  const mcpPath = path.join(projectDir, '.mcp.json');
  if (fs.existsSync(mcpPath)) {
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      const servers = mcpConfig.mcpServers || mcpConfig.servers || {};

      for (const [serverName, serverConfig] of Object.entries(servers)) {
        // Skip if already in registry by npm package name
        const cmd = serverConfig.command || '';
        const args = serverConfig.args || [];
        let npmPackage = null;

        // Detect npm packages from npx commands
        if (cmd === 'npx' && args.length > 0) {
          npmPackage = args.find((a) => !a.startsWith('-') && a !== '-y');
        }

        const alreadyTracked = sources.some(
          (s) => (s.package && s.package === npmPackage) || s.name === serverName
        );

        if (!alreadyTracked) {
          sources.push({
            name: serverName,
            type: 'mcp',
            origin: 'mcp-config',
            repo: null,
            branch: null,
            package: npmPackage,
            pluginId: null,
            description: `MCP server: ${serverName}`,
            paths: [],
            installPath: null,
            versionFile: null,
            localVersion: null,
            localSha: null,
            installed: true,
            command: cmd,
            args: args,
          });
        }
      }
    } catch (err) {
      process.stderr.write(`Warning: Failed to read .mcp.json: ${err.message}\n`);
    }
  }

  // -----------------------------------------------------------------------
  // 5. Local skills with package.json
  // -----------------------------------------------------------------------
  const skillsDir = path.join(projectDir, '.claude', 'skills');
  if (fs.existsSync(skillsDir)) {
    try {
      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const skillName of skillDirs) {
        const pkgPath = path.join(skillsDir, skillName, 'package.json');
        if (!fs.existsSync(pkgPath)) continue;

        // Skip if already tracked
        const alreadyTracked = sources.some(
          (s) => s.installPath && s.installPath.includes(skillName)
        );
        if (alreadyTracked) continue;

        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          sources.push({
            name: skillName,
            type: 'local-skill',
            origin: 'local',
            repo: null,
            branch: null,
            package: pkg.name || null,
            pluginId: null,
            description: pkg.description || `Local skill: ${skillName}`,
            paths: [`.claude/skills/${skillName}/`],
            installPath: `.claude/skills/${skillName}/`,
            versionFile: null,
            localVersion: pkg.version || null,
            localSha: null,
            installed: true,
          });
        } catch (parseErr) {
          // Malformed package.json -- skip
        }
      }
    } catch (err) {
      // Non-fatal
    }
  }

  // -----------------------------------------------------------------------
  // 6. Known marketplaces (for plugin SHA comparison)
  // -----------------------------------------------------------------------
  const marketplacesPath = path.join(homeDir, '.claude', 'plugins', 'known_marketplaces.json');
  if (fs.existsSync(marketplacesPath)) {
    try {
      const marketplaces = JSON.parse(fs.readFileSync(marketplacesPath, 'utf8'));
      for (const source of sources) {
        if (source.marketplace && marketplaces[source.marketplace]) {
          const mp = marketplaces[source.marketplace];
          source.marketplaceRepo = mp.source ? mp.source.repo : null;
          source.marketplaceLastUpdated = mp.lastUpdated || null;
        }
      }
    } catch (err) {
      // Non-fatal
    }
  }

  return sources;
}

module.exports = discoverSources;

// Allow direct execution for debugging
if (require.main === module) {
  const projectDir = process.argv[2] || process.cwd();
  const homeDir = process.argv[3] || require('os').homedir();
  const sources = discoverSources(projectDir, homeDir);

  process.stdout.write(`\nDiscovered ${sources.length} sources:\n\n`);
  for (const s of sources) {
    const ver = s.localVersion || '-';
    const status = s.installed ? 'installed' : 'not installed';
    process.stdout.write(`  ${s.name.padEnd(35)} ${ver.padEnd(15)} ${s.type.padEnd(15)} ${status}\n`);
  }
  process.stdout.write('\n');
}
