# Day 1 (Monday): AI Infrastructure + Portable Models

**Time estimate**: 3-4h coding, 0h GPU
**Goal**: AI enabled end-to-end with portable model storage

---

## Task 1.1: Fix .env AI Configuration (~10 min)

### What's Wrong

**File**: `backend/.env`

Current state (lines 17-27):

```env
AI_PROVIDER=ollama
AI_MODEL=chiro-no                    # WRONG — should be chiro-no-lora-v2
OLLAMA_BASE_URL=http://localhost:11434
AI_ENABLED=true                       # OK (already enabled)

# AI Model Overrides — COMMENTED OUT with wrong names
# AI_MODEL_SOAP=chiro-norwegian-lora  # Wrong model name
# AI_MODEL_REDFLAGS=chiro-no-lora     # Wrong model name
# AI_MODEL_FAST=chiro-fast            # OK
# AI_MODEL_MEDICAL=chiro-medical      # OK but v2 is better
```

Missing env vars: `GUARDRAILS_ENABLED`, `RAG_ENABLED`, `AI_TIMEOUT`

### Fix

Replace lines 17-34 in `backend/.env` with:

```env
# AI Configuration
AI_PROVIDER=ollama
AI_ENABLED=true
GUARDRAILS_ENABLED=true
RAG_ENABLED=false

# Default AI Model (ultimate fallback when MODEL_ROUTING model unavailable)
AI_MODEL=chiro-no-lora-v2

# Ollama Connection
OLLAMA_BASE_URL=http://localhost:11434
AI_TIMEOUT=35000

# Per-task model overrides (optional — MODEL_ROUTING in ai.js handles this)
# Only uncomment to override the hardcoded routing in ai.js
# AI_MODEL_SOAP=chiro-no-lora-v2
# AI_MODEL_REDFLAGS=chiro-no-lora-v2
# AI_MODEL_FAST=chiro-fast
# AI_MODEL_MEDICAL=chiro-no-lora-v2
```

### Why These Values

| Env Var              | Value              | Reason                                                                |
| -------------------- | ------------------ | --------------------------------------------------------------------- |
| `AI_MODEL`           | `chiro-no-lora-v2` | Best model (79% eval). Used as fallback when routed model unavailable |
| `GUARDRAILS_ENABLED` | `true`             | Input validation + output filtering for safety-critical tasks         |
| `RAG_ENABLED`        | `false`            | RAG requires pgvector + embeddings — not set up for desktop mode      |
| `AI_TIMEOUT`         | `35000`            | Circuit breaker in ai.js line 36 uses `requestTimeout = 35000`        |

### Important: ai.js Env Var Names

The `ai.js` service reads these **specific** env var names (lines 156-159):

```javascript
const AI_MODEL_SOAP = process.env.AI_MODEL_SOAP || null; // SOAP notes, summaries
const AI_MODEL_REDFLAGS = process.env.AI_MODEL_REDFLAGS || null; // Red flags, safety
const AI_MODEL_FAST = process.env.AI_MODEL_FAST || null; // Autocomplete, spell check
const AI_MODEL_MEDICAL = process.env.AI_MODEL_MEDICAL || null; // Diagnosis, reasoning
```

These are **NOT** the same as what `.env.example` currently has (`AI_MODEL_NORWEGIAN`, etc.). The env vars are optional overrides — when `null`, `ai.js` uses its hardcoded `MODEL_ROUTING` (lines 346-377) which already routes to the right models.

