# Day 4 (Thursday): Stability + Tests + i18n

**Time estimate**: 4-5h coding, 0h GPU
**Goal**: All tests passing, priority hardcoded strings extracted, clean builds

---

## Task 4.1: Fix Backend Test Failures (~2-3h)

### Current State

- **1720 tests** across 65 suites
- **54 suites pass**, 11 fail
- Failures: PGlite WASM crashes + Ollama unavailable in test environment

### Existing Infrastructure (Already in Place)

From reading the actual files:

| What               | Status                                              | File                                       |
| ------------------ | --------------------------------------------------- | ------------------------------------------ |
| `jest.config.js`   | `maxWorkers: 1` already set (line 34)               | `backend/jest.config.js`                   |
| `forceExit: true`  | Already set (line 36)                               | `backend/jest.config.js`                   |
| `resetMocks: true` | Already set (line 41)                               | `backend/jest.config.js`                   |
| `testTimeout`      | 30000ms (30s)                                       | `backend/jest.config.js`                   |
| Env setup          | Sets `DB_ENGINE=pglite`, `CACHE_ENGINE=memory`      | `backend/tests/envSetup.js`                |
| Database mock      | Already exists — mocks `query`, `transaction`, etc. | `backend/src/config/__mocks__/database.js` |
| node-cron mock     | Already exists                                      | `backend/__mocks__/node-cron.js`           |
| AI service mock    | **MISSING** — needs to be created                   | `backend/src/services/__mocks__/ai.js`     |

### Test File Structure (TWO directories!)

```
backend/
├── __tests__/          ← 35 test files (newer structure)
│   ├── integration/api/  (18 files: auth, crm, patients, training, etc.)
│   ├── unit/services/    (8 files: billing, crm, encryption, etc.)
│   └── validators/       (3 files: billing, encounter, exercise)
└── tests/              ← 30 test files (legacy structure)
    ├── services/         (11 files: ai, appointments, billing, etc.)
    ├── security/         (4 files: authBypass, encryption, sqlInjection, etc.)
    ├── compliance/       (2 files: gdprExport, gdprApi)
    ├── integration/      (2 files: api, security)
    ├── domain/entities/  (1 file: Patient)
    ├── middleware/        (1 file: auditLogger)
    ├── routes/           (1 file: exercises)
    ├── unit/             (2 files: encryption, norwegianIdValidation)
    └── utils/            (3 files: cache, encryption, errors)
```

Both directories are included by `jest.config.js` roots: `['<rootDir>/__tests__', '<rootDir>/tests']`

### Three Root Causes Identified

#### Root Cause 1: CommonJS `require()` in ESM Module (CRITICAL)

**File**: `backend/src/services/guardrails.js` line 13

```javascript
const logger = require("../utils/logger"); // ❌ CommonJS in ESM project!
```

The project uses `"type": "module"` in `package.json`. This `require()` throws:

```
ReferenceError: require is not defined
```

**Any test that imports `ai.js` triggers this** because `ai.js` imports `guardrails.js`:

```javascript
// ai.js line 43
const guardrails = await import("./guardrails.js"); // → triggers require() error
```

**Fix**: Change guardrails.js line 13 from:

```javascript
const logger = require("../utils/logger");
```

to:

```javascript
import logger from "../utils/logger.js";
```

Then check the rest of `guardrails.js` for any other CommonJS patterns (`module.exports`, `require()`).

#### Root Cause 2: PGlite WASM Crash During Test Load

**Error**:

```
RuntimeError: Aborted(). Build with -sASSERTIONS for more info.
  at Object.Module._pg_initdb (postgres.js:9:332053)
```

Some test files (like `crm-extended.test.js`) call `db.query()` at **file scope** — before any `describe()` or `beforeAll()`:

```javascript
// ❌ BAD — runs immediately when file is loaded
async function ensureCRMTables() {
  await db.query(...);  // PGlite WASM not ready yet → CRASH
}
ensureCRMTables();  // Called at file scope!
```

**Fix**: Move all database calls into `beforeAll()`:

```javascript
// ✅ GOOD
describe("CRM Tests", () => {
  beforeAll(async () => {
    await ensureCRMTables();
  });
});
```

#### Root Cause 3: Missing AI Service Mock

