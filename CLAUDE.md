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

---

## Session 2026-01-27: Database & Frontend Fixes

### Database Schema Applied
The following were added to make auth work:
```sql
-- Run these if starting fresh:
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  fresh BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scheduled_job_logs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  job_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Auth functions
CREATE OR REPLACE FUNCTION record_successful_login(user_uuid UUID)
RETURNS void AS $$ UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = user_uuid; $$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION record_failed_login(user_uuid UUID)
RETURNS void AS $$ UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = user_uuid; $$ LANGUAGE SQL;
```

Migration file: `database/migrations/005_complete_auth_schema.sql`
Demo users seed: `database/seeds/demo-users.sql`

### Test Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@chiroclickcrm.no | admin123 | ADMIN |
| kiropraktor@chiroclickcrm.no | admin123 | PRACTITIONER |

### Frontend Dev Mode
The frontend can run WITHOUT Clerk by using a placeholder key in `.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```
- `main.jsx` - Detects placeholder key and skips ClerkProvider
- `App.jsx` - Renders without SignedIn/SignedOut wrappers in dev mode
- `api.js` - Skips 401 redirect to /sign-in in dev mode

### Stub Components Created
These are placeholders to prevent import errors:
| Component | Path |
|-----------|------|
| AISettings | `frontend/src/components/AISettings.jsx` |
| SchedulerDecisions | `frontend/src/components/scheduler/SchedulerDecisions.jsx` |
| AppointmentImporter | `frontend/src/components/scheduler/AppointmentImporter.jsx` |
| TodaysMessages | `frontend/src/components/scheduler/TodaysMessages.jsx` |
| ExaminationComponents | `frontend/src/components/examination/index.jsx` |
| ExercisePanel | `frontend/src/components/exercises/index.jsx` |

### Stub Backend Routes Created
| Route | Path | Status |
|-------|------|--------|
| scheduler | `backend/src/routes/scheduler.js` | Stub |
| kiosk | `backend/src/routes/kiosk.js` | Stub |
| crm | `backend/src/routes/crm.js` | **COMPLETE** |
| automations | `backend/src/routes/automations.js` | Stub |
| bulkCommunication | `backend/src/routes/bulkCommunication.js` | Stub |
| exercises | `backend/src/routes/exercises.js` | Stub |
| notifications | `backend/src/routes/notifications.js` | Stub |
| patientPortal | `backend/src/routes/patientPortal.js` | Stub |

---

## CRM System (Completed 2026-01-28)

### Status: FULLY OPERATIONAL

The CRM module is now complete with 40+ API endpoints:

### CRM API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /crm/overview | Dashboard metrics |
| GET | /crm/leads | Lead list with filtering |
| GET | /crm/leads/pipeline | Pipeline statistics |
| GET/POST | /crm/leads/:id | Lead CRUD |
| POST | /crm/leads/:id/convert | Convert to patient |
| GET | /crm/lifecycle | Patients by lifecycle |
| GET | /crm/lifecycle/stats | Lifecycle statistics |
| GET/POST | /crm/referrals | Referral management |
| GET | /crm/referrals/stats | Referral statistics |
| GET/POST | /crm/surveys | Survey management |
| GET | /crm/surveys/:id/responses | Survey responses |
| GET | /crm/surveys/nps/stats | NPS analytics |
| GET/POST | /crm/communications | Communication history |
| GET/POST | /crm/campaigns | Campaign management |
| POST | /crm/campaigns/:id/launch | Launch campaign |
| GET/POST | /crm/workflows | Workflow automation |
| POST | /crm/workflows/:id/toggle | Toggle workflow |
| GET | /crm/retention | Retention dashboard |
| GET | /crm/retention/churn | Churn analysis |
| GET | /crm/retention/cohorts | Cohort analysis |
| GET/POST | /crm/waitlist | Waitlist management |
| POST | /crm/waitlist/notify | Notify waitlist |
| GET/PUT | /crm/settings | CRM settings |

### Key Files
- `backend/src/routes/crm.js` - Full route definitions (310 lines)
- `backend/src/controllers/crm.js` - Controller with 50+ methods
- `backend/src/services/crm.js` - Business logic (~1300 lines)

### Test Credentials
| Email | Password | Role |
|-------|----------|------|
| mads@chiroclick.no | admin123 | PRACTITIONER |

### Testing CRM
```bash
# Login and save cookie
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mads@chiroclick.no","password":"admin123"}'

# Test CRM Overview
curl -b cookies.txt http://localhost:3000/api/v1/crm/overview

# Test Leads
curl -b cookies.txt http://localhost:3000/api/v1/crm/leads

# Test Lifecycle Stats
curl -b cookies.txt http://localhost:3000/api/v1/crm/lifecycle/stats
```

### Database Fixes Applied
1. Created `current_tenant_id()` function for RLS
2. Fixed `setTenantContext()` to use `set_config()` instead of `SET`
3. Changed `clinic_id` to `organization_id` in CRM service/controller

### Clinical Settings System (NEW)
Full backend API for clinical documentation preferences:

**Files:**
- `backend/src/services/clinicalSettings.js` - Settings service with defaults
- `backend/src/controllers/clinicalSettings.js` - CRUD controller
- `backend/src/routes/clinicalSettings.js` - API routes

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /clinical-settings | Get org settings |
| GET | /clinical-settings/defaults | Get default values |
| PATCH | /clinical-settings | Update settings |
| PUT | /clinical-settings/adjustment/style | Set Gonstead/Diversified |
| POST | /clinical-settings/reset | Reset to defaults |

**Settings Structure:**
```javascript
{
  adjustment: {
    style: 'gonstead' | 'diversified' | 'segment_listing',
    gonstead: { useFullNotation, includeDirection, listings },
    diversified: { useAnatomicalTerms, includeRestriction, terminology }
  },
  tests: {
    orthopedic: { resultFormat: 'plus_minus' | 'pos_neg' | 'numeric' },
    neurological: { reflexGrading: 'numeric' | 'plus_system' },
    rom: { format: 'degrees' | 'percent' | 'descriptive' }
  }
}
```

### Letter Templates Added to AI Training
14 Norwegian letter templates added to `ai-training/letters-training.jsonl`:
- Headache referral letters
- Exam declarations (studieattester)
- Insurance reports
- Referrals to neurologist, orthopedist, physiotherapy

### Common Issues & Fixes
| Issue | Fix |
|-------|-----|
| `useKeyboardShortcuts.js` parse error | File contains JSX - renamed to `.jsx` |
| Duplicate `aiAPI` export | Remove first declaration at line ~470 in api.js |
| Duplicate hook exports | Don't export both `default as X` and `X` |
| Missing index.js for directory imports | Create `index.js` that re-exports from `index.jsx` |
| 401 redirect loop in dev | Check `import.meta.env.DEV` before redirecting |

### Running the System
```bash
# Docker (backend + db + redis)
docker-compose up -d

# Frontend (separate terminal)
cd frontend && npm run dev

# Access
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```
