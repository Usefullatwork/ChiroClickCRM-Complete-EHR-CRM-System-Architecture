# ChiroClickEHR

Norwegian-compliant EHR/CRM/PMS for chiropractic clinics. Desktop-first (Electron + PGlite), with patient portal and mobile app.

## Identity

- **Brand**: ChiroClickEHR (DB name stays `chiroclickcrm`)
- **Version**: v2.1.0 (2026-03-20). Patient connectivity sprint complete.
- **Mode**: Desktop — `DB_ENGINE=pglite`, `CACHE_ENGINE=memory`, `DEV_SKIP_AUTH=true`
- **Ports**: Backend=3000, Frontend=5173, Ollama=11434
- **Credentials**: admin@chiroclickehr.no / admin123

## Current State

- **Backend**: 4,544 tests pass (176 suites). 79 integration suites fail pre-existing (PGlite top-level await + Jest ESM circular init — NOT from our work).
- **Frontend**: 158/158 tests pass (32 pre-existing failures in InvoiceGenerator/BodyChart/PlaygroundTab/Training/Automations), build OK
- **E2E**: 21 Playwright spec files (+3 in Sprint 6: GDPR erasure, kiosk intake, multi-org security)
- **CI**: 5/5 GREEN (Security, Backend, Frontend, Docker Build, E2E)
- **Electron**: Portable exe verified (96MB), PGlite WASM loads correctly
- **Latest migration**: 079 (`v7 training data`)
- **Branch**: `sprint6/overnight-blitz` (Sprint 6: test coverage + refactoring blitz)
- **Services**: 8 domain dirs + 27 extracted modules. All files <500 lines. Zero SELECT \*.
- **Sprint 6**: +42 test files, 5 FE components split, 4 data files→JSON, 5 BE routes split into sub-routes

## Commands

```bash
cd backend && npm test                          # All backend tests
cd backend && npm test -- --testPathPattern=X   # Single test file
cd frontend && npx vitest --run                 # All frontend tests
cd frontend && npm run build                    # Verify prod build
cd frontend && npx playwright test              # E2E tests
```

## Architecture

| Layer    | Stack                                  | Notes                                                           |
| -------- | -------------------------------------- | --------------------------------------------------------------- |
| Backend  | Node.js + Express + PGlite             | Multi-tenant via `organization_id`. Winston logging.            |
| Frontend | React 18 + Vite + Tailwind             | i18n (18 namespaces, ~70 components). Lazy-loaded chunks.       |
| AI       | Ollama (chiro-no-sft-dpo-v6, 96% eval) | Claude API fallback via provider abstraction. Budget-tracked.   |
| Desktop  | Electron (portable exe)                | `ELECTRON_RUN_AS_NODE=1` for backend fork. PGlite `asarUnpack`. |
| Portal   | React pages under `/portal/`           | Booking, messaging, documents, communication preferences.       |
| Mobile   | React Native + Expo                    | Exercises, messaging, documents, booking, push notifications.   |

**Key directories:**

- `frontend/src/components/` — 40 subdirs (incl. crm-settings/), ~300 components
- `frontend/src/services/api/` — 7 domain modules (patients, clinical, billing, communications, ai, admin, client)
- `frontend/src/config/api.js` — API_BASE_URL + API_TIMEOUT constants
- `backend/src/services/` — 8 domain dirs + extracted modules per domain
- `backend/src/jobs/` — 4 scheduler modules (jobRunner, communicationJobs, aiJobs, maintenanceJobs)
- `backend/src/application/services/` — 4 AI training modules (trainingPipeline, modelValidation, dataCuration, retrainingMetrics)
- `backend/src/routes/` — 49 route files (47 registered + 2 regulatory stubs). Swagger at `/api-docs` (109 endpoints)
- `database/migrations/` — 078 migrations (PGlite auto-applies on startup via `db-init.js`). Gap at 025 is intentional (removed in commit 201f79b)

## Patient Connectivity (v2.1 — COMPLETE)

| Service                    | Role                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| `documentDelivery.js`      | PDF generate → portal doc → email/SMS/push pipeline                           |
| `pushNotification.js`      | Expo Push API wrapper (mock in desktop)                                       |
| `appointmentReminders.js`  | Schedule on create, cancel on cancel, \*/15 cron                              |
| `communications.js`        | Core SMS/email abstraction — all delivery routes through here                 |
| `patientPortal.js` (route) | Booking, messaging, documents, preferences                                    |
| `routes/mobile/` (dir)     | Split into 7 sub-routes: auth, profile, exercises, programs, workouts, clinic |
| `automations/actions.js`   | 9 action types incl. SEND_BOOKING_LINK                                        |

