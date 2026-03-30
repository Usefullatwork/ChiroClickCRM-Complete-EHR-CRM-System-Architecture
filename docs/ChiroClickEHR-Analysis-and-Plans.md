# ChiroClickEHR — Product Analysis, Improvement Plan & Security Plan

**Date:** 2026-03-17
**Focus:** Modular EHR (core product) + CRM (patient follow-up). Billing is out of scope.

---

## Part 1: What ChiroClickEHR Actually Is

ChiroClickEHR is a **click-to-document chiropractic journal system** with integrated patient follow-up. Two things matter:

1. **The EHR** — fast, modular clinical documentation. SOAP notes, macros, templates, AI ghost text, body charts, spine diagrams, examination panels, compliance checking. The practitioner sits down, clicks through their encounter, and walks away with a complete journal entry in 2–3 minutes.

2. **The CRM** — keep patients coming back. Automated recall workflows, SMS/email follow-ups, lifecycle tracking (active → at-risk → churned), engagement scoring. After you treat a patient, the system makes sure they don't fall through the cracks.

Billing/financial exists but isn't the focus — the system doesn't process payments.

---

## Part 2: Current EHR Architecture — How It Works

### The Two Encounter Workflows

**ClinicalEncounter** — the full-featured view. Orchestrator component with 13+ extracted sub-components (SubjectiveSection, ObjectiveSection, AssessmentSection, PlanSection, ComplianceScan, NeurologicalFindings, SpecialTests, etc.). 150+ state variables in `useClinicalEncounterState`. Lazy-loaded panels for neuro exam, body diagram, exercises, AI diagnosis sidebar.

**EasyAssessment** — the quick version. 3-column layout with tab navigation (Subjective → Objective → Assessment → Plan). Two view modes: "easy" (checkboxes + smart inputs) and "detailed" (full text). Real-time chart narrative preview in the right sidebar. This is likely where most daily documentation happens.

### Speed Documentation Stack

The system has 6 ways to get text into a SOAP note fast:

| Method             | How It Works                                                                                                  | Speed                |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Macros**         | One-click from Macro Matrix grid (200+ pre-written phrases, bilingual). `.bs` + space → "Bedring siden sist." | Fastest              |
| **Slash Commands** | `/better`, `/neuro`, `/sublux` → palette appears → Enter inserts                                              | Fast                 |
| **Templates**      | 2,847+ templates by discipline, click to insert. Variables like `[X]`, `[duration]` for customization         | Fast                 |
| **AI Ghost Text**  | Type a few words → 1.2s debounce → grey suggestion appears → Tab to accept                                    | Medium               |
| **SALT**           | Copy subjective/objective from last encounter, prepend "Bedring siden sist"                                   | Fast (repeat visits) |
| **AI Scribe**      | Voice dictation via Web Speech API → parsed into SOAP sections                                                | Hands-free           |

### What IS Modular Today

| Feature           | Customizable?                                             | User-Facing UI?         |
| ----------------- | --------------------------------------------------------- | ----------------------- |
| Macros            | Create/edit/delete, favorites, search                     | Yes — Macro Matrix      |
| Templates         | Create/edit, 14 disciplines, track usage                  | Yes — Template Library  |
| AI Models         | Switch Ollama/Claude, budget caps, fallback modes         | Yes — AI Settings       |
| Clinical Settings | Adjustment notation style, test formats, letter templates | Partial — Settings page |
| Compliance Rules  | Hardcoded in ComplianceEngine.jsx                         | No                      |
| Exam Panels       | Components exist but fixed order                          | No reordering           |
| SOAP Tabs         | 4 tabs, can't customize                                   | No                      |
| Page Layout       | 3-column, hardcoded                                       | No                      |
| Slash Commands    | 50+ built-in, can't add from UI                           | No                      |

### What is NOT Modular (The Gap)

The biggest gap: **practitioners can't customize their workspace**. They can customize _content_ (macros, templates, settings) but not _layout_ (which panels show, what order, which tabs). Every chiropractor gets the same fixed workflow regardless of their specialty, style, or preference.

---

## Part 3: Current CRM Architecture — How It Works

### The Follow-Up Engine

The CRM is built around a **time-based automation system**:

