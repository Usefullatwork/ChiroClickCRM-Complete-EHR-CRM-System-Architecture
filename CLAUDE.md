# ChiroClickEHR -- Development Reference

## Quick Reference

- **Path**: Desktop SSD (not HDD -- npm is too slow on HDD)
- **Ports**: Backend=3000, Frontend=5173, Ollama=11434
- **Test credentials**: admin@chiroclickehr.no / admin123
- **DB name**: chiroclickcrm (legacy, not renamed)
- **Brand**: ChiroClickEHR (was ChiroClickCRM)
- **Mode**: Desktop -- DB_ENGINE=pglite, CACHE_ENGINE=memory, DEV_SKIP_AUTH=true

## Test Commands

```bash
# Backend (2,045 tests, 85 suites)
cd backend && npm test

# Frontend (974 tests, 44 suites)
cd frontend && npx vitest --run

# E2E (88 tests, 11 Playwright specs)
cd frontend && npx playwright test

# Single backend file
cd backend && npm test -- --testPathPattern=crm.test.js

# Claude API provider tests only
cd backend && npm test -- --testPathPattern="providers|aiCost|clinicalEvals|extendedThinking|structuredExtraction|clinicalVision|batchProcessor|clinicalOrchestrator|complianceValidator|rag.contextual" --no-coverage
```

## Architecture Overview

**Backend**: Node.js + Express, PGlite for desktop mode (PostgreSQL for Docker). 85 test suites covering auth, patients, encounters, CRM, AI, exercises, billing, GDPR, and security. Swagger API docs at `/api-docs` with 109 annotated endpoints. Multi-tenant via `organization_id` with RLS. Winston logging (no console.log -- pre-commit hook enforces this).

**Frontend**: React 18 + Vite, lazy-loaded chunks (ClinicalEncounter -50.7% after splitting). 44 test suites. Tailwind CSS + design tokens. Norwegian (nb-NO) primary language via i18n. Key pages: Dashboard, ClinicalEncounter, EasyAssessment, PatientDetail, CRM, Training, Settings. Service worker for offline exercise caching.

**AI**: Multi-model Ollama routing (`chiro-no-sft-dpo-v6` production at 96% eval, `chiro-fast` for autocomplete, `chiro-medical` for clinical reasoning). Claude API fallback via provider abstraction (disabled/fallback/preferred/claude_only modes). Budget-tracked with daily/monthly caps. RAG with pgvector + HNSW index.

## File Organization (Canonical Locations)

```
frontend/src/components/
  anatomy/       -- AnatomyViewer, AnatomicalSpine, MuscleMap, EnhancedSpineDiagram, Spine3DViewer
  assessment/    -- EasyAssessment sub-components (BodyChart, SpineDiagram, MacroMatrix)
  examination/   -- AnatomicalBodyChart, BodyChartPanel, ExamPanelManager (clinical exam)
  clinical/      -- QuickPalpationSpine, EnhancedClinicalTextarea, AITextarea, TextExpansionPopup
  patient/       -- Patient self-service/portal components
  patients/      -- Clinician-facing patient views
  exercises/     -- ExercisePanel (670 lines), offline sync
  scheduler/     -- SchedulerDecisions, AppointmentImporter, TodaysMessages

backend/src/
  services/ai.js            -- Multi-model routing with guardrails/RAG (42KB)
  services/providers/       -- claudeProvider, ollamaProvider, aiProviderFactory, budgetTracker
  services/crm.js           -- CRM business logic (~1300 lines)
  services/exercises.js     -- Exercise prescription service (1100+ lines)
  services/reportService.js -- Weekly AI digest (Monday 07:00 Europe/Oslo)
```

## Critical Lessons

