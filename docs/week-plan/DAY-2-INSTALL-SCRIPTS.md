# Day 2 (Tuesday): Clean Install Mode + Training Data

**Time estimate**: 4-5h coding, 0h GPU
**Goal**: Friends can install and run the app; v4 training data prepared

---

## Task 2.1: Create INSTALL.bat (~1h)

### Purpose

A friend copies the folder to their machine and double-clicks `INSTALL.bat`. It installs dependencies, creates config, and prepares for first run.

### File to Create: `INSTALL.bat` (project root)

```batch
@echo off
title ChiroClick CRM - First Time Setup
color 0A
setlocal enabledelayedexpansion

echo.
echo  ========================================
echo   ChiroClick CRM - First Time Setup
echo  ========================================
echo.

:: 1. Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo       ERROR: Node.js is not installed!
    echo       Download from: https://nodejs.org/ ^(version 18+^)
    echo       Install it, then run this script again.
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VER=%%a
echo       Node.js found: %NODE_VER%

:: 2. Install backend dependencies
echo.
echo [2/6] Installing backend dependencies...
cd /d "%~dp0backend"
call npm install --production
if errorlevel 1 (
    echo       ERROR: Backend install failed
    pause
    exit /b 1
)
echo       Backend dependencies installed

:: 3. Install frontend dependencies
echo.
echo [3/6] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo       ERROR: Frontend install failed
    pause
    exit /b 1
)
echo       Frontend dependencies installed

:: 4. Create .env from template if it doesn't exist
echo.
echo [4/6] Setting up configuration...
cd /d "%~dp0backend"
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo       Created .env from template
) else (
    echo       .env already exists, keeping current config
)

:: 5. Clean data directory (fresh start, no patient data)
echo.
echo [5/6] Preparing database...
cd /d "%~dp0"
if exist "data\pglite" (
    echo       Found existing database.
    choice /C YN /N /M "      Delete existing data for fresh start? [Y/N]: "
    if errorlevel 2 (
        echo       Keeping existing data
    ) else (
        rmdir /S /Q "data\pglite"
        echo       Database cleared - will initialize on first start
    )
) else (
    echo       No existing database - will initialize on first start
)

:: Ensure data directories exist
mkdir "data" 2>nul
mkdir "data\backups" 2>nul
mkdir "data\uploads" 2>nul
mkdir "data\exports" 2>nul
mkdir "data\temp" 2>nul
mkdir "data\logs" 2>nul

:: 6. Check Ollama (optional)
echo.
echo [6/6] Checking Ollama AI (optional)...
where ollama >nul 2>&1
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo       Ollama found at: %LOCALAPPDATA%\Programs\Ollama\ollama.exe
    ) else (
        echo       Ollama not found.
        echo       AI features require Ollama: https://ollama.com/download/windows
        echo       You can install it later and use ChiroClick without AI for now.
    )
) else (
    echo       Ollama found in PATH
)

:: Check if models are bundled
if exist "%~dp0data\ollama\manifests" (
    echo       AI models found in project folder (portable)
) else (
    echo       No AI models bundled.
    echo       AI models will be downloaded on first start with AI (~14GB).
    echo       You can skip AI on startup to use ChiroClick without it.
)

echo.
echo  ========================================
echo   Setup Complete!
echo  ========================================
echo.
echo   To start ChiroClick CRM:
echo     Double-click START-CHIROCLICK.bat
echo.
echo   Login credentials:
echo     Email: admin@chiroclickcrm.no
echo     Password: admin123
echo.
echo   The database will auto-initialize on first start with:
echo     - Demo organization
echo     - Demo users (admin + practitioner)
echo     - Clinical templates, exercise library, etc.
echo     - NO patient data (clean slate)
echo.
endlocal
pause
```

### What Happens on First Start (After INSTALL.bat)

When the user runs `START-CHIROCLICK.bat`, the backend's `db-init.js` handles:

1. Creates all 50+ database tables from `database/schema.sql`
2. Applies 59 migrations (idempotent `ALTER TABLE IF NOT EXISTS`)
3. Creates performance indexes
4. Seeds demo users: `admin@chiroclickcrm.no / admin123`
5. Seeds clinical templates, exercise library, spine palpation templates

