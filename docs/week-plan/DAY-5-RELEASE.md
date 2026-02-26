# Day 5 (Friday): E2E QA + Clean Install Test + Release

**Time estimate**: 2-3h coding, 0h GPU
**Goal**: Verified end-to-end workflow, clean install tested, tagged release

---

## Task 5.1: End-to-End Workflow Test (~30 min)

### Full Cold Start Test (Your Machine)

1. **Close everything**:
   - Close all terminal windows
   - Kill Ollama: `taskkill /F /IM ollama.exe`
   - Kill Node: `taskkill /F /IM node.exe`

2. **Start from scratch**:
   - Double-click `START-CHIROCLICK.bat`
   - Choose `[A] Start with AI`
   - Wait for all 5 steps to complete

3. **Verify startup**:
   - [ ] Backend running at http://localhost:3000
   - [ ] Frontend running at http://localhost:5173
   - [ ] Ollama running with models from `data/ollama/`
   - [ ] Browser opens automatically

4. **Login test**:
   - [ ] Navigate to http://localhost:5173
   - [ ] Login: `admin@chiroclickcrm.no` / `admin123`
   - [ ] Dashboard loads with widgets

5. **Patient workflow**:
   - [ ] Create new patient (Patients → New → fill required fields)
   - [ ] Open patient → Clinical Encounter
   - [ ] Type chief complaint: "Korsryggsmerter med utstråling til venstre ben"
   - [ ] Trigger AI SOAP suggestion
   - [ ] Verify Norwegian clinical text appears
   - [ ] Check ICPC-2 code suggestion (expect L03 or L86)
   - [ ] Save encounter

6. **Red flag test**:
   - [ ] New encounter with: "Pasienten har blæredysfunksjon og sadelformet nummenhet"
   - [ ] Trigger red flag analysis
   - [ ] Verify: flags "AKUTT" or "HENVIS" classification
   - [ ] Verify: mentions cauda equina

7. **Non-AI features**:
   - [ ] Navigate to Settings → verify loads
   - [ ] Navigate to Exercises → verify library loads
   - [ ] Navigate to CRM → verify overview loads
   - [ ] Navigate to Billing → verify loads

---

## Task 5.2: Clean Install Test (~30 min)

### Simulate Friend's Experience

This is the critical test — can someone else actually use this?

#### Step 1: Create Clean Copy

```batch
:: On your machine
double-click MAKE-CLEAN-COPY.bat
:: Wait for copy to complete
:: Creates: ..\ChiroClickCRM-Clean\
```

#### Step 2: Verify Clean Copy Contents

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Clean

# Should NOT exist:
ls data/pglite 2>/dev/null    # Should fail (no patient data)
ls .git 2>/dev/null            # Should fail (no git history)
ls backend/.env 2>/dev/null    # Should fail (no config)
ls backend/node_modules 2>/dev/null  # Should fail (no deps)
ls frontend/node_modules 2>/dev/null # Should fail (no deps)

# SHOULD exist:
ls INSTALL.bat                 # Setup script
ls START-CHIROCLICK.bat        # Launcher
ls backend/.env.example        # Config template
ls data/ollama/manifests 2>/dev/null  # AI models (if bundled)
ls database/schema.sql         # Database schema
```

#### Step 3: Run Install

```batch
:: In the clean copy folder
double-click INSTALL.bat
```

Verify:

- [ ] Checks Node.js successfully
- [ ] Backend `npm install` completes
- [ ] Frontend `npm install` completes
- [ ] `.env` created from `.env.example`
- [ ] Data directories created
- [ ] AI models detected (or "not found" message)

#### Step 4: First Start

```batch
:: In the clean copy folder
double-click START-CHIROCLICK.bat
:: Choose [A] Start with AI (or [S] Skip if no models)
```

Verify:

- [ ] Backend starts (http://localhost:3000/api/v1/health returns OK)
- [ ] Frontend starts (http://localhost:5173 loads)
- [ ] Database auto-initializes (tables created, seeds applied)
- [ ] Login works: `admin@chiroclickcrm.no` / `admin123`
- [ ] Patient list is EMPTY (no leftover data)
- [ ] Can create a new patient
- [ ] If AI enabled: SOAP suggestions work
- [ ] If AI disabled: App works without AI features

#### Step 5: Clean Up

After testing, delete the clean copy:

```bash
rm -rf /c/Users/MadsF/Desktop/ChiroClickCRM-Clean
```

---

## Task 5.3: Update Documentation (~30 min)

### Update CLAUDE.md (Project Root)

In the AI Models section, update:

````markdown
## Multi-Model AI System

### Best Model: chiro-no-lora-v2 (or v4 if it won)

- **Eval score**: 79% (v2) or XX% (v4)
- **Strong**: Quick fields 100%, Red flags 81%, Norwegian 87%
- **Weak**: Diagnosis codes 60%, Communication 81%

### .env Configuration

```env
AI_ENABLED=true
AI_MODEL=chiro-no-lora-v2
OLLAMA_BASE_URL=http://localhost:11434
AI_TIMEOUT=35000
GUARDRAILS_ENABLED=true
RAG_ENABLED=false
```
````

### Portable Models

Models stored in `data/ollama/` (set via OLLAMA_MODELS env var in START-CHIROCLICK.bat).
Moving the project folder = models travel with it.

````

### Update README.md

Add these sections:

```markdown
## Quick Start