1. Patient visits on June 1
2. Recall rule: "Every 6 weeks" (DAYS_SINCE_VISIT: 42)
3. Daily at 9 AM (Europe/Oslo), the automation engine scans patients
4. Finds matches → queues SMS/email → creates follow-up task
5. Practitioner sees pending messages in **Scheduler UI** → approves → sent
6. Patient books → lifecycle moves back to "active"

### CRM Modules

The service layer is already well-decomposed into `crm/leads.js`, `crm/lifecycle.js`, `crm/campaigns.js`, `crm/retention.js`, `crm/waitlist.js`. Plus separate services for communications, follow-ups, and automations.

**Trigger types:** DAYS_SINCE_VISIT, BIRTHDAY, NEW_LEAD, APPOINTMENT_BOOKED
**Action types:** SEND_SMS, SEND_EMAIL, UPDATE_LIFECYCLE, CREATE_FOLLOWUP, LOG_COMMUNICATION, SEND_PUSH

### Where CRM Meets EHR

The integration point is `last_visit_date` from the encounters table. When a clinical encounter is created, it updates the patient's visit history. The automation engine reads this to determine who needs a recall. The Scheduler UI (TodaysMessages, SchedulerDecisions) surfaces pending actions for practitioner approval.

Gap: **No direct post-encounter trigger**. The CRM relies on time-based polling (daily cron), not event-driven. A patient who finishes an encounter doesn't immediately get a follow-up task queued — it waits for the next daily run.

---

## Part 4: Design Critique (EHR-Centered)

### What Works Really Well

**The speed documentation stack is the product's competitive advantage.** Six different input methods means every practitioner can find their preferred flow. The macro system with 200+ bilingual phrases and the 2,847-template library are genuinely impressive for a chiropractic EHR. The AI ghost text with Tab-to-accept is smooth. SALT (copy-from-last-visit) solves the most common scenario: a returning patient whose situation is similar to last time.

**ComplianceEngine is a great idea.** Real-time compliance checking during documentation, with auto-insert for missing qualifiers, prevents billing rejections and keeps practitioners safe. The treatment-to-qualifier rules (e.g., "adjustment requires subluxation finding") encode Norwegian healthcare knowledge.

**The dual workflow (ClinicalEncounter vs. EasyAssessment)** gives power users the full panel and quick users the streamlined tabs. This is the right pattern.

### What Needs Work

**1. Workspace customization is the #1 missing feature**

Chiropractors have wildly different workflows. A sports chiropractor uses ROM tables and orthopedic tests constantly. A wellness-focused chiropractor barely touches neuro exams. Yet they all get the same fixed layout.

What's needed: a **panel configuration system** where practitioners can show/hide sections, reorder tabs, pin frequently used exam modules, and save their layout as a "workspace profile." The component architecture already supports this — the panels are lazy-loaded and conditionally rendered — but the configuration is hardcoded.

**2. Two body chart implementations create confusion**

`assessment/BodyChart.jsx` (23KB) and `examination/AnatomicalBodyChart.jsx` (102KB) both let practitioners annotate a body diagram. The examination one is much more detailed (annotation tools, regions, markers) while the assessment one is simpler. From a practitioner's perspective, these should be one component with a "simple/detailed" toggle — not two separate systems.

**3. ComplianceEngine rules should be data-driven**

The compliance rules are JavaScript objects inside `ComplianceEngine.jsx` (23KB). New rules require a code change. These should be in a database table managed through the Settings UI so that rule updates don't require a software release, and different organizations can customize rules to their payer requirements.

**4. Slash commands are hardcoded**

50+ slash commands exist but practitioners can't add their own. Given that macros are already fully customizable, slash commands should follow the same pattern: store in DB, manage via UI, sync to frontend.

**5. EasyAssessment's "easy" mode needs more smart defaults**

The checkbox-based quick entry is fast, but it doesn't learn from patterns. If a practitioner always selects the same 4 checkboxes for a certain complaint type, the system should suggest those presets. This is a natural extension of the AI integration — a "smart template" that adapts to the practitioner's documentation patterns.

**6. The CRM should trigger on encounter events, not just time**