1. **NEVER run npm on HDD** (D: drive) from Claude Code -- causes timeouts
2. **Run backend tests** with `cd backend && npm test` (NOT `npx jest` from root)
3. **Pre-commit hook** greps for literal `console.log` -- use `process.stdout.write`
4. **PGlite WASM** crashes under parallel test suites -- known limitation
5. **`useCallback({obj})`** silently crashes in prod builds -- use `useMemo(() => ({obj}))`
6. **Dev mode (Vite HMR)** is lenient with React hook misuse; prod builds crash at runtime
7. **Download Playwright artifacts**: `gh run download --name playwright-report`
8. **Vitest v1 hangs in CI** (jsdom unresolved handles) -- use `timeout -k 10 300 npx vitest --run`
9. **Git commits**: use `-m` flag, not HEREDOC (hangs on Windows MSYS)
10. **`git add .`** / `git add -A` on this large repo can timeout -- stage files by name
11. **Barrel `index.js`** re-exports prevent Vite from tree-shaking (components stay in shared chunk)
12. **Zustand test mocks** need `Object.assign()` pattern for selector/no-selector calls
13. **Don't add duplicate DB columns** -- fix controller to use existing column names + SQL aliases
14. **ESM test import errors**: must use `npm test` (configures ESM loader via jest.config)
15. **`node -e`** with complex JSON on Windows sometimes produces no output -- use `node -p`

## Claude API Integration

### Environment Variables

| Variable                    | Default             | Description                                           |
| --------------------------- | ------------------- | ----------------------------------------------------- |
| `CLAUDE_FALLBACK_MODE`      | `disabled`          | `disabled` / `fallback` / `preferred` / `claude_only` |
| `CLAUDE_API_KEY`            | (none)              | Anthropic SDK key; required for any non-disabled mode |
| `CLAUDE_MODEL`              | `claude-sonnet-4-6` | Override default model mapping                        |
| `CLAUDE_DAILY_BUDGET_USD`   | `10`                | Hard daily spend cap (USD)                            |
| `CLAUDE_MONTHLY_BUDGET_USD` | `200`               | Hard monthly spend cap (USD)                          |

Without `CLAUDE_API_KEY`, the factory falls back to `disabled` regardless of mode.

### Model Mapping (Ollama -> Claude)

| Task                | Ollama Model Pattern | Claude Model        |
| ------------------- | -------------------- | ------------------- |
| SOAP / letters      | `chiro-no*`          | `claude-sonnet-4-6` |
| Norwegian           | `chiro-norwegian*`   | `claude-sonnet-4-6` |
| Red flags / medical | `chiro-medical*`     | `claude-sonnet-4-6` |
| Autocomplete        | `chiro-fast*`        | `claude-haiku-4-5`  |
| Default             | --                   | `claude-sonnet-4-6` |

### Cost Model

| Model               | Input/MTok | Output/MTok | Cache Read (90% off) | Cache Create (+25%) |
| ------------------- | ---------- | ----------- | -------------------- | ------------------- |
| `claude-sonnet-4-6` | $3.00      | $15.00      | $0.30                | $3.75               |
| `claude-haiku-4-5`  | $0.80      | $4.00       | $0.08                | $1.00               |

Budget enforcement: pre-flight `canSpend()` before every Claude call; auto-resets daily/monthly.
Full endpoint docs at `/api-docs` (Swagger).

## Known Tech Debt

- `pdf.js` + `pdfGenerator.js` are split with divergent APIs (not merging yet)
- `assessment/` BodyChart + SpineDiagram used by EasyAssessment (not consolidated with `anatomy/`)
- `mobile-app/` exists (routes/mobile.js now registered in server.js)
- `routes/fhir.js` + `routes/helseId.js` are regulatory stubs (kept for future)
- `services/ai.js` is now a shim re-exporting from `services/ai/` (5 modules)
- i18n: ~75 hardcoded Norwegian strings in 6 components (partially extracted)

## Current State

- **Backend**: 2,045 tests (85 suites), 0 lint errors
- **Frontend**: 974 tests (44 suites), 0 lint errors
- **E2E**: 88 tests (11 Playwright specs)
- **CI**: All 5/5 GREEN (Security, Backend, Frontend, Docker Build, E2E)
- **Commits**: ~42 on main
- **Sprint history**: see `docs/sprint-history.md`
