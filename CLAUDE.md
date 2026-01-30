# ChiroClick CRM - Claude Code Memory

## Project Overview
Norwegian-compliant EHR-CRM-PMS system for chiropractic practices.
- **Location**: `F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture`
- **Tech Stack**: React + Vite + Node.js + PostgreSQL + Ollama AI

## Multi-Model AI System (Implemented 2026-01-21)

### Models
| Model | Base | Size | Purpose |
|-------|------|------|---------|
| `chiro-no` | Mistral 7B | ~4GB | Default/balanced |
| `chiro-fast` | Llama 3.2 3B | ~2GB | Quick autocomplete |
| `chiro-norwegian` | Viking 7B | ~4GB | Norwegian language |
| `chiro-medical` | MedGemma 4B | ~3GB | Clinical reasoning |

### Task Routing
```
Norwegian (spell check, SOAP)  → chiro-norwegian
Medical (diagnosis, red flags) → chiro-medical
Quick (autocomplete)           → chiro-fast
General                        → chiro-no
```

### Key Files
- `ai-training/Modelfile*` - 4 Modelfiles for each variant
- `ai-training/build-model.bat` - Builds all models
- `backend/src/services/ai.js` - Multi-model routing logic
- `START-CHIROCLICK.bat` - Launcher with model detection

### Commands
```batch
# Build all models (~14GB total)
cd ai-training && build-model.bat

# Verify
ollama list | findstr chiro

# Test
ollama run chiro-norwegian "Skriv subjektiv for nakkesmerter"
```

### Environment (.env)
```env
AI_MODEL=chiro-no
AI_MODEL_FAST=chiro-fast
AI_MODEL_NORWEGIAN=chiro-norwegian
AI_MODEL_MEDICAL=chiro-medical
```

## Training Data
- `ai-training/training-data.jsonl` - 5,642 examples (3.0 MB)
- `ai-training/rag-chunks.json` - RAG data (4.4 MB)

## Important Notes
- **USB Drive**: Must be NTFS or exFAT (not FAT32) for models >4GB
- **Disk Space**: ~14GB required for all AI models
- **RAM**: Minimum 8GB, recommended 16GB

## Quick Start
```batch
START-CHIROCLICK.bat
```
Options on first run: [B]uild all, [M]inimal, [S]kip AI

## Documentation Updated
- README.md - AI section added
- PORTABLE_SETUP.md - Multi-model guide
- TRAINING_GUIDE.md - Training instructions
- NEXT_SESSION_TODO.md - Full implementation details

---

## Current Work: Quick-Click Spine Palpation System (2026-01-25)
**Status:** Code complete, needs database setup & testing

### What Was Built
A clickable spine segment system for rapid palpation documentation:
- Click spine segment -> select direction -> Norwegian clinical text inserted into palpation field
- Right sidebar always visible in ClinicalEncounter
- 100+ default Norwegian templates for all spine segments
- Customizable templates per organization via Settings UI

### Files Created/Modified
| File | Status |
|------|--------|
| `database/schema.sql` | Added spine_text_templates table |
| `database/seeds/spine-templates.sql` | NEW - 100+ Norwegian templates |
| `backend/src/controllers/spineTemplates.js` | NEW - CRUD controller |
| `backend/src/routes/spineTemplates.js` | NEW - API routes |
| `backend/src/server.js` | Added route registration |
| `frontend/src/components/clinical/QuickPalpationSpine.jsx` | NEW - Main component |
| `frontend/src/pages/ClinicalEncounter.jsx` | Integrated sidebar |
| `frontend/src/pages/Settings.jsx` | Added template editor |
| `frontend/src/services/api.js` | Added spineTemplatesAPI |

### Commit
`7961cb0` - feat(clinical): Add quick-click spine palpation text insertion system

---

## PRIORITY: Repository Cleanup (Session 2026-01-30)

### Current Status
- **Branch**: `claude/chiroclickcrm-ehr-system-01UQ8tUJXuBbkUKHvdMFk3iH`
- **Divergence**: 2 local commits ahead, 30 remote commits behind
- **Staged files**: 282 files ready to commit
- **Untracked files**: 60 files remaining to stage
- **Chosen strategy**: Rebase onto remote (then organize commits)

### PHASE 1: Git Cleanup (IN PROGRESS)

#### Step 1.1: Stage Remaining Files
The following 60 files still need to be staged:
```bash
# Backend extras
git add backend/src/config/ backend/src/data/ backend/src/domain/
git add backend/src/jobs/ backend/src/migrations/scripts/ backend/src/scripts/
git add backend/tests/

# Database
git add database/migrations/ database/seeds/ database/run_all_migrations.sql

# Frontend extras
git add frontend/Dockerfile.dev frontend/package-lock.json frontend/public/
git add frontend/scripts/ frontend/src/__tests__/ frontend/src/data/
git add frontend/src/examples/ frontend/src/utils/

# Root files
git add bin/ scripts/ sample-data/ training-data-extracted/
git add *.js *.sql *.py *.txt *.json

# SKIP these large folders (add to .gitignore):
# - exercise_videos/ (video files)
# - mobile-app/ (if contains node_modules)
```