**Provider strategy**: Mock in desktop mode. Set `EMAIL_PROVIDER=smtp` + `SMS_PROVIDER=twilio` + Firebase creds for real delivery.

## Gotchas

1. **Git**: `-m` flag only (HEREDOC hangs on Windows). Stage files by name (never `git add .`).
2. **Backend tests**: `cd backend && npm test` (NOT `npx jest` from root — ESM loader issue).
3. **Pre-commit hook**: greps for `console.log` — use `process.stdout.write`.
4. **PGlite WASM**: crashes under parallel test suites — known, not a regression.
5. **Prod builds**: `useCallback({obj})` crashes silently — use `useMemo(() => ({obj}))`.
6. **Vite dev vs prod**: dev mode tolerates React hook misuse; prod crashes at runtime.
7. **Vitest CI**: hangs on completion — use `timeout -k 10 300 npx vitest --run`.
8. **i18n**: CUSTOM `useTranslation` from `./i18n` (NOT react-i18next). Same API, local module.
9. **Barrel exports**: `index.js` re-exports prevent Vite tree-shaking.
10. **Electron**: `process.resourcesPath` replaces `__dirname/..` in packaged app.
11. **`node -e`** on Windows: sometimes no output — use `node -p` instead.

## Claude API

| Variable                    | Default    | Description                                           |
| --------------------------- | ---------- | ----------------------------------------------------- |
| `CLAUDE_FALLBACK_MODE`      | `disabled` | `disabled` / `fallback` / `preferred` / `claude_only` |
| `CLAUDE_API_KEY`            | (none)     | Required for any non-disabled mode                    |
| `CLAUDE_DAILY_BUDGET_USD`   | `10`       | Hard daily cap                                        |
| `CLAUDE_MONTHLY_BUDGET_USD` | `200`      | Hard monthly cap                                      |

Budget enforcement: `canSpend()` pre-flight. Auto-resets daily/monthly.

## Tech Debt

- `pdf.js` + `pdfGenerator.js` split by domain — both in `services/clinical/`, accessed via `controllers/pdf.js`
- `routes/fhir.js` + `routes/helseId.js` are regulatory stubs (future)
- `services/ai/` — runtime inference (9 modules). `services/training/` — model training pipeline (13 modules)
- i18n: ~50 bilingual `{en,no}` strings remain by design

## System Basics V2 (v1.3.0, medical preset)

### Installed Components

- **Agents**: 18 (6 core + 2 browser + 6 seo + 4 workflows)
- **Skills**: 28 (19 SB2 + 6 project-specific + 3 medical)
- **Commands**: 27 (18 SB2 + 9 project-specific)
- **Rules**: 7 (5 SB2 base + 2 medical)
- **Hooks**: Full template (12 event types)

### Command Structure (27 commands in 4 categories)

| Category         | Commands                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| session/ (7)     | save-state, resume, reboot, health, backup, start, memory-curator                                               |
| development/ (9) | dev-task, parallel, finish-branch, tech-debt, changelog, electron-verify, rpi-research, rpi-plan, rpi-implement |
| quality/ (7)     | test, release-check, i18n-scan, api-coverage, dep-audit, perf-audit, code-audit                                 |
| update/ (4)      | update, add-source, sync-skills, add-skill                                                                      |

### Session Management

1. Work normally until warned at 40 tool calls
2. Run `/session:save-state` to persist progress
3. Run `/compact` to reclaim context
4. Run `/session:resume` to restore and continue
5. If degraded, `/session:reboot` for 5-question recovery

### Agent Model Routing

- **Sonnet**: Implementation (backend-dev, frontend-dev, clinical-qa, test-analyzer)
- **Opus**: Review (code-reviewer, compliance-scanner, chief-of-staff, research-lead)

### Dream Consolidation

- Manual: `/dream` to consolidate session learnings
- Auto: `should-dream.sh` Stop hook triggers after 24hr gap
- State: `.planning/last-dream-timestamp`

### MCP Servers (template)

Copy `.mcp.json.template` to `.mcp.json` and fill in API keys:

- Playwright (visual testing)
- Context7 (documentation lookup)
- DeepWiki (wiki research)
- Firecrawl (web scraping, requires API key)

### Unified Update System

```bash
node scripts/update.js --check   # Check for updates
node scripts/update.js           # Apply updates
```