Tests in `tests/services/ai.test.js` and `__tests__/integration/api/training.test.js` need Ollama running. Without it, they fail with connection errors.

### Fix Strategy (Priority Order)

#### Fix 1: Fix guardrails.js require() (~5 min)

**File**: `backend/src/services/guardrails.js`

Change line 13:

```javascript
// FROM:
const logger = require("../utils/logger");
// TO:
import logger from "../utils/logger.js";
```

Scan the rest of the file for any other `require()` or `module.exports` and convert to ESM.

#### Fix 2: Set AI_ENABLED=false in Test Environment (~2 min)

**File**: `backend/tests/envSetup.js`

Add:

```javascript
process.env.AI_ENABLED = "false";
process.env.GUARDRAILS_ENABLED = "false";
process.env.RAG_ENABLED = "false";
```

This makes ai.js return gracefully from all functions (they check `isAIAvailable()` first).

#### Fix 3: Create AI Service Mock (~10 min)

**File to create**: `backend/src/services/__mocks__/ai.js`

```javascript
/**
 * Mock AI service for testing
 * Provides deterministic responses without requiring Ollama
 */
const mockSOAPResponse = {
  text: "Subjektivt: Pasienten rapporterer smerter i korsryggen.",
  confidence: { score: 0.75, level: "medium", factors: ["adequate_length"] },
  metadata: { model: "test-mock", guardrailsApplied: false },
};

const mockDiagnosisResponse = {
  suggestion: "L03 - Korsryggsymptomer",
  codes: ["L03"],
  reasoning: "Basert på kliniske funn",
  aiAvailable: true,
};

const mockRedFlagResponse = {
  analysis:
    "Ingen røde flagg identifisert. Mekanisk nakkesmerte. TRYGT å behandle.",
  riskLevel: "LOW",
  canTreat: true,
  recommendReferral: false,
  detectedFlags: [],
  medicationWarnings: [],
  source: "mock",
};

export const generateCompletion = jest.fn().mockResolvedValue(mockSOAPResponse);
export const spellCheckNorwegian = jest.fn().mockResolvedValue({
  original: "test",
  corrected: "test",
  hasChanges: false,
  aiAvailable: true,
});
export const generateSOAPSuggestions = jest.fn().mockResolvedValue({
  section: "subjective",
  suggestion: "Mock SOAP suggestion",
  aiAvailable: true,
});
export const suggestDiagnosisCodes = jest
  .fn()
  .mockResolvedValue(mockDiagnosisResponse);
export const analyzeRedFlags = jest.fn().mockResolvedValue(mockRedFlagResponse);
export const generateClinicalSummary = jest.fn().mockResolvedValue({
  summary: "Mock clinical summary",
  aiAvailable: true,
});
export const learnFromOutcome = jest.fn().mockResolvedValue({ success: true });
export const organizeOldJournalNotes = jest.fn().mockResolvedValue({
  success: true,
  organizedData: {},
  aiAvailable: true,
});
export const organizeMultipleNotes = jest.fn().mockResolvedValue({
  totalNotes: 0,
  successfullyProcessed: 0,
  results: [],
});
export const mergeOrganizedNotes = jest.fn().mockResolvedValue({
  success: true,
  mergedNote: "Mock merged note",
  aiAvailable: true,
});
export const getAIStatus = jest.fn().mockResolvedValue({
  provider: "ollama",
  available: true,
  enabled: true,
  defaultModel: "test-mock",
});
export const getModelForTask = jest.fn().mockResolvedValue({
  model: "test-mock",
  abVariant: null,
});
export const isModelAvailable = jest.fn().mockResolvedValue(true);
export const refreshAvailableModels = jest.fn().mockResolvedValue(undefined);
export const getModelForField = jest.fn().mockResolvedValue("test-mock");
export const buildFieldPrompt = jest.fn().mockReturnValue("Mock prompt");
export const generateCompletionStream = jest.fn();

export const MODEL_ROUTING = {};
export const MODEL_CONFIG = {};
export const AB_SPLIT_CONFIG = {};
export const extractCompletionText = jest.fn((r) => r?.text || r || "");
export const calculateConfidence = jest.fn(() => ({
  score: 0.75,
  factors: ["mock"],
  level: "medium",
}));

export default {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
  getAIStatus,
  getModelForTask,
  MODEL_ROUTING,
};
```