### First Time Setup
1. Install [Node.js 18+](https://nodejs.org/)
2. (Optional) Install [Ollama](https://ollama.com/download/windows) for AI features
3. Double-click `INSTALL.bat`
4. Double-click `START-CHIROCLICK.bat`
5. Login: `admin@chiroclickcrm.no` / `admin123`

### Sharing with a Colleague
1. Run `MAKE-CLEAN-COPY.bat` on your machine
2. Copy the `ChiroClickCRM-Clean` folder to a USB drive or cloud storage
3. Your colleague runs `INSTALL.bat` then `START-CHIROCLICK.bat`
4. Their copy starts with a clean database — no patient data included

### Starting the App
Double-click `START-CHIROCLICK.bat` and choose:
- **[A] Start with AI** — Full features including AI SOAP suggestions (~14GB RAM)
- **[S] Skip AI** — Faster startup, all features except AI assistance
````

### Update Memory File

**File**: `~/.claude/projects/C--Users-MadsF/memory/chiroclickcrm.md`

Add v4 training results (or note v2 remains best):

```markdown
## AI Model Status (2026-02-28)

- **Production model**: chiro-no-lora-v2 (79% eval)
- **v4 result**: XX% (accepted/rejected)
- **Portable storage**: data/ollama/ with OLLAMA_MODELS env var
- **Clean install**: INSTALL.bat + START-CHIROCLICK.bat tested
```

---

## Task 5.4: Final Commit + Tag (~15 min)

### Stage Files

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture

# Stage specific files (NEVER git add . or git add -A)
git add INSTALL.bat
git add MAKE-CLEAN-COPY.bat
git add START-CHIROCLICK.bat
git add backend/.env.example
git add .gitignore

# i18n files
git add frontend/src/i18n/locales/nb/
git add frontend/src/i18n/locales/en/

# Modified components (i18n extraction)
git add frontend/src/components/clinical/
git add frontend/src/components/ai/
git add frontend/src/components/communications/
git add frontend/src/components/comms/

# Test mocks
git add backend/src/services/__mocks__/

# AI training results
git add ai-training/evaluation/baseline/
git add ai-training/scripts/generate_v4_targeted.py
git add ai-training/data/mined/v4-targeted.jsonl

# Model files (if v4 deployed)
git add -f ai-training/models/gguf/Modelfile.chiro-no-lora-v4

# Documentation
git add docs/week-plan/
git add README.md
git add CLAUDE.md
```

### Commit

```bash
git commit -m "feat: v1.0-beta — AI enabled, portable models, clean install"
```

### Tag

```bash
git tag -a v1.0.0-beta -m "Production-ready beta with AI, portable deployment, clean install"
```

---

## Task 5.5: Create Feedback Checklist for Friends (~15 min)

### File to Create: `FEEDBACK.md` (project root)

See separate section below — this is what you give to friends alongside the app.

---

## Day 5 Checklist

- [ ] Full cold-start workflow works (START-CHIROCLICK.bat → AI SOAP → save)
- [ ] Clean copy created and tested (INSTALL.bat → START-CHIROCLICK.bat → login → works)
- [ ] Fresh database auto-initializes with demo data
- [ ] AI models are portable in `data/ollama/`
- [ ] Login works on clean install
- [ ] Empty patient list on clean install (no leftover data)
- [ ] Documentation updated (CLAUDE.md, README.md, memory)
- [ ] All changes committed
- [ ] Tagged `v1.0.0-beta`
- [ ] `FEEDBACK.md` created for friends