#### Step 1.2: Create .gitignore for Large Files
```bash
echo "exercise_videos/" >> .gitignore
echo "mobile-app/node_modules/" >> .gitignore
echo "nul" >> .gitignore
echo "*.mjs" >> .gitignore
```

#### Step 1.3: Create WIP Commit
```bash
git commit -m "WIP: All uncommitted changes before rebase"
```

#### Step 1.4: Rebase onto Remote
```bash
git fetch origin
git rebase origin/claude/chiroclickcrm-ehr-system-01UQ8tUJXuBbkUKHvdMFk3iH
# Resolve any conflicts if needed
```

#### Step 1.5: Reorganize into Logical Commits (Optional)
After rebase, can soft reset and create organized commits:
1. CQRS Architecture & AI Feedback
2. Backend Services & Routes
3. Database Migrations
4. Frontend Components
5. AI Training Data
6. Infrastructure & Config
7. Documentation

### PHASE 2: Documentation Reorganization

#### New Folder Structure
```
/docs
  /getting-started/   SETUP-GUIDE.md, QUICK-START.md
  /architecture/      OVERVIEW.md, DATABASE.md, AI-SYSTEM.md, SECURITY.md
  /clinical/          VESTIBULAR-MODULE.md, BPPV-EXERCISES.md, etc.
  /deployment/        DOCKER.md, RUNBOOK.md, COMPLIANCE.md
  /development/       FRONTEND.md, API.md, TESTING.md
  /archive/           Old completion notices
```

#### Files to Archive (Redundant)
- 100_PERCENT_COMPLETE.md
- IMPLEMENTATION_COMPLETE.md
- COMPLETED_TASKS_SUMMARY.md
- MERGE_COMPLETE.md
- CRITICAL_FIXES_TODAY.md

#### Files to Keep at Root
- README.md (trim to ~200 lines)
- CLAUDE.md (this file)
- SECURITY.md (summary only)
- CHANGELOG.md (create from history)
- docker-compose.yml

### PHASE 3: Environment Validation

#### Create Setup Scripts
- `scripts/setup.sh` (Linux/Mac)
- `scripts/setup.bat` (Windows)

#### Test Startup Sequence
1. `docker-compose up -d postgres redis`
2. Wait for database
3. Run migrations
4. `cd backend && npm install && npm run dev`
5. `cd frontend && npm install && npm run dev`

#### Update .env.example
Add missing AI model config variables.

---

## TODO List

### Startup Tasks (Do First)
- [ ] **Start Docker containers** - `docker-compose up -d`
- [ ] **Start backend server** - `cd backend && npm run dev`
- [ ] **Start frontend server** - `cd frontend && npm run dev`

### Database Setup
- [ ] **Run database migration** - Create spine_text_templates table
  ```sql
  -- Connect to database
  docker exec -it chiroclickcrm-db psql -U postgres -d chiroclickcrm

  -- Then run the table creation from schema.sql (the spine_text_templates section)
  ```
- [ ] **Seed default templates** - Populate Norwegian palpation templates
  ```bash
  docker exec -i chiroclickcrm-db psql -U postgres -d chiroclickcrm < database/seeds/spine-templates.sql
  ```

### Testing
- [ ] **Test API endpoints**
  ```bash
  # List all segments
  curl http://localhost:3000/api/v1/spine-templates/segments

  # Get grouped templates
  curl http://localhost:3000/api/v1/spine-templates/grouped

  # Get specific template
  curl http://localhost:3000/api/v1/spine-templates/C2/left
  ```

- [ ] **Test QuickPalpationSpine in browser**
  1. Open http://localhost:5173/patients/{id}/encounter
  2. Verify right sidebar shows "PALPASJON Rask-klikk"
  3. Click segment (e.g., C2) -> direction popup appears
  4. Click direction (V/H/B/P/A) -> text inserts into palpation field
  5. Verify multiple clicks append text correctly

- [ ] **Test Settings UI**
  1. Go to Settings > Clinical tab
  2. Find "Palpasjonsmaler (Rask-klikk)" section
  3. Expand region, edit a template, save
  4. Verify changes appear in encounter
  5. Test reset to defaults

---

## Spine Templates API Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/spine-templates | List all templates |
| GET | /api/v1/spine-templates/grouped | Templates grouped by segment |
| GET | /api/v1/spine-templates/segments | List of segments |
| GET | /api/v1/spine-templates/directions | List of directions |
| GET | /api/v1/spine-templates/:segment/:direction | Specific template |
| POST | /api/v1/spine-templates | Create custom template |
| PATCH | /api/v1/spine-templates/:id | Update template |
| DELETE | /api/v1/spine-templates/:id | Delete custom (revert to default) |
| POST | /api/v1/spine-templates/reset | Reset all to defaults |

---

## Future Enhancements (Backlog)
- [ ] Voice command: "C2 left" -> inserts text
- [ ] Quick-tap mode: double-tap segment for default direction
- [ ] Favorites: pin frequently used segment+direction combos
- [ ] AI suggestion: highlight likely segments based on chief complaint
