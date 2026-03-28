#!/usr/bin/env node
/**
 * System Basics V2 — Structure Validator
 *
 * Validates:
 *   1. All SKILL.md files have valid YAML frontmatter (name, description)
 *   2. All agent .md files have valid YAML frontmatter (name, description, model)
 *   3. All preset.json files reference existing files
 *   4. No broken internal references
 *
 * Exit code 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;
let checked = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function error(msg) {
  process.stdout.write(`  ERROR: ${msg}\n`);
  errors++;
}

function warn(msg) {
  process.stdout.write(`  WARN:  ${msg}\n`);
  warnings++;
}

function ok(msg) {
  process.stdout.write(`  OK:    ${msg}\n`);
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns null if no frontmatter found, or an object with parsed key-value pairs.
 * This is a simple parser — handles string, boolean, number, and CSV list values.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const lines = match[1].split(/\r?\n/);
  const result = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse booleans
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Parse numbers
    else if (/^\d+$/.test(value)) value = parseInt(value, 10);

    result[key] = value;
  }

  return result;
}

/**
 * Recursively find files matching a pattern.
 */
function findFiles(dir, test) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, screenshots
      if (['node_modules', '.git', 'screenshots', 'dist'].includes(entry.name)) continue;
      results.push(...findFiles(fullPath, test));
    } else if (test(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validateSkills() {
  process.stdout.write('\n--- Validating Skills ---\n');

  const skillFiles = findFiles(
    path.join(ROOT, '.claude', 'skills'),
    (name) => name === 'SKILL.md',
  );

  // Also check preset skill directories
  const presetSkillFiles = findFiles(
    path.join(ROOT, 'presets'),
    (name) => name === 'SKILL.md',
  );

  const allSkillFiles = [...skillFiles, ...presetSkillFiles];

  if (allSkillFiles.length === 0) {
    warn('No SKILL.md files found');
    return;
  }

  for (const filePath of allSkillFiles) {
    const relativePath = path.relative(ROOT, filePath);
    checked++;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      error(`${relativePath}: Missing YAML frontmatter (expected --- block)`);
      continue;
    }

    if (!frontmatter.name) {
      error(`${relativePath}: Missing required field 'name' in frontmatter`);
    }

    if (!frontmatter.description) {
      error(`${relativePath}: Missing required field 'description' in frontmatter`);
    }

    if (frontmatter.name && frontmatter.description) {
      ok(`${relativePath}: ${frontmatter.name}`);
    }
  }
}

function validateAgents() {
  process.stdout.write('\n--- Validating Agents ---\n');

  // Find agent .md files in .claude/agents/ and presets/*/agents/
  const coreAgents = findFiles(
    path.join(ROOT, '.claude', 'agents'),
    (name) => name.endsWith('.md') && name !== 'INDEX.md',
  );

  const presetAgents = findFiles(
    path.join(ROOT, 'presets'),
    (name, fullPath) => name.endsWith('.md') && fullPath.includes('agents'),
  );

  const borisAgents = findFiles(
    path.join(ROOT, 'boris-playbook', 'agents'),
    (name) => name.endsWith('.md'),
  );

  const allAgents = [...coreAgents, ...presetAgents, ...borisAgents];

  if (allAgents.length === 0) {
    warn('No agent .md files found');
    return;
  }

  for (const filePath of allAgents) {
    const relativePath = path.relative(ROOT, filePath);
    checked++;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      error(`${relativePath}: Missing YAML frontmatter (expected --- block)`);
      continue;
    }

    if (!frontmatter.name) {
      error(`${relativePath}: Missing required field 'name' in frontmatter`);
    }

    if (!frontmatter.description) {
      error(`${relativePath}: Missing required field 'description' in frontmatter`);
    }

    // Model is recommended but not strictly required (inherits from session)
    if (!frontmatter.model) {
      warn(`${relativePath}: No 'model' field — will use session default`);
    }

    if (frontmatter.name && frontmatter.description) {
      ok(`${relativePath}: ${frontmatter.name} (model: ${frontmatter.model || 'default'})`);
    }
  }
}

