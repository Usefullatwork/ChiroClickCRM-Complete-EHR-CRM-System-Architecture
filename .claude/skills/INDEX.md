# Skills Index

## User-Invocable Skills

| Skill              | Trigger                           | Purpose                                                                     |
| ------------------ | --------------------------------- | --------------------------------------------------------------------------- |
| `design-first`     | Any change touching 3+ files      | Mandatory design gate: read, plan, approve, execute                         |
| `compliance-audit` | Regulatory content review         | Full Norwegian healthcare compliance audit                                  |
| `overnight-sweep`  | `/overnight-sweep` or weekly scan | Run full-suite quality checks across the codebase                           |
| `dream`            | Memory consolidation              | 4-phase memory consolidation: orient, gather, consolidate, prune            |
| `deep-scan`        | Content audit                     | Multi-pass content quality audit with regulatory, parity, and source checks |
| `code-review`      | Code review                       | Two-stage review: spec compliance then quality                              |
| `seo-audit`        | SEO review                        | Comprehensive SEO health check                                              |
| `seo-content`      | Content optimization              | Optimize content for search engine visibility                               |
| `seo-hreflang`     | Hreflang tags                     | Validate and fix hreflang bidirectional links                               |
| `seo-images`       | Image optimization                | Check alt text, lazy loading, image sizes                                   |
| `seo-schema`       | Structured data                   | Validate and add JSON-LD schema markup                                      |
| `seo-sitemap`      | Sitemap management                | Verify sitemap completeness and accuracy                                    |
| `seo-technical`    | Technical SEO                     | Check meta tags, canonical URLs, robots directives                          |
| `ui-audit`         | UI verification                   | 6-pillar UI audit: copywriting, visuals, color, typography, spacing, UX     |
| `i18n-parity`      | Multilingual content              | Verify translation parity between language versions                         |
| `visual-check`     | UI verification                   | Visual regression and layout verification                                   |

## ChiroClickEHR-Specific Skills

| Skill                | Trigger                       | Purpose                                                       |
| -------------------- | ----------------------------- | ------------------------------------------------------------- |
| `docx`               | .docx output request          | Word document creation via pandoc                             |
| `root-cause-tracing` | Strike 2 of error protocol    | Deep execution path tracing for persistent errors             |
| `subagent-review`    | Spawning 3+ parallel agents   | Review gates to prevent agent cross-contamination             |
| `tdd`                | New feature or bug fix        | Red-Green-Refactor test-driven development                    |
| `ui-ux-pro-max`      | UI/UX design work             | Design intelligence: 67 styles, 96 palettes, 57 font pairings |
| `worktree-workflow`  | Agents needing file isolation | Git worktree creation and merge workflow                      |

## Medical Preset Skills

| Skill               | Trigger                           | Purpose                                      |
| ------------------- | --------------------------------- | -------------------------------------------- |
| `phi-check`         | Code handling patient data        | Detects PHI leaks (GDPR Art.9, Normen 5.4.4) |
| `norwegian-medical` | Writing/editing Norwegian UI text | Norwegian Bokmal medical content standards   |
| `wcag-audit`        | Before releases or UI changes     | WCAG 2.1 AA compliance scanning              |

## Background Knowledge Skills (not user-invocable)

| Skill          | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `rpi-workflow` | Research-Plan-Implement development methodology                 |
| `tool-mastery` | Advanced tool use patterns: PTC, ToolSearch, filtering          |
| `web-research` | Web research patterns: Firecrawl, WebSearch, WebFetch workflows |

Background knowledge skills are loaded into agents via the `skills:` frontmatter field.

## Commands (27 total, 4 categories)

| Category    | Command                        | Purpose                                     |
| ----------- | ------------------------------ | ------------------------------------------- |
| session     | `/session:save-state`          | Save current session state before /compact  |
| session     | `/session:resume`              | Restore context after /compact              |
| session     | `/session:reboot`              | 5-question context recovery                 |
| session     | `/session:health`              | Quick project health check                  |
| session     | `/session:backup`              | Backup PGlite database                      |
| session     | `/session:start`               | Start ChiroClickEHR system                  |
| session     | `/session:memory-curator`      | Prune and organize auto-memory files        |
| development | `/development:dev-task`        | Dispatch single task to fresh subagent      |
| development | `/development:parallel`        | Dispatch parallel subagents                 |
| development | `/development:finish-branch`   | Pre-merge checklist                         |
| development | `/development:tech-debt`       | Scan for technical debt                     |
| development | `/development:changelog`       | Generate grouped changelog from git history |
| development | `/development:electron-verify` | Verify Electron desktop build artifacts     |
| development | `/development:rpi-research`    | RPI phase 1: investigate, GO/NO-GO          |
| development | `/development:rpi-plan`        | RPI phase 2: design approach                |
| development | `/development:rpi-implement`   | RPI phase 3: execute plan                   |
| quality     | `/quality:test`                | Run test suite and report                   |
| quality     | `/quality:release-check`       | Pre-release verification                    |
| quality     | `/quality:code-audit`          | Spawn code-reviewer for two-stage audit     |
| quality     | `/quality:i18n-scan`           | Scan for hardcoded Norwegian strings        |
| quality     | `/quality:api-coverage`        | Scan Swagger endpoints vs test files        |
| quality     | `/quality:dep-audit`           | Audit npm deps for vulns and licenses       |
| quality     | `/quality:perf-audit`          | Analyze build output sizes and performance  |
| update      | `/update:update`               | Check all sources for updates and apply     |
| update      | `/update:add-source`           | Track a GitHub repo as skill source         |
| update      | `/update:sync-skills`          | Quick sync shorthand                        |
| update      | `/update:add-skill`            | Install a specific skill                    |