No manual database setup needed.

---

## Task 2.2: Create MAKE-CLEAN-COPY.bat (~30 min)

### Purpose

You run this on YOUR machine to create a copy without patient data, suitable for giving to a friend.

### File to Create: `MAKE-CLEAN-COPY.bat` (project root)

```batch
@echo off
title ChiroClick CRM - Create Clean Copy
color 0B
setlocal enabledelayedexpansion

echo.
echo  ========================================
echo   Create Clean Copy (no patient data)
echo  ========================================
echo.

set "DEST=%~dp0..\ChiroClickCRM-Clean"

echo  This will create a clean copy at:
echo    %DEST%
echo.
echo  INCLUDED:
echo    + All source code
echo    + AI models (if in data\ollama\)
echo    + Install scripts (INSTALL.bat, START-CHIROCLICK.bat)
echo    + .env.example template
echo.
echo  EXCLUDED (privacy/size):
echo    - Patient data (data\pglite\)
echo    - Session logs, exports, uploads
echo    - node_modules (reinstalled via INSTALL.bat)
echo    - .env (recreated from .env.example)
echo    - .git history
echo    - Python training venv (ai-training\ml-env\)
echo.
choice /C YN /N /M "  Create clean copy? [Y/N]: "
if errorlevel 2 goto :EOF

echo.
echo  Creating clean copy...

:: Remove old copy if exists
if exist "%DEST%" (
    echo  Removing previous clean copy...
    rmdir /S /Q "%DEST%"
)

:: Use robocopy to copy everything EXCEPT excluded dirs
:: /MIR = mirror, /XD = exclude directories, /XF = exclude files
:: Robocopy exit codes 0-7 are success
robocopy "%~dp0." "%DEST%" /MIR ^
    /XD node_modules .git data\pglite data\logs data\temp data\exports ^
        data\backups data\uploads coverage ^
        ai-training\ml-env ^
        ai-training\models\chiro-no-lora ai-training\models\chiro-no-dpo ^
        ai-training\models\chiro-no ai-training\data\processed ^
        __pycache__ .nyc_output dist build ^
    /XF .env .env.local cookies.txt *.log *.tmp *.bak ^
    /NFL /NDL /NJH /NJS /NP

:: Ensure .env is removed (robocopy /XF should handle, but be safe)
del "%DEST%\backend\.env" 2>nul

:: Ensure data dirs exist but are empty (for first-run structure)
mkdir "%DEST%\data" 2>nul
mkdir "%DEST%\data\backups" 2>nul
mkdir "%DEST%\data\uploads" 2>nul
mkdir "%DEST%\data\exports" 2>nul
mkdir "%DEST%\data\temp" 2>nul
mkdir "%DEST%\data\logs" 2>nul

:: Report AI models status
if exist "%DEST%\data\ollama\manifests" (
    echo.
    echo  AI models included in copy (portable)
) else (
    echo.
    echo  NOTE: No AI models in copy. Friend will need Ollama + models.
)

:: Calculate approximate size
echo.
echo  Calculating size...
for /f "tokens=3" %%a in ('dir "%DEST%" /s /-c 2^>nul ^| findstr "File(s)"') do set TOTAL_BYTES=%%a
echo  Total size: approximately %TOTAL_BYTES% bytes

echo.
echo  ========================================
echo   Clean Copy Created!
echo  ========================================
echo.
echo   Location: %DEST%
echo.
echo   Tell your friend to:
echo     1. Copy the folder to their PC
echo     2. Install Node.js 18+ from https://nodejs.org/
echo     3. (Optional) Install Ollama from https://ollama.com/download/windows
echo     4. Double-click INSTALL.bat
echo     5. Double-click START-CHIROCLICK.bat
echo.
endlocal
pause
```

### What Gets Excluded and Why