Currently, the CRM automation engine polls daily. If a practitioner documents a new patient's first encounter, there's no immediate CRM action. Adding event-driven triggers (ENCOUNTER_CREATED, ENCOUNTER_SIGNED, TREATMENT_PLAN_COMPLETED) would make the follow-up system much more responsive.

---

## Part 5: System Design Review

### Architecture Summary

```
┌──────────────────────────────────────────────────┐
│              PRACTITIONER UI                       │
│                                                    │
│  ClinicalEncounter  │  EasyAssessment  │  CRM     │
│  (Full panels)      │  (Quick tabs)    │  (Follow) │
│                                                    │
│  Speed Stack: Macros → Templates → AI Ghost →      │
│               SALT → Slash Cmds → AI Scribe        │
└──────────────┬──────────────────────┬──────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌────────────────────────┐
│    Express Backend    │  │   Automation Engine     │
│                       │  │                         │
│  Encounters CRUD      │  │  Time triggers (daily)  │
│  Clinical Settings    │  │  DAYS_SINCE_VISIT       │
│  Macros/Templates     │  │  BIRTHDAY               │
│  AI Provider Factory  │  │  → SMS/Email/Follow-up  │
│  Compliance Engine    │  │                         │
│  Audit Logging        │  │  ⚠️ No event triggers   │
└──────────┬───────────┘  └──────────┬─────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────────────────────────────────┐
│              PostgreSQL / PGlite                   │
│                                                    │
│  clinical_encounters (SOAP as JSON)                │
│  patients (lifecycle_stage, engagement_score)      │
│  follow_ups, communications, workflows             │
│  macros, templates, clinical_settings              │
│  audit_log (every read + write)                    │
└──────────────────────────────────────────────────┘
```

### Key Technical Observations

**SOAP stored as JSON columns.** Subjective, objective, assessment, plan are all JSON blobs in the encounters table. This gives maximum flexibility (any structure) but prevents SQL queries across clinical content (e.g., "find all encounters where objective mentions L5-S1"). The RAG system with pgvector compensates for this by indexing encounter text for semantic search, which is actually a better approach than trying to normalize SOAP into relational columns.

**150+ state variables in encounter hook.** `useClinicalEncounterState` is a god hook. It manages form state, panel visibility, exam data, clinical data, and AI state all in one place. This works but makes the encounter page fragile — any change risks side effects across unrelated features.

**Component sizes are concerning.** AnatomicalBodyChart.jsx is 102KB. MacroMatrix is 28KB. TemplateLibrary is 32KB. ComplianceEngine is 23KB. These are well above the 500-line file limit in the coding standards. The functionality is right, but the implementations need decomposition.

**The automation engine is polling-based.** Daily cron at 9 AM scans patients and queues actions. This means a patient recalled at 9:01 AM waits until the next day. For a healthcare recall system, daily granularity is probably fine. But adding event triggers (post-encounter, appointment-cancelled) would make the CRM feel much more responsive.

---

## Part 6: Improvement Plan (EHR-First)

### Tier 1 — Make the Journal Faster and More Customizable (Next 3 Sprints)

These directly improve the core product: speed of clinical documentation and practitioner workflow customization.

**1.1 Panel Configuration System** (HIGHEST PRIORITY)

Build a workspace customization layer. Practitioners should be able to: show/hide exam panels (neuro exam, body chart, exercise panel, AI sidebar), reorder SOAP section panels, pin favorite panels to always-visible, save their configuration as a workspace profile.

Implementation approach: store panel config as a JSON object in `clinical_settings` per user. The encounter pages already conditionally render panels (`showNeuroExam`, `showBodyDiagram`, etc.) — the change is to drive those booleans from user config instead of hardcoded defaults.

Effort: Medium. The conditional rendering exists; this adds a config layer and a simple UI to toggle panels.

**1.2 Unify Body Chart Components**

Merge `assessment/BodyChart.jsx` (23KB) and `examination/AnatomicalBodyChart.jsx` (102KB) into one component under `anatomy/` with simple/detailed mode toggle. Use the examination version as the base (it has annotation tools) and add a simplified view for quick assessments.

Effort: Medium. The detailed version subsumes the simple one; it's mainly consolidation and adding a mode prop.

**1.3 Custom Slash Commands**