function validatePresets() {
  process.stdout.write('\n--- Validating Presets ---\n');

  const presetsDir = path.join(ROOT, 'presets');
  if (!fs.existsSync(presetsDir)) {
    warn('No presets/ directory found');
    return;
  }

  const presetDirs = fs.readdirSync(presetsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const presetName of presetDirs) {
    const presetDir = path.join(presetsDir, presetName);
    const manifestPath = path.join(presetDir, 'preset.json');
    checked++;

    if (!fs.existsSync(manifestPath)) {
      error(`presets/${presetName}/: Missing preset.json manifest`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      error(`presets/${presetName}/preset.json: Invalid JSON — ${e.message}`);
      continue;
    }

    // Check required fields
    if (!manifest.name) {
      error(`presets/${presetName}/preset.json: Missing 'name' field`);
    } else if (manifest.name !== presetName) {
      warn(`presets/${presetName}/preset.json: 'name' (${manifest.name}) does not match directory (${presetName})`);
    }

    if (!manifest.description) {
      error(`presets/${presetName}/preset.json: Missing 'description' field`);
    }

    // Validate agent references
    if (manifest.agents && Array.isArray(manifest.agents)) {
      for (const agentName of manifest.agents) {
        const agentPath = path.join(presetDir, 'agents', `${agentName}.md`);
        if (!fs.existsSync(agentPath)) {
          error(`presets/${presetName}/preset.json: References agent '${agentName}' but file not found at agents/${agentName}.md`);
        } else {
          ok(`presets/${presetName}/: Agent '${agentName}' exists`);
        }
      }
    }

    if (!manifest.agents || manifest.agents.length === 0) {
      warn(`presets/${presetName}/preset.json: No agents defined`);
    }

    ok(`presets/${presetName}/preset.json: ${manifest.name} — ${manifest.description?.slice(0, 60) || 'no description'}...`);
  }
}

function validateInternalReferences() {
  process.stdout.write('\n--- Validating Internal References ---\n');

  // Check that settings.json hook scripts exist
  const settingsPath = path.join(ROOT, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    checked++;
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const hooks = settings.hooks || {};

      for (const [eventName, hookList] of Object.entries(hooks)) {
        if (!Array.isArray(hookList)) continue;

        for (const hookGroup of hookList) {
          if (!hookGroup.hooks || !Array.isArray(hookGroup.hooks)) continue;

          for (const hook of hookGroup.hooks) {
            if (hook.type !== 'command') continue;

            // Extract script paths from hook commands
            const scriptMatch = hook.command.match(/bash\s+([\w/./-]+\.sh)/);
            if (scriptMatch) {
              const scriptPath = path.join(ROOT, scriptMatch[1]);
              if (!fs.existsSync(scriptPath)) {
                error(`.claude/settings.json: Hook references '${scriptMatch[1]}' but file not found`);
              } else {
                ok(`.claude/settings.json: ${eventName} hook script exists — ${scriptMatch[1]}`);
              }
            }
          }
        }
      }
    } catch (e) {
      error(`.claude/settings.json: Invalid JSON — ${e.message}`);
    }
  }

  // Check hook settings templates reference existing scripts
  const templatesDir = path.join(ROOT, 'hooks', 'settings-templates');
  if (fs.existsSync(templatesDir)) {
    const templates = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json'));

    for (const template of templates) {
      checked++;
      const templatePath = path.join(templatesDir, template);
      try {
        const content = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        const hooks = content.hooks || {};

        for (const [eventName, hookList] of Object.entries(hooks)) {
          if (!Array.isArray(hookList)) continue;

          for (const hookGroup of hookList) {
            if (!hookGroup.hooks || !Array.isArray(hookGroup.hooks)) continue;

            for (const hook of hookGroup.hooks) {
              if (hook.type !== 'command') continue;

              const scriptMatch = hook.command.match(/bash\s+([\w/./-]+\.sh)/);
              if (scriptMatch) {
                const scriptPath = path.join(ROOT, scriptMatch[1]);
                if (!fs.existsSync(scriptPath)) {
                  error(`hooks/settings-templates/${template}: References '${scriptMatch[1]}' but file not found`);
                }
              }
            }
          }
        }

        ok(`hooks/settings-templates/${template}: Valid JSON`);
      } catch (e) {
        error(`hooks/settings-templates/${template}: Invalid JSON — ${e.message}`);
      }
    }
  }

  // Check INDEX.md skill references exist
  const indexPath = path.join(ROOT, '.claude', 'skills', 'INDEX.md');
  if (fs.existsSync(indexPath)) {
    checked++;
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const skillNames = [];

    // Extract skill names from markdown table rows
    const tableRows = indexContent.match(/^\|\s*`([^`]+)`/gm);
    if (tableRows) {
      for (const row of tableRows) {
        const match = row.match(/`([^`]+)`/);
        if (match) skillNames.push(match[1]);
      }
    }

    // Check that referenced skills have a SKILL.md
    const existingSkillDirs = new Set();
    const skillsDir = path.join(ROOT, '.claude', 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (entry.isDirectory()) existingSkillDirs.add(entry.name);
      }
    }

    for (const skillName of skillNames) {
      if (existingSkillDirs.has(skillName)) {
        const skillMd = path.join(skillsDir, skillName, 'SKILL.md');
        if (!fs.existsSync(skillMd)) {
          warn(`INDEX.md references skill '${skillName}' — directory exists but SKILL.md missing`);
        }
      }
      // Skills listed in INDEX.md may not have directories (e.g., skills defined in presets)
      // This is not an error — just informational
    }

    ok('.claude/skills/INDEX.md: Parsed');
  }
}