### Verification

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture
grep -E "^AI_|^OLLAMA|^GUARD|^RAG" backend/.env
```

Expected output:

```
AI_PROVIDER=ollama
AI_ENABLED=true
AI_MODEL=chiro-no-lora-v2
OLLAMA_BASE_URL=http://localhost:11434
AI_TIMEOUT=35000
GUARDRAILS_ENABLED=true
RAG_ENABLED=false
```

---

## Task 1.2: Verify ai.js MODEL_ROUTING (~15 min)

### Already Verified — No Code Changes Needed

I've read `backend/src/services/ai.js` (1845 lines). Here's the routing summary:

**MODEL_ROUTING** (lines 346-377) — hardcoded model assignments:

| Task Type                                                                | Routed Model              | Fallback                                   |
| ------------------------------------------------------------------------ | ------------------------- | ------------------------------------------ |
| `soap_notes`, `clinical_summary`, `journal_organization`                 | `chiro-norwegian-lora-v2` | `chiro-norwegian-lora` → `chiro-norwegian` |
| `diagnosis_suggestion`, `sick_leave`                                     | `chiro-no-lora-v2`        | `chiro-no-lora` → `chiro-no`               |
| `autocomplete`, `spell_check`, `abbreviation`, `quick_suggestion`        | `chiro-fast`              | (no fallback)                              |
| `norwegian_text`, `patient_communication`, `referral_letter`, etc.       | `chiro-norwegian-lora-v2` | (same chain)                               |
| `red_flag_analysis`, `treatment_safety`, `contraindication_check`        | `chiro-no-lora-v2`        | `chiro-no-lora` → `chiro-no`               |
| `differential_diagnosis`, `clinical_reasoning`, `medication_interaction` | `chiro-medical`           | (no fallback)                              |

**Resolution order** (lines 436-477):

1. Env var override (TASK_ENV_OVERRIDES) — checked first
2. MODEL_ROUTING hardcoded map — checked second
3. Model availability check — verifies model exists in Ollama
4. Fallback model from MODEL_CONFIG — if routed model unavailable
5. `AI_MODEL` env var — ultimate fallback

**This is correct and needs no changes.** Setting `AI_MODEL=chiro-no-lora-v2` in `.env` handles the fallback case.

### Only Note: Circuit Breaker Timeout

Line 36: `ollamaBreaker.requestTimeout = 35000;`
Line 719: `const OLLAMA_TIMEOUT_MS = 30000;`

The circuit breaker timeout (35s) is slightly higher than the per-request axios timeout (30s). This is intentional — the breaker should track real Ollama failures, not race with its own timer. The `AI_TIMEOUT=35000` env var in `.env` documents this but isn't actually read by the current code (the values are hardcoded). This is fine.

---

## Task 1.3: Make Ollama Models Portable (~1h)

### Problem

Ollama stores models at `%USERPROFILE%\.ollama\models\` by default. Moving the project folder loses the AI models.

### Solution: `OLLAMA_MODELS` Environment Variable

Ollama reads `OLLAMA_MODELS` to determine where to store/read models. Set this BEFORE starting Ollama to redirect model storage into the project folder.

### Step 1: Create Local Model Storage Directory

```bash
mkdir -p /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/data/ollama
```

Current `data/` directory already has: `backups`, `exports`, `logs`, `pglite`, `temp`, `uploads`

After: `data/ollama/` will contain `blobs/` and `manifests/` subdirectories.

### Step 2: Copy Existing Models

```bash
# From Git Bash
cp -r /c/Users/MadsF/.ollama/models/* /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/data/ollama/
```

Or from CMD:

```batch
xcopy "%USERPROFILE%\.ollama\models\*" "C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\data\ollama\" /E /I /Y
```

**Expected size**: ~5-14GB depending on which models are installed.

### Step 3: Update START-CHIROCLICK.bat

**File**: `START-CHIROCLICK.bat` (project root, 147 lines)

**Insert after line 23** (right after `echo  Starting with AI enabled...`), BEFORE any Ollama commands:

```batch
:: Set Ollama to use local model storage (portable)
set OLLAMA_MODELS=%~dp0data\ollama
echo       Model storage: %OLLAMA_MODELS%
```

The `%~dp0` resolves to the directory where the .bat file lives (with trailing backslash), making it portable.

**Also update line 37** — change `start "" ollama serve` to:

```batch
start "" cmd /c "set OLLAMA_MODELS=%~dp0data\ollama && ollama serve"
```

This ensures the spawned Ollama process inherits the `OLLAMA_MODELS` env var. The parent `set` only affects the current cmd, but `start ""` spawns a new process that needs the var too.

**Also update the model check loop** (lines 46-55) — the `ollama list` command needs the env var set. Since we set it above with `set`, it's already in the current shell environment, so `ollama list` at line 47 will use it. No change needed here.

**Also update line 64-66** — the fallback model copy path. Currently it copies TO `%USERPROFILE%\.ollama\models`. Change to:

```batch
REM OLD: powershell -Command "Copy-Item ... -Destination '%USERPROFILE%\.ollama\models' ..."
REM NEW: Copy to local storage
if exist "%~dp0ollama-models\blobs" (
    echo  Found models in project folder. Copying to local storage...
    xcopy "%~dp0ollama-models\*" "%~dp0data\ollama\" /E /I /Y /Q
    echo  Models copied!
    timeout /t 2 /nobreak >nul
)
```

### Step 4: Add to .gitignore

**File**: `.gitignore` (project root)

Add after line 80 (`data/pglite/`):

```
# Ollama model storage (portable, too large for git)
data/ollama/
```

### Step 5: Verify

```bash
# Kill existing Ollama
"/c/Windows/System32/taskkill.exe" //F //IM ollama.exe 2>/dev/null
sleep 2

# Set env and start
export OLLAMA_MODELS="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/data/ollama"
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" serve &
sleep 5

# Verify models are found from local storage
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" list
# Should show: chiro-no-lora-v2, chiro-fast, chiro-norwegian-lora-v2, etc.
```

### Full START-CHIROCLICK.bat Diff Summary

| Line     | Change                                                                                  |
| -------- | --------------------------------------------------------------------------------------- |
| After 23 | Add `set OLLAMA_MODELS=%~dp0data\ollama` + echo                                         |
| 37       | Wrap `ollama serve` to pass env var to child process                                    |
| 64-66    | Change model copy destination from `%USERPROFILE%\.ollama\models` to `%~dp0data\ollama` |

---

## Task 1.4: Test AI End-to-End (~20 min)

### Step 1: Start Ollama with Local Models

```bash
export OLLAMA_MODELS="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/data/ollama"
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" serve &
sleep 5
```

### Step 2: Verify Model Responds

```bash
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" run chiro-no-lora-v2 "Skriv subjektiv for nakkesmerter etter bilulykke"
```

Expected: Norwegian clinical text about neck pain after car accident.

### Step 3: Start Backend

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend
npm run dev &
sleep 5
```

### Step 4: Test AI Health Endpoint

```bash
curl http://localhost:3000/api/v1/training/status
```

Expected: JSON with `available: true`, `enabled: true`, `defaultModel: "chiro-no-lora-v2"`, and a list of installed models.

### Step 5: Browser Test

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/frontend
npm run dev
```

1. Open http://localhost:5173
2. Login: `admin@chiroclickcrm.no` / `admin123`
3. Go to any patient → Clinical Encounter
4. Type a chief complaint → trigger AI SOAP suggestion
5. Verify Norwegian response appears

---

## Task 1.5: Update .env.example (~10 min)

**File**: `backend/.env.example`

Replace the AI section (lines 72-81) with:

```env
# -----------------------------------------------------------------------------
# AI Integration (Ollama - local models, optional)
# Install Ollama from https://ollama.com/download/windows
# Models are stored in data/ollama/ (portable with project folder)
# -----------------------------------------------------------------------------
AI_ENABLED=true
AI_MODEL=chiro-no-lora-v2
OLLAMA_BASE_URL=http://localhost:11434
AI_TIMEOUT=35000
GUARDRAILS_ENABLED=true
RAG_ENABLED=false

# Per-task model overrides (optional — ai.js MODEL_ROUTING handles this automatically)
# Env var names must match what ai.js reads:
#   AI_MODEL_SOAP     — SOAP notes, clinical summaries, journal organization
#   AI_MODEL_REDFLAGS — Red flag analysis, treatment safety, contraindications
#   AI_MODEL_FAST     — Autocomplete, spell check, abbreviations
#   AI_MODEL_MEDICAL  — Differential diagnosis, clinical reasoning, medication interactions
# AI_MODEL_SOAP=chiro-no-lora-v2
# AI_MODEL_REDFLAGS=chiro-no-lora-v2
# AI_MODEL_FAST=chiro-fast
# AI_MODEL_MEDICAL=chiro-no-lora-v2
```

Also add `DEV_SKIP_AUTH=true` in the auth section (currently missing from .env.example):

```env
# Development Mode - Skip Authentication (set false in production)
DEV_SKIP_AUTH=true
```

---

## Day 1 Checklist

- [ ] `backend/.env` — `AI_MODEL=chiro-no-lora-v2`, `GUARDRAILS_ENABLED=true`, `RAG_ENABLED=false`
- [ ] `backend/.env.example` — Updated AI section with correct env var names
- [ ] `data/ollama/` — Created and populated with models from `%USERPROFILE%\.ollama\models\`
- [ ] `START-CHIROCLICK.bat` — Sets `OLLAMA_MODELS=%~dp0data\ollama` before starting Ollama
- [ ] `.gitignore` — Contains `data/ollama/`
- [ ] Ollama starts and finds models from local storage (`ollama list` works)
- [ ] AI SOAP generation works from ClinicalEncounter UI
- [ ] Commit: `git commit -m "feat: AI enabled with portable model storage"`
