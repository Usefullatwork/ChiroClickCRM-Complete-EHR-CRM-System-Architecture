#!/usr/bin/env node
/**
 * System Basics V2 -- Version Checker
 *
 * Checks remote versions for different source types:
 *   - GitHub repos: fetch latest commit SHA or release tag
 *   - npm packages: fetch registry.npmjs.org for latest version
 *   - Plugins: compare installed SHA with marketplace latest
 *
 * Uses only Node.js stdlib (https module).  All network calls have
 * a 10-second timeout to avoid hanging.
 */

const https = require('https');

const TIMEOUT_MS = 10000;

// -------------------------------------------------------------------------
// HTTP helpers
// -------------------------------------------------------------------------

/**
 * Perform an HTTPS GET and return the parsed JSON body.
 * Follows up to 3 redirects.  Rejects on timeout or HTTP errors.
 *
 * @param {string} url
 * @param {Object} [headers]
 * @param {number} [redirects]
 * @returns {Promise<Object>}
 */
function fetchJson(url, headers = {}, redirects = 3) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': 'system-basics-v2-updater/1.0',
      'Accept': 'application/json',
      ...headers,
    };

    const req = https.get(url, { headers: defaultHeaders, timeout: TIMEOUT_MS }, (res) => {
      // Follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        if (redirects <= 0) {
          reject(new Error(`Too many redirects for ${url}`));
          return;
        }
        fetchJson(res.headers.location, headers, redirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (res.statusCode === 403) {
        reject(new Error('GitHub API rate limit exceeded (403). Try again later or set GITHUB_TOKEN.'));
        return;
      }

      if (res.statusCode === 404) {
        reject(new Error(`Not found: ${url}`));
        return;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Invalid JSON from ${url}: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/**
 * Build GitHub API headers.  If GITHUB_TOKEN is set, include it
 * to raise rate limits from 60/hr to 5000/hr.
 */
function githubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------------------
// Version check strategies
// -------------------------------------------------------------------------

/**
 * Check a GitHub repo for the latest commit SHA on a branch.
 *
 * @param {string} repo      "owner/name"
 * @param {string} [branch]  default "main"
 * @returns {Promise<{sha: string, date: string, message: string}>}
 */
async function checkGitHubLatestCommit(repo, branch = 'main') {
  const url = `https://api.github.com/repos/${repo}/commits/${branch}`;
  const data = await fetchJson(url, githubHeaders());
  return {
    sha: data.sha,
    shortSha: data.sha.slice(0, 12),
    date: data.commit?.committer?.date || null,
    message: (data.commit?.message || '').split('\n')[0].slice(0, 80),
  };
}

/**
 * Check a GitHub repo for the latest release tag.
 *
 * @param {string} repo  "owner/name"
 * @returns {Promise<{tag: string, date: string, name: string} | null>}
 */
async function checkGitHubLatestRelease(repo) {
  try {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const data = await fetchJson(url, githubHeaders());
    return {
      tag: data.tag_name,
      version: data.tag_name.replace(/^v/, ''),
      date: data.published_at || null,
      name: data.name || data.tag_name,
    };
  } catch (err) {
    // Many repos don't have releases -- fall back to null
    return null;
  }
}

/**
 * Check the npm registry for the latest version of a package.
 *
 * @param {string} packageName
 * @returns {Promise<{version: string, date: string}>}
 */
async function checkNpmLatest(packageName) {
  // Scoped packages need URL-encoding: @scope/name -> @scope%2Fname
  const encoded = packageName.replace('/', '%2F');
  const url = `https://registry.npmjs.org/${encoded}/latest`;
  const data = await fetchJson(url);
  return {
    version: data.version,
    date: null, // npm /latest doesn't include time; would need full metadata
  };
}

/**
 * Check a GitHub repo tree to compute a quick "content hash" for a set of
 * paths.  This lets us detect file-level changes without downloading
 * every file.
 *
 * @param {string} repo     "owner/name"
 * @param {string} branch   Branch name
 * @param {string[]} paths  Paths within the repo to check
 * @returns {Promise<{treeSha: string, fileCount: number, files: Array}>}
 */
async function checkGitHubTree(repo, branch = 'main', paths = []) {
  const url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
  const data = await fetchJson(url, githubHeaders());

  if (!data.tree) {
    throw new Error(`No tree data for ${repo}@${branch}`);
  }

  let files = data.tree.filter((item) => item.type === 'blob');

  // Filter to only requested paths if specified
  if (paths.length > 0) {
    files = files.filter((item) =>
      paths.some((p) => item.path.startsWith(p))
    );
  }

  return {
    treeSha: data.sha,
    fileCount: files.length,
    files: files.map((f) => ({ path: f.path, sha: f.sha, size: f.size })),
  };
}

// -------------------------------------------------------------------------
// Unified check for a single source
// -------------------------------------------------------------------------

/**
 * Check a single source for available updates.
 * Returns the source object enriched with remote version info and status.
 *
 * @param {Object} source  A source descriptor from discover-sources.js
 * @returns {Promise<Object>}  Enriched source with .remoteVersion, .status, .updateInfo
 */
async function checkSource(source) {
  const result = { ...source, remoteVersion: null, status: 'UNKNOWN', updateInfo: null };

  try {
    // --- npm packages ---
    if (source.package) {
      const npm = await checkNpmLatest(source.package);
      result.remoteVersion = npm.version;

      if (!source.localVersion || source.localVersion === '-') {
        result.status = source.installed ? 'CHECK' : 'NEW';
      } else if (source.localVersion === npm.version) {
        result.status = 'OK';
      } else {
        result.status = 'UPDATE';
      }
      result.updateInfo = {
        command: `npm install ${source.package}@latest`,
        from: source.localVersion,
        to: npm.version,
      };
      return result;
    }

    // --- GitHub repos ---
    if (source.repo) {
      // Try release tag first
      const release = await checkGitHubLatestRelease(source.repo);

      if (release) {
        result.remoteVersion = release.version;
        result.updateInfo = {
          release: release.tag,
          releaseName: release.name,
          releaseDate: release.date,
        };

        if (source.localVersion && source.localVersion === release.version) {
          result.status = 'OK';
        } else if (source.localVersion) {
          result.status = 'UPDATE';
          result.updateInfo.from = source.localVersion;
          result.updateInfo.to = release.version;
        }
      }

      // Always also get latest commit for SHA comparison
      const commit = await checkGitHubLatestCommit(source.repo, source.branch || 'main');
      result.remoteCommit = commit;

      if (source.localSha) {
        if (source.localSha === commit.sha || commit.sha.startsWith(source.localSha)) {
          if (result.status === 'UNKNOWN') result.status = 'OK';
        } else {
          result.status = 'UPDATE';
          if (!result.updateInfo) result.updateInfo = {};
          result.updateInfo.fromSha = source.localSha.slice(0, 12);
          result.updateInfo.toSha = commit.shortSha;
          result.updateInfo.commitMessage = commit.message;
          result.updateInfo.commitDate = commit.date;
        }
      }

      // For repos with paths, get the tree to count changed files
      if (source.paths && source.paths.length > 0 && result.status === 'UPDATE') {
        try {
          const tree = await checkGitHubTree(source.repo, source.branch || 'main', source.paths);
          result.updateInfo.remoteFileCount = tree.fileCount;
          result.updateInfo.treeSha = tree.treeSha;
        } catch (treeErr) {
          // Non-fatal: tree info is just bonus detail
        }
      }

      // If we have no version info at all, mark based on install status
      if (result.status === 'UNKNOWN') {
        result.status = source.installed ? 'CHECK' : 'NEW';
        result.remoteVersion = release ? release.version : commit.shortSha;
      }

      return result;
    }

    // --- Plugins (compare SHA with marketplace) ---
    if (source.type === 'plugin' && source.marketplaceRepo) {
      const commit = await checkGitHubLatestCommit(source.marketplaceRepo, 'main');
      result.remoteCommit = commit;
      result.remoteVersion = commit.shortSha;

      if (source.localSha) {
        if (source.localSha === commit.sha || commit.sha.startsWith(source.localSha)) {
          result.status = 'OK';
        } else {
          result.status = 'UPDATE';
          result.updateInfo = {
            fromSha: source.localSha.slice(0, 12),
            toSha: commit.shortSha,
            command: `claude plugins update ${source.name}`,
          };
        }
      } else {
        result.status = source.installed ? 'CHECK' : 'NEW';
      }

      return result;
    }

    // --- Fallback for plugins without marketplace repo ---
    if (source.type === 'plugin') {
      result.status = source.installed ? 'OK' : 'NEW';
      result.remoteVersion = source.localVersion || '-';
      return result;
    }

    // --- Local skills ---
    if (source.type === 'local-skill') {
      result.status = 'OK';
      result.remoteVersion = source.localVersion || '-';
      return result;
    }

  } catch (err) {
    result.status = 'ERROR';
    result.error = err.message;
  }

  return result;
}

/**
 * Check all sources in parallel with concurrency limit.
 *
 * @param {Array<Object>} sources
 * @param {number} [concurrency]  Max parallel requests (default 5)
 * @returns {Promise<Array<Object>>}
 */
async function checkAllSources(sources, concurrency = 5) {
  const results = [];
  const queue = [...sources];

  async function worker() {
    while (queue.length > 0) {
      const source = queue.shift();
      const result = await checkSource(source);
      results.push(result);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

module.exports = {
  fetchJson,
  githubHeaders,
  checkGitHubLatestCommit,
  checkGitHubLatestRelease,
  checkNpmLatest,
  checkGitHubTree,
  checkSource,
  checkAllSources,
};

// Allow direct execution for debugging
if (require.main === module) {
  const discoverSources = require('./discover-sources');
  const projectDir = process.argv[2] || process.cwd();
  const homeDir = require('os').homedir();

  process.stdout.write('Discovering sources...\n');
  const sources = discoverSources(projectDir, homeDir);
  process.stdout.write(`Found ${sources.length} sources. Checking versions...\n\n`);

  checkAllSources(sources)
    .then((results) => {
      for (const r of results) {
        const local = (r.localVersion || r.localSha?.slice(0, 12) || '-').padEnd(15);
        const remote = (r.remoteVersion || '-').padEnd(15);
        const status = r.status.padEnd(8);
        process.stdout.write(`  ${r.name.padEnd(35)} ${local} ${remote} ${status}\n`);
        if (r.error) {
          process.stdout.write(`    ERROR: ${r.error}\n`);
        }
      }
      process.stdout.write('\n');
    })
    .catch((err) => {
      process.stderr.write(`Fatal: ${err.message}\n`);
      process.exit(1);
    });
}