Let practitioners create their own slash commands through the same API as macros. Store in DB with `command_trigger`, `output_text`, `category`. Sync to frontend on login. The `SlashCommands.jsx` component already has a palette UI; it needs to fetch from API instead of a hardcoded array.

Effort: Low–Medium. Backend CRUD exists for macros; this mirrors the same pattern.

**1.4 Smart Template Suggestions**

Track which macros and templates are used together for specific complaint types. After 10+ encounters, suggest pre-populated "encounter presets" — e.g., "Low Back Pain (Acute)" auto-selects relevant macros, checkboxes, and ICPC-2 codes based on the practitioner's documented patterns.

Effort: Medium–High. Requires analytics on macro usage patterns and a simple recommendation engine. Could use existing AI infrastructure.

### Tier 2 — Make the CRM Responsive (Sprints 4–6)

These improve the patient follow-up system so it reacts to clinical events, not just time.

**2.1 Event-Driven Automation Triggers**

Add new trigger types: `ENCOUNTER_CREATED`, `ENCOUNTER_SIGNED`, `TREATMENT_PLAN_COMPLETED`, `APPOINTMENT_CANCELLED`. When these events fire, the automation engine evaluates workflows immediately (not waiting for the daily cron). This means: patient finishes first visit → CRM immediately queues a welcome message + follow-up task.

Implementation: emit events from encounter/appointment controllers, automation engine subscribes. The WebSocket infrastructure already exists for real-time delivery.

Effort: Medium. The automation engine supports multiple trigger types; adding new ones is extending the pattern.

**2.2 Data-Driven Compliance Rules**

Move compliance rules from `ComplianceEngine.jsx` JavaScript objects to a database table. Add a Settings UI for managing rules (treatment-to-qualifier mappings, ICPC-2 code validations). This lets organizations customize compliance without code changes and allows rule updates as Norwegian regulations evolve.

Effort: Medium. Needs a new DB table, CRUD API, and Settings UI panel.

**2.3 Decompose the Encounter State Hook**

Split `useClinicalEncounterState` (150+ state variables) into focused hooks: `useSOAPForm()` (form data), `usePanelVisibility()` (which panels are open), `useExamData()` (neuro, ortho, ROM results), `useAIState()` (ghost text, suggestions, scribe). Compose them in the encounter page.

Effort: Medium. Refactor, not feature work. Requires careful testing since state interactions are complex.

**2.4 Decompose Large Components**

Break down the oversized components:

| Component               | Current Size | Split Into                                                            |
| ----------------------- | ------------ | --------------------------------------------------------------------- |
| AnatomicalBodyChart.jsx | 102KB        | BodyChartCanvas, AnnotationTools, RegionSelector, MarkerLayer         |
| MacroMatrix.jsx         | 28KB         | MacroGrid, MacroSearch, MacroFavorites, MacroEditor                   |
| TemplateLibrary.jsx     | 32KB         | TemplateSearch, TemplateCategoryList, TemplatePreview, TemplateEditor |
| ComplianceEngine.jsx    | 23KB         | ComplianceRulesEngine, CompliancePanel, ComplianceAutoInsert          |

Effort: Medium per component. Pure refactor with existing test coverage.

### Tier 3 — Strategic Improvements (Sprints 7+)

**3.1 i18n Extraction for Clinical UI**

676 hardcoded Norwegian strings across 121 files. Prioritize extracting from the encounter workflow first (EasyAssessment, ClinicalEncounter, clinical components). This doesn't change the UI — it just makes the codebase maintainable and opens the door for English-speaking chiropractors in Scandinavia.

**3.2 Accessibility Testing in CI**

Add `@axe-core/playwright` to the 11 existing E2E specs. WCAG 2.1 AA is Norwegian law for healthcare software. Automated testing prevents regressions, especially in the clinical encounter flow where keyboard navigation matters (practitioners often tab between fields while typing with one hand).

**3.3 FHIR R4 Stubs → Real Implementation**

Patient, Encounter, Condition, Observation resources. Required for HelseID integration and interoperability with Norwegian health registries. Not urgent for desktop-only practitioners, but necessary for multi-practice deployment.

**3.4 Remove Barrel Exports**

Known tech debt. Component `index.js` re-exports prevent Vite tree-shaking. Direct imports reduce bundle size. Quick win, low risk.

---

## Part 7: Security Plan (EHR-Focused)