#### Fix 4: Fix File-Scope Database Calls (~30 min)

Find and fix test files that call `db.query()` at file scope:

```bash
# Find files calling query/db outside describe/it blocks
grep -rn "db\.query\|ensureCRM\|ensureTable" backend/__tests__/ backend/tests/ \
  --include="*.test.js" | head -20
```

Key file to fix: `__tests__/integration/crm-extended.test.js`

Move `ensureCRMTables()` from file scope into `beforeAll()`.

#### Fix 5: Add AI Mock to AI-Dependent Tests (~15 min)

For tests that import routes depending on ai.js (like `training.test.js`):

```javascript
// At the top of the test file, before other imports
jest.unstable_mockModule("../../src/services/ai.js", () => ({
  getAIStatus: jest.fn().mockResolvedValue({ available: true }),
  generateCompletion: jest.fn().mockResolvedValue({ text: "mock" }),
  // ... other exports
}));
```

### Likely Failing Suites (from Agent Analysis)

| Suite                                            | Root Cause                      | Fix                       |
| ------------------------------------------------ | ------------------------------- | ------------------------- |
| `tests/services/ai.test.js`                      | guardrails.js `require()` error | Fix 1 (require→import)    |
| `__tests__/integration/api/training.test.js`     | Ollama not available            | Fix 5 (mock ai.js)        |
| `__tests__/integration/api/dataCuration.test.js` | AI analytics needs Ollama       | Fix 5 (mock ai.js)        |
| `__tests__/integration/crm-extended.test.js`     | `db.query()` at file scope      | Fix 4 (move to beforeAll) |
| `tests/services/clinicalValidation.test.js`      | Imports guardrails.js           | Fix 1 (require→import)    |
| `tests/integration/api.test.js`                  | PGlite WASM crash               | Fix 4 (lifecycle)         |
| `tests/integration/security.test.js`             | PGlite WASM crash               | Fix 4 (lifecycle)         |
| `tests/compliance/gdprApi.test.js`               | PGlite WASM crash               | Fix 4 (lifecycle)         |
| `__tests__/integration/websocket.test.js`        | Socket.io setup                 | Mock socket.io            |
| `tests/services/patients.test.js`                | PGlite query                    | Mock database             |
| `tests/services/appointments.test.js`            | PGlite query                    | Mock database             |

### Diagnosis Strategy

Run tests once and categorize failures:

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend
npm test 2>&1 | grep -E "FAIL" | sort
```

Then for each FAIL:

1. **"require is not defined"** → guardrails.js CommonJS fix (Fix 1)
2. **"RuntimeError: Aborted()"** → PGlite WASM crash (Fix 4)
3. **"ECONNREFUSED" / "timeout"** → Ollama unavailable (Fix 5)
4. **"Cannot find module"** → Import path issue (fix import)

### Verification

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend
npm test 2>&1 | tail -30
# Target: 0 failures, 65/65 suites pass
```

---

## Task 4.2: Fix i18n Hardcoded Strings (SCOPED DOWN)

### Reality Check: 3,071 Lines, Not 75

A comprehensive scan found **3,071 lines** with Norwegian characters across **191 files**. The original "75+" estimate was only counting 6 recently-modified components.

### Full Inventory

| Category                                | Files | Lines | Priority                                            |
| --------------------------------------- | ----- | ----- | --------------------------------------------------- |
| **Medical Protocols & Data**            | 5     | 400+  | LOW — practitioners expect Norwegian clinical terms |
| `data/examinationProtocols.js`          | 1     | 189   | LOW — domain data, not UI                           |
| `components/assessment/macroContent.js` | 1     | 79    | LOW — already bilingual (has `no:` and `en:`)       |
| `components/anatomy/templateData.js`    | 1     | 51    | LOW — clinical documentation templates              |
| **Communication Templates**             | 3     | 150+  | MEDIUM — already bilingual data structures          |
| `data/communicationTemplates.js`        | 1     | 59    | MEDIUM — has `no:` key, just needs `t()` wrapping   |
| **Page Names & Error Boundaries**       | 50+   | 500+  | HIGH — user-facing, visible in UI                   |
| `App.jsx`                               | 1     | 25+   | HIGH — PageErrorBoundary names                      |
| **Anatomical Labels**                   | 4     | 100+  | MEDIUM — body region labels                         |
| `anatomy/body/EnhancedBodyDiagram.jsx`  | 1     | 30+   | MEDIUM — body part translations                     |
| **Red Flag Definitions**                | 4     | 200+  | LOW — safety-critical, keep Norwegian               |
| **Scattered UI Labels**                 | 100+  | 700+  | HIGH — buttons, headings, tooltips                  |