| Excluded                      | Reason                          | Size Impact |
| ----------------------------- | ------------------------------- | ----------- |
| `data/pglite/`                | YOUR patient data (PHI)         | 10-100MB    |
| `data/logs/`                  | May contain PHI in log entries  | varies      |
| `data/uploads/`               | Patient documents               | varies      |
| `data/exports/`               | GDPR exports with patient info  | varies      |
| `node_modules/`               | Platform-specific binaries      | ~3GB        |
| `.git/`                       | History not needed for friend   | ~500MB      |
| `.env`                        | Your specific config            | <1KB        |
| `ai-training/ml-env/`         | Python venv with absolute paths | ~2GB        |
| `ai-training/models/`         | Raw training model checkpoints  | ~15GB       |
| `ai-training/data/processed/` | Processed training data         | ~50MB       |

### What Gets Included

| Included                  | Why                             | Size    |
| ------------------------- | ------------------------------- | ------- |
| Source code               | The app itself                  | ~50MB   |
| `data/ollama/`            | Portable AI models (if present) | ~5-14GB |
| `INSTALL.bat`             | Friend's setup script           | <5KB    |
| `START-CHIROCLICK.bat`    | Launcher                        | <5KB    |
| `.env.example`            | Config template                 | <2KB    |
| `database/`               | Schema + seeds (auto-runs)      | ~5MB    |
| `ai-training/data/mined/` | Raw training data JSONL         | ~50MB   |

---

## Task 2.3: Update .env.example (~10 min)

Already detailed in Day 1, Task 1.5. Just verify:

**File**: `backend/.env.example`

Must have ALL settings needed for a fresh install:

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Desktop Mode
DESKTOP_MODE=true
DB_ENGINE=pglite
CACHE_ENGINE=memory

# Authentication
DEV_SKIP_AUTH=true
SESSION_SECRET=change-this-to-a-random-string-in-production
JWT_SECRET=change-this-jwt-secret-in-production
JWT_EXPIRES_IN=24h

# Encryption
ENCRYPTION_KEY=12345678901234567890123456789012

# AI (requires Ollama: https://ollama.com/download/windows)
AI_ENABLED=true
AI_MODEL=chiro-no-lora-v2
OLLAMA_BASE_URL=http://localhost:11434
AI_TIMEOUT=35000
GUARDRAILS_ENABLED=true
RAG_ENABLED=false

# CORS
CORS_ORIGIN=http://localhost:5173

# Norwegian Compliance
TIMEZONE=Europe/Oslo
DEFAULT_LANGUAGE=NO

# Communications (mock for desktop)
SMS_PROVIDER=mock
EMAIL_PROVIDER=mock