### Threat Model for a Healthcare EHR

The primary threat isn't hackers — it's **unauthorized access to patient journals by people who shouldn't see them.** In a chiropractic practice, this means: a receptionist viewing clinical notes they shouldn't access, a practitioner viewing another practitioner's patients without authorization, or patient data leaking through logs, error messages, or API responses.

The secondary threat is **data integrity** — ensuring clinical encounters can't be silently modified after signing (Norwegian law requires immutable journals after finalization).

### Current Security Posture: What's Good

| Control                  | Status                  | Notes                                                          |
| ------------------------ | ----------------------- | -------------------------------------------------------------- |
| Authentication           | ✅ Strong               | Session-based auth, httpOnly cookies, SameSite strict          |
| Role-Based Access        | ✅ Implemented          | ADMIN, PRACTITIONER, ASSISTANT roles enforced                  |
| Multi-Tenant Isolation   | ✅ RLS + Middleware     | organization_id filtering at DB and app layer                  |
| Audit Logging            | ✅ Comprehensive        | All reads AND writes to patient data logged (Normen compliant) |
| Journal Immutability     | ✅ Implemented          | Signed encounters get amendment workflow, not edits            |
| Fødselsnummer Encryption | ✅ AES-256-CBC          | Encrypted at rest, mod-11 validated                            |
| Input Sanitization       | ⚠️ Regex-based          | Works but not robust against encoded/mutation XSS              |
| CSRF Protection          | ✅ Double Submit Cookie | Disabled in desktop mode (acceptable)                          |
| Rate Limiting            | ✅ Three tiers          | Global, moderate, strict + AI-specific limits                  |
| Error Handling           | ✅ No PHI leakage       | Stack traces hidden in production                              |

### Security Gaps — Prioritized for EHR

**Priority 1: Critical for Clinical Data (Fix Immediately)**

**1. Guard DEV_SKIP_AUTH against production deployment**
Risk: If `DEV_SKIP_AUTH=true` reaches a production server, all authentication is bypassed. Every patient record is wide open.
Fix: Add startup validation in `server.js`. If `NODE_ENV=production` and `DEV_SKIP_AUTH=true`, refuse to start with a clear error.

```javascript
if (
  process.env.NODE_ENV === "production" &&
  process.env.DEV_SKIP_AUTH === "true"
) {
  throw new Error("FATAL: DEV_SKIP_AUTH cannot be enabled in production");
}
```

Effort: 5 minutes. Impact: Prevents catastrophic misconfiguration.

**2. Replace regex input sanitization with a proper library**
Risk: The current `sanitizeString()` uses regex replacement which misses encoded attacks (`%3Cscript%3E`), nested payloads, and mutation XSS. Clinical text fields (subjective, objective, assessment, plan) are preserved unsanitized for legitimate clinical content.
Fix: Use `sanitize-html` with an allow-list approach. Clinical fields get a medical-safe allow-list. Non-clinical fields get strict sanitization.
Effort: 1–2 days. Impact: Closes XSS vectors.

**3. WebSocket authentication**
Risk: `initializeWebSocket(httpServer)` is called at startup, but the WS auth flow isn't clearly enforced. Unauthenticated WS connections could receive real-time notifications containing patient data.
Fix: Validate session cookie on WS handshake. Reject unauthenticated connections. Verify organization_id before joining rooms.
Effort: 1 day. Impact: Prevents unauthorized real-time data access.

**Priority 2: Important for Compliance (Fix Within 2 Weeks)**

**4. Add dependency vulnerability scanning to CI**
Risk: npm packages with known CVEs could introduce vulnerabilities. Healthcare software is a high-value target.
Fix: Add `npm audit --audit-level=high --omit=dev` to the CI pipeline. Add `gitleaks` for secrets scanning.
Effort: 1 hour (CI config change).

**5. Account lockout after failed login attempts**
Risk: Brute-force attacks on practitioner accounts. Current rate limiting (5 attempts/15min) is per-IP, not per-account. Distributed attacks bypass this.
Fix: After 10 failed attempts per username, lock the account for 30 minutes. Notify admin. Log to audit trail.
Effort: 1 day.