### Scoped Plan: Fix HIGH Priority Only (Day 4)

**Do NOT try to i18n all 3,071 lines in one day.** Instead, focus on the strings friends will actually see:

#### Phase 1: App.jsx Error Boundaries (~15 min)

Replace hardcoded `pageName="Pasienter"` etc. with `t()` calls.

#### Phase 2: Page-Level Labels (~1h)

The main pages users navigate through:

- Dashboard labels
- Patient list labels
- Clinical Encounter headings
- Navigation items

#### Phase 3: Recently Modified Components (~45 min)

The 12 components from the Phase 5 audit (ComplianceScan, OutcomeChart, etc.)

### What to Leave Alone

| Category                                | Why                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `examinationProtocols.js` (189 lines)   | Domain data — chiropractors want Norwegian medical terms. This is content, not UI. |
| `macroContent.js` (79 lines)            | Already bilingual with `no:` / `en:` keys. Works correctly.                        |
| `templateData.js` (51 lines)            | Clinical palpation templates — practitioners expect Norwegian                      |
| `redFlagScreeningService.js` (46 lines) | Safety-critical content — changing this risks introducing errors                   |
| `communicationTemplates.js` (59 lines)  | Already bilingual data structures                                                  |
| `slashCommandsContent.js` (40+ lines)   | Already bilingual                                                                  |

### i18n Pattern

The project uses `react-i18next`. Existing pattern:

```jsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t("common.save")}</button>;
}
```

### Check Existing Locale Files

```bash
ls frontend/src/i18n/locales/nb/
ls frontend/src/i18n/locales/en/
```

### Priority Extraction

For each HIGH priority component:

1. Read the file, find Norwegian text literals in JSX
2. Add key to `nb/<namespace>.json` and `en/<namespace>.json`
3. Replace literal with `{t('namespace.key')}`
4. Ensure `useTranslation()` is imported

### Realistic Day 4 Target

- Extract ~50-80 strings from HIGH priority components
- Leave ~2,900 lines (domain data, already-bilingual content) for a future sprint
- The app will work correctly in Norwegian with the remaining hardcoded strings

### Verification

```bash
# Count HIGH priority remaining (pages + components, excluding data files)
grep -rn "[åøæÅØÆ]" frontend/src/pages/ --include="*.jsx" | grep -v __tests__ | wc -l
# Target: significant reduction from current count
```

---

## Task 4.3: Clean Builds (~30 min)

### Frontend Build

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/frontend
npm run build 2>&1 | grep -E "warning|error"
# Target: 0 warnings, 0 errors
```

### Frontend Lint

```bash
npx eslint src/ --max-warnings 0
# Target: 0 warnings
```

### Backend Lint

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend
npx eslint src/ --max-warnings 0
# Target: 0 warnings
```

### Frontend Tests

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/frontend
npm test 2>&1 | tail -10
# Target: 589+ tests, 0 failures
```

---

## Day 4 Checklist

- [ ] AI service mock created at `backend/src/services/__mocks__/ai.js`
- [ ] `tests/envSetup.js` updated with `AI_ENABLED=false`
- [ ] Backend tests: 0 failures (65/65 suites pass)
- [ ] HIGH priority i18n strings extracted (~50-80 strings)
- [ ] Both `nb/` and `en/` locale files updated for extracted strings
- [ ] `npm run build` — 0 warnings (frontend)
- [ ] `npx eslint src/ --max-warnings 0` — 0 warnings (both)
- [ ] Frontend tests: 0 failures
- [ ] Commit: `git commit -m "fix: backend test mocks + i18n priority strings"`

### Future Sprint (Not Day 4)

- Extract remaining ~2,900 lines of Norwegian strings
- Most are domain data (medical protocols, clinical templates) that work correctly as-is
- Create a tracking issue for full i18n completion