# Feature Flags
FEATURE_SMS_ENABLED=false
FEATURE_EMAIL_ENABLED=false
```

---

## Task 2.4: Generate Targeted Training Data for v4 (~2-3h)

### Purpose

v2 scores 79% overall but has weak spots. Generate 100 targeted examples to improve:

- **Diagnosis codes** (60%): ICPC-2 vs ICD-10 confusion
- **Red flags** (81% → target 90%): Missing eval keywords
- **Communication** (81% → target 90%): Tighter SMS-style outputs

### File to Create: `ai-training/scripts/generate_v4_targeted.py`

This script generates 100 targeted training examples in JSONL format.

**Structure** — each example is a ChatML conversation:

```json
{
  "messages": [
    { "role": "system", "content": "Du er en klinisk assistent..." },
    { "role": "user", "content": "Foreslå ICPC-2 kode for..." },
    {
      "role": "assistant",
      "content": "{\"code\": \"L03\", \"name\": \"Korsryggsmerter\", \"confidence\": 0.85}"
    }
  ]
}
```

**Categories**:

#### 50 ICPC-2 Diagnosis Code Examples

Key ICPC-2 codes for chiropractic (the eval checks for these):

```
L01 - Nakkesymptomer/-plager
L02 - Ryggsymptomer/-plager
L03 - Korsryggsymptomer/-plager
L08 - Skuldersymptomer/-plager
L83 - Nakkesyndromer/cervikalt syndrom
L84 - Ryggsyndromer uten utstråling
L86 - Ryggsyndromer med utstråling (lumbal)
N01 - Hodepine
N89 - Migrene
L18 - Muskel-/leddsmerter generelt
```

Negative examples that correct common ICD-10 confusion:

- "M54 er ICD-10. Korrekt ICPC-2: L86 Ryggsyndromer med utstråling"
- "G44 er ICD-10. Korrekt ICPC-2: N01 Hodepine"

#### 30 Red Flag Examples

Must contain eval keywords: `akutt`, `henvis`, `mekanisk`, `nevrologisk`, `AKUTT`, `HENVIS`, `MONITORÉR`, `TRYGT`

Example classifications:

```
AKUTT/HENVIS — Cauda equina: blæredysfunksjon + sadelformet nummenhet → akutt henvisning
HENVIS — Progressiv nevrologisk deficit → henvis til nevrolog
MONITORÉR — Unilateral hodepine hos >50 år → monitorér, vurder temporalisarteritt
TRYGT — Mekanisk nakkesmerte uten nevrologiske funn → trygt å behandle
```

#### 20 Communication Examples

SMS format, under 160 chars, Norwegian:

```
"Hei {navn}, dette er en påminnelse om din time hos ChiroClick i morgen kl. {tid}. Mvh {behandler}"
"Hei {navn}, hvordan går det etter behandlingen? Gi gjerne tilbakemelding. Mvh {behandler}"
```

### Output

```
ai-training/data/mined/v4-targeted.jsonl
```

100 JSONL lines, each a complete ChatML conversation.

---

## Task 2.5: Rebuild Dataset — v2 Base + Targeted Additions (~10 min)

### Critical Rule

Use v2's dataset (~4,973 examples) as base. v3 expanded to 10,955 and regressed to 55%. **Volume killed quality.**

### Steps

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training

# 1. Check current state
wc -l data/processed/general-clinical/train.jsonl
# If this shows ~10,000+ lines, it's the v3 dataset (bad)

# 2. Back up v3 dataset
mv data/processed/general-clinical data/processed/general-clinical-v3-backup

# 3. Restore v2 base dataset
# The v2 dataset should be in the _archive or a backup
# If not available, use clean_and_prepare.py to regenerate from raw sources

# 4. Combine v2 base + v4 targeted
mkdir -p data/processed/general-clinical
cat data/processed/general-clinical-v2-backup/train.jsonl data/mined/v4-targeted.jsonl > /tmp/combined.jsonl

# 5. Shuffle
PYTHONIOENCODING=utf-8 ml-env/Scripts/python.exe -c "
import random, pathlib
lines = pathlib.Path('/tmp/combined.jsonl').read_text(encoding='utf-8').strip().split('\n')
random.shuffle(lines)
pathlib.Path('data/processed/general-clinical/train.jsonl').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(f'Shuffled {len(lines)} examples')
"

# 6. Verify count
wc -l data/processed/general-clinical/train.jsonl
# Expected: ~5,073 (4,973 + 100 targeted)
# MUST be under 5,500. If over 6,000 → something went wrong
```

### Finding the v2 Dataset

Check these locations for the original v2 dataset:

1. `data/processed/general-clinical-v3-backup/` (if it was backed up before v3)
2. `_archive/` folder (from Phase 1 cleanup)
3. Git history: `git log --oneline -- data/processed/general-clinical/train.jsonl`
4. Regenerate from raw sources using `scripts/clean_and_prepare.py`

The key identifier: v2 dataset has ~4,973 lines. v3 has ~10,955.

---

## Day 2 Checklist

- [ ] `INSTALL.bat` created at project root
- [ ] `INSTALL.bat` tested: checks Node.js, installs deps, creates .env, prepares data dirs
- [ ] `MAKE-CLEAN-COPY.bat` created at project root
- [ ] `MAKE-CLEAN-COPY.bat` tested: creates clean copy without `data/pglite/`, `node_modules/`, `.env`, `.git/`
- [ ] `.env.example` has all required vars for fresh install
- [ ] `ai-training/scripts/generate_v4_targeted.py` created
- [ ] 100 targeted examples in `ai-training/data/mined/v4-targeted.jsonl`
- [ ] Combined dataset: ~5,073 examples in `data/processed/general-clinical/train.jsonl`
- [ ] Commit: `git commit -m "feat: portable install scripts + v4 training data"`
