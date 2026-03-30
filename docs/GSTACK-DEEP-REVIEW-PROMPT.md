# ChiroClickEHR — Deep Review & Improvement Session

> **Use this prompt in a fresh Claude Code session with [gstack](https://github.com/garrytan/gstack) installed.**
> Run: `/gstack-office-hours` first, then follow the sprint flow below.

---

## Project Context

You are working on **ChiroClickEHR** — a Norwegian-compliant EHR/CRM/PMS system for chiropractic clinics. Desktop-first (Electron + PGlite), with patient portal and mobile app.

**Local path**: `C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture`
**Version**: v2.1.0 (Patient Connectivity Sprint — COMPLETE)
**Mode**: Desktop — `DB_ENGINE=pglite`, `CACHE_ENGINE=memory`, `DEV_SKIP_AUTH=true`
**Ports**: Backend=3000, Frontend=5173, Ollama=11434
**Credentials**: admin@chiroclickehr.no / admin123

---

## Stack

| Layer    | Stack                                  | Notes                                                           |
| -------- | -------------------------------------- | --------------------------------------------------------------- |
| Backend  | Node.js + Express + PGlite             | Multi-tenant via `organization_id`. Winston logging.            |
| Frontend | React 18 + Vite + Tailwind + shadcn/ui | i18n (18 namespaces, ~70 components). Lazy-loaded chunks.       |
| AI       | Ollama (chiro-no-sft-dpo-v6, 96% eval) | Claude API fallback via provider abstraction. Budget-tracked.   |
| Desktop  | Electron (portable exe, 96MB)          | `ELECTRON_RUN_AS_NODE=1` for backend fork. PGlite `asarUnpack`. |
| Portal   | React pages under `/portal/`           | Booking, messaging, documents, communication preferences.       |
| Mobile   | React Native + Expo                    | Exercises, messaging, documents, booking, push notifications.   |

**Backend dependencies**: Express, PGlite, bcrypt, JWT, jwks-rsa, Socket.io, Redis, PDFKit, Nodemailer, Winston, Swagger, node-cron, Anthropic SDK, Helmet, express-rate-limit, express-validator, sanitize-html

**Frontend dependencies**: React 18, Vite, Tailwind, shadcn/ui (Radix), Zustand, react-hook-form + zod, TanStack Query, Recharts, Three.js (@react-three/fiber), Socket.io-client, DnD Kit, Lucide icons, DOMPurify

**Desktop**: Electron 28, electron-builder (portable/dmg/AppImage)

---

## What This System Does

### Clinical (EHR)

- **SOAP notes** — structured clinical documentation with body chart and spine diagram
- **Patient journal** — full medical history, diagnoses (ICPC-2), referrals, X-ray/MRI
- **Treatment plans** — exercise programs, automated reminders
- **Clinical assessments** — body chart, spine diagram, range of motion
- **AI assistant** — local Ollama model for Norwegian chiropractic context (96% eval pass rate)

### Business (CRM/PMS)

- **Appointment booking** — scheduling with automated reminders (email/SMS/push)
- **Patient portal** — self-service booking, messaging, document access
- **CRM** — patient lifecycle, communication preferences, automations (9 action types)
- **Document management** — PDF generation, delivery pipeline (portal → email → SMS → push)
- **Billing/invoicing** — Norwegian healthcare billing integration

### Infrastructure

- **109 API endpoints** across 49 route files (47 registered + 2 regulatory stubs)
- **78 database migrations** (PGlite auto-applies on startup via `db-init.js`)
- **97 backend service files** (ai/, providers/, crm, exercises, pdf, etc.)
- **~300 frontend components** across 39 subdirectories
- **18 i18n namespaces** — Norwegian Bokmål primary, English secondary
- **CI/CD**: 5 GitHub Actions workflows (Security, Backend, Frontend, Docker Build, E2E)

---

## Current Architecture (Key Files)

```
backend/
├── src/
│   ├── routes/          # 49 route files, 109 endpoints, Swagger at /api-docs
│   │   ├── mobile/      # 7 sub-routes: auth, profile, exercises, programs, workouts, clinic
│   │   ├── patientPortal.js  # Booking, messaging, documents, preferences
│   │   ├── fhir.js      # Regulatory stub (future)
│   │   └── helseId.js   # Regulatory stub (future)
│   ├── services/        # 97 service files
│   │   ├── ai/          # 5 modules: provider abstraction, Ollama, Claude fallback
│   │   ├── providers/   # Email (SMTP), SMS (Twilio), Push (Expo)
│   │   ├── crm/         # CRM logic, automations, communication
│   │   ├── documentDelivery.js   # PDF → portal → email/SMS/push pipeline
│   │   ├── pushNotification.js   # Expo Push API (mock in desktop)
│   │   ├── appointmentReminders.js  # Cron-based (*/15)
│   │   └── communications.js    # Core SMS/email abstraction
│   ├── middleware/       # Auth (JWT), rate limiting, validation, audit logging
│   └── controllers/     # Request handlers, PDF generation
├── __tests__/           # 2,657 tests (130 suites)
database/
├── migrations/          # 078 migrations (gap at 025 is intentional)
frontend/
├── src/
│   ├── components/      # 39 subdirs, ~300 components
│   ├── i18n/            # CUSTOM useTranslation (NOT react-i18next)
│   ├── __tests__/       # ~1,050 tests (55 suites)
│   └── pages/           # Route-level pages
desktop/                 # Electron packaging
ai-training/             # Ollama model files, training data, eval scripts
e2e/                     # 88 Playwright tests (11 specs)
mobile-app/              # React Native + Expo
```

---

## What Needs Deep Review

### 1. Code Quality & Architecture (`/gstack-review`, `/gstack-plan-eng-review`)

- Are the 97 backend services well-separated or leaking concerns?
- Is `services/ai.js` shim (re-exporting from `services/ai/`) the right pattern?
- Are the 78 migrations clean? Any that should be squashed?
- Is multi-tenancy (`organization_id`) properly enforced across all routes?
- Dead code: `routes/fhir.js` + `routes/helseId.js` are stubs — should they stay?
- `pdf.js` + `pdfGenerator.js` split — should they be consolidated?
- `assessment/` BodyChart + SpineDiagram not consolidated with `anatomy/`
- Barrel exports (`index.js` re-exports) prevent Vite tree-shaking
- Are there circular imports or import-time side effects?

### 2. Healthcare Security (`/gstack-cso`)

- **Norwegian law compliance**: Normen (healthcare security standard), GDPR, patient data handling
- **PHI protection**: fødselsnummer (11-digit national ID) — never in URLs, logs, error messages
- **ICPC-2 codes**: stored with encounter, always with audit trail
- **Audit logging**: ALL mutations AND reads on patient records (Normen requires read logging)
- **Authentication**: JWT + bcrypt, `requireAuth` middleware on all patient routes
- **Authorization**: `requireRole`/`requireOrganization` for multi-tenant access control
- **API security**: Helmet, rate limiting, CORS, express-validator, sanitize-html
- **Secrets management**: `.env` properly gitignored? Any hardcoded keys?
- **Desktop mode**: `DEV_SKIP_AUTH=true` — is this ever accidentally enabled in production?
- **Provider credentials**: Twilio, SMTP, Expo push — how are they stored?

### 3. Testing Gaps (`/gstack-qa`)

- 2,657 backend + ~1,050 frontend tests — where are the gaps?
- PGlite WASM crashes under parallel test suites — is this mitigated?
- Are all patient data routes tested for auth (401/403)?
- Are all audit-logged operations tested for log entries?
- E2E: 88 tests — do they cover the full patient lifecycle?
- Mobile app: test coverage?
- AI assistant: are responses tested for Norwegian medical accuracy?

### 4. Performance (`/gstack-benchmark`)

- API latency under load (109 endpoints)
- Electron startup time (96MB portable exe)
- PGlite WASM initialization and query performance
- AI inference speed (Ollama local model)
- Frontend bundle size (Vite build, tree-shaking with barrel exports)
- Socket.io connection management
- Image/PDF generation performance
- Database migration auto-apply on startup — how long for 78 migrations?

### 5. Design & UX (`/gstack-plan-design-review`)

- Norwegian UI standards compliance (WCAG 2.1 AA — required by Norwegian law)
- i18n parity: are all 18 namespaces complete in both nb-NO and en?
- CUSTOM `useTranslation` from `./i18n` — is it feature-complete vs react-i18next?
- ~300 components across 39 subdirs — is the information architecture intuitive?
- Patient portal UX — is self-service booking clear?
- Mobile app UX — Expo + React Native responsiveness
- Accessibility: keyboard navigation, screen reader support, color contrast

### 6. Known Issues (`/gstack-investigate`)

- PGlite WASM parallel suite crashes (known, not regression — but is there a fix?)
- `useCallback({obj})` crashes in prod — are all instances using `useMemo` now?
- Vite dev tolerates React hook misuse; prod crashes at runtime
- Vitest hangs in CI — timeout wrapper sufficient?
- `process.stdout.write` used instead of `console.log` (pre-commit hook) — any missed?
- i18n: ~50 bilingual `{en,no}` strings remain "by design" — are they intentional?

### 7. AI Model Quality

- `chiro-no-sft-dpo-v6` — 96% eval pass rate, 8.1GB GGUF
- 5,224 SFT + 916 DPO training examples ready for v7/v8
- Claude API fallback: `CLAUDE_FALLBACK_MODE` with budget enforcement
- Provider abstraction: Ollama → Claude seamless switching
- Norwegian medical terminology accuracy
- Eval suite: how robust are the 96% pass criteria?

---

## Suggested gstack Sprint Flow

```
1.  /gstack-office-hours        → Rethink: is the EHR architecture fit for scale?
2.  /gstack-plan-ceo-review     → Scope: what should the next release focus on?
3.  /gstack-plan-eng-review     → Architecture: 97 services, 49 routes — well-layered?
4.  /gstack-plan-design-review  → UX: Norwegian healthcare UI compliance, i18n parity
5.  /gstack-review              → Code quality: dead code, barrel exports, PHI leaks
6.  /gstack-cso                 → Security: OWASP Top 10 + Norwegian healthcare law (Normen)
7.  /gstack-qa                  → Testing: gaps in 2,657 backend + 1,050 frontend tests
8.  /gstack-benchmark           → Performance: Electron startup, PGlite, API latency
9.  /gstack-investigate         → Debug: PGlite WASM crashes, React hook misuse in prod
10. /gstack-ship                → Run tests, open PR with fixes
11. /gstack-retro               → What did we learn? Update CLAUDE.md
```

---

## Key Commands

```bash
# Backend
cd "C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture"
cd backend && npm test                          # All 2,657 backend tests
cd backend && npm test -- --testPathPattern=X   # Single test file

# Frontend
cd frontend && npx vitest --run                 # All ~1,050 frontend tests
cd frontend && npm run build                    # Verify prod build (check bundle size)

# E2E
cd frontend && npx playwright test              # 88 E2E tests (11 specs)

# Dev servers
npm run dev                                     # Backend (3000) + Frontend (5173) concurrently

# AI
# Requires Ollama running on port 11434 with chiro-no-sft-dpo-v6 model loaded
```

---

## Recent Commits (Context)

```
v2.1.0 — Patient Connectivity Sprint
- Document delivery pipeline (PDF → portal → email/SMS/push)
- Push notifications (Expo Push API, mock in desktop)
- Appointment reminders (cron-based */15)
- Patient portal (booking, messaging, documents, preferences)
- Mobile routes (7 sub-routes: auth, profile, exercises, programs, workouts, clinic)
- CRM automations (9 action types incl. SEND_BOOKING_LINK)
```

---

## Ground Rules

- **Git**: Use `-m` flag only (HEREDOC hangs on Windows MSYS)
- **Git staging**: Stage files by name (never `git add .` — timeouts on large repo)
- **Backend tests**: `cd backend && npm test` (NOT `npx jest` from root — ESM loader issue)
- **Pre-commit hook**: greps for `console.log` — use `process.stdout.write`
- **i18n**: CUSTOM `useTranslation` from `./i18n` (NOT react-i18next). Same API, local module.
- **Vitest CI**: hangs on completion — use `timeout -k 10 300 npx vitest --run`
- **PGlite**: WASM crashes under parallel test suites — known, not regression
- **Electron**: `ELECTRON_RUN_AS_NODE=1` for backend fork, `asarUnpack` for PGlite
- **Node on Windows**: `node -e` sometimes no output — use `node -p` instead
- **All agents must use `bypassPermissions` mode**
- **PHI rules**: NEVER log patient data, fødselsnummer, diagnoses, or ICPC-2 codes