**6. Test encryption key rotation end-to-end**
Risk: `keyRotation.js` exists and the table is created on startup, but there are no integration tests verifying rotation doesn't corrupt existing encrypted fødselsnummer data.
Fix: Write integration test: create encrypted data → rotate key → verify decryption still works.
Effort: Half day.

**7. CSP reporting endpoint**
Risk: Content Security Policy violations happen silently. If an XSS attack bypasses sanitization, there's no alert.
Fix: Add `report-uri` directive in Helmet CSP config. Create an internal endpoint that logs CSP violations to the audit log.
Effort: Half day.

**Priority 3: Strengthening (Fix Within 1 Month)**

**8. Per-user rate limiting for authenticated endpoints**
Current rate limiting is per-IP. In a clinic where multiple practitioners share a network, this means one practitioner's heavy API usage affects others. Add per-user token bucket alongside per-IP.

**9. Encounter signing verification**
Ensure that signed encounters are truly immutable at the database level — not just at the application level. Add a database trigger or constraint that prevents UPDATE on rows where `signed_at IS NOT NULL` (except for the amendment JSON array).

**10. Session secret entropy validation**
On startup, check that `SESSION_SECRET` is at least 32 characters and isn't a common weak value. Refuse to start with weak secrets in production.

**11. Clinical data access monitoring**
Build a dashboard view of the `suspicious_activity` audit log view. Alert on: a practitioner accessing patients outside their usual caseload, bulk patient data exports, access outside business hours, access patterns that suggest "browsing" rather than treating.

**12. Automate GDPR breach detection**
Monitor for indicators of a data breach: failed logins followed by successful login from different IP, bulk data export, unusual API patterns. Norwegian law (GDPR Art. 33) requires Datatilsynet notification within 72 hours. Having automated detection makes this possible.

### Norwegian Healthcare Compliance Status

| Requirement                                  | Source                     | Status | Gap                          |
| -------------------------------------------- | -------------------------- | ------ | ---------------------------- |
| Audit logging of all patient data access     | Normen 5.3                 | ✅     | None — comprehensive         |
| Immutable journal after signing              | Helsepersonelloven §40     | ✅     | Consider DB-level constraint |
| Encryption of patient identifiers            | Personopplysningsloven §13 | ✅     | Add rotation test            |
| 10-year data retention                       | Helsepersonelloven §40     | ✅     | Policy documented            |
| Individual user accounts with access control | Normen 5.2                 | ✅     | Consider 2FA for all roles   |
| Data portability (GDPR Art. 20)              | GDPR                       | ✅     | 55 tests pass                |
| Right to erasure (GDPR Art. 17)              | GDPR                       | ✅     | 55 tests pass                |
| Breach notification within 72 hours          | GDPR Art. 33               | ⚠️     | Automate detection           |
| HelseID identity federation                  | NHN                        | ❌     | Stub only — Tier 3           |

---

## Summary: Top 10 Actions in Priority Order

| #   | Action                                  | Area     | Why It Matters                                                                          |
| --- | --------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| 1   | **Panel Configuration System**          | EHR      | Let practitioners customize their workspace. This is the single biggest UX improvement. |
| 2   | **Guard DEV_SKIP_AUTH from production** | Security | 5-minute fix that prevents catastrophic auth bypass.                                    |
| 3   | **Replace regex sanitization**          | Security | Close XSS vectors in clinical text fields.                                              |
| 4   | **Unify Body Chart components**         | EHR      | One component, two modes. Reduces confusion and maintenance.                            |
| 5   | **Custom Slash Commands**               | EHR      | Extend the speed documentation stack with practitioner-defined shortcuts.               |
| 6   | **WebSocket authentication**            | Security | Prevent unauthorized real-time data access.                                             |
| 7   | **Event-driven CRM triggers**           | CRM      | Post-encounter actions happen immediately, not next morning.                            |
| 8   | **Dependency + secrets scanning in CI** | Security | Basic supply chain security for healthcare software.                                    |
| 9   | **Decompose encounter state hook**      | EHR      | 150+ state variables is fragile. Split into focused hooks.                              |
| 10  | **Data-driven compliance rules**        | EHR      | Rules in DB, not code. Organizations can customize without releases.                    |

---

_Generated 2026-03-17 — ChiroClickEHR Architecture Review (EHR-Centered)_
