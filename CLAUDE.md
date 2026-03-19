# ChiroClickEHR

Norwegian-compliant EHR/CRM/PMS for chiropractic clinics. Desktop-first (Electron + PGlite), with patient portal and mobile app.

## Identity

- **Brand**: ChiroClickEHR (DB name stays `chiroclickcrm`)
- **Version**: v2.0.1 released (2026-03-19). Next: v2.1 (patient connectivity)
- **Mode**: Desktop — `DB_ENGINE=pglite`, `CACHE_ENGINE=memory`, `DEV_SKIP_AUTH=true`
- **Ports**: Backend=3000, Frontend=5173, Ollama=11434
- **Credentials**: admin@chiroclickehr.no / admin123

## Current State

- **Backend**: 2,630 tests (124 suites), 0 lint errors
- **Frontend**: 1,046 tests (54 suites), 0 lint errors
- **E2E**: 88 tests (11 Playwright specs)
- **CI**: 5/5 GREEN (Security, Backend, Frontend, Docker Build, E2E)
- **Electron**: Portable exe verified (96MB), PGlite WASM loads correctly
- **Latest migration**: 076 (`patient_connectivity`)
- **Branch**: `feature/v2.1-patient-connectivity` (Sessions 0-2 complete)

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
| Portal   | React pages under `/portal/`           | Auth via portal token. View-only (v2.1 adds booking/messaging). |
| Mobile   | React Native + Expo                    | Exercise-only now. v2.1 adds messaging, docs, booking, push.    |

**Key directories:**

- `frontend/src/components/` — 39 subdirs, ~300 components
- `backend/src/services/` — 97 service files (ai/, providers/, crm, exercises, pdf, etc.)
- `backend/src/routes/` — 52 route files. Swagger at `/api-docs` (109 endpoints)
- `database/migrations/` — 073 migrations (PGlite auto-applies on startup via `db-init.js`)

## v2.1 Sprint: Patient Connectivity

**Goal**: Patients reachable via SMS/email. Documents sendable. Self-service booking + messaging.

**Critical service paths for v2.1:**

| Service                   | Path                    | Status                                                        |
| ------------------------- | ----------------------- | ------------------------------------------------------------- |
| `communications.js`       | `backend/src/services/` | Core SMS/email abstraction                                    |
| `emailService.js`         | `backend/src/services/` | Nodemailer + templates                                        |
| `smsService.js`           | `backend/src/services/` | Twilio client + rate limiting                                 |
| `exerciseDelivery.js`     | `backend/src/services/` | Fixed — imports from `./emailService.js` now                  |
| `appointmentReminders.js` | `backend/src/services/` | Logic exists, DB table created (migration 076)                |
| `documentDelivery.js`     | `backend/src/services/` | NEW — PDF generate + portal doc + email/SMS delivery pipeline |
| `pdfGenerator.js`         | `backend/src/services/` | 7 document types                                              |
| `patientPortal.js`        | `backend/src/routes/`   | Extend with booking, messaging, docs                          |
| `mobile.js`               | `backend/src/routes/`   | 2,200 lines — extend for v2.1                                 |
| `scheduler.js`            | `backend/src/jobs/`     | 12 cron jobs — wire reminders                                 |
| `automations/actions.js`  | `backend/src/services/` | Has `SEND_BOOKING_LINK` (merged from AI tooling branch)       |

**Session 0 complete**: AI tooling merged, exerciseDelivery fixed, migration 076 (4 tables), documentDelivery pipeline + tests.
**Session 2 complete**: Patient self-service booking (request/reschedule/cancel + available slots) + messaging (patient inbox/compose/thread + staff chat). Staff booking request management (approve/reject). 28 new tests.
**Provider strategy**: Mock SMS/email only. Real Twilio/SMTP via `.env` later — no code changes needed.

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

- `pdf.js` + `pdfGenerator.js` split by domain — both via `controllers/pdf.js`
- `assessment/` BodyChart + SpineDiagram not consolidated with `anatomy/`
- `routes/fhir.js` + `routes/helseId.js` are regulatory stubs (future)
- `services/ai.js` is a shim re-exporting from `services/ai/` (5 modules)
- i18n: ~50 bilingual `{en,no}` strings remain by design
- `exerciseDelivery.js` line 11: FIXED (now imports from `./emailService.js`)