// ---------------------------------------------------------------------------
// Check 1: Domain Enum Validation
// ---------------------------------------------------------------------------

function validateDomainEnums() {
  process.stdout.write('\n--- Validating Domain Enums (Agent Library) ---\n');

  // Load valid domains from _schema.json
  const schemaPath = path.join(ROOT, 'agents', '_schema.json');
  if (!fs.existsSync(schemaPath)) {
    warn('agents/_schema.json not found — skipping domain enum validation');
    return;
  }

  let validDomains;
  try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    validDomains = schema.properties.domain.enum;
  } catch (e) {
    error(`agents/_schema.json: Failed to parse — ${e.message}`);
    return;
  }

  const agentFiles = findFiles(
    path.join(ROOT, 'agents'),
    (name) => name.endsWith('.md') && name !== '_template.md' && name !== 'INDEX.md',
  );

  let invalidCount = 0;

  for (const filePath of agentFiles) {
    const relativePath = path.relative(ROOT, filePath);
    checked++;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) continue; // Already reported in validateAgents

    if (!frontmatter.domain) {
      error(`${relativePath}: Missing 'domain' field`);
      invalidCount++;
    } else if (!validDomains.includes(frontmatter.domain)) {
      error(`${relativePath}: Invalid domain '${frontmatter.domain}' — must be one of: ${validDomains.join(', ')}`);
      invalidCount++;
    }
  }

  if (invalidCount === 0) {
    ok(`All ${agentFiles.length} library agents have valid domain enums`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: Cross-Reference Validation
// ---------------------------------------------------------------------------

function validateCrossReferences() {
  process.stdout.write('\n--- Validating Cross-References ---\n');

  // Build a set of all agent names (filename without .md) across the library
  const agentFiles = findFiles(
    path.join(ROOT, 'agents'),
    (name) => name.endsWith('.md') && name !== '_template.md' && name !== 'INDEX.md',
  );

  const knownAgentNames = new Set();
  for (const filePath of agentFiles) {
    const baseName = path.basename(filePath, '.md');
    knownAgentNames.add(baseName);
  }

  // Template placeholders to skip
  const placeholders = new Set(['related1', 'related2', 'related3', 'related4', 'related5']);

  let brokenCount = 0;
  let checkedCount = 0;

  for (const filePath of agentFiles) {
    const relativePath = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter || !frontmatter.related_agents) continue;

    checked++;
    checkedCount++;

    // Parse the related_agents value — it can be a CSV string like "[a, b, c]"
    let relatedStr = String(frontmatter.related_agents);
    // Strip surrounding brackets if present
    relatedStr = relatedStr.replace(/^\[/, '').replace(/\]$/, '');
    const relatedList = relatedStr.split(',').map((s) => s.trim()).filter(Boolean);

    for (const refName of relatedList) {
      if (placeholders.has(refName)) continue;

      if (!knownAgentNames.has(refName)) {
        warn(`${relativePath}: related_agents references '${refName}' — not found in agent library`);
        brokenCount++;
      }
    }
  }

  if (brokenCount === 0) {
    ok(`All cross-references valid across ${checkedCount} agents with related_agents`);
  } else {
    warn(`${brokenCount} broken cross-references found`);
  }
}

// ---------------------------------------------------------------------------
// Check 3: Curated Agent Frontmatter Completeness
// ---------------------------------------------------------------------------

function validateCuratedAgents() {
  process.stdout.write('\n--- Validating Curated Agent Frontmatter ---\n');

  const curatedDir = path.join(ROOT, '.claude', 'agents');
  if (!fs.existsSync(curatedDir)) {
    warn('.claude/agents/ directory not found');
    return;
  }

  const requiredFields = ['name', 'description', 'model', 'tools', 'permissionMode', 'maxTurns', 'color', 'skills', 'effort'];

  const curatedFiles = findFiles(
    curatedDir,
    (name) => name.endsWith('.md'),
  );

  if (curatedFiles.length === 0) {
    warn('No curated agent files found in .claude/agents/');
    return;
  }

  let incompleteCount = 0;

  for (const filePath of curatedFiles) {
    const relativePath = path.relative(ROOT, filePath);
    checked++;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      error(`${relativePath}: Missing YAML frontmatter`);
      incompleteCount++;
      continue;
    }

    const missing = [];
    for (const field of requiredFields) {
      if (frontmatter[field] === undefined || frontmatter[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      warn(`${relativePath}: Missing curated fields: ${missing.join(', ')}`);
      incompleteCount++;
    } else {
      ok(`${relativePath}: All ${requiredFields.length} curated fields present`);
    }
  }

  if (incompleteCount === 0) {
    ok(`All ${curatedFiles.length} curated agents have complete frontmatter`);
  }
}

// ---------------------------------------------------------------------------
// Check 4: Skill Frontmatter Validation
// ---------------------------------------------------------------------------

function validateSkillFrontmatter() {
  process.stdout.write('\n--- Validating Skill Frontmatter (user-invocable) ---\n');

  // Gather all SKILL.md files from .claude/skills/ and presets/
  const coreSkills = findFiles(
    path.join(ROOT, '.claude', 'skills'),
    (name) => name === 'SKILL.md',
  );

  const presetSkills = findFiles(
    path.join(ROOT, 'presets'),
    (name) => name === 'SKILL.md',
  );

  const allSkills = [...coreSkills, ...presetSkills];

  if (allSkills.length === 0) {
    warn('No SKILL.md files found');
    return;
  }

  let issueCount = 0;

  for (const filePath of allSkills) {
    const relativePath = path.relative(ROOT, filePath);
    checked++;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) continue; // Already reported in validateSkills

    // Check 4a: user-invocable field must exist
    if (frontmatter['user-invocable'] === undefined) {
      warn(`${relativePath}: Missing 'user-invocable' field (mandatory per Wave 1)`);
      issueCount++;
      continue;
    }

    // Check 4b: if user-invocable is false, disable-model-invocation must be true
    if (frontmatter['user-invocable'] === false) {
      if (frontmatter['disable-model-invocation'] !== true) {
        warn(`${relativePath}: user-invocable is false but 'disable-model-invocation: true' is missing`);
        issueCount++;
      } else {
        ok(`${relativePath}: Correctly configured as non-invocable`);
      }
    } else {
      ok(`${relativePath}: user-invocable: true`);
    }
  }

  if (issueCount === 0) {
    ok(`All ${allSkills.length} skills have valid user-invocable configuration`);
  }
}

// ---------------------------------------------------------------------------
// Check 5: README Badge Count
// ---------------------------------------------------------------------------

function validateReadmeBadgeCount() {
  process.stdout.write('\n--- Validating README Badge Count ---\n');

  const readmePath = path.join(ROOT, 'README.md');
  if (!fs.existsSync(readmePath)) {
    warn('README.md not found — skipping badge count validation');
    return;
  }

  checked++;

  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Extract agent count from badge — pattern like "Agents-318" or "Agents-316_library"
  const badgeMatch = readmeContent.match(/Agents[_-](\d+)/i);
  if (!badgeMatch) {
    warn('README.md: Could not find agent count in badge');
    return;
  }

  const badgeCount = parseInt(badgeMatch[1], 10);

  // Count actual .md files in agents/ subdirectories (excluding _template.md, INDEX.md, _schema.json)
  const agentFiles = findFiles(
    path.join(ROOT, 'agents'),
    (name) => name.endsWith('.md') && name !== '_template.md' && name !== 'INDEX.md',
  );

  const actualCount = agentFiles.length;

  if (badgeCount === actualCount) {
    ok(`README badge count (${badgeCount}) matches actual agent count (${actualCount})`);
  } else {
    warn(`README badge says ${badgeCount} library agents but found ${actualCount} — update the badge`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

process.stdout.write('System Basics V2 — Structure Validator\n');
process.stdout.write('='.repeat(45) + '\n');

validateSkills();
validateAgents();
validatePresets();
validateInternalReferences();
validateDomainEnums();
validateCrossReferences();
validateCuratedAgents();
validateSkillFrontmatter();
validateReadmeBadgeCount();

process.stdout.write('\n' + '='.repeat(45) + '\n');
process.stdout.write(`Checked: ${checked} items\n`);
process.stdout.write(`Errors:  ${errors}\n`);
process.stdout.write(`Warnings: ${warnings}\n`);

if (errors > 0) {
  process.stdout.write('\nVALIDATION FAILED\n');
  process.exit(1);
} else {
  process.stdout.write('\nVALIDATION PASSED\n');
  process.exit(0);
}
